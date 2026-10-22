import SwiftUI

struct PaperView: View {
    private let initialPaper: Paper
    init(paper: Paper) { self.initialPaper = paper }
    @EnvironmentObject private var store: AppStore
    private var paper: Paper { store.catalog.papers.first { $0.id == initialPaper.id } ?? initialPaper }
    @State private var note = false
    @State private var diagram = false
    @State private var report = false
    @State private var mode = "Poster"
    private var sections: [PosterSection] {
        paper.poster?.sections ?? (paper.isAbstractOnly ? [
            PosterSection(title: "论文摘要", label: "原始摘要 · 尚未生成详细解读", text: paper.summary)
        ] : [
            PosterSection(title: "研究问题", label: "基础速读 · 待逐条补充原文定位", text: paper.problem),
            PosterSection(title: "核心方法", label: "基础速读 · 编辑整理", text: paper.method),
            PosterSection(title: "主要结果", label: "基础速读 · 请结合原文实验条件", text: paper.result),
            PosterSection(title: "条件与局限", label: "阅读提示", text: paper.limitation)
        ].filter { !$0.text.isEmpty })
    }
    var body: some View {
        VStack(spacing: 0) {
            PopTabs(options: ["Poster", "论文交流"], selection: $mode)
                .padding(.horizontal, 22).padding(.top, 12).padding(.bottom, 5)
            if mode == "论文交流" {
                DiscussionList(topic: paper.topic, paperId: paper.id)
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 18) {
                            header
                            HStack {
                                Label(paper.isAbstractOnly ? "论文摘要 · 详细解读待发布" : paper.poster == nil ? "基础速读 · 完整 Poster 待制作" : "精选图解 · 编辑整理", systemImage: "checkmark.seal")
                                    .font(.system(size: 10)).foregroundStyle(.secondary)
                            }
                            if let hook = paper.poster?.hook, !hook.isEmpty {
                                DisclosureGroup { Text(hook).font(.system(size: 13)).foregroundStyle(.secondary).lineSpacing(5).padding(.top, 12) }
                                    label: { Label("从一个例子开始", systemImage: "lightbulb").font(.system(size: 12, weight: .medium)) }.popCard()
                            }
                            if !(paper.poster?.flow ?? paper.steps).isEmpty { Button { diagram = true } label: { flowCard }.buttonStyle(.plain) }
                            if let evidence = paper.poster?.evidence, !evidence.isEmpty {
                                VStack(alignment: .leading, spacing: 15) {
                                    PopSectionHeading(title: "关键证据", detail: "原文实验 · 请结合条件")
                                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 130), spacing: 12)], alignment: .leading, spacing: 12) {
                                        ForEach(evidence, id: \.label) { item in
                                            VStack(alignment: .leading, spacing: 7) {
                                                Text(item.value).font(.system(size: 29, weight: .bold, design: .rounded)).foregroundStyle(PopTheme.accent)
                                                Text(item.label).font(.system(size: 11, weight: .semibold))
                                                Text(item.context).font(.system(size: 10)).foregroundStyle(.secondary).lineSpacing(3).fixedSize(horizontal: false, vertical: true)
                                            }.padding(15).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                                                .background(PopTheme.wash.opacity(0.7), in: RoundedRectangle(cornerRadius: 16))
                                        }
                                    }
                                }.popCard()
                            }
                            ForEach(Array(sections.enumerated()), id: \.offset) { index, section in
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack(alignment: .top) {
                                        Text(String(format: "%02d", index + 1)).font(.system(size: 11, weight: .semibold, design: .monospaced)).foregroundStyle(PopTheme.accent).padding(.top, 4)
                                        Text(section.title).font(.system(size: 18, weight: .bold))
                                    }
                                    Text(section.text).font(.system(size: 14)).lineSpacing(6).textSelection(.enabled)
                                    Text(section.label).font(.system(size: 10)).foregroundStyle(.secondary)
                                    if let source = paper.source { Link(destination: source) { Label("查看原文核实", systemImage: "arrow.up.right") }.font(.caption) }
                                    Button(index + 1 < sections.count ? "继续下一节" : "读完了，标记已读") {
                                        if index + 1 < sections.count {
                                            store.change("positions", key: paper.id, value: String(index + 1))
                                            withAnimation { proxy.scrollTo(index + 1, anchor: .top) }
                                        } else { store.change("read", key: paper.id, value: "true") }
                                    }.font(.caption.weight(.semibold))
                                }.popCard().id(index)
                            }
                            if let example = paper.poster?.example, !example.title.isEmpty {
                                VStack(alignment: .leading, spacing: 14) {
                                    Text(example.title).font(.system(size: 17, weight: .semibold))
                                    Text("编辑例子 · 非原文实验").font(.caption).foregroundStyle(.secondary)
                                    Label(example.before, systemImage: "minus.circle").font(.system(size: 12)).foregroundStyle(.secondary)
                                    Label(example.after, systemImage: "arrow.right.circle.fill").font(.system(size: 12, weight: .medium)).foregroundStyle(PopTheme.accent)
                                }.popCard()
                            }
                            resources
                            Button { mode = "论文交流" } label: {
                                Label("带着问题，加入论文交流", systemImage: "bubble.left.and.bubble.right.fill").frame(maxWidth: .infinity).padding(8)
                            }.buttonStyle(PopPrimaryButtonStyle())
                            if let topic = store.catalog.topics.first(where: { $0.id == paper.topic }) {
                                NavigationLink { TopicView(topic: topic) } label: { Label("进入 \(topic.name) 社区", systemImage: "person.3") }.padding(.vertical, 8)
                            }
                            if let related = paper.poster?.related, !related.isEmpty {
                                Text("接着读").font(.headline)
                                ForEach(store.catalog.papers.filter { related.contains($0.id) }) { other in
                                    NavigationLink { PaperView(paper: other) } label: { PaperCard(paper: other) }.buttonStyle(.plain)
                                }
                            }
                        }.padding(22).frame(maxWidth: 620).frame(maxWidth: .infinity)
                    }
                    .refreshable { await store.refresh() }
                    .onAppear {
                        if let position = store.library.positions[paper.id], let index = Int(position) { proxy.scrollTo(index, anchor: .top) }
                    }
                }
            }
        }
        .background(PopTheme.background).navigationTitle(paper.name).compactNavigation()
        .toolbar {
            ToolbarItemGroup {
                Button { note = true } label: { Label("私人笔记", systemImage: "square.and.pencil") }
                Button { store.toggle("saved", key: paper.id, contains: store.library.saved.contains(paper.id)) } label: {
                    Label(store.library.saved.contains(paper.id) ? "取消收藏" : "收藏", systemImage: store.library.saved.contains(paper.id) ? "bookmark.fill" : "bookmark")
                }
                Menu {
                    Button("刷新论文") { Task { await store.refresh() } }
                    Button(store.library.read.contains(paper.id) ? "标记未读" : "标记已读") { store.toggle("read", key: paper.id, contains: store.library.read.contains(paper.id)) }
                    Button(store.library.hidden.contains(paper.id) ? "恢复推荐" : "不感兴趣") { store.toggle("hidden", key: paper.id, contains: store.library.hidden.contains(paper.id)) }
                    Button("内容纠错") { report = true }
                    ShareLink(item: "\(paper.title)\n\(paper.summary)\n原文：\(paper.sourceUrl)\n在 PaperPop 打开：paperpop://paper/\(paper.id)") { Label("分享论文", systemImage: "square.and.arrow.up") }
                } label: { Label("更多", systemImage: "ellipsis.circle") }
            }
        }
        .sheet(isPresented: $note) { NavigationStack { NoteEditor(paper: paper) } }
        .sheet(isPresented: $diagram) { NavigationStack { FlowDetail(title: paper.name, steps: paper.poster?.flow ?? paper.steps) } }
        .sheet(isPresented: $report) { NavigationStack { ReportView(type: "paper", id: paper.id) } }
    }
    private var header: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                Text("PAPER INSIGHT").font(.system(size: 9, weight: .semibold)).tracking(2).foregroundStyle(PopTheme.accent)
                Spacer()
                Pill(text: PopTheme.topicName(paper.topic), color: PopTheme.color(paper.topic))
            }
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(paper.name).font(.system(size: 36, weight: .bold, design: .serif)).tracking(-1.2)
                    Text(paper.poster?.title ?? (paper.isAbstractOnly ? "从摘要开始，回到原文。" : "一个想法，快速读懂。")).font(.system(size: 20, weight: .semibold)).lineSpacing(4).fixedSize(horizontal: false, vertical: true)
                }.frame(maxWidth: .infinity, alignment: .leading)
                ResearchArtwork(topic: paper.topic).frame(width: 73, height: 100)
            }
            Text(paper.summary).font(.system(size: 13)).foregroundStyle(.secondary).lineSpacing(5)
            Divider().opacity(0.5)
            HStack {
                Label(paper.date, systemImage: "calendar").font(.system(size: 9))
                Spacer()
                Text(paper.kind).font(.system(size: 9))
            }.foregroundStyle(.secondary)
            DisclosureGroup {
                VStack(alignment: .leading, spacing: 8) {
                    Text(paper.title).font(.system(size: 12, weight: .medium)).textSelection(.enabled)
                    Text(paper.authors.joined(separator: " · ")).font(.system(size: 10)).foregroundStyle(.secondary)
                    if let source = paper.source { Link("打开原文", destination: source).font(.system(size: 11)) }
                }.padding(.top, 9)
            } label: { Text("论文信息与来源").font(.system(size: 11)).foregroundStyle(.secondary) }
        }.padding(22).background(PopTheme.card, in: RoundedRectangle(cornerRadius: 24))
            .overlay(RoundedRectangle(cornerRadius: 24).stroke(PopTheme.accent.opacity(0.07)))
    }
    private var flowCard: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack {
                VStack(alignment: .leading, spacing: 7) {
                    Text("THE CORE IDEA").font(.system(size: 9, weight: .semibold)).tracking(1.5).foregroundStyle(PopTheme.accent)
                    Text("一个流程，理解方法。").font(.system(size: 18, weight: .bold))
                }
                Spacer()
                Image(systemName: "arrow.up.left.and.arrow.down.right").font(.system(size: 12)).foregroundStyle(PopTheme.accent)
                    .frame(width: 30, height: 30).background(PopTheme.wash, in: Circle())
            }
            FlowDiagram(steps: paper.poster?.flow ?? paper.steps, tint: PopTheme.color(paper.topic))
            Text("原创流程示意 · 非论文原图 · 点击放大").font(.system(size: 9)).foregroundStyle(.secondary)
        }.popCard()
    }
    private var resources: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("原文与资源").font(.headline)
            if let url = paper.source { Link(destination: url) { Label("打开论文 / 官方来源", systemImage: "doc.text") } }
            if let project = paper.projectUrl, let url = URL(string: project) { Link(destination: url) { Label("项目资源", systemImage: "link") } }
            Text("\(paper.poster?.version ?? "basic-1") · \(paper.poster == nil ? "基础速读尚未提供逐条原文定位" : "各节标注原文与编辑解释；结论须结合实验条件")").font(.caption).foregroundStyle(.secondary)
        }.popCard()
    }
}
struct FlowDetail: View {
    let title: String
    let steps: [String]
    @Environment(\.dismiss) private var dismiss
    @State private var scale = 1.0
    var body: some View {
        VStack {
            HStack { Text("图解字号"); Slider(value: $scale, in: 1...2) }.padding()
            ScrollView([.horizontal, .vertical]) {
                VStack(spacing: 18) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                        Text("\(index + 1). \(step)").font(.system(size: 22 * scale, weight: .semibold)).padding(24)
                            .frame(minWidth: 280).background(PopTheme.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 20))
                        if index < steps.count - 1 { Image(systemName: "arrow.down").font(.title2) }
                    }
                }.padding(24)
            }
        }.navigationTitle(title).toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { dismiss() } } }
    }
}
struct NoteEditor: View {
    let paper: Paper
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @State private var text = ""
    @State private var folder = ""
    @State private var pendingSave: Task<Void, Never>?
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(paper.name).font(.title2.weight(.bold))
            Label("私人笔记，不会公开到讨论区", systemImage: "lock").font(.caption).foregroundStyle(.secondary)
            TextField("分组（可选，例如 Agent 项目）", text: $folder).textFieldStyle(.roundedBorder)
            TextEditor(text: $text).font(.body).frame(minHeight: 240).padding(8).background(PopTheme.background, in: RoundedRectangle(cornerRadius: 16))
            Text(store.syncMessage).font(.caption).foregroundStyle(.secondary)
        }.padding(20).navigationTitle("我的笔记")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { save(); dismiss() } } }
            .onAppear { text = store.library.notes[paper.id] ?? ""; folder = store.library.folders[paper.id] ?? "" }
            .onChange(of: text) { _, _ in scheduleSave() }
            .onChange(of: folder) { _, _ in scheduleSave() }
            .onDisappear { pendingSave?.cancel(); save() }
    }
    private func scheduleSave() {
        pendingSave?.cancel()
        pendingSave = Task { try? await Task.sleep(for: .milliseconds(500)); if !Task.isCancelled { save() } }
    }
    private func save() {
        if text != store.library.notes[paper.id] ?? "" { store.change("notes", key: paper.id, value: text) }
        if folder != store.library.folders[paper.id] ?? "" { store.change("folders", key: paper.id, value: folder) }
    }
}
