import Foundation
import PaperPopCore
@main
enum Verification {
    static func main() throws { try testOfflineQueueAndAtomicReload(); try testCatalogAndExport(); print("PaperPop core: persistence, merge, catalog and export passed") }
    static func testOfflineQueueAndAtomicReload() throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString).appendingPathComponent("state.json")
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        var state = LocalSnapshot()
        let save = LibraryChange(field: "saved", key: "paper", value: "true")
        let note = LibraryChange(field: "notes", key: "paper", value: "离线笔记")
        state.pending = [save, note]
        for change in state.pending { state.library.apply(change) }
        try DiskStore.write(state, to: url)
        let restored = try DiskStore.read(LocalSnapshot.self, from: url)
        assert(restored.pending.map(\.id) == state.pending.map(\.id))
        assert(restored.library.saved.contains("paper"))
        assert(restored.library.notes["paper"] == "离线笔记")
        var remote = Library()
        remote.apply(LibraryChange(field: "saved", key: "another", value: "true"))
        for change in restored.pending { remote.apply(change) }
        assert(remote.saved == ["paper", "another"])
        remote.apply(LibraryChange(field: "notes", key: "paper", value: ""))
        assert(remote.notes["paper"] == nil)
    }
    static func testCatalogAndExport() throws {
        let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
        let catalog = try DiskStore.read(Catalog.self, from: root.appendingPathComponent("PaperPop/Resources/catalog.json"))
        assert(catalog.papers.count == 12)
        assert(catalog.papers.filter { $0.poster != nil }.count == 3)
        assert(catalog.papers.allSatisfy { $0.source?.scheme == "https" })
        assert(catalog.papers.first!.matches("Shinn"))
        var library = Library()
        library.apply(LibraryChange(field: "notes", key: catalog.papers[0].id, value: "我的笔记"))
        let export = KnowledgeExport.markdown(catalog: catalog, library: library)
        assert(export.contains("我的笔记"))
        assert(export.contains(catalog.papers[0].sourceUrl))
        assert(!export.contains(catalog.papers[1].title))
    }
}
