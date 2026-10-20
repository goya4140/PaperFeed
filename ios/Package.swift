// swift-tools-version: 6.0
import PackageDescription
let package = Package(
    name: "PaperPopCore", platforms: [.macOS(.v14), .iOS(.v17)],
    products: [.library(name: "PaperPopCore", targets: ["PaperPopCore"])],
    targets: [
        .target(name: "PaperPopCore", path: "PaperPop/Core"),
        .executableTarget(name: "PaperPopVerify", dependencies: ["PaperPopCore"], path: "Verification")
    ]
)
