#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
APP="$(pwd)/ios/build/PaperPop Preview.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -parse-as-library -target "$(uname -m)-apple-macosx14.0" -O \
  ios/PaperPop/Core/*.swift ios/PaperPop/App/*.swift ios/PaperPop/Views/*.swift \
  -o "$APP/Contents/MacOS/PaperPop"
cp ios/PaperPop/Resources/catalog.json "$APP/Contents/Resources/catalog.json"
cp ios/PaperPop/Assets.xcassets/AppIcon.appiconset/AppIcon.png "$APP/Contents/Resources/AppIcon.png"
/usr/bin/python3 - "$APP" <<'PY'
import plistlib,sys
from pathlib import Path
app=Path(sys.argv[1])
info={'CFBundleName':'PaperPop Preview','CFBundleDisplayName':'PaperPop Preview','CFBundleIdentifier':'app.paperpop.macpreview','CFBundleExecutable':'PaperPop','CFBundlePackageType':'APPL','CFBundleShortVersionString':'0.1.0','CFBundleVersion':'1','LSMinimumSystemVersion':'14.0','NSHighResolutionCapable':True,'CFBundleIconFile':'AppIcon.png','NSAppTransportSecurity':{'NSAllowsArbitraryLoads':True},'CFBundleURLTypes':[{'CFBundleURLName':'app.paperpop.paper','CFBundleURLSchemes':['paperpop']}],'NSLocalNetworkUsageDescription':'连接配置的 PaperPop 开发后台。'}
(app/'Contents/Info.plist').write_bytes(plistlib.dumps(info))
PY
codesign --force --sign - "$APP"
echo "Built: $APP"
