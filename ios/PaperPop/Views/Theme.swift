import SwiftUI
#if os(macOS)
import AppKit
#endif

enum PopTheme {
    static let accent = Color(red: 0.24, green: 0.35, blue: 0.92)
    static let ink = Color.primary
    static let midnight = Color(red: 0.08, green: 0.12, blue: 0.28)
    static let mint = Color(red: 0.73, green: 0.93, blue: 0.79)
    #if os(macOS)
    static let background = adaptive(light: (0.96, 0.97, 0.985), dark: (0.055, 0.070, 0.12))
    static let card = adaptive(light: (1, 1, 1), dark: (0.09, 0.11, 0.18))
    static let wash = adaptive(light: (0.92, 0.94, 0.985), dark: (0.13, 0.16, 0.25))
    private static func adaptive(light: (Double, Double, Double), dark: (Double, Double, Double)) -> Color {
        Color(nsColor: NSColor(name: nil) { appearance in
            let c = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? dark : light
            return NSColor(calibratedRed: c.0, green: c.1, blue: c.2, alpha: 1)
        })
    }
    #else
    static let background = Color("Canvas")
    static let card = Color("Surface")
    static let wash = Color("Wash")
    #endif
    static func color(_ topic: String) -> Color {
        switch topic {
        case "Agent Memory": return accent
        case "Agent Systems": return Color(red: 0.10, green: 0.55, blue: 0.45)
        case "Test-Time Learning": return Color(red: 0.78, green: 0.35, blue: 0.30)
        case "World Models": return Color(red: 0.22, green: 0.48, blue: 0.75)
        default: return Color(red: 0.54, green: 0.37, blue: 0.73)
        }
    }
    static func symbol(_ topic: String) -> String {
        switch topic {
        case "Agent Memory": return "brain.head.profile"
        case "Agent Systems": return "point.3.connected.trianglepath.dotted"
        case "Test-Time Learning": return "waveform.path"
        case "World Models": return "globe.americas"
        default: return "square.stack.3d.up"
        }
    }
    static func topicName(_ topic: String) -> String {
        switch topic {
        case "Agent Memory": return "智能体记忆"
        case "Agent Systems": return "智能体系统"
        case "Test-Time Learning": return "测试时学习"
        case "World Models": return "世界模型"
        case "Efficient Models": return "高效模型"
        default: return topic
        }
    }
}
struct Pill: View {
    var text: String
    var color: Color = PopTheme.accent
    var body: some View {
        Text(text).font(.system(size: 10, weight: .semibold)).padding(.horizontal, 9).padding(.vertical, 5)
            .foregroundStyle(color).background(color.opacity(0.075), in: Capsule())
    }
}
struct PopSearchField: View {
    @Binding var text: String
    var prompt: String
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass").font(.system(size: 15, weight: .medium)).foregroundStyle(.secondary)
            TextField(prompt, text: $text).textFieldStyle(.plain).font(.system(size: 13)).autocorrectionDisabled()
            if !text.isEmpty { Button { text = "" } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary) }.buttonStyle(.plain).accessibilityLabel("清除搜索") }
        }.padding(.horizontal, 15).frame(height: 45)
            .background(PopTheme.card, in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(.primary.opacity(0.055)))
    }
}
struct PopPrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var enabled
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.font(.system(size: 12, weight: .semibold)).foregroundStyle(.white)
            .padding(.horizontal, 17).padding(.vertical, 11)
            .background(PopTheme.accent, in: RoundedRectangle(cornerRadius: 12))
            .opacity(enabled ? (configuration.isPressed ? 0.82 : 1) : 0.45)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: 0.14), value: configuration.isPressed)
    }
}
struct PopTabs: View {
    var options: [String]
    @Binding var selection: String
    var body: some View {
        HStack(spacing: 22) {
            ForEach(options, id: \.self) { item in
                Button { withAnimation(.easeInOut(duration: 0.18)) { selection = item } } label: {
                    VStack(spacing: 9) {
                        Text(item).font(.system(size: 14, weight: selection == item ? .bold : .medium))
                            .foregroundStyle(selection == item ? Color.primary : Color.secondary)
                        Capsule().fill(selection == item ? PopTheme.accent : .clear).frame(width: 18, height: 3)
                    }
                }.buttonStyle(.plain).accessibilityAddTraits(selection == item ? .isSelected : [])
            }
            Spacer(minLength: 0)
        }
    }
}
struct PopSectionHeading: View {
    var title: String
    var detail: String
    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).font(.system(size: 19, weight: .bold))
            Spacer()
            Text(detail).font(.system(size: 10, weight: .medium)).foregroundStyle(.secondary)
        }
    }
}
struct ResearchArtwork: View {
    var topic: String
    var inverted = false
    var body: some View {
        GeometryReader { geometry in
            let side = min(geometry.size.width, geometry.size.height)
            let color = inverted ? Color.white : PopTheme.color(topic)
            ZStack {
                Canvas { context, size in
                    let center = CGPoint(x: size.width / 2, y: size.height / 2)
                    let r = min(size.width, size.height) * 0.31
                    for factor in [0.8, 1.25, 1.70] {
                        let rr = r * factor
                        context.stroke(Path(ellipseIn: CGRect(x: center.x - rr, y: center.y - rr, width: rr * 2, height: rr * 2)), with: .color(color.opacity(inverted ? 0.13 : 0.10)), lineWidth: 1)
                    }
                    let points = (0..<6).map { index -> CGPoint in
                        let angle = Double(index) * .pi / 3 - .pi / 6
                        return CGPoint(x: center.x + cos(angle) * r * 1.25, y: center.y + sin(angle) * r * 1.25)
                    }
                    for index in 0..<6 {
                        var line = Path(); line.move(to: points[index]); line.addLine(to: points[(index + 2) % 6])
                        context.stroke(line, with: .color(color.opacity(inverted ? 0.3 : 0.15)), lineWidth: 1)
                        let p = points[index]
                        context.fill(Path(ellipseIn: CGRect(x: p.x - 3, y: p.y - 3, width: 6, height: 6)), with: .color(index == 1 && inverted ? PopTheme.mint : color.opacity(0.7)))
                    }
                }
                RoundedRectangle(cornerRadius: side * 0.17).fill(inverted ? .white.opacity(0.12) : color.opacity(0.10))
                    .frame(width: side * 0.45, height: side * 0.45).rotationEffect(.degrees(-12))
                Image(systemName: PopTheme.symbol(topic)).font(.system(size: side * 0.24, weight: .light)).foregroundStyle(color)
            }
        }.accessibilityHidden(true)
    }
}
struct PaperCard: View {
    let paper: Paper
    @EnvironmentObject private var store: AppStore
    var body: some View {
        HStack(alignment: .top, spacing: 15) {
            ResearchArtwork(topic: paper.topic).frame(width: 79, height: 91)
                .background(PopTheme.color(paper.topic).opacity(0.055), in: RoundedRectangle(cornerRadius: 16))
            VStack(alignment: .leading, spacing: 7) {
                HStack(spacing: 6) {
                    Text(PopTheme.topicName(paper.topic)).font(.system(size: 10, weight: .semibold)).foregroundStyle(PopTheme.color(paper.topic))
                    Spacer(minLength: 3)
                    if store.library.saved.contains(paper.id) { Image(systemName: "bookmark.fill").font(.system(size: 11)).foregroundStyle(PopTheme.accent) }
                }
                Text(paper.name).font(.system(size: 20, weight: .bold, design: .serif)).foregroundStyle(.primary).lineLimit(2)
                Text(paper.summary).font(.system(size: 12)).foregroundStyle(.secondary).lineSpacing(3).lineLimit(2)
                HStack(spacing: 5) {
                    Text(paper.isAbstractOnly ? "摘要" : paper.poster == nil ? "速读" : "Poster").foregroundStyle(PopTheme.accent)
                    Text("·")
                    Text(paper.date)
                    Spacer(minLength: 0)
                    Image(systemName: "arrow.up.right").font(.system(size: 10, weight: .semibold))
                }.font(.system(size: 10)).foregroundStyle(.secondary).padding(.top, 3)
            }
        }.padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(PopTheme.card, in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(.primary.opacity(0.04)))
    }
}
struct FeaturedPaperCard: View {
    let paper: Paper
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                HStack(spacing: 5) { Image(systemName: "sparkle"); Text("本期精选") }.font(.system(size: 10, weight: .semibold)).foregroundStyle(PopTheme.mint)
                Spacer()
                Text("PAPER / \(paper.name)").font(.system(size: 9, weight: .medium, design: .monospaced)).foregroundStyle(.white.opacity(0.55))
            }
            HStack(spacing: 4) {
                VStack(alignment: .leading, spacing: 11) {
                    Text(paper.poster?.title ?? paper.name).font(.system(size: 23, weight: .bold)).lineSpacing(4).fixedSize(horizontal: false, vertical: true)
                    Text(paper.summary).font(.system(size: 11)).foregroundStyle(.white.opacity(0.65)).lineSpacing(3).lineLimit(2)
                }.frame(maxWidth: .infinity, alignment: .leading)
                ResearchArtwork(topic: paper.topic, inverted: true).frame(width: 100, height: 118)
            }
            HStack {
                Text("读懂 \(paper.name)").font(.system(size: 11, weight: .semibold))
                Image(systemName: "arrow.right").font(.system(size: 11, weight: .semibold))
                Spacer()
                Text("图解 · 证据 · 局限").font(.system(size: 9)).foregroundStyle(.white.opacity(0.5))
            }.padding(.top, 3)
        }.foregroundStyle(.white).padding(22)
            .background(LinearGradient(colors: [PopTheme.midnight, Color(red: 0.17, green: 0.24, blue: 0.49)], startPoint: .topLeading, endPoint: .bottomTrailing), in: RoundedRectangle(cornerRadius: 24))
    }
}
struct FlowDiagram: View {
    let steps: [String]
    var tint: Color = PopTheme.accent
    var body: some View {
        VStack(spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                HStack(spacing: 13) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10).fill(tint.opacity(index == 0 ? 1 : 0.08)).frame(width: 32, height: 32)
                        Text(String(format: "%02d", index + 1)).font(.system(size: 11, weight: .semibold, design: .monospaced)).foregroundStyle(index == 0 ? .white : tint)
                    }
                    Text(step).font(.system(size: 13, weight: .medium)).fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                }
                if index < steps.count - 1 {
                    HStack { Rectangle().fill(tint.opacity(0.18)).frame(width: 1, height: 13).padding(.leading, 16); Spacer() }
                }
            }
        }
    }
}
struct EmptyState: View {
    var icon: String
    var title: String
    var message: String
    var body: some View {
        VStack(spacing: 13) {
            Image(systemName: icon).font(.system(size: 24, weight: .light)).foregroundStyle(PopTheme.accent)
                .frame(width: 64, height: 64).background(PopTheme.wash, in: RoundedRectangle(cornerRadius: 22))
            Text(title).font(.system(size: 17, weight: .semibold))
            Text(message).font(.system(size: 12)).foregroundStyle(.secondary).lineSpacing(3).multilineTextAlignment(.center)
        }.padding(.vertical, 36).padding(.horizontal, 24).frame(maxWidth: .infinity)
    }
}
struct InlineError: View {
    var message: String
    var retry: () -> Void
    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "wifi.exclamationmark").foregroundStyle(.secondary)
            Text(message).font(.system(size: 12)).foregroundStyle(.secondary)
            Spacer(minLength: 0)
            Button("重试", action: retry).buttonStyle(.plain).font(.system(size: 12, weight: .semibold)).foregroundStyle(PopTheme.accent)
        }.popCard()
    }
}
extension View {
    @ViewBuilder func quietMenu() -> some View {
        #if os(macOS)
        self.menuStyle(.borderlessButton).menuIndicator(.hidden)
        #else
        self
        #endif
    }
    @ViewBuilder func accountEntry() -> some View {
        #if os(iOS)
        self.textInputAutocapitalization(.never).autocorrectionDisabled()
        #else
        self.autocorrectionDisabled()
        #endif
    }
    @ViewBuilder func serverEntry() -> some View {
        #if os(iOS)
        self.textInputAutocapitalization(.never).keyboardType(.URL).autocorrectionDisabled()
        #else
        self.autocorrectionDisabled()
        #endif
    }
    func popCard() -> some View {
        self.padding(20).frame(maxWidth: .infinity, alignment: .leading)
            .background(PopTheme.card, in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(.primary.opacity(0.04)))
    }
    @ViewBuilder func compactNavigation() -> some View {
        #if os(iOS)
        self.navigationBarTitleDisplayMode(.inline)
        #else
        self
        #endif
    }
}
