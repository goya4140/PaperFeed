#!/usr/bin/env python3
"""Install a downloaded Apple Xcode archive, build PaperPop and run an iPhone Simulator.

Uses a per-process DEVELOPER_DIR; never changes the global xcode-select setting,
accepts licenses, reads browser credentials, or replaces an existing Xcode.
"""
import argparse
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "outputs" / "ios-simulator"
BUNDLE = "app.paperpop.ios"


class SetupError(RuntimeError):
    pass


def run(args, *, env=None, capture=False, cwd=None, check=True):
    if not capture:
        print("→", " ".join(str(a) for a in args), flush=True)
    return subprocess.run([str(a) for a in args], env=env, cwd=cwd, check=check,
                          text=True, stdout=subprocess.PIPE if capture else None,
                          stderr=subprocess.PIPE if capture else None)


def select_xcode(explicit=None):
    candidates = []
    if explicit:
        candidates.append(Path(explicit).expanduser())
    elif os.environ.get("DEVELOPER_DIR"):
        candidates.append(Path(os.environ["DEVELOPER_DIR"]).expanduser())
    if not explicit:
        for folder in (Path("/Applications"), Path.home() / "Applications"):
            candidates.extend(sorted(folder.glob("Xcode*.app"), reverse=True))
    for candidate in candidates:
        developer = candidate / "Contents/Developer" if candidate.suffix == ".app" else candidate
        if (developer / "usr/bin/xcodebuild").is_file() and (developer / "Applications/Simulator.app").is_dir():
            return developer.resolve()
    raise SetupError("没有找到完整 Xcode。需要适配 macOS 15 的 Xcode 26.3；Command Line Tools 不包含 iOS SDK 或 Simulator。")


def install_archive(archive):
    archive = Path(archive).expanduser().resolve()
    if not archive.is_file() or archive.suffix.lower() != ".xip":
        raise SetupError("--archive 必须指向已下载完成的 Apple 官方 .xip 文件。")
    applications = Path.home() / "Applications"
    applications.mkdir(exist_ok=True)
    if shutil.disk_usage(applications).free < 18 * 1024 ** 3:
        raise SetupError("解包前可用空间不足 18 GiB。未删除任何文件，请先腾出空间再继续。")
    with tempfile.TemporaryDirectory(prefix=".PaperPop-Xcode-", dir=applications) as staging:
        # Apple's xip utility validates the signed archive. Do not bypass a failed validation.
        run(["/usr/bin/xip", "--expand", archive], cwd=staging)
        apps = list(Path(staging).glob("Xcode*.app"))
        if len(apps) != 1:
            raise SetupError("解包结果未找到唯一的 Xcode.app。")
        app = apps[0]
        run(["/usr/bin/codesign", "--verify", "--deep", "--strict", app])
        run(["/usr/sbin/spctl", "--assess", "--type", "execute", app])
        import plistlib
        with (app / "Contents/Info.plist").open("rb") as source:
            version = plistlib.load(source).get("CFBundleShortVersionString", "")
        if not version or any(c not in "0123456789." for c in version):
            raise SetupError("Xcode 版本信息无效。")
        destination = applications / f"Xcode-{version}.app"
        if destination.exists():
            raise SetupError(f"{destination} 已存在，未覆盖。请使用 --xcode-app 选择已有安装。")
        shutil.move(str(app), destination)
        print(f"已安装：{destination}", flush=True)
        return destination


def xcrun(env, *arguments, capture=False):
    return run(["/usr/bin/xcrun", *arguments], env=env, capture=capture)


def sim_json(env, *arguments):
    return json.loads(xcrun(env, "simctl", "list", *arguments, "--json", capture=True).stdout)


def version_key(version):
    return tuple(int(v) for v in version.split(".") if v.isdigit())


def choose_runtime(runtimes, requested=None):
    available = [r for r in runtimes if r.get("isAvailable") and
                 r.get("identifier", "").startswith("com.apple.CoreSimulator.SimRuntime.iOS-") and
                 version_key(r.get("version", "0")) >= (17,)]
    if requested:
        available = [r for r in available if r.get("version") == requested or r.get("version", "").startswith(requested + ".")]
    return max(available, key=lambda r: version_key(r["version"])) if available else None


