import SwiftUI

struct RootView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.scenePhase) private var scenePhase
    @State private var linkedPaper: Paper?
    @AppStorage("paperpop.appearance") private var appearance = "light"
    var body: some View {
        pages
        .safeAreaInset(edge: .bottom, spacing: 0) { PopTabBar() }
        .preferredColorScheme(appearance == "system" ? nil : appearance == "dark" ? .dark : .light)
        .sheet(isPresented: $store.showLogin) { NavigationStack { LoginView() }.environmentObject(store) }
        .sheet(item: $linkedPaper) { paper in NavigationStack { PaperView(paper: paper).toolbar { ToolbarItem(placement: .cancellationAction) { Button("关闭") { linkedPaper = nil } } } } }
        .alert("操作提示", isPresented: Binding(get: { store.errorMessage != nil }, set: { if !$0 { store.errorMessage = nil } })) {
            Button("知道了") { store.errorMessage = nil }
        } message: { Text(store.errorMessage ?? "") }
        .onOpenURL { url in
            guard url.scheme == "paperpop", url.host == "paper" else { return }
            linkedPaper = store.catalog.papers.first { $0.id == url.lastPathComponent }
        }
        .task(id: scenePhase) {
            guard scenePhase == .active else { return }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(30))
                guard !Task.isCancelled else { break }
                await store.refreshNotifications()
                await store.synchronize()
            }
        }
    }
    @ViewBuilder private var pages: some View {
        #if os(iOS)
        TabView(selection: $store.tab) {
            NavigationStack { DiscoverView() }.toolbar(.hidden, for: .tabBar).tag(0)
            NavigationStack { CommunitiesView() }.toolbar(.hidden, for: .tabBar).tag(1)
            NavigationStack { LibraryView() }.toolbar(.hidden, for: .tabBar).tag(2)
            NavigationStack { ProfileView() }.toolbar(.hidden, for: .tabBar).tag(3)
        }
        #else
        NavigationStack {
            switch store.tab {
            case 1: CommunitiesView()
            case 2: LibraryView()
            case 3: ProfileView()
            default: DiscoverView()
            }
        }.id(store.tab)
        #endif
    }
}
struct DiscoverView: View {
    @EnvironmentObject private var store: AppStore
    @State private var query = ""
    @State private var selectedTopic = "全部"
    @State private var mode = "为你推荐"
    @State private var interests = false
    var filtered: [Paper] {
        let papers = store.catalog.papers.filter {
            ($0.matches(query) || PopTheme.topicName($0.topic).localizedCaseInsensitiveContains(query)) && (selectedTopic == "全部" || $0.topic == selectedTopic) && !store.library.hidden.contains($0.id)
        }
        return papers.sorted {
            if mode == "最新发表" { return $0.date > $1.date }
            let a = store.library.interests.contains($0.topic) ? 1 : 0
            let b = store.library.interests.contains($1.topic) ? 1 : 0
            if a != b { return a > b }
            if ($0.poster != nil) != ($1.poster != nil) { return $0.poster != nil }
            return $0.date > $1.date
        }
    }
    private var featured: Paper? {
        guard query.isEmpty, mode == "为你推荐" else { return nil }
        return filtered.first { $0.poster != nil }
    }
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 23) {
                HStack(spacing: 9) {
                    Image(systemName: "square.stack.3d.up.fill").font(.system(size: 17, weight: .medium)).foregroundStyle(.white)
                        .frame(width: 32, height: 32).background(PopTheme.accent, in: RoundedRectangle(cornerRadius: 11))
                    Text("PaperPop").font(.system(size: 23, weight: .bold, design: .rounded)).tracking(-0.8)
                    Spacer()
                    Button { Task { await store.refresh() } } label: {
                        Image(systemName: "arrow.clockwise").font(.system(size: 15)).foregroundStyle(.secondary)
                            .frame(width: 32, height: 36)
                    }.buttonStyle(.plain).accessibilityLabel("刷新论文")
                    NavigationLink { NotificationsView() } label: {
                        Image(systemName: store.unread > 0 ? "bell.badge" : "bell").font(.system(size: 16)).foregroundStyle(.primary)
                            .frame(width: 36, height: 36).background(PopTheme.card, in: Circle())
                    }.buttonStyle(.plain).accessibilityLabel(store.unread > 0 ? "消息，\(store.unread)条未读" : "消息")
                }
                VStack(alignment: .leading, spacing: 9) {
                    Text("A LITTLE DISCOVERY, EVERY DAY").font(.system(size: 9, weight: .semibold)).tracking(1.8).foregroundStyle(PopTheme.accent)
                    Text("好想法，值得被发现。").font(.system(size: 27, weight: .bold)).tracking(-0.7)
                    Text("发现前沿研究，读懂背后的想法。").font(.system(size: 12)).foregroundStyle(.secondary)
                }.padding(.top, 1)
                PopSearchField(text: $query, prompt: "搜索论文、作者、研究方向")
                HStack(alignment: .top) {
                    PopTabs(options: ["为你推荐", "最新发表"], selection: $mode)
                    Button { interests = true } label: { Image(systemName: "slider.horizontal.3").font(.system(size: 15)).foregroundStyle(.secondary).padding(3) }
                        .buttonStyle(.plain).accessibilityLabel("调整研究兴趣")
                }
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(["全部"] + store.catalog.topics.map(\.name), id: \.self) { topic in
                            Button { selectedTopic = topic } label: {
                                Text(topic == "全部" ? "全部" : PopTheme.topicName(topic)).font(.system(size: 11, weight: .medium))
                                    .padding(.horizontal, 13).padding(.vertical, 8)
                                    .background(selectedTopic == topic ? PopTheme.accent : PopTheme.card, in: Capsule())
                                    .foregroundStyle(selectedTopic == topic ? Color.white : Color.secondary)
                            }.buttonStyle(.plain)
                        }
                    }
                }.padding(.top, -10)
                if let featured {
                    NavigationLink { PaperView(paper: featured) } label: { FeaturedPaperCard(paper: featured) }.buttonStyle(.plain)
                }
                PopSectionHeading(title: "值得一读", detail: "\(filtered.count) 条研究内容")
                VStack(spacing: 11) {
                    ForEach(filtered.filter { $0.id != featured?.id }) { paper in
                        NavigationLink { PaperView(paper: paper) } label: { PaperCard(paper: paper) }.buttonStyle(.plain)
                            .contextMenu {
                                Button(store.library.saved.contains(paper.id) ? "取消收藏" : "稍后读", systemImage: "bookmark") {
                                    store.toggle("saved", key: paper.id, contains: store.library.saved.contains(paper.id))
                                }
                                Button("不感兴趣", systemImage: "eye.slash") { store.change("hidden", key: paper.id, value: "true") }
                            }
                    }
                }
                if filtered.isEmpty { EmptyState(icon: "magnifyingglass", title: "换个方向，继续发现", message: "试试其他标题、作者或方向；已隐藏内容可在“我的”中恢复。") }
                HStack(spacing: 6) { Circle().fill(PopTheme.accent.opacity(0.5)).frame(width: 4, height: 4); Text("已收录论文 · 刷新获取后台内容") }
                    .font(.system(size: 9)).foregroundStyle(.secondary).frame(maxWidth: .infinity).padding(.vertical, 7)
            }.padding(.horizontal, 22).padding(.top, 18).padding(.bottom, 18)
                .frame(maxWidth: 620).frame(maxWidth: .infinity)
        }
        .background(PopTheme.background).navigationTitle("").compactNavigation()
        .refreshable { await store.refresh() }
        .sheet(isPresented: $interests) { NavigationStack { InterestView() } }
    }
}
struct PopTabBar: View {
    @EnvironmentObject private var store: AppStore
    private let titles = ["发现", "社区", "资料库", "我的"]
    private let icons = ["square.grid.2x2", "bubble.left.and.bubble.right", "bookmark", "person.crop.circle"]
    var body: some View {
        HStack(spacing: 0) {
            ForEach(0..<4, id: \.self) { index in
                Button { store.tab = index } label: {
                    VStack(spacing: 4) {
                        Image(systemName: icons[index] + (store.tab == index ? ".fill" : ""))
                            .font(.system(size: 18, weight: .medium)).frame(width: 47, height: 29)
                            .background(store.tab == index ? PopTheme.accent.opacity(0.08) : .clear, in: Capsule())
                        Text(titles[index]).font(.system(size: 9, weight: store.tab == index ? .semibold : .regular))
                    }.foregroundStyle(store.tab == index ? PopTheme.accent : .secondary)
                        .frame(maxWidth: .infinity).frame(height: 58).contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityLabel(titles[index]).accessibilityAddTraits(store.tab == index ? .isSelected : [])
            }
        }.padding(.horizontal, 12).padding(.top, 5).padding(.bottom, 3)
            .frame(maxWidth: .infinity).background(PopTheme.card)
            .overlay(alignment: .top) { Rectangle().fill(.primary.opacity(0.05)).frame(height: 0.5) }
    }
}

struct InterestView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        List {
            Section { Text("选择你关心的方向，随时可以调整。暂不选择也能浏览全部内容。").foregroundStyle(.secondary) }
            ForEach(store.catalog.topics) { topic in
                Button {
                    store.toggle("interests", key: topic.id, contains: store.library.interests.contains(topic.id))
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 5) { Text(topic.name).font(.headline); Text(topic.description).font(.caption).foregroundStyle(.secondary) }
                        Spacer()
                        Image(systemName: store.library.interests.contains(topic.id) ? "checkmark.circle.fill" : "circle").foregroundStyle(PopTheme.accent)
                    }.padding(.vertical, 8)
                }.buttonStyle(.plain)
            }
        }.navigationTitle("你的研究兴趣")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { dismiss() } } }
    }
}
