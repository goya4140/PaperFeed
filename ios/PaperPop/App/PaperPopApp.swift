import SwiftUI

@main
struct PaperPopApp: App {
    @StateObject private var store = AppStore()
    @Environment(\.scenePhase) private var scenePhase
    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .tint(PopTheme.accent)
                .task { await store.refresh() }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active { Task { await store.refresh() } }
                }
                #if os(macOS)
                .frame(minWidth: 390, minHeight: 760)
                #endif
        }
        #if os(macOS)
        .defaultSize(width: 440, height: 840)
        .windowStyle(.hiddenTitleBar)
        #endif
    }
}
