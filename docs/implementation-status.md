# 完整 Demo 目标进度 · 2026-10-08

Demo 已部署至当前账户的 Sites，已完成核心投资人演示路线的线上验收。以下分别记录实现、测试证据与覆盖边界。

## 当前实现

- 12 条真实内容 / 5 个方向，含 4 条官方博客或项目发布，以及 DeepSeek-V2 技术报告。
- Reflexion、MemGPT、ReAct 三篇深入图文：机制图、原创类比、证据、实验条件、局限、关联研究和讨论问题。
- 三条实际 AAC 配音动态分镜，每条五幕；统一音轨保证连续播放，支持字幕、暂停、静音、进度和切换。
- 兴趣引导与调整，推荐/热点/关注动态，主题、类型、作者搜索；收藏、已读和正负反馈实际影响规则推荐。
- 五个方向社区：加入/退出、共读、发帖、回复、共同方向和论文匹配、关注示例同行。
- 收藏、分组、笔记、已读、个人活动回看，引用复制及 Markdown/BibTeX/完整知识库导出。
- D1 研究空间持久化、匿名 Cookie 隔离、revision 冲突处理、待同步本机缓存和失败重试。平台用户身份接入代码就绪，生产身份尚未验证。

## 验证证据

- TypeScript 检查与 Sites helper 生产构建通过。
- `verify-demo.mjs --http`：12 条数据、推荐信号、来源分类、作者搜索、引用、三个深读、15 段及三条完整 AAC、知识库导出；26 个生产页面/直达入口 200、无效论文 404、媒体真实响应。
- `verify-state.mjs --api`：已在开发环境与 Wrangler 生产构建运行；验证真实 D1 读写、独立匿名空间、过期 revision 409、来源 403、格式 422、损坏 JSON 400、实际附件内容。
- 浏览器已有完整开发流程：兴趣→播放→深读→笔记→社区/共读→发帖/回复→同行关注→刷新→个人空间。
- 本轮浏览器：BibTeX 文件落盘；知识库落盘且检查深读/笔记/论文回复/社区讨论内容。复制引用显示成功并提供手动复制文本框；未将工具剪贴板读取作为已验证证据。
- 收藏/已读/分组后，文库正确显示同一状态，分组 + 已读组合筛选有效。论文评论与回复新增后在个人空间出现。
- 主动停止本地服务后保存笔记：显示“数据库保存未完成”，本机操作保留；服务恢复后数据库保存成功，刷新仍有笔记。
- 390×844：社区与讲解无水平溢出；播放音频 paused=false、切换后新音频 paused=true/time=0。已压缩手机讲解首屏排版；未在物理手机上测试手势。
- 生产构建发现 Vinext Link 初始化错误，改为标准文档导航；同时修复兴趣弹窗恢复时的遮挡。重启生产进程后实际验证链接跳转、搜索/清除、兴趣引导关闭与刷新恢复、独立测试访客重置、社区加入退出、共读、发帖回复、关注和个人记录回看。
- 本轮生产媒体静音、字幕、seek/replay 验证：静态响应缺少字节范围使浏览器 seekable=0，改为完整加载短音轨 Blob，验证 seekable=[0,37.29]；音频 currentTime 实际 10→20→10，End 跳到尾部后播放回到开头。三条音轨均验证播放，切换停止旧音轨，MemGPT 跳转到 10 秒后继续播放，ReAct 暂停有效。
- 截图保存在 ignored `outputs/`：player-mobile.jpg、profile-database-desktop.jpg。

## 当前完成审计

| 目标范围 | 当前证据 |
| --- | --- |
| 兴趣、热点、关注、搜索、分类、反馈 | 当前源码与内容验证；线上兴趣选择、研究博客分类、Charles Packer 搜索只返回 MemGPT；负反馈后 Reflexion 从推荐隐藏，恢复正反馈后再次推荐 |
| 12 条核验内容 / 4 条官方 / 3 篇深读 | papers.ts、deep-reads.ts 与来源记录；当前数据检查；线上深读的机制图、例子、HumanEval 条件及原文入口 |
| 3 条真实动态讲解 | 三条线上音轨分别播放成功，约 37 秒；暂停、静音、字幕、十秒跳转、切换与收藏；手机视口入口可用 |
| 详情、收藏、已读、分组、引用与导出 | 12 个详情直达生产检查；线上笔记保存刷新、已读及文库状态一致；完整知识库真实下载并检查内容；分组与 BibTeX 已有生产构建浏览器验证 |
| 5 个社区、同行与共读 | 5 个线上社区路由；线上 Agent Memory 加入、共读、讨论、回复、共同阅读与关注；个人空间刷新保留全部记录 |
| 个人空间与存储 | profile/library 当前实现；生产 D1 API 实际写入、读回、独立访客隔离、revision 409、origin 403、格式 422/400、真实导出附件均通过 |
| 桌面、手机与错误处理 | 桌面核心路线；390×844 手机导航、播放器无横向溢出；当前源码具备触摸滑动与键盘控制；已有本地断连恢复/空结果/重置验证；生产未知论文 404 |
| GitHub、Sites 与演示材料 | GitHub main 已同步当前账户配置；Sites 私有站点部署 succeeded；README、数据来源、真实边界与约 7 分钟演示路线齐备 |

