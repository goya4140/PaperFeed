# PaperPop 0.1 · 原生阅读与交流

更新：2026-10-20。Swift + SwiftUI，iOS 17 起，无第三方客户端依赖。仓库包含 Xcode 工程、内置研究内容、可持久化的讨论 API，以及使用同一套 SwiftUI 源码构建的 Mac 预览。

## 视觉改版

当前界面采用雾白画布、钴蓝强调色与深蓝精选卡片，统一底部导航、搜索、筛选、论文列表、Poster、方向社区及个人空间。研究方向插图由原生 SwiftUI Canvas 绘制，支持高分辨率缩放，不依赖网络图片。默认浅色，可在「我的 → 外观」切换深色或跟随系统。设计规范见 `DESIGN.md`。

## 现在直接打开

在 Finder 双击 **`ios/Start PaperPop.command`**。首次运行会用本机 Swift 编译器构建 Mac 预览，随后打开 App 并启动 API。保持启动终端运行；Control+C 停止后台。

如果直接打开 `ios/build/PaperPop Preview.app`，内置论文、Poster、收藏和笔记无需后台即可使用。公共讨论、注册和同步需要运行后台。这是 Mac 原生预览，不是 iPhone 安装包。

当前已生成 Mac App：`ios/build/PaperPop Preview.app`。源码包内不含构建缓存，重新构建使用：

```bash
npm run ios:preview
npm run ios:api
```

Node.js 需要 22.13 或更新版本。预览编译需要 macOS 14 起和 Swift 6 编译器；本机已满足。Node 的 SQLite 实验性提示不影响本轮验证。

## 已配置的 iPhone 模拟器

本机 macOS 15.7.9 / Apple silicon 已安装 **Xcode 26.3（17C529）**，路径 `/Users/wlh/Applications/Xcode-26.3.app`。签名和 Gatekeeper 检查通过，用户已完成 Apple 许可确认和首次组件安装。iOS 26.3.1（23D8133）运行时已安装，专用设备 **PaperPop iPhone / iPhone 16 Pro** 已启动。

**2026-10-20 已完成真实 iOS 构建、安装、启动与界面操作验证。** 实测发现并修复了 Retina 图标尺寸、iOS 26 双底栏、未签名模拟器的钥匙串 `-34018` 问题。当前模拟器使用本地临时签名，不需要 Apple 开发者账号；不要添加 `CODE_SIGNING_ALLOWED=NO`，否则登录会话无法写入钥匙串。

下次双击 **`ios/Run iPhone Simulator.command`**，或在项目根目录运行：

```bash
npm run ios:doctor
npm run ios:simulator
```

脚本自动选择完整 Xcode、检查并挂载运行时、复用专用模拟器、启动本地 API、构建并打开 App。它使用每次命令的 `DEVELOPER_DIR`，不改变全局 `xcode-select`；终端直接调用 Xcode 工具时，也可设置 `DEVELOPER_DIR=/Users/wlh/Applications/Xcode-26.3.app/Contents/Developer`。

构建日志、xcresult、实际界面截图和验证记录保存在项目根目录 `outputs/ios-simulator/`。`library-persistence.png` 记录重启后收藏和笔记保留，`session-restored.png` 记录 iOS 钥匙串恢复登录。测试账号已退出并清理。

迁移到其他 Mac 时可使用 `python3 scripts/ios-simulator.py --xcode-app /完整路径/Xcode.app`；或用 `--archive` 安装已从 Apple 下载的 `.xip`。脚本会停止等待用户本人完成首次许可和管理员验证。

