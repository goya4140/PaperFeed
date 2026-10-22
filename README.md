# PaperFeed · Research, made easier

## 本地业务开发 · 2026-10-22

已完成本地业务阶段 1–6：数据库论文与版本、arXiv 采集、独立可靠 worker、本地管理后台、人工解读草稿/发布、举报与账号限制。沿用已有 SwiftUI 页面和 Node API，原 ID、收藏笔记、讨论与同步保持兼容。模型生成及其后的服务端推荐、客户端分页、账号恢复和真机全流程验收尚待后续阶段。

运行与配置见 [本地业务运行说明](docs/local-business/README.md)，逐阶段验证见 [开发记录](docs/local-business/progress.md)。管理后台默认 http://127.0.0.1:8787/admin/ 。

## PaperPop 原生 App · 2026-10-20

新增 SwiftUI iOS 工程与独立的 Node.js/SQLite 讨论服务，入口见 [iOS 运行说明](ios/README.md)。支持论文发现、结构化 Poster、账号、共享论文讨论、研究方向社区、站内通知、收藏和私人笔记同步。此原生后台与现有 Sites Demo 的身份及数据库独立，尚未迁移 Web 数据。

当前已配置 Xcode 26.3 与 iOS 26.3.1 运行时，PaperPop 已在 iPhone 16 Pro 模拟器完成实际编译、安装与运行。已验证 Poster、收藏与笔记重启保留、社区切换、登录同步及钥匙串会话恢复。双击 `ios/Run iPhone Simulator.command` 可再次启动。真机和 TestFlight 尚未验证。下面保留现有 Web Demo 的说明。

PaperFeed 是一个以兴趣驱动的研究内容社区：发现研究 → 轻松理解 → 表达兴趣 → 参与讨论 → 连接同行 → 沉淀知识。

当前 v0.3 面向投资人连续演示，含 12 条真实研究内容、3 篇深入图文和 3 条可播放的配音分镜。按用户要求发布至当前账户 wanglinhao4140 的新 Sites；原 lij850601 站点保留。新站地址：https://paperfeed-research-demo.wanglinhao4140.chatgpt.site 。Sites 已返回部署成功；当前为账户所有者私有访问，需要 ChatGPT 登录。已在该线上站点走通兴趣、配音讲解、深读、笔记、社区共读、评论回复、同行关注、个人空间及真实文件导出。生产 D1 API 与 26 个页面入口检查通过。

## 功能与入口

| 页面 | 可实际操作的能力 |
| --- | --- |
| `/` | 首次兴趣选择、兴趣调整、推荐/热点/关注动态、搜索作者与内容、主题和类型筛选、正负反馈 |
| `/swipe` | 三条合成配音动态讲解（完整预加载，可跳转），字幕、暂停、静音、进度、切换、前后十秒、收藏、兴趣反馈、完整阅读入口 |
| `/paper/2303.11366` 等 | 12 个独立详情，快速解读、原文资源、讨论/回复、笔记、收藏、已读、分组、引用和导出 |
| `/explore`、`/topic/Agent%20Memory` 等 | 5 个研究方向、关注、加入社区、共读提纲、发帖和回复、兴趣附近及关注示例同行 |
| `/discussions` | 历史示例话题、关注、赞同、实际保存的回复 |
| `/library` | 收藏分组、已读筛选、笔记检索、Markdown/BibTeX 文件下载 |
| `/profile` | 兴趣、同行、社区、共读、讨论、回复、阅读和笔记回看，知识库导出、演示重置 |

详见 [7 分钟投资人演示路线](docs/investor-demo.md) 和 [验证进度与来源](docs/implementation-status.md)。

## 存储与身份

