import SwiftUI
import UniformTypeIdentifiers

struct MarkdownDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.plainText] }
    var text: String
    init(text: String) { self.text = text }
    init(configuration: ReadConfiguration) throws {
        text = String(data: configuration.file.regularFileContents ?? Data(), encoding: .utf8) ?? ""
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: Data(text.utf8))
    }
}
struct ExportButton: View {
    @EnvironmentObject private var store: AppStore
    @State private var exporting = false
    var body: some View {
        Button { exporting = true } label: { Label("导出 Markdown 文件", systemImage: "square.and.arrow.up") }
            .fileExporter(isPresented: $exporting, document: MarkdownDocument(text: store.exportText), contentType: .plainText, defaultFilename: "PaperPop-notes.md") { result in
                if case .failure(let error) = result { store.handle(error) }
            }
    }
}
