import SwiftUI

struct CommunitiesView: View {
    @EnvironmentObject private var store: AppStore
    @State private var query = ""
    @State private var filter = "探索方向"
    private var topics: [ResearchTopic] {
        store.catalog.topics.filter { topic in
            (query.isEmpty || (topic.name + topic.description + PopTheme.topicName(topic.id)).localizedCaseInsensitiveContains(query)) && (filter == "探索方向" || store.library.joined.contains(topic.id))
        }
    }
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 23) {
                HStack {
                    Text("研究社区").font(.system(size: 23, weight: .bold)).tracking(-0.5)
                    Spacer()
                    Image(systemName: "person.2.wave.2").font(.system(size: 18, weight: .light)).foregroundStyle(PopTheme.accent)
                }
                VStack(alignment: .leading, spacing: 9) {
                    Text("FIND YOUR PEOPLE").font(.system(size: 9, weight: .semibold)).tracking(1.8).foregroundStyle(PopTheme.accent)
                    Text("好问题，总会遇见同路人。").font(.system(size: 25, weight: .bold)).tracking(-0.6)
                    Text("从一篇论文出发，让想法在交流中生长。").font(.system(size: 12)).foregroundStyle(.secondary)
                }
                PopSearchField(text: $query, prompt: "寻找你感兴趣的研究方向")
                PopTabs(options: ["探索方向", "已加入"], selection: $filter)
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 155), spacing: 12)], spacing: 12) {
                    ForEach(topics) { topic in
                        NavigationLink { TopicView(topic: topic) } label: {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Image(systemName: PopTheme.symbol(topic.id)).font(.system(size: 16, weight: .medium))
                                        .foregroundStyle(PopTheme.color(topic.id)).frame(width: 34, height: 34)
                                        .background(PopTheme.color(topic.id).opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                                    Spacer()
                                    Image(systemName: store.library.joined.contains(topic.id) ? "checkmark" : "arrow.up.right").font(.system(size: 10, weight: .medium)).foregroundStyle(.secondary)
                                }
                                ResearchArtwork(topic: topic.id).frame(height: 78).frame(maxWidth: .infinity)
                                Text(PopTheme.topicName(topic.id)).font(.system(size: 17, weight: .bold))
                                Text(topic.name).font(.system(size: 10, weight: .medium)).foregroundStyle(.secondary).lineLimit(1).minimumScaleFactor(0.75)
                                Text(topic.description).font(.system(size: 11)).foregroundStyle(.secondary).lineLimit(2).frame(minHeight: 32, alignment: .topLeading)
                                HStack(spacing: 4) { Circle().fill(PopTheme.color(topic.id)).frame(width: 4, height: 4); Text("\(store.catalog.papers.filter { $0.topic == topic.id }.count) 条研究内容") }.font(.system(size: 9)).foregroundStyle(.secondary)
                            }.padding(16).frame(maxWidth: .infinity, alignment: .leading)
                                .background(PopTheme.card, in: RoundedRectangle(cornerRadius: 20))
                                .overlay(RoundedRectangle(cornerRadius: 20).stroke(.primary.opacity(0.04)))
                        }.buttonStyle(.plain)
                    }
                }
                if topics.isEmpty { EmptyState(icon: "person.2", title: "找到你的研究方向", message: filter == "已加入" ? "加入感兴趣的社区，下次在这里快速找到。" : "试试其他方向或关键词。") }
                NavigationLink { DiscussionList(topic: nil, paperId: nil).navigationTitle("全部交流") } label: {
                    HStack { Image(systemName: "bubble.left.and.bubble.right"); Text("看看大家在聊什么"); Spacer(); Image(systemName: "arrow.right") }
                        .font(.system(size: 12, weight: .medium)).foregroundStyle(PopTheme.accent).popCard()
                }.buttonStyle(.plain)
            }.padding(.horizontal, 22).padding(.vertical, 20).frame(maxWidth: 620).frame(maxWidth: .infinity)
        }.background(PopTheme.background).navigationTitle("").compactNavigation()
    }
}
struct TopicView: View {
    let topic: ResearchTopic
    @EnvironmentObject private var store: AppStore
    @State private var mode = "交流"
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 15) {
                    ResearchArtwork(topic: topic.id).frame(width: 66, height: 70)
                        .background(PopTheme.color(topic.id).opacity(0.06), in: RoundedRectangle(cornerRadius: 18))
                    VStack(alignment: .leading, spacing: 6) {
                        Text(PopTheme.topicName(topic.id)).font(.system(size: 23, weight: .bold))
                        Text(topic.name).font(.system(size: 11)).foregroundStyle(.secondary)
                        Text(topic.description).font(.system(size: 11)).foregroundStyle(.secondary)
                    }
                    Spacer(minLength: 0)
                }
                HStack {
                    Text(topic.prompt).font(.system(size: 11)).foregroundStyle(.secondary)
                    Spacer(minLength: 6)
                    Button(store.library.joined.contains(topic.id) ? "已加入" : "+ 加入") {
                        store.toggle("joined", key: topic.id, contains: store.library.joined.contains(topic.id))
                    }.buttonStyle(.bordered).buttonBorderShape(.capsule).controlSize(.small)
                }
                PopTabs(options: ["交流", "研究内容"], selection: $mode)
            }.padding(.horizontal, 22).padding(.top, 16).padding(.bottom, 4)
            if mode == "交流" { DiscussionList(topic: topic.id, paperId: nil) }
            else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(store.catalog.papers.filter { $0.topic == topic.id }) { paper in
                            NavigationLink { PaperView(paper: paper) } label: { PaperCard(paper: paper) }.buttonStyle(.plain)
                        }
                    }.padding(22).frame(maxWidth: 620).frame(maxWidth: .infinity)
                }
            }
        }.background(PopTheme.background).navigationTitle("方向社区").compactNavigation()
    }
}
struct DiscussionList: View {
    let topic: String?
    let paperId: String?
    @EnvironmentObject private var store: AppStore
    @State private var posts: [Discussion] = []
    @State private var failure: String?
    @State private var loading = true
    @State private var composer = false
    @State private var query = ""
    @State private var kind = "全部"
    @State private var hasMore = true
    @State private var loadingMore = false
    var filtered: [Discussion] { posts.filter { (kind == "全部" || $0.kind == kind) && (query.isEmpty || ($0.title + $0.body + $0.author).localizedCaseInsensitiveContains(query)) } }
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text(paperId == nil ? "灵感与交流" : "围绕这篇论文").font(.system(size: 17, weight: .bold))
                    Spacer()
                    Button { if store.requireLogin() { composer = true } } label: { Label("发起交流", systemImage: "plus.bubble") }.buttonStyle(PopPrimaryButtonStyle()).buttonBorderShape(.capsule).controlSize(.small)
                }
                Text("友善交流，让每个问题都有价值。私人记录请使用笔记。").font(.system(size: 10)).foregroundStyle(.secondary)
                PopSearchField(text: $query, prompt: "搜索已加载的标题、内容或作者")
                PopTabs(options: ["全部", "问题", "讨论"], selection: $kind)
                if loading { ProgressView().frame(maxWidth: .infinity) }
                if let failure { InlineError(message: failure) { Task { await load() } } }
                if !loading && failure == nil && filtered.isEmpty {
                    EmptyState(icon: "bubble.left.and.bubble.right", title: posts.isEmpty ? "开启第一场交流" : "没有匹配的话题", message: "提一个具体问题，分享你的思考或复现经历。")
                }
                ForEach(filtered) { post in
                    NavigationLink { ThreadView(id: post.id) } label: { DiscussionCard(post: post) }.buttonStyle(.plain)
                }
                if hasMore && !posts.isEmpty {
                    Button(loadingMore ? "加载中…" : "加载更多") { Task { await more() } }.disabled(loadingMore).frame(maxWidth: .infinity)
                }
            }.padding(20).frame(maxWidth: 760).frame(maxWidth: .infinity)
        }
        .background(PopTheme.background)
        .task(id: store.user?.id) { await load() }
        .refreshable { await load() }
        .sheet(isPresented: $composer) {
            NavigationStack { ComposePost(topic: topic, paperId: paperId) { Task { await load() } } }
        }
    }
    private func load() async {
        loading = true; failure = nil
        do { posts = try await store.posts(topic: topic, paperId: paperId); hasMore = posts.count == 50 }
        catch { failure = error.localizedDescription }
        loading = false
    }
    private func more() async {
        loadingMore = true; defer { loadingMore = false }
        do {
            let next = try await store.posts(topic: topic, paperId: paperId, offset: posts.count)
            let existing = Set(posts.map(\.id)); posts.append(contentsOf: next.filter { !existing.contains($0.id) }); hasMore = next.count == 50
        } catch { failure = error.localizedDescription }
    }
}
struct DiscussionCard: View {
    let post: Discussion
    var body: some View {
        VStack(alignment: .leading, spacing: 13) {
            HStack(spacing: 8) {
                Text(String(post.author.prefix(1)).uppercased()).font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(PopTheme.color(post.topic)).frame(width: 25, height: 25)
                    .background(PopTheme.color(post.topic).opacity(0.08), in: Circle())
                Text(post.author).font(.system(size: 11, weight: .medium))
                Spacer()
                Pill(text: post.kind, color: post.kind == "问题" ? PopTheme.accent : .teal)
            }
            Text(post.title).font(.system(size: 16, weight: .semibold)).lineSpacing(3)
            Text(post.body).font(.system(size: 12)).foregroundStyle(.secondary).lineSpacing(3).lineLimit(2)
            HStack {
                Text(PopTheme.topicName(post.topic))
                Text("·")
                Text(String(post.createdAt.prefix(10)))
                Spacer()
                Label("\(post.replies) 回复", systemImage: "bubble.right")
            }.font(.system(size: 9)).foregroundStyle(.secondary)
        }.popCard()
    }
}
struct ComposePost: View {
    let topic: String?
    let paperId: String?
    var onPublished: () -> Void
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var bodyText = ""
    @State private var selectedTopic = ""
    @State private var selectedPaper = ""
    @State private var kind = "问题"
    @State private var sending = false
    @State private var failure: String?
    @State private var requestId = UUID().uuidString
    @State private var cancelConfirm = false
    var body: some View {
        Form {
            Section("发布位置") {
                Picker("方向", selection: $selectedTopic) { ForEach(store.catalog.topics) { Text($0.name).tag($0.id) } }.disabled(paperId != nil || topic != nil)
                Picker("关联论文", selection: $selectedPaper) {
                    Text("不关联具体论文").tag("")
                    ForEach(store.catalog.papers.filter { $0.topic == selectedTopic }) { Text($0.name).tag($0.id) }
                }.disabled(paperId != nil)
                Picker("类型", selection: $kind) { Text("问题").tag("问题"); Text("讨论").tag("讨论") }
            }
            Section("标题与正文") {
                TextField("一个明确的问题或观点（最多 150 字）", text: $title)
                TextEditor(text: $bodyText).frame(minHeight: 200)
                Text("\(bodyText.count)/10000 · 发布后对社区成员公开").font(.caption).foregroundStyle(.secondary)
            }
            Section { Text("不发布广告、骚扰或他人隐私。讨论研究结论时请提供依据；没有证据的推断请明确说明。").font(.caption).foregroundStyle(.secondary) }
            if let failure { Section { Text(failure).foregroundStyle(.red); Text("内容仍保留，可以重试。").font(.caption) } }
        }.disabled(sending).navigationTitle("发起交流")
            .interactiveDismissDisabled(!bodyText.isEmpty || !title.isEmpty)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("取消") { if bodyText.isEmpty && title.isEmpty { dismiss() } else { cancelConfirm = true } }.disabled(sending) }
                ToolbarItem(placement: .confirmationAction) { Button(sending ? "发布中…" : "发布") { Task { await publish() } }.disabled(sending || title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || title.count > 150 || bodyText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || bodyText.count > 10000) }
            }
            .confirmationDialog("放弃这次编辑？", isPresented: $cancelConfirm) { Button("放弃编辑", role: .destructive) { dismiss() } }
            .onAppear { selectedTopic = topic ?? store.catalog.topics.first?.id ?? ""; selectedPaper = paperId ?? "" }
            .onChange(of: selectedTopic) { _, value in if let paper = store.catalog.papers.first(where: { $0.id == selectedPaper }), paper.topic != value { selectedPaper = "" } }
            .onChange(of: title) { _, _ in requestId = UUID().uuidString }
            .onChange(of: bodyText) { _, _ in requestId = UUID().uuidString }
            .onChange(of: selectedPaper) { _, _ in requestId = UUID().uuidString }
            .onChange(of: kind) { _, _ in requestId = UUID().uuidString }
    }
    private func publish() async {
        sending = true; defer { sending = false }
        do {
            _ = try await store.publish(id: requestId, title: title, body: bodyText, kind: kind, topic: selectedTopic, paperId: selectedPaper.isEmpty ? nil : selectedPaper)
            onPublished(); dismiss()
        } catch { failure = error.localizedDescription; if (error as? APIError)?.status == 401 { store.showLogin = true } }
    }
}
struct ThreadView: View {
    let id: String
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @State private var detail: ThreadDetail?
    @State private var failure: String?
    @State private var loading = true
    @State private var replyText = ""
    @State private var replyTarget: Reply?
    @State private var sending = false
    @State private var requestId = UUID().uuidString
    @State private var reportTarget: ReportTarget?
    @State private var deletingPost = false
    @State private var deletingReply: String?
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                if loading && detail == nil { ProgressView().frame(maxWidth: .infinity) }
                if let failure { InlineError(message: failure) { Task { await load() } } }
                if let detail {
                    HStack {
                        Pill(text: detail.post.kind); Text(detail.post.topic).font(.caption).foregroundStyle(.secondary)
                        Spacer()
                        moderation(id: detail.post.id, authorId: detail.post.authorId, type: "post")
                    }
                    Text(detail.post.title).font(.title.weight(.bold))
                    Text("\(detail.post.author) · \(String(detail.post.createdAt.prefix(10)))").font(.caption).foregroundStyle(.secondary)
                    Text(detail.post.body).lineSpacing(5).textSelection(.enabled)
                    if let paperId = detail.post.paperId, let paper = store.catalog.papers.first(where: { $0.id == paperId }) {
                        NavigationLink { PaperView(paper: paper) } label: { Label("关联论文：\(paper.name)", systemImage: "doc.text") }
                    }
                    Divider()
                    Text(detail.post.kind == "问题" ? "回答与交流" : "评论与回复").font(.headline)
                    if detail.replies.isEmpty { Text("还没有回复，分享你的看法。").foregroundStyle(.secondary) }
                    ForEach(detail.replies) { reply in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack { Text(reply.author).font(.subheadline.weight(.semibold)); Spacer(); moderation(id: reply.id, authorId: reply.authorId, type: "reply") }
                            if let parentId = reply.parentId {
                                Text("回复 \(detail.replies.first(where: { $0.id == parentId })?.author ?? "已不可见的内容")").font(.caption).foregroundStyle(PopTheme.accent)
                            }
                            Text(reply.body).textSelection(.enabled)
                            HStack {
                                Text(String(reply.createdAt.prefix(10))).font(.caption).foregroundStyle(.secondary)
                                Spacer()
                                Button("回复") { if store.requireLogin() { replyTarget = reply } }.font(.caption)
                            }
                        }.popCard()
                    }
                    if store.user == nil { Button("登录后参与交流") { store.showLogin = true }.buttonStyle(PopPrimaryButtonStyle()) }
                    else {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text(replyTarget.map { "回复 \($0.author)" } ?? (detail.post.kind == "问题" ? "写一个回答" : "发表评论")).font(.headline)
                                Spacer()
                                if replyTarget != nil { Button("取消回复") { replyTarget = nil } }
                            }
                            TextEditor(text: $replyText).frame(minHeight: 120).padding(6).background(PopTheme.card, in: RoundedRectangle(cornerRadius: 14)).disabled(sending)
                            Text("公开发布 · 最多 10000 字").font(.caption).foregroundStyle(.secondary)
                            Button(sending ? "发送中…" : "发送") { Task { await send() } }.buttonStyle(PopPrimaryButtonStyle())
                                .disabled(sending || replyText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || replyText.count > 10000)
                        }
                    }
                }
            }.padding(20).frame(maxWidth: 760).frame(maxWidth: .infinity)
        }.background(PopTheme.background).navigationTitle("论文与方向交流")
            .task(id: store.user?.id) { await load() }
            .refreshable { await load() }
            .onChange(of: replyText) { _, _ in requestId = UUID().uuidString }
            .onChange(of: replyTarget?.id) { _, _ in requestId = UUID().uuidString }
            .sheet(item: $reportTarget) { target in NavigationStack { ReportView(type: target.type, id: target.id) } }
            .confirmationDialog("删除帖子及其全部回复？", isPresented: $deletingPost) {
                Button("删除", role: .destructive) { Task { do { try await store.removePost(id); dismiss() } catch { store.handle(error) } } }
            }
            .confirmationDialog("删除这条回复？", isPresented: Binding(get: { deletingReply != nil }, set: { if !$0 { deletingReply = nil } })) {
                Button("删除回复", role: .destructive) {
                    if let target = deletingReply { Task { do { try await store.removeReply(target); await load() } catch { store.handle(error) } } }
                }
            }
    }
    private func moderation(id: String, authorId: String, type: String) -> some View {
        Menu {
            if store.user?.id == authorId {
                Button("删除", role: .destructive) { if type == "post" { deletingPost = true } else { deletingReply = id } }
            } else {
                Button("举报") { if store.requireLogin() { reportTarget = ReportTarget(id: id, type: type) } }
                Button("屏蔽此用户", role: .destructive) {
                    if store.requireLogin() { Task { do { try await store.block(authorId); if type == "post" { dismiss() } else { await load() } } catch { store.handle(error) } } }
                }
            }
        } label: { Image(systemName: "ellipsis").frame(width: 30, height: 30).contentShape(Rectangle()) }
    }
    private func load() async {
        loading = true; failure = nil
        do { detail = try await store.detail(id) } catch { failure = error.localizedDescription }
        loading = false
    }
    private func send() async {
        sending = true; defer { sending = false }
        do {
            try await store.reply(id: requestId, postId: id, parentId: replyTarget?.id, body: replyText)
            replyText = ""; replyTarget = nil; requestId = UUID().uuidString; await load()
        } catch { failure = error.localizedDescription }
    }
    private struct ReportTarget: Identifiable { var id: String; var type: String }
}
struct ReportView: View {
    let type: String
    let id: String
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @State private var reason = ""
    @State private var sending = false
    @State private var failure: String?
    @State private var sent = false
    var body: some View {
        Form {
            Section(type == "paper" ? "说明原文位置、错误内容与建议修正" : "说明违规内容与原因") { TextEditor(text: $reason).frame(minHeight: 180) }
            if let failure { Text(failure).foregroundStyle(.red) }
            if sent { Label("已提交，等待运营处理", systemImage: "checkmark.circle").foregroundStyle(.green) }
            else {
                Button(sending ? "提交中…" : "提交") {
                    guard store.requireLogin() else { return }
                    Task {
                        sending = true; defer { sending = false }
                        do { try await store.report(type: type, id: id, reason: reason); sent = true }
                        catch { failure = error.localizedDescription }
                    }
                }.disabled(sending || reason.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || reason.count > 1000)
            }
        }.navigationTitle(type == "paper" ? "内容纠错" : "举报内容")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { dismiss() } } }
    }
}
