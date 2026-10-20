import SwiftUI

struct LibraryView: View {
    @EnvironmentObject private var store: AppStore
    @State private var query = ""
    @State private var filter = "收藏"
    @State private var folder = "全部分组"
    private var folders: [String] { ["全部分组"] + Set(store.library.folders.values).sorted() }
    private var papers: [Paper] {
        store.catalog.papers.filter { paper in
            let included: Bool
            switch filter {
            case "笔记": included = store.library.notes[paper.id] != nil
            case "已读": included = store.library.read.contains(paper.id)
            case "稍后读": included = store.library.saved.contains(paper.id) && !store.library.read.contains(paper.id)
            default: included = store.library.saved.contains(paper.id)
            }
            return included && (folder == "全部分组" || store.library.folders[paper.id] == folder) && (paper.matches(query) || PopTheme.topicName(paper.topic).localizedCaseInsensitiveContains(query) || (store.library.notes[paper.id]?.localizedCaseInsensitiveContains(query) ?? false))
        }
    }
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                HStack {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("YOUR KNOWLEDGE, CONNECTED").font(.system(size: 9, weight: .semibold)).tracking(1.5).foregroundStyle(PopTheme.accent)
                        Text("让好想法，留下来。").font(.system(size: 25, weight: .bold)).tracking(-0.6)
                    }
                    Spacer()
                    ExportButton().labelStyle(.iconOnly).buttonStyle(.plain).font(.system(size: 17)).foregroundStyle(PopTheme.accent)
                }
                Label(store.syncMessage, systemImage: store.snapshot.pending.isEmpty && store.user != nil ? "checkmark.icloud" : "internaldrive")
                    .font(.caption).foregroundStyle(.secondary)
                PopSearchField(text: $query, prompt: "搜索论文和私人笔记")
                PopTabs(options: ["收藏", "稍后读", "笔记", "已读"], selection: $filter)
                HStack {
                    Menu {
                        ForEach(folders, id: \.self) { name in Button(name) { folder = name } }
                    } label: {
                        HStack(spacing: 7) { Image(systemName: "folder"); Text(folder); Image(systemName: "chevron.down").font(.system(size: 8)) }
                            .font(.system(size: 11)).foregroundStyle(.secondary).padding(.horizontal, 12).padding(.vertical, 9)
                            .background(PopTheme.card, in: Capsule())
                    }.quietMenu().fixedSize()
                    Spacer()
                    Text("\(papers.count) 条内容").font(.system(size: 10)).foregroundStyle(.secondary)
                }
                ForEach(papers) { paper in
                    NavigationLink { PaperView(paper: paper) } label: {
                        VStack(alignment: .leading, spacing: 10) {
                            PaperCard(paper: paper)
                            if let note = store.library.notes[paper.id] { Text(note).font(.subheadline).foregroundStyle(.secondary).lineLimit(3).padding(.horizontal, 12) }
                            if let group = store.library.folders[paper.id] { Label(group, systemImage: "folder").font(.caption).padding(.horizontal, 12) }
                        }
                    }.buttonStyle(.plain)
                }
                if papers.isEmpty { EmptyState(icon: "books.vertical", title: "留一点空间给新想法", message: "收藏论文，或在阅读页写下私人笔记，之后在这里找回。") }
            }.padding(22).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.background(PopTheme.background).navigationTitle("").compactNavigation()
            .refreshable { await store.synchronize() }

    }
}
struct ProfileView: View {
    @EnvironmentObject private var store: AppStore
    @AppStorage("paperpop.appearance") private var appearance = "light"
    @State private var interests = false
    @State private var confirmDelete = false
    @State private var busy = false
    @State private var hidden = false
    @State private var logoutConfirm = false
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 21) {
                Text("我的空间").font(.system(size: 23, weight: .bold))
                VStack(spacing: 15) {
                    ZStack(alignment: .bottomTrailing) {
                        Circle().fill(PopTheme.wash).frame(width: 76, height: 76)
                        Image(systemName: "person.crop.circle.fill").font(.system(size: 57, weight: .light)).foregroundStyle(PopTheme.accent.opacity(0.8)).frame(width: 76, height: 76)
                        Image(systemName: "sparkle").font(.system(size: 12)).foregroundStyle(PopTheme.accent).frame(width: 23, height: 23).background(PopTheme.card, in: Circle())
                    }
                    VStack(spacing: 6) {
                        Text(store.user?.name ?? "你好，研究者").font(.system(size: 22, weight: .bold))
                        Text("把阅读，变成自己的知识。").font(.system(size: 12)).foregroundStyle(.secondary)
                    }
                    if store.user == nil { Button("登录，接续你的研究") { store.showLogin = true }.buttonStyle(PopPrimaryButtonStyle()).buttonBorderShape(.capsule).controlSize(.small) }
                    HStack { stat("收藏", store.library.saved.count); Spacer(); stat("笔记", store.library.notes.count); Spacer(); stat("已读", store.library.read.count) }
                        .padding(.horizontal, 25).padding(.top, 7)
                }.padding(24).frame(maxWidth: .infinity).background(PopTheme.card, in: RoundedRectangle(cornerRadius: 24))
                HStack(spacing: 9) {
                    Image(systemName: store.user == nil ? "internaldrive" : "icloud").font(.system(size: 14)).foregroundStyle(PopTheme.accent)
                    Text(store.syncMessage).font(.system(size: 10)).foregroundStyle(.secondary)
                    Spacer(minLength: 0)
                    if store.user != nil { Button { Task { await store.synchronize() } } label: { Image(systemName: "arrow.clockwise").font(.system(size: 12)) }.buttonStyle(.plain) }
                }.padding(14).background(PopTheme.wash.opacity(0.65), in: RoundedRectangle(cornerRadius: 14))
                PopSectionHeading(title: "我的研究", detail: "属于你的知识轨迹")
                VStack(spacing: 12) {
                    Button { interests = true } label: { ProfileMenuRow(icon: "slider.horizontal.3", title: "研究兴趣") }
                    Divider().opacity(0.4)
                    NavigationLink { JoinedTopicsView() } label: { ProfileMenuRow(icon: "person.2", title: "已加入的社区") }
                    Divider().opacity(0.4)
                    Button { hidden = true } label: { ProfileMenuRow(icon: "eye.slash", title: "已隐藏内容", detail: "\(store.library.hidden.count)") }
                }.buttonStyle(.plain).popCard()
                PopSectionHeading(title: "偏好与设置", detail: "")
                VStack(spacing: 12) {
                    NavigationLink { NotificationsView() } label: { ProfileMenuRow(icon: "bell", title: "回复通知", detail: store.unread > 0 ? "\(store.unread) 未读" : "") }
                    Divider().opacity(0.4)
                    HStack {
                        Label("外观", systemImage: "circle.lefthalf.filled").font(.system(size: 13))
                        Spacer()
                        Picker("外观", selection: $appearance) { Text("浅色").tag("light"); Text("深色").tag("dark"); Text("跟随系统").tag("system") }.labelsHidden().pickerStyle(.menu).fixedSize()
                    }.padding(.vertical, 4)
                    Divider().opacity(0.4)
                    ExportButton().font(.system(size: 13)).frame(maxWidth: .infinity, alignment: .leading)
                    Divider().opacity(0.4)
                    NavigationLink { ServerSettingsView() } label: { ProfileMenuRow(icon: "network", title: "服务器连接") }
                    if store.user != nil {
                        Divider().opacity(0.4)
                        NavigationLink { BlockedUsersView() } label: { ProfileMenuRow(icon: "person.slash", title: "屏蔽管理") }
                    }
                    Divider().opacity(0.4)
                    NavigationLink { AboutView() } label: { ProfileMenuRow(icon: "info.circle", title: "关于 PaperPop") }
                }.buttonStyle(.plain).popCard()
                if store.user != nil {
                    VStack(alignment: .leading, spacing: 15) {
                        Button("重新登录 / 切换账号") { store.showLogin = true }
                        Button("退出登录") { logoutConfirm = true }
                        Button("删除账号与服务器数据", role: .destructive) { confirmDelete = true }
                    }.font(.system(size: 12)).disabled(busy).popCard()
                }
                VStack(spacing: 6) { Text("PaperPop").font(.system(size: 15, weight: .semibold, design: .rounded)); Text("保持好奇，让研究发生。 · v0.1").font(.system(size: 9)) }
                    .foregroundStyle(.secondary).frame(maxWidth: .infinity).padding(.vertical, 12)
            }.padding(22).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.background(PopTheme.background).navigationTitle("").compactNavigation()
            .sheet(isPresented: $interests) { NavigationStack { InterestView() } }
            .sheet(isPresented: $hidden) { NavigationStack { HiddenPapersView() } }
            .confirmationDialog("删除账号？此操作不可恢复。你的账号、收藏、笔记、帖子、回复和通知将从此服务器删除。请先导出需要保留的笔记。", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("永久删除", role: .destructive) { Task { busy = true; defer { busy = false }; do { try await store.deleteAccount() } catch { store.handle(error) } } }
            }
            .confirmationDialog("退出后，本机待同步记录会留在此账号的本机空间；重新登录同一账号可继续同步。", isPresented: $logoutConfirm, titleVisibility: .visible) {
                Button("退出登录") { Task { busy = true; await store.logout(); busy = false } }
            }
    }
    private func stat(_ label: String, _ value: Int) -> some View {
        VStack(spacing: 5) { Text("\(value)").font(.system(size: 25, weight: .semibold, design: .rounded)); Text(label).font(.system(size: 10)).foregroundStyle(.secondary) }
    }
}
struct ProfileMenuRow: View {
    var icon: String
    var title: String
    var detail = ""
    var body: some View {
        HStack(spacing: 11) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(PopTheme.accent).frame(width: 22)
            Text(title).font(.system(size: 13)).foregroundStyle(.primary)
            Spacer()
            if !detail.isEmpty { Text(detail).font(.system(size: 10)).foregroundStyle(.secondary) }
            Image(systemName: "chevron.right").font(.system(size: 9, weight: .semibold)).foregroundStyle(.tertiary)
        }.padding(.vertical, 5).contentShape(Rectangle())
    }
}
struct HiddenPapersView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        List {
            if store.library.hidden.isEmpty { Text("没有隐藏的内容").foregroundStyle(.secondary) }
            ForEach(store.catalog.papers.filter { store.library.hidden.contains($0.id) }) { p in
                HStack { Text(p.name); Spacer(); Button("恢复推荐") { store.change("hidden", key: p.id, value: "false") } }
            }
        }.navigationTitle("已隐藏内容").toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { dismiss() } } }
    }
}
struct JoinedTopicsView: View {
    @EnvironmentObject private var store: AppStore
    var body: some View {
        List {
            if store.library.joined.isEmpty { Text("尚未加入社区，在社区页探索你感兴趣的方向。").foregroundStyle(.secondary) }
            ForEach(store.catalog.topics.filter { store.library.joined.contains($0.id) }) { topic in NavigationLink(topic.name) { TopicView(topic: topic) } }
        }.navigationTitle("已加入的社区")
    }
}
struct NotificationsView: View {
    @EnvironmentObject private var store: AppStore
    var body: some View {
        List {
            if store.user == nil { Button("登录后查看回复通知") { store.showLogin = true } }
            else if store.notifications.isEmpty { EmptyState(icon: "bell", title: "暂无回复通知", message: "有人回复你的帖子或评论时，会显示在这里。") }
            ForEach(store.notifications) { notice in
                NavigationLink { ThreadView(id: notice.postId).task { await store.markRead(notice.id) } } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack { if !notice.read { Circle().fill(PopTheme.accent).frame(width: 7, height: 7) }; Text(notice.title).font(.headline) }
                        Text(notice.body).font(.subheadline).foregroundStyle(.secondary).lineLimit(3)
                        Text(String(notice.createdAt.prefix(10))).font(.caption).foregroundStyle(.secondary)
                    }.padding(.vertical, 6)
                }
            }
        }.navigationTitle("回复通知")
            .task { await store.refreshNotifications() }
            .refreshable { await store.refreshNotifications() }
    }
}
struct LoginView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @State private var register = false
    @State private var name = ""
    @State private var password = ""
    @State private var importGuest = true
    @State private var sending = false
    @State private var failure: String?
    var body: some View {
        Form {
            Section {
                Text("让研究与交流接续发生。").font(.title2.weight(.bold))
                Picker("方式", selection: $register) { Text("登录").tag(false); Text("注册").tag(true) }.pickerStyle(.segmented)
            }
            Section("账号") {
                TextField("用户名（2–32 字，文字、数字或下划线）", text: $name).accountEntry()
                SecureField("密码（8–128 字符）", text: $password)
                Text("请妥善保存密码，此内测版尚未提供密码找回。").font(.caption).foregroundStyle(.secondary)
                if store.user == nil { Toggle("将当前访客收藏与笔记导入账号", isOn: $importGuest) }
            }
            Section {
                Button(sending ? "连接中…" : (register ? "注册并登录" : "登录")) {
                    Task {
                        sending = true; failure = nil; defer { sending = false }
                        do { try await store.authenticate(name: name, password: password, register: register, importGuest: importGuest); dismiss() }
                        catch { failure = error.localizedDescription }
                    }
                }.disabled(sending || name.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 || password.count < 8 || password.count > 128)
                if let failure { Text(failure).foregroundStyle(.red) }
            }
            Section("连接与隐私") {
                Text(store.serverAddress).font(.caption).textSelection(.enabled)
                NavigationLink("配置服务器") { ServerSettingsView() }
                Text("收藏与笔记仅对你可见；发帖和回复会公开到所连接服务器。注册即表示你同意遵守社区规则，不发布骚扰、广告或他人隐私。").font(.caption).foregroundStyle(.secondary)
            }
        }.navigationTitle(register ? "加入 PaperPop" : "欢迎回来")
            .disabled(sending)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("稍后") { dismiss() }.disabled(sending) } }
    }
}
struct ServerSettingsView: View {
    @EnvironmentObject private var store: AppStore
    @State private var address = ""
    @State private var testing = false
    @State private var message: String?
    var body: some View {
        Form {
            Section("API 根地址") {
                TextField("http://127.0.0.1:8787", text: $address).serverEntry()
                Text("模拟器使用本机地址；真机填写 Mac 的局域网 IP，并在 Mac 启动监听局域网的后台。公网服务必须使用 HTTPS。").font(.caption).foregroundStyle(.secondary)
                Button(testing ? "连接中…" : "保存并连接") {
                    Task {
                        testing = true; defer { testing = false }
                        do { try store.configure(address); await store.refresh(); message = store.connected ? "连接成功" : "连接失败，请检查地址、服务和网络权限。离线内容仍可使用。" }
                        catch { message = error.localizedDescription }
                    }
                }.disabled(testing)
                if let message { Text(message).font(.subheadline) }
            }
            Section {
                Label(store.connected ? "后台已连接" : "后台未连接", systemImage: store.connected ? "checkmark.circle" : "wifi.slash")
                Text("切换服务器后会进入对应服务器的独立账号与本机空间；登录凭据不会发送到其他服务器。").font(.caption).foregroundStyle(.secondary)
            }
        }.navigationTitle("服务器连接").onAppear { address = store.serverAddress }
    }
}
struct BlockedUsersView: View {
    @EnvironmentObject private var store: AppStore
    @State private var members: [Member] = []
    @State private var failure: String?
    var body: some View {
        List {
            if let failure { Text(failure).foregroundStyle(.red) }
            if members.isEmpty { Text("没有屏蔽的用户").foregroundStyle(.secondary) }
            ForEach(members) { member in
                HStack { Text(member.name); Spacer(); Button("取消屏蔽") { Task { do { try await store.block(member.id, remove: true); await load() } catch { failure = error.localizedDescription } } } }
            }
        }.navigationTitle("屏蔽管理").task { await load() }.refreshable { await load() }
    }
    private func load() async { do { members = try await store.blocked(); failure = nil } catch { failure = error.localizedDescription } }
}
struct AboutView: View {
    var body: some View {
        List {
            Section("PaperPop 0.1") { Text("发现相关研究，通过 Poster 理解核心思路，围绕论文与研究方向交流。") }
            Section("内容与出处") {
                Text("内置内容为 12 条历史论文、技术报告及官方研究发布，不是实时资讯。3 篇精选 Poster 包含证据说明，其余为基础速读。所有流程图均为编辑重绘示意，并非论文原图。")
                Text("Poster 用于辅助理解；研究结论须结合原文版本、实验条件和局限判断。纠错入口在论文页右上角。")
            }
            Section("数据与同步") {
                Text("访客数据保存在本机。登录后，收藏、笔记、阅读标记、分组与兴趣可同步到你配置的后台。同一字段的冲突采用服务器最后收到的操作；不同字段独立合并。离线操作会排队重试。")
                Text("账号会话保存在系统钥匙串。公开帖子、回答和评论对同一服务器的访问者可见；收藏与私人笔记按账号隔离。退出后，本机记录按账号保留。删除账号会删除该账号的服务器数据和此设备缓存。")
            }
            Section("社区规则") { Text("友善交流，尊重作者与其他研究者。禁止广告、骚扰、冒用身份和泄露隐私。可以在内容菜单举报或屏蔽；运营通过后台处理举报。") }
            Section("首版边界") { Text("当前提供内容浏览、结构化 Poster、账号、共享讨论、方向社区、站内通知、私人知识同步与导出。暂不包含自动采集、自动生成 Poster、密码找回、音频、私信、系统推送或作者认证。") }
        }.navigationTitle("关于与使用说明")
    }
}
