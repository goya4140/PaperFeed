# PaperPop 本地业务运行说明 · 阶段 1–6

已完成：原有账号/收藏笔记/讨论同步保留，数据库内容、arXiv 采集、可靠任务与管理工作台。AI 解读生成（第 7 阶段）尚未配置，服务端推荐/分页与客户端完整对接、邮箱恢复及真机全流程验收仍在后续阶段。不要把人工摘要演示当成模型生成。

## 环境与首次启动

需要 Node.js 22.13+（本机 24.14.1）、Python 3 标准库和现有 Swift/Xcode 环境。后端没有新增 npm 依赖。

```bash
# 项目根目录执行。可选：复制配置示例后修改，真实密钥不提交 Git。
cp server/config/local.env.example .env.local
npm run local:init
npm run local:admin:init
```

不要覆盖已有 `.env.local`。已有数据库直接迁移，迁移记录在 `schema_migrations`；旧用户、收藏、笔记和讨论不清空。内置内容一次性导入，之后修改种子 JSON 不会覆盖数据库。迁移前应先备份数据。

管理员是独立账号，不是 App 注册账号。初始化默认创建 `admin` 并生成随机密码，凭据保存在 `PAPERPOP_DATA_DIR/admin-login.json`（默认 `server/.data/admin-login.json`，权限 0600）。终端不会输出密码；再次初始化不会重置已有账号。可在运行初始化命令前通过本机环境设置 `PAPERPOP_ADMIN_NAME`、`PAPERPOP_ADMIN_PASSWORD`（12–128 字符），自动化测试用临时库，不使用生产凭据。

分别在终端启动：

```bash
npm run ios:api          # 本地 API + 管理静态页面
npm run local:worker     # 独立任务进程
npm run local:scheduler  # 可选：按来源配置定时投递
```

每个终端 Control+C 停止相应进程。worker 会中止当前请求并保存待恢复状态；异常退出后，租约过期可由新进程恢复。scheduler 仅投递，不占用 App HTTP 请求；停止 API 不会停止其他终端的 worker。不要同时在另一终端占用同一端口。

后台：http://127.0.0.1:8787/admin/ 。App 默认服务器同为 http://127.0.0.1:8787 。

Mac 原生 App：双击 `ios/Start PaperPop.command` 或运行 `npm run ios:preview` 后打开 `ios/build/PaperPop Preview.app`。该旧启动器启动 API 与 App；worker、scheduler 按上面命令独立启动。iPhone 模拟器使用 `npm run ios:simulator`，真机未作本轮完整业务验收。

## 配置与数据

配置优先级为进程环境 > 项目根 `.env.local` > 默认值。数据目录应放在私有本机路径，并保持所有进程使用同一个目录。

| 配置 | 默认值 / 用途 |
| --- | --- |
| HOST / PORT | 127.0.0.1 / 8787；仅默认本机监听 |
| PAPERPOP_DATA_DIR | server/.data；SQLite、私有管理员凭据 |
| PAPERPOP_SOURCES_FILE | server/config/sources.json |
| PAPERPOP_ARXIV_INTERVAL_MS | 3100；最小 3000，跨进程串行请求 |
| PAPERPOP_WORKER_POLL_MS | 1000 |
| PAPERPOP_TASK_LEASE_MS | 15000；独立心跳与恢复租约 |
| PAPERPOP_TASK_TIMEOUT_MS | 120000；单次任务时间预算 |
| PAPERPOP_MODEL_BASE_URL / NAME / KEY | 第 7 阶段使用；当前没有模型调用 |

真实数据库、密钥、管理员凭据、构建缓存和运行日志均被 Git 排除。

## 内容导入和采集

可用最小论文 JSON：`id`、`title`、`authors`（数组）、`summary`、`date`、`topic`（现有方向 ID，例如 `Agent Systems`）、`sourceUrl`。缺详细解读时 App 显示摘要和原文。`name`、`tags` 等可选。

