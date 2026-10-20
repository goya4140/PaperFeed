#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
APP="$(pwd)/ios/build/PaperPop Preview.app"
if ! command -v node >/dev/null; then echo '需要先安装 Node.js 22.13 或更新版本。'; exit 1; fi
if [ ! -x "$APP/Contents/MacOS/PaperPop" ]; then bash scripts/build-mac-preview.sh; fi
if node --input-type=module -e 'try{const r=await fetch("http://127.0.0.1:8787/health",{signal:AbortSignal.timeout(1500)});const d=await r.json();process.exit(d.service==="paperpop"?0:1)}catch{process.exit(1)}'; then
  echo 'PaperPop 后台已经运行。'
  open "$APP"
else
  node server/server.mjs &
  paperpop_api_pid=$!
  trap 'kill "$paperpop_api_pid" 2>/dev/null || true' EXIT
  for paperpop_attempt in {1..30}; do
    if curl --fail --silent http://127.0.0.1:8787/health >/dev/null; then break; fi
    if ! kill -0 "$paperpop_api_pid" 2>/dev/null; then echo '后台启动失败，请检查 8787 端口。'; exit 1; fi
    sleep 0.2
  done
  open "$APP"
  echo 'PaperPop 已打开。保持此窗口运行；按 Control+C 停止后台。'
  wait "$paperpop_api_pid"
fi
