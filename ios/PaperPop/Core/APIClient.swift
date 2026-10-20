import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct APIError: LocalizedError, Sendable {
    public var message: String
    public var status: Int
    public var errorDescription: String? { message }
}
public struct APIClient: Sendable {
    public var baseURL: URL
    public var token: String?
    public init(baseURL: URL, token: String? = nil) { self.baseURL = baseURL; self.token = token }
    public func request<T: Decodable & Sendable>(_ path: String, method: String = "GET", body: Data? = nil) async throws -> T {
        guard let url = URL(string: baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + path) else {
            throw APIError(message: "服务器地址无效", status: 0)
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 15
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError(message: "服务器响应无效", status: 0) }
        guard (200..<300).contains(http.statusCode) else {
            let error = try? JSONDecoder().decode(ErrorBody.self, from: data)
            throw APIError(message: error?.error ?? "请求失败（\(http.statusCode)）", status: http.statusCode)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
    public static func body<T: Encodable>(_ value: T) throws -> Data { try JSONEncoder().encode(value) }
    private struct ErrorBody: Decodable { var error: String }
}
public struct EmptyResponse: Codable, Sendable { public var ok: Bool }