- Cloudflare D1 持久化研究空间，`DB` 绑定由 `.openai/hosting.json` 声明；Drizzle 维护 schema 和提交到仓库的 SQL migration。
- `/api/state` 提供按身份隔离的读写、数据校验和 revision 并发控制；客户端合并本机待保存操作与服务端记录。
- Sites 平台提供的已认证用户头可作为空间标识；未登录访客使用 HttpOnly Cookie。当前没有独立注册、登录、真实社交消息或作者认证。
- localStorage `paperfeed-demo-v3` 保存缓存与待同步操作，兼容旧 v2 记录。页面显示读取/保存/失败状态；失败时保留本机操作并提供重试。清除浏览器 Cookie 会更换匿名空间，不能把匿名身份当成跨设备账号。
- 同一条笔记并发修改采用后写内容，独立笔记、收藏变化和追加回复可合并。不是多人协同编辑器。
- 新增讨论保存在自己的演示空间，没有发布给示例人物或真实社区。演示重置会替换当前身份的记录，请先导出需要保留的内容。

## 本地启动

Node.js >=22.13.0；React 19、Vinext、Base UI、Cloudflare Workers/D1。无需第三方 AI API 密钥即可演示。

```bash
npm ci
npm run db:generate
npm run build
```

首次启动本地数据库，执行已提交的 migration（只执行一次）：

```bash
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_warm_korvac.sql
npm run dev -- --port 5173
```

打开 http://localhost:5173 。`.wrangler/state` 是被忽略的本地数据库，不提交到 Git。修改 schema 后通过 `npm run db:generate` 生成新 migration，不修改已执行的 migration。Sites 正式部署负责应用生产 migration。

生产构建可在本机运行：

```bash
npx wrangler dev --config dist/server/wrangler.json --port 5173 --persist-to .wrangler/state
```

在 Codex Sites 工作流中使用插件自带 `build-site.mjs` 构建和 source helper 打包；保留现有项目 ID 与访问范围，凭据只走 stdin，不写入仓库。

## 验证

```bash
npx tsc --noEmit
node scripts/verify-demo.mjs
node scripts/verify-state.mjs
# 先在 5173 启动包含本地 D1 的应用
node scripts/verify-state.mjs --api
node scripts/verify-demo.mjs --http
```

数据检查覆盖推荐信号、搜索、来源分类、深读结构、实际 AAC 文件、引用与完整知识导出。状态检查覆盖校验、旧数据迁移、增量合并；API 检查真实 D1 读写、匿名隔离、过期 revision 拒绝、错误输入和 HTTP 附件。

已实际进行浏览器操作验证，包括配音播放与切换、笔记/讨论/回复、收藏已读分组、刷新保留、数据库中断恢复、真实文件下载及手机布局。检查范围和仍待验证项以进度文档为准。

## 内容来源与真实边界

八篇论文：Reflexion、MemGPT、ReAct、Voyager、TTT Layers、SWE-bench、DeepSeek-V2、DreamerV3。另有 Anthropic Building Effective Agents、OpenAI o1、OpenAI Deep Research、Google DeepMind Gemini Robotics 四条官方博客/项目发布。每条内容标注首发时间和原始链接；这是固定内容集，不是今日实时资讯。

三篇深读区分原文证据、作者报告和编辑类比，示意图为原创重绘，非论文原图。配音由 macOS Tingting 离线生成，音频文件随项目分发；在其他系统播放不需要系统语音。macOS 可用 `node scripts/generate-narration.mjs` 重新生成，需 Python 3、say、afconvert。

推荐使用可解释规则：兴趣、关注、正负反馈、同方向收藏/已读影响排序。质量分、匹配分、历史计数、研究者和互动均为明确标注的演示数据，不是推荐效果评估或真实运营数据。

尚未接入实时采集、自动批量内容生产、真实多人社区及通知、作者认证、外部文献工具账户同步或训练好的推荐模型。线上 D1 与平台身份验证见部署与验收记录。

## 项目资料归档

- [原始产品说明 v0.1](docs/paperfeed_product_overview_v0.1.md)：保留最初愿景和需求；不代表全部功能已实现。
- [产品化工程方案](docs/production-engineering-plan.md)：iOS/Web 共用后台、每日论文采集、分层内容生产与运营计划；尚未实施。
- [投资人演示路线](docs/investor-demo.md)。
- [实现与验收记录](docs/implementation-status.md)。
- [Demo 截图](docs/screenshots/)：开发及线上验收画面，部分为历史版本。

源码、研究内容、配音媒体、数据库迁移与脚本均纳入仓库。依赖、构建产物、部署打包副本、本机数据库、缓存和凭据不上传。