官方参考：[Xcode 系统兼容表](https://developer.apple.com/xcode/system-requirements)、[组件与模拟器运行时下载](https://developer.apple.com/documentation/xcode/downloading-and-installing-additional-xcode-components)。

## 在 Xcode 运行 iOS

1. 安装完整 Xcode（建议 16 或更新版本）及 iOS Simulator runtime。
2. 打开 `ios/PaperPop.xcodeproj`，选择共享 Scheme **PaperPop**。
3. 选择一个 iPhone 模拟器，点击 Run。模拟器使用本地临时签名即可运行，不需要开发者账号。
4. 在项目根目录启动 `npm run ios:api`。App 默认地址为 `http://127.0.0.1:8787`。
5. 在 App「我的 → 注册 / 登录」创建自己的账号。没有预置密码或伪造用户。

真机调试：在 Xcode 的 Signing & Capabilities 选择自己的 Team，并视需要修改 Bundle Identifier；连接 iPhone 后选择设备 Run。后台改用局域网监听：

```bash
HOST=0.0.0.0 npm run ios:api
```

在 App「我的 → 服务器连接」填写 `http://Mac的局域网IP:8787`。确保手机和 Mac 同网；首次访问允许 App 使用本地网络。此命令将后台开放到局域网，只在你准备让同网设备访问时使用。HTTPS 公网服务填写其根地址。

Debug 配置允许 HTTP 用于本机和局域网测试，客户端校验会拒绝公网 HTTP 地址。Release 使用单独的 Info.plist，不开启任意 HTTP；正式发布应配置 HTTPS 服务。

**本机验证边界：iPhone 16 Pro 模拟器 / iOS 26.3.1 已实测；物理 iPhone、TestFlight 和商店审核尚未验证，没有生成用于真机分发的 IPA。**

## 已实现的功能

- 发现：12 条历史研究内容，标题/作者/方向搜索，兴趣优先与按发表时间排序，方向筛选、显式隐藏和恢复。
- Poster：Reflexion、MemGPT、ReAct 三篇精选内容；问题、机制流程、证据、条件与局限、编辑类比、原文入口、关联阅读；流程图可放大。其余九条有明确标注的基础速读。
- 论文讨论：每篇内容独立关联的共享问题/讨论、回答、针对回复继续交流；无需先加入方向社区。
- 方向社区：五个方向主页、加入/退出、问题与讨论类型筛选、已加载内容搜索、分页、论文关联及双向导航。
- 账号：用户名密码注册/登录、钥匙串会话、退出、账号删除。用户名大小写不区分；没有邮箱收集与密码找回功能。
- 资料库：收藏、稍后读、已读、私人笔记、命名分组、笔记搜索、Markdown 文件导出与论文分享。
- 同步：访客本机持久化、登录时可选择迁移访客数据、离线操作队列、幂等回放、按账号及服务器隔离。账号同步各字段；相同字段采用服务器最后接收到的操作，不是协同文档编辑。
- 通知与管理：站内回复通知、已读、前台 30 秒刷新、举报、屏蔽/解除屏蔽、作者删除自己的帖子和回复。
- 手机体验：深色模式、系统文字样式、原文链接、显式阅读分节接续、`paperpop://paper/2303.11366` 深链接。

没有部署公网后台；同一服务器上的客户端才能共享数据。当前 Web Demo 仍使用原来的 Sites/D1 服务；两者尚未合并账号、讨论或收藏。

## 内容与生成边界

内容由现有项目的 `lib/papers.ts` 和 `lib/deep-reads.ts` 导出，日期与原始来源随记录保留。内置集不是实时资讯，不展示演示热度或虚构推荐准确率。精选 Poster 使用已有编辑材料，基础速读尚未补齐逐条原文定位。

```bash
npm run ios:content
```

更新后重启 API，并重新构建 App，或在 App 下拉刷新获取后台内容。每篇内容按论文 ID 关联，Poster 数据与 UI 分离。

本轮没有接入 paper2poster 自动生成框架、自动全文采集、批量审核后台、音视频、私信、系统推送、作者认证或付费。新增框架可在服务端产出相同 Poster JSON；App 无需绑定某个框架。当前已经提供的是可读的结构化 Poster，而非自动内容生产系统。

## 服务端、数据和运营

```bash
npm run ios:api
```

默认只监听 `127.0.0.1:8787`。支持 `PORT`、`HOST`、`PAPERPOP_DATA_DIR` 环境变量。SQLite 数据位于 `server/.data/paperpop.sqlite`，不提交到 Git。密码使用加盐 scrypt；服务器仅保存会话令牌摘要，会话有效期 30 天。不要使用其他服务的真实密码测试。

账号删除会级联删除该用户的私人资料、帖子、回复、通知、举报与屏蔽关系。已被其他人下载、引用或备份的内容不在删除范围。正式公开运营仍需要部署、备份、可联系的运营主体、隐私政策、密码恢复及平台发布材料；本轮未声称已具备 App Store 上架条件。

运营在服务器本机处理举报：

```bash
node server/moderate.mjs reports
node server/moderate.mjs remove post 帖子ID
node server/moderate.mjs remove reply 回复ID
```

这是本机管理命令，不暴露无认证的管理接口。删除为永久操作，运营需自行确认。备份时停止服务后复制整个数据目录，或使用 SQLite 在线备份工具；不要只复制活跃 WAL 数据库的主文件。

API：`/health`、`/v1/catalog`、`/v1/auth/register`、`/v1/auth/login`、`/v1/auth/logout`、`/v1/me`、`/v1/library`、`/v1/posts`、`/v1/posts/:id`、`/v1/posts/:id/replies`、`/v1/replies/:id`、`/v1/notifications`、`/v1/notifications/read`、`/v1/blocks`、`/v1/reports`。写操作和个人数据使用 Bearer 会话；浏览公开研究和讨论无需登录。

## 验证

在项目根目录运行：

```bash
npm run ios:verify
npm run ios:verify:client
```

第一项使用隔离的临时数据库验证 API，再用 Swift Package 检查内容、离线记录、合并和导出。第二项编译一个独立的原生客户端验证程序，连接隔离后台，实际检验 Keychain、API 解码、访客迁移、同步、发帖、账号隔离及删除；不使用用户的预览账号。

本轮已通过：

- Swift 核心编译与可执行检查。
- 所有 SwiftUI 源码的 macOS SDK 类型检查，以及 Mac 原生 App 实际编译。
- API 两账号隔离、讨论/回答、幂等提交、通知与已读、屏蔽、举报、权限、重启持久化及账号删除。
- 原生 Store 集成验证，覆盖真实 Keychain 与服务端通信。
- Mac 原生界面操作：发现 → Reflexion Poster → 放大图解 → 私人笔记 → 论文交流；讨论空状态从真实后台加载。
- Xcode 工程、Info.plist 和 Privacy Manifest 的 plist 结构检查；现有 Web TypeScript 检查。

- iOS SDK 完整构建、模拟器安装启动、首页和 Poster、收藏、私人笔记、论文交流和方向社区切换。
- iOS 强制退出重启后的收藏和笔记保留；本机测试账号登录、同步、钥匙串会话重启恢复，随后退出并清理测试账号。

未验证：物理 iPhone 与真机局域网权限、系统分享/文件导出面板、TestFlight 与商店审核。iOS 截图在 `outputs/ios-simulator/`；`outputs/ios/` 为之前的 Mac 预览画面。

## 工程结构

- `PaperPop/App`：App 入口、应用状态、会话安全存储、同步。
- `PaperPop/Core`：内容、讨论、个人资料模型、磁盘原子写入、API 客户端及知识导出。
- `PaperPop/Views`：发现、Poster、图解、社区、帖子、笔记、账号、设置、导出。
- `PaperPop/Resources/catalog.json`：内置内容与 Poster。
- `PaperPop.xcodeproj`：已提交的 Xcode 工程和共享 Scheme，无需额外工程生成器。
- `Package.swift`、`Verification`：独立可运行的核心验证。
- `StoreVerification`：原生客户端集成检查。
- 项目根目录 `server/`：Node.js 内置 HTTP + SQLite 服务。
