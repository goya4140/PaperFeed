import SwiftUI
import Security
import CryptoKit

@MainActor
final class AppStore: ObservableObject {
    @Published var catalog: Catalog
    @Published var snapshot = LocalSnapshot()
    @Published var user: Member?
    @Published var notifications: [Notice] = []
    @Published var connected = false
    @Published var syncMessage = "离线可阅读，收藏与笔记保存在本机"
    @Published var errorMessage: String?
    @Published var serverAddress: String
    @Published var showLogin = false
    @Published var tab = 0
    private var token: String?
    private var syncing = false
    private var epoch = UUID()
    private let defaults = UserDefaults.standard
    private let directory: URL
    var library: Library { snapshot.library }
    var api: APIClient { APIClient(baseURL: URL(string: serverAddress)!, token: token) }
    var unread: Int { notifications.filter { !$0.read }.count }
    private var serverKey: String { SHA256.hash(data: Data(serverAddress.utf8)).map { String(format: "%02x", $0) }.joined() }
    private var snapshotURL: URL { directory.appendingPathComponent("\(serverKey)-\(user?.id ?? "guest").json") }

    init() {
        directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("PaperPop", isDirectory: true)
        serverAddress = defaults.string(forKey: "paperpop.server") ?? "http://127.0.0.1:8787"
        // A missing or malformed bundled catalog is a packaging error, never an empty feed.
        guard let url = Bundle.main.url(forResource: "catalog", withExtension: "json"),
              let seed = try? DiskStore.read(Catalog.self, from: url) else { fatalError("Missing bundled PaperPop catalog") }
        catalog = seed
        if let cached = try? DiskStore.read(Catalog.self, from: directory.appendingPathComponent("catalog.json")) { catalog = cached }
        restoreIdentity()
        loadSnapshot()
    }
    private func restoreIdentity() {
        token = TokenVault.read(serverKey)
        if token != nil, let data = defaults.data(forKey: "paperpop.member.\(serverKey)") { user = try? JSONDecoder().decode(Member.self, from: data) }
    }
    private func loadSnapshot() {
        do {
            if FileManager.default.fileExists(atPath: snapshotURL.path) { snapshot = try DiskStore.read(LocalSnapshot.self, from: snapshotURL) }
            else { snapshot = LocalSnapshot() }
        } catch {
            let backup = snapshotURL.appendingPathExtension("unreadable-\(UUID().uuidString)")
            try? FileManager.default.copyItem(at: snapshotURL, to: backup)
            snapshot = LocalSnapshot(); errorMessage = "本机记录读取失败，请保留研究空间中的备份文件：\(error.localizedDescription)"
        }
    }
    @discardableResult private func persist() -> Bool {
        do { try DiskStore.write(snapshot, to: snapshotURL); return true }
        catch { errorMessage = "本机保存失败，请先导出笔记：\(error.localizedDescription)"; return false }
    }
    func configure(_ address: String) throws {
        let value = address.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: value), let host = url.host, url.user == nil, url.password == nil,
              url.query == nil, url.fragment == nil, url.path.isEmpty || url.path == "/" else { throw APIError(message: "请输入服务器根地址，例如 http://127.0.0.1:8787", status: 0) }
        let octets = host.split(separator: ".").compactMap { UInt8($0) }
        let privateIPv4 = octets.count == 4 && (octets[0] == 10 || octets[0] == 192 && octets[1] == 168 || octets[0] == 172 && (16...31).contains(octets[1]))
        let local = host == "localhost" || host == "127.0.0.1" || host == "::1" || host.hasSuffix(".local") || privateIPv4
        guard url.scheme == "https" || (url.scheme == "http" && local) else { throw APIError(message: "公网服务器必须使用 HTTPS；HTTP 仅用于本机或局域网调试", status: 0) }
        if value == serverAddress { return }
        persist(); epoch = UUID(); serverAddress = value; defaults.set(value, forKey: "paperpop.server")
        token = nil; user = nil; notifications = []; connected = false
        restoreIdentity(); loadSnapshot()
    }
    func refresh() async {
        let generation = epoch, client = api
        do {
            let latest: Catalog = try await client.request("/v1/catalog")
            guard generation == epoch else { return }
            catalog = latest; connected = true
            try? DiskStore.write(latest, to: directory.appendingPathComponent("catalog.json"))
            if token != nil {
                do {
                    let member: Member = try await client.request("/v1/me")
                    guard generation == epoch else { return }
                    if user?.id != member.id {
                        user = member; loadSnapshot()
                        defaults.set(try? JSONEncoder().encode(member), forKey: "paperpop.member.\(serverKey)")
                    }
                    await synchronize()
                    await refreshNotifications()
                } catch { handle(error) }
            } else { syncMessage = "已连接后台 · 登录后可交流和同步" }
        } catch {
            guard generation == epoch else { return }
            connected = false; syncMessage = "后台未连接 · 本机阅读和笔记可用"
        }
    }
    func authenticate(name: String, password: String, register: Bool, importGuest: Bool) async throws {
        let client = api, generation = epoch
        let result: AuthResult = try await client.request(register ? "/v1/auth/register" : "/v1/auth/login", method: "POST", body: APIClient.body(["name": name, "password": password]))
        guard generation == epoch else { return }
        try TokenVault.write(result.token, key: serverKey)
        let guest = user == nil ? snapshot.library.migrationChanges : []
        let guestURL = user == nil ? snapshotURL : nil
        user = result.user; token = result.token; connected = true
        defaults.set(try JSONEncoder().encode(result.user), forKey: "paperpop.member.\(serverKey)")
        epoch = UUID(); loadSnapshot()
        if importGuest {
            for change in guest { snapshot.library.apply(change); snapshot.pending.append(change) }
            if persist(), let guestURL { try? DiskStore.write(LocalSnapshot(), to: guestURL) }
        }
        showLogin = false
        await synchronize(); await refreshNotifications()
    }
    func change(_ field: String, key: String, value: String) {
        let change = LibraryChange(field: field, key: key, value: value)
        snapshot.library.apply(change)
        // Unsent edits to the same field are compacted; the in-flight command remains safe to replay.
        snapshot.pending.removeAll { $0.field == field && $0.key == key }
        snapshot.pending.append(change)
        persist()
        syncMessage = user == nil ? "已保存到本机 · 登录后可同步" : "本机已保存 · 等待同步"
        Task { await synchronize() }
    }
    func toggle(_ field: String, key: String, contains: Bool) { change(field, key: key, value: contains ? "false" : "true") }
    func synchronize() async {
        guard token != nil, user != nil, !syncing else { return }
        let generation = epoch, client = api
        syncing = true
        defer {
            syncing = false
            if generation != epoch && token != nil { Task { await synchronize() } }
        }
        do {
            var remote: Library = try await client.request("/v1/library")
            guard generation == epoch else { return }
            while !snapshot.pending.isEmpty {
                var batch: [LibraryChange] = []
                for change in snapshot.pending.prefix(100) {
                    let candidate = batch + [change]
                    let byteCount = try APIClient.body(Changes(changes: candidate)).count
                    if !batch.isEmpty && byteCount > 200000 { break }
                    batch = candidate
                }
                let ids = Set(batch.map(\.id))
                remote = try await client.request("/v1/library", method: "POST", body: APIClient.body(Changes(changes: batch)))
                guard generation == epoch else { return }
                snapshot.pending.removeAll { ids.contains($0.id) }
                var merged = remote
                for pending in snapshot.pending { merged.apply(pending) }
                snapshot.library = merged; persist()
            }
            snapshot.library = remote; persist(); connected = true; syncMessage = "已同步 · \(user?.name ?? "")"
        } catch {
            guard generation == epoch else { return }
            syncMessage = "本机已保存 · 同步未完成，可重试"; handle(error, quiet: true)
        }
    }
    func logout() async {
        let client = api
        persist()
        let _: EmptyResponse? = try? await client.request("/v1/auth/logout", method: "POST")
        TokenVault.delete(serverKey); defaults.removeObject(forKey: "paperpop.member.\(serverKey)")
        epoch = UUID(); token = nil; user = nil; notifications = []; loadSnapshot()
        syncMessage = "已退出 · 当前使用访客本机空间"
    }
    func deleteAccount() async throws {
        let _: EmptyResponse = try await api.request("/v1/me", method: "DELETE")
        try? FileManager.default.removeItem(at: snapshotURL)
        TokenVault.delete(serverKey); defaults.removeObject(forKey: "paperpop.member.\(serverKey)")
        epoch = UUID(); token = nil; user = nil; notifications = []; loadSnapshot()
        syncMessage = "账号与服务器数据已删除"
    }
    func requireLogin() -> Bool {
        if user == nil { showLogin = true; return false }
        return true
    }
    func posts(topic: String? = nil, paperId: String? = nil, offset: Int = 0) async throws -> [Discussion] {
        var components = URLComponents(); components.queryItems = [URLQueryItem(name: "offset", value: String(offset))]
        if let topic { components.queryItems?.append(URLQueryItem(name: "topic", value: topic)) }
        if let paperId { components.queryItems?.append(URLQueryItem(name: "paperId", value: paperId)) }
        return try await api.request("/v1/posts?\(components.percentEncodedQuery ?? "")")
    }
    func detail(_ id: String) async throws -> ThreadDetail { try await api.request("/v1/posts/\(id)") }
    func publish(id: String, title: String, body: String, kind: String, topic: String, paperId: String?) async throws -> Discussion {
        let result: Discussion = try await api.request("/v1/posts", method: "POST", body: APIClient.body(PostRequest(id: id, title: title, body: body, kind: kind, topic: topic, paperId: paperId)))
        connected = true; return result
    }
    func reply(id: String, postId: String, parentId: String?, body: String) async throws {
        let _: EmptyResponse = try await api.request("/v1/posts/\(postId)/replies", method: "POST", body: APIClient.body(ReplyRequest(id: id, body: body, parentId: parentId)))
    }
    func removePost(_ id: String) async throws { let _: EmptyResponse = try await api.request("/v1/posts/\(id)", method: "DELETE") }
    func removeReply(_ id: String) async throws { let _: EmptyResponse = try await api.request("/v1/replies/\(id)", method: "DELETE") }
    func report(type: String, id: String, reason: String) async throws {
        let _: EmptyResponse = try await api.request("/v1/reports", method: "POST", body: APIClient.body(["targetType": type, "targetId": id, "reason": reason]))
    }
    func block(_ id: String, remove: Bool = false) async throws {
        let _: EmptyResponse = try await api.request("/v1/blocks", method: remove ? "DELETE" : "POST", body: APIClient.body(["userId": id]))
        await refreshNotifications()
    }
    func blocked() async throws -> [Member] { try await api.request("/v1/blocks") }
    func refreshNotifications() async {
        guard token != nil else { return }
        let generation = epoch
        do {
            let result: [Notice] = try await api.request("/v1/notifications")
            if generation == epoch { notifications = result }
        } catch { handle(error, quiet: true) }
    }
    func markRead(_ id: String) async {
        do { let _: EmptyResponse = try await api.request("/v1/notifications/read", method: "POST", body: APIClient.body(["id": id])); await refreshNotifications() }
        catch { handle(error) }
    }
    func handle(_ error: Error, quiet: Bool = false) {
        if let apiError = error as? APIError, apiError.status == 401 {
            syncMessage = "登录已过期，记录仍保存在本机；请重新登录"
            if !quiet { showLogin = true }
        }
        if !quiet { errorMessage = error.localizedDescription }
    }
    var exportText: String { KnowledgeExport.markdown(catalog: catalog, library: library) }
    private struct Changes: Encodable { var changes: [LibraryChange] }
    private struct PostRequest: Encodable { var id: String; var title: String; var body: String; var kind: String; var topic: String; var paperId: String? }
    private struct ReplyRequest: Encodable { var id: String; var body: String; var parentId: String? }
}

enum TokenVault {
    private static func query(_ key: String) -> [String: Any] { [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "app.paperpop.session", kSecAttrAccount as String: key] }
    static func read(_ key: String) -> String? {
        var q = query(key); q[kSecReturnData as String] = true; q[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &item) == errSecSuccess, let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    static func write(_ value: String, key: String) throws {
        let data = Data(value.utf8), q = query(key)
        let status = SecItemUpdate(q as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecItemNotFound {
            var insert = q; insert[kSecValueData as String] = data
            insert[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            let result = SecItemAdd(insert as CFDictionary, nil)
            if result != errSecSuccess { throw APIError(message: "无法安全保存登录信息（\(result)）", status: 0) }
        } else if status != errSecSuccess { throw APIError(message: "无法更新登录信息（\(status)）", status: 0) }
    }
    static func delete(_ key: String) { SecItemDelete(query(key) as CFDictionary) }
}