def ensure_runtime(env, requested=None, allow_download=True):
    # A freshly registered Apple runtime may not have been mounted yet.
    xcrun(env, "simctl", "runtime", "scan-and-mount", capture=True)
    runtime = choose_runtime(sim_json(env, "runtimes").get("runtimes", []), requested)
    if runtime:
        return runtime
    sdk_version = xcrun(env, "--sdk", "iphonesimulator", "--show-sdk-version", capture=True).stdout.strip()
    target = requested or sdk_version
    if not allow_download:
        raise SetupError(f"没有可用的 iOS {target} 模拟器运行时；去掉 --no-download 可从 Apple 下载。")
    print(f"安装 Apple iOS {target} Apple silicon 模拟器运行时。", flush=True)
    run(["xcodebuild", "-downloadPlatform", "iOS", "-buildVersion", target,
         "-architectureVariant", "arm64"], env=env)
    runtime = None
    for _ in range(30):
        xcrun(env, "simctl", "runtime", "scan-and-mount", capture=True)
        runtime = choose_runtime(sim_json(env, "runtimes").get("runtimes", []), target)
        if runtime and Path(runtime["bundlePath"]).is_dir():
            break
        time.sleep(2)
    if not runtime or not Path(runtime["bundlePath"]).is_dir():
        raise SetupError("下载命令结束，但 simctl 尚未列出可用运行时；请查看 Xcode Components 中的实际安装错误。")
    return runtime


def ensure_device(env, runtime):
    name = "PaperPop iPhone"
    devices = sim_json(env, "devices").get("devices", {}).get(runtime["identifier"], [])
    existing = next((d for d in devices if d.get("name") == name and d.get("isAvailable")), None)
    if existing:
        return existing["udid"], existing["state"]
    types = sim_json(env, "devicetypes").get("devicetypes", [])
    supported = {d["identifier"] for d in runtime.get("supportedDeviceTypes", [])}
    iphones = [d for d in types if d.get("name", "").startswith("iPhone") and
               (not supported or d["identifier"] in supported)]
    choices = {d["identifier"]: d for d in iphones}
    preference = ["com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro",
                  "com.apple.CoreSimulator.SimDeviceType.iPhone-15-Pro"]
    selected = next((choices[t] for t in preference if t in choices), None)
    if selected is None:
        if not supported or not iphones:
            raise SetupError("没有找到与该运行时匹配的 iPhone 设备类型。")
        selected = iphones[-1]
    udid = xcrun(env, "simctl", "create", name, selected["identifier"], runtime["identifier"], capture=True).stdout.strip()
    return udid, "Shutdown"