```bash
node server/content.mjs import /absolute/path/paper.json
# 直接执行采集（诊断/小批验证）
npm run local:collect -- --source arxiv-ai --ids 1706.03762
# 正常业务：先投递，再由 worker 执行
npm run local:jobs -- collect --source arxiv-ai --ids 1706.03762
npm run local:jobs -- list
npm run local:worker -- --once
# 历史补采 / 保存游标后的继续采集
npm run local:collect -- --source arxiv-ai --from 2025-01-01T00:00:00Z --until 2025-01-02T00:00:00Z
npm run local:collect -- --source arxiv-ai --resume 运行记录ID
npm run local:jobs -- retry 失败任务ID
```

来源配置包含分类、方向、页大小、每批页数、是否启用与周期小时数。默认启用 cs.AI，cs.CL 关闭；方向是可配置的编辑归类规则，不是已经验证的语义分类器。定时器每 30 秒检查，未完成窗口隔至少一分钟续投递，完成后按 `everyHours` 执行。手动补采不会推进增量水位；正常增量有一天时间重叠以避免边界丢失。单 worker 每次任务处理一页然后让出执行权；相同来源请求在数据库锁下串行。直接 CLI 与 worker 可共享来源限流锁；一般使用投递方式即可。

来源 ID 去掉 `vN` 作为稳定论文 ID；各版来源快照保存到 `paper_versions`。同版重复采集跳过，旧版不覆盖新版；收藏和讨论始终关联稳定 ID。分别保存发表、来源更新和系统收录时间。元数据采集没有下载 PDF。

## 管理流程

1. 搜索或新增论文，修改标题/摘要/方向/公开状态和精选状态。
2. 创建解读草稿，选择已收录的来源版本，编辑小节、出处、流程和可选证据。仅有摘要时必须标注摘要范围，不填写无依据的实验细节。
3. 保存、修改、预览，再发布“当前已保存版本”。草稿保存不改变 App 中已发布版本；修改已发布解读需要复制成新草稿。
4. App 点击“刷新论文”；详情页会响应内容库更新。后台下架后，普通接口立即不再返回该论文/解读；App 离线缓存的撤回策略将在第 9 阶段完善。
5. 任务页查看状态、进度、错误和事件，重试失败任务；举报页记录处理结果并隐藏内容；账号页限制或解除写入/同步权限；操作记录显示管理员行为。

管理员会话 8 小时，HttpOnly + SameSite=Strict Cookie，写请求要求 CSRF。管理员接口与 App Bearer 会话独立。默认本机 HTTP，不是公网部署方案。

## 验证和保存

```bash
npm run local:test        # 迁移、内容、采集、worker、管理权限/发布/审核
npm run ios:verify        # 既有 API + Swift 核心验证
npm run ios:verify:client # 真实 macOS Keychain、原生 Store 与隔离 API
npm run ios:preview       # 完整 Mac SwiftUI 构建
```

隔离测试采用合成 Atom 和临时数据库检查错误/重试/版本规则；这些是自动测试，不冒充外部调用。实际 arXiv 请求与浏览器/原生 App 验证另行执行，结果见 `progress.md`。测试不固定要求 API 总数为 12，只验证必要的种子记录与新增内容的行为。

备份最简单方式：停止 API、worker、scheduler，复制整个私有数据目录（含 SQLite WAL/SHM，如仍存在）到另一个私有目录。恢复前也停止全部进程，将当前数据目录移至备份位置，再把完整备份复制回来；所有进程使用同一 `PAPERPOP_DATA_DIR`，运行 `local:init` 后启动。不要只复制正在写入的主 `.sqlite` 文件，也不要覆盖仍在使用的数据库。完整在线备份/恢复演练属于后续最终验收。

当前运行与截图证据在被忽略的 `outputs/local-business/`、`outputs/ios-simulator/`；分阶段代码版本与测试记录在 `progress.md`。