验证边界：没有物理手机触控测试，手机视口与控制按钮已测；平台多账号登录隔离未实测，生产 service-access 测试验证了匿名空间隔离。以上属于测试覆盖限制，不将其写成已通过。示例社区不是实时多人服务，推荐不是训练模型，数据不是实时资讯。

## 外部部署问题

原 manifest 项目 `appgprj_6a9fb6af9a308191a68c7eab04637d80` 的 get_site 多轮返回 `project_not_found`，source credential 也曾返回相同错误。
当前 Sites 账户列表只含 wanglinhao4140 下其他项目，原 PaperFeed 曾属于 lij850601 账户。此前未创建替代站点。用户随后明确授权使用当前账户构建 Sites，已按下节迁移；原站点保持不变，后续使用新站。

## 来源核验

已有 8 篇论文元数据由原版本于 2026-09-08 核验。2026-10-08 补查：

- https://arxiv.org/html/2303.11366v4
- https://arxiv.org/html/2310.08560v2
- https://arxiv.org/html/2210.03629v3
- https://react-lm.github.io/
- https://research.memgpt.ai/
- https://www.anthropic.com/engineering/building-effective-agents （2024-12-19）
- https://openai.com/index/learning-to-reason-with-llms/ （2024-09-12）
- https://openai.com/index/introducing-deep-research/ （2025-02-02；解读最初发布，不包含当前套餐）
- https://deepmind.google/blog/gemini-robotics-brings-ai-into-the-physical-world/ （2025-03-12）

所有图示为编辑重绘，配音为 macOS Tingting 离线合成。生成脚本 scripts/generate-narration.mjs；播放无需系统语音或第三方 TTS。

## 当前账户站点迁移 · 2026-10-08

用户明确要求使用自己的当前账户构建 Sites。已创建新私有站点，项目 ID `appgprj_6ac7b0a1e7d0819189f74bca369562d9`，所有者 wanglinhao4140@gmail.com；旧站点及其记录保留。此版本解除原账户访问依赖。

目标地址：https://paperfeed-research-demo.wanglinhao4140.chatgpt.site

已完成源码同步、TypeScript / 内容 / 状态检查与 Sites 生产构建，带 DB 绑定的正式部署返回 `succeeded`。

首个成功版本的源提交：`eca856524375c36d4bdb8769e7aa2669940cd337`；版本：`appgprj_6ac7b0a1e7d0819189f74bca369562d9~appgver_cf077978763881919a0e30c029e4d4f7`；部署：`appgdep_6ac7b12659688191acbdfc3ea08d0151`。本记录之后只同步说明文档，应用代码保持一致。

线上浏览器实际打开站点，显示“登录后即可访问”，点击“使用 ChatGPT 继续”后进入 OpenAI 登录页。当前浏览器没有该账户的登录会话；未绕过私有访问，也未扩大分享范围。需要所有者在浏览器完成登录后继续在线验收：推荐→播放→深读→保存→社区→个人空间→导出，尤其是生产 D1 与平台身份隔离。当前不能声称完整线上路线已通过。

## 线上验收完成 · 2026-10-08

最新已验收的应用部署 `appgdep_6ac7b2135c1c8191b7cd78dbc196030d`；源提交 `2e4bb1ea2281770fcb06a042bc8a405f9e5c4a14`。随后文档更新不改变应用代码。

- 浏览器随后获得访问权限，已走通：调整兴趣 → 三条讲解实际播放 → Reflexion 深读 → 收藏/已读/笔记 → 论文讨论及回复 → 加入 Agent Memory 与共读 → 发布社区讨论及回复 → 关注林一 → 个人空间刷新回看 → 导出知识库。
- 新增笔记“线上验收：比较纯重试与反思，固定总调用预算，检查错误归因。”刷新后仍在。个人空间显示社区、共读、同行、论文讨论和两类回复。
- 实际下载 `/Users/wlh/Downloads/paperfeed-notes (2).md`；文件包含原文/深读/HumanEval 条件、笔记、论文评论和社区回复。
- 线上研究博客筛选返回 Anthropic 与 OpenAI o1；Charles Packer 作者搜索只返回 MemGPT；负反馈隐藏 Reflexion。验收后恢复正反馈，便于展示。
- 线上 390×844 手机侧栏可进入讲解，document.scrollWidth=innerWidth=390；截图 `outputs/online-mobile-player.jpg`；桌面截图 `outputs/online-profile.jpg`。
- 通过官方 Sites service-access，在服务端使用仅发送至本站的凭据执行生产 API 检查：D1 写入/读回、匿名访客隔离、过期 revision 409、来源 403、无效数据 422/400、附件内容均通过。凭据未写入文件或仓库；service-access 不代表浏览器用户身份。
- 同样方式验证 26 个生产页面及详情/深读/笔记/讨论直达、未知论文 404、三条真实媒体响应。TypeScript、内容和状态验证再次通过。