def ensure_api():
    def healthy():
        try:
            with urllib.request.urlopen("http://127.0.0.1:8787/health", timeout=2) as response:
                return json.load(response).get("service") == "paperpop"
        except (OSError, ValueError):
            return False
    if healthy():
        print("已连接现有 PaperPop API。", flush=True)
        return
    node = shutil.which("node")
    if not node:
        raise SetupError("未找到 Node.js；启动讨论 API 需要 Node.js 22.13 或更新版本。")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with (OUTPUT / "api.log").open("a") as log:
        process = subprocess.Popen([node, "server/server.mjs"], cwd=ROOT, stdout=log,
                                   stderr=subprocess.STDOUT, start_new_session=True)
    for _ in range(30):
        if healthy():
            (OUTPUT / "api.pid").write_text(str(process.pid) + "\n")
            return
        if process.poll() is not None:
            break
        time.sleep(0.2)
    raise SetupError(f"后台未能启动；未停止其他进程。请查看 {OUTPUT / 'api.log'}。")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--xcode-app", help="完整 Xcode.app 路径；不修改全局 xcode-select")
    parser.add_argument("--archive", help="解包并安装 Apple 官方 Xcode .xip 到 ~/Applications，不覆盖已有版本")
    parser.add_argument("--runtime", help="指定 iOS 模拟器版本，例如 26.2")
    parser.add_argument("--diagnose", action="store_true", help="只检查环境，不安装或创建任何资源")
    parser.add_argument("--setup-only", action="store_true", help="只检查 Xcode 并安装所需运行时")
    parser.add_argument("--no-download", action="store_true", help="缺少运行时时直接报错")
    parser.add_argument("--headless", action="store_true", help="不打开 Simulator.app 窗口")
    options = parser.parse_args()
    if options.diagnose and options.archive:
        parser.error("--diagnose 不可与 --archive 一起使用")
    explicit = install_archive(options.archive) if options.archive else options.xcode_app
    developer = select_xcode(explicit)
    env = dict(os.environ, DEVELOPER_DIR=str(developer))
    print(f"DEVELOPER_DIR={developer}", flush=True)
    run(["xcodebuild", "-version"], env=env)
    first = run(["xcodebuild", "-checkFirstLaunchStatus"], env=env, capture=True, check=False)
    if first.returncode:
        raise SetupError(f"Xcode 首次配置未完成。请在 Finder 打开 {developer.parent.parent}，由你本人确认许可并完成系统提示的组件安装，然后重新运行。本脚本不会代替你接受许可或输入管理员密码。\n{first.stdout}{first.stderr}")
    if options.diagnose:
        xcrun(env, "--sdk", "iphonesimulator", "--show-sdk-version")
        xcrun(env, "simctl", "list", "runtimes")
        return
    runtime = ensure_runtime(env, options.runtime, not options.no_download)
    if options.setup_only:
        print(f"Xcode 与 {runtime['name']} 已就绪。", flush=True)
        return
    udid, state = ensure_device(env, runtime)
    if state != "Booted":
        xcrun(env, "simctl", "boot", udid)
    xcrun(env, "simctl", "bootstatus", udid, "-b")
    if not options.headless:
        run(["/usr/bin/open", "-a", developer / "Applications/Simulator.app", "--args", "-CurrentDeviceUDID", udid])
    ensure_api()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    log_path = OUTPUT / f"build-{stamp}.log"
    result_path = OUTPUT / f"build-{stamp}.xcresult"
    args = ["xcodebuild", "-project", ROOT / "ios/PaperPop.xcodeproj", "-scheme", "PaperPop",
            "-configuration", "Debug", "-sdk", "iphonesimulator", "-destination", f"id={udid}",
            "-derivedDataPath", ROOT / "ios/DerivedData", "-resultBundlePath", result_path,
            "CODE_SIGNING_ALLOWED=YES", "CODE_SIGN_IDENTITY=-", "build"]
    print("开始 iOS Simulator 实际编译，使用本地临时签名，无需开发者账号。", flush=True)
    with log_path.open("w") as log:
        process = subprocess.Popen([str(a) for a in args], env=env, cwd=ROOT,
                                   stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in process.stdout:
            log.write(line)
            if any(word in line for word in ("error:", "warning:", "BUILD SUCCEEDED", "BUILD FAILED")):
                print(line.rstrip(), flush=True)
        code = process.wait()
    if code:
        raise SetupError(f"iOS 编译失败（{code}），完整日志：{log_path}")
    app = ROOT / "ios/DerivedData/Build/Products/Debug-iphonesimulator/PaperPop.app"
    if not app.is_dir():
        raise SetupError("构建返回成功，但未找到 PaperPop.app。")
    xcrun(env, "simctl", "install", udid, app)
    xcrun(env, "simctl", "launch", "--terminate-running-process", udid, BUNDLE)
    xcrun(env, "simctl", "get_app_container", udid, BUNDLE, "app")
    xcrun(env, "simctl", "io", udid, "screenshot", OUTPUT / "launch.png")
    report = {"developerDirectory": str(developer), "runtime": runtime["name"],
              "device": udid, "bundleIdentifier": BUNDLE, "app": str(app),
              "buildLog": str(log_path), "resultBundle": str(result_path),
              "status": "built-installed-launched", "uiVerified": False}
    (OUTPUT / "run.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"PaperPop 已编译、安装并发出启动请求。请在 Simulator 中确认界面与交互。\n运行记录：{OUTPUT / 'run.json'}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except SetupError as error:
        print(f"PaperPop iOS：{error}", file=sys.stderr)
        sys.exit(2)
    except (subprocess.CalledProcessError, OSError, ValueError) as error:
        print(f"PaperPop iOS 操作失败：{error}", file=sys.stderr)
        sys.exit(1)
