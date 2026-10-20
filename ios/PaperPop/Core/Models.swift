import Foundation

public struct Catalog: Codable, Sendable {
    public var version: Int
    public var generatedAt: String
    public var topics: [ResearchTopic]
    public var papers: [Paper]
}
public struct ResearchTopic: Codable, Identifiable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var description: String
    public var prompt: String
}
public struct Paper: Codable, Identifiable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var title: String
    public var authors: [String]
    public var date: String
    public var kind: String
    public var topic: String
    public var tags: [String]
    public var summary: String
    public var problem: String
    public var method: String
    public var result: String
    public var limitation: String
    public var steps: [String]
    public var sourceUrl: String
    public var projectUrl: String?
    public var poster: Poster?
    public var source: URL? { URL(string: sourceUrl) }
    public func matches(_ query: String) -> Bool {
        query.isEmpty || ([name, title, summary, topic] + authors + tags).joined(separator: " ").localizedCaseInsensitiveContains(query)
    }
}
public struct Poster: Codable, Hashable, Sendable {
    public var title: String
    public var hook: String
    public var status: String
    public var sourceUrl: String
    public var version: String
    public var flow: [String]
    public var sections: [PosterSection]
    public var example: PosterExample
    public var evidence: [PosterEvidence]
    public var related: [String]
}
public struct PosterSection: Codable, Hashable, Sendable {
    public var title: String
    public var label: String
    public var text: String
}
public struct PosterExample: Codable, Hashable, Sendable {
    public var title: String
    public var before: String
    public var after: String
}
public struct PosterEvidence: Codable, Hashable, Sendable {
    public var label: String
    public var value: String
    public var context: String
}
public struct Member: Codable, Identifiable, Sendable { public var id: String; public var name: String }
public struct AuthResult: Codable, Sendable { public var token: String; public var user: Member }
public struct Discussion: Codable, Identifiable, Hashable, Sendable {
    public var id: String
    public var topic: String
    public var paperId: String?
    public var kind: String
    public var title: String
    public var body: String
    public var authorId: String
    public var author: String
    public var createdAt: String
    public var replies: Int
}
public struct Reply: Codable, Identifiable, Sendable {
    public var id: String
    public var postId: String
    public var parentId: String?
    public var body: String
    public var authorId: String
    public var author: String
    public var createdAt: String
}
public struct ThreadDetail: Codable, Sendable { public var post: Discussion; public var replies: [Reply] }
public struct Notice: Codable, Identifiable, Sendable {
    public var id: String
    public var postId: String
    public var title: String
    public var body: String
    public var createdAt: String
    public var read: Bool
}
public struct LibraryChange: Codable, Identifiable, Sendable {
    public var id: String = UUID().uuidString
    public var field: String
    public var key: String
    public var value: String
    public init(field: String, key: String, value: String) { self.field = field; self.key = key; self.value = value }
}
public struct Library: Codable, Sendable {
    public var saved: Set<String> = []
    public var read: Set<String> = []
    public var interests: Set<String> = []
    public var joined: Set<String> = []
    public var hidden: Set<String> = []
    public var notes: [String: String] = [:]
    public var folders: [String: String] = [:]
    public var positions: [String: String] = [:]
    public init() {}
    public var migrationChanges: [LibraryChange] {
        var changes: [LibraryChange] = []
        for (field, values) in [("saved", saved), ("read", read), ("interests", interests), ("joined", joined), ("hidden", hidden)] {
            for key in values.sorted() { changes.append(LibraryChange(field: field, key: key, value: "true")) }
        }
        for (field, values) in [("notes", notes), ("folders", folders), ("positions", positions)] {
            for key in values.keys.sorted() { if let value = values[key], !value.isEmpty { changes.append(LibraryChange(field: field, key: key, value: value)) } }
        }
        return changes
    }
    public mutating func apply(_ change: LibraryChange) {
        switch change.field {
        case "saved": Self.update(&saved, change)
        case "read": Self.update(&read, change)
        case "interests": Self.update(&interests, change)
        case "joined": Self.update(&joined, change)
        case "hidden": Self.update(&hidden, change)
        case "notes": notes[change.key] = change.value.isEmpty ? nil : change.value
        case "folders": folders[change.key] = change.value.isEmpty ? nil : change.value
        case "positions": positions[change.key] = change.value.isEmpty ? nil : change.value
        default: break
        }
    }
    private static func update(_ set: inout Set<String>, _ change: LibraryChange) {
        if change.value == "true" { set.insert(change.key) } else { set.remove(change.key) }
    }
}
public struct LocalSnapshot: Codable, Sendable {
    public var library = Library()
    public var pending: [LibraryChange] = []
    public init() {}
}
public enum DiskStore {
    public static func read<T: Decodable>(_ type: T.Type, from url: URL) throws -> T {
        try JSONDecoder().decode(type, from: Data(contentsOf: url))
    }
    public static func write<T: Encodable>(_ value: T, to url: URL) throws {
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(value).write(to: url, options: .atomic)
    }
}
public enum KnowledgeExport {
    public static func markdown(catalog: Catalog, library: Library) -> String {
        var text = "# PaperPop 研究笔记\n\n"
        for p in catalog.papers where library.saved.contains(p.id) || library.notes[p.id] != nil {
            text += "## \(p.title)\n\n\(p.authors.joined(separator: ", ")) · \(p.date)\n\n[原文](\(p.sourceUrl))\n\n\(p.summary)\n\n"
            if let folder = library.folders[p.id] { text += "分组：\(folder)\n\n" }
            if let note = library.notes[p.id] { text += "### 我的笔记\n\n\(note)\n\n" }
        }
        return text
    }
}
