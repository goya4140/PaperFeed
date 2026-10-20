import Foundation
import SwiftUI
import CryptoKit

@main
enum StoreVerification {
    @MainActor static func main() async throws {
        guard let address = ProcessInfo.processInfo.environment["PAPERPOP_VERIFY_API"] else { fatalError("PAPERPOP_VERIFY_API is required") }
        let name = "verify_" + String(UUID().uuidString.prefix(8))
        let store = AppStore()
        try store.configure(address)
        await store.refresh()
        precondition(store.connected)
        store.change("notes", key: "2303.11366", value: "离线导入笔记")
        store.change("saved", key: "2303.11366", value: "true")
        try await store.authenticate(name: name, password: "synthetic-password-123", register: true, importGuest: true)
        for _ in 0..<100 where !store.snapshot.pending.isEmpty { try await Task.sleep(for: .milliseconds(50)) }
        precondition(store.snapshot.pending.isEmpty, store.syncMessage)
        let library: Library = try await store.api.request("/v1/library")
        precondition(library.notes["2303.11366"] == "离线导入笔记")
        let id = UUID().uuidString
        let post = try await store.publish(id: id, title: "客户端集成验证", body: "测试数据，验证结束后自动清理。", kind: "问题", topic: "Agent Memory", paperId: "2303.11366")
        precondition(post.id == id)
        let found = try await store.posts(paperId: "2303.11366")
        precondition(found.contains { $0.id == id })
        await store.logout()
        precondition(store.library.notes["2303.11366"] == nil, "Imported guest data must not be re-imported on every login")
        try await store.authenticate(name: name + "_b", password: "synthetic-password-456", register: true, importGuest: false)
        precondition(store.library.notes.isEmpty && store.library.saved.isEmpty, "Accounts must have isolated local and server state")
        store.change("notes", key: "2310.08560", value: "Account B only")
        for _ in 0..<100 where !store.snapshot.pending.isEmpty { try await Task.sleep(for: .milliseconds(50)) }
        try await store.deleteAccount()
        try await store.authenticate(name: name, password: "synthetic-password-123", register: false, importGuest: false)
        precondition(store.library.saved.contains("2303.11366"))
        precondition(store.library.notes["2303.11366"] == "离线导入笔记")
        try await store.deleteAccount()
        precondition(store.user == nil)
        let prefix = SHA256.hash(data: Data(address.utf8)).map { String(format: "%02x", $0) }.joined()
        let directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("PaperPop")
        for url in (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)) ?? [] where url.lastPathComponent.hasPrefix(prefix) { try? FileManager.default.removeItem(at: url) }
        print("PaperPop client integration: Keychain, API decoding, guest import, offline queue, account sync, publish, logout/login and deletion passed.")
    }
}
