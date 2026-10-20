import AppKit
import ImageIO
import UniformTypeIdentifiers
let output = CommandLine.arguments[1]
let size = 1024
// An explicit bitmap keeps the export at 1024 pixels on Retina displays too.
let context = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8,
                        bytesPerRow: size * 4, space: CGColorSpaceCreateDeviceRGB(),
                        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
NSColor(calibratedRed:0.24,green:0.35,blue:0.92,alpha:1).setFill()
NSBezierPath(rect:NSRect(x:0,y:0,width:size,height:size)).fill()
NSColor.white.withAlphaComponent(0.12).setFill()
NSBezierPath(ovalIn:NSRect(x:600,y:640,width:600,height:600)).fill()
let paper=NSBezierPath(roundedRect:NSRect(x:230,y:230,width:570,height:600),xRadius:70,yRadius:70)
NSColor(calibratedRed:1,green:1,blue:1,alpha:1).setFill();paper.fill()
let paragraph=NSMutableParagraphStyle();paragraph.alignment = .center
let attributes:[NSAttributedString.Key:Any] = [.font:NSFont(name:"Georgia-Bold",size:430) ?? NSFont.boldSystemFont(ofSize:430),.foregroundColor:NSColor(calibratedRed:0.24,green:0.35,blue:0.92,alpha:1),.paragraphStyle:paragraph]
("P" as NSString).draw(in:NSRect(x:230,y:280,width:570,height:510),withAttributes:attributes)
NSColor(calibratedRed:0.08,green:0.12,blue:0.28,alpha:1).setFill()
NSBezierPath(roundedRect:NSRect(x:575,y:170,width:280,height:180),xRadius:65,yRadius:65).fill()
let tail=NSBezierPath();tail.move(to:NSPoint(x:760,y:200));tail.line(to:NSPoint(x:820,y:125));tail.line(to:NSPoint(x:815,y:230));tail.close();tail.fill()
NSColor.white.setFill()
for x in [640,710,780] { NSBezierPath(ovalIn:NSRect(x:x-12,y:250,width:24,height:24)).fill() }
NSGraphicsContext.restoreGraphicsState()
let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: output) as CFURL,
                                                UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, context.makeImage()!, nil)
precondition(CGImageDestinationFinalize(destination), "Icon export failed")
