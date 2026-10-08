# 完整 Demo 目标进度 · 2026-10-08

目标尚未完成，以下本地验收不代表已部署到线上。

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

## 完成审计：仍需继续

| 要求 | 当前证据 | 尚缺证据 |
| --- | --- | --- |
| 12 条内容、4 条官方内容、3 篇深读 | 内容源码、来源记录、数据检查、浏览器深读 | 已满足本地内容数量和结构要求 |
| 推荐、搜索筛选、个人沉淀 | 数据检查 + 浏览器正负反馈/类型/作者搜索/文库操作 | 线上回归 |
| 3 条讲解与媒体控制 | 真 AAC、浏览器播放/暂停/字幕/静音/切换 | 物理触控手势未验证；浏览器按钮、键盘和手机布局已测 |
| 社区、共读、同行 | 生产浏览器操作和个人空间回看 | 线上回归 |
| 存储、错误和恢复 | D1 API、并发合并检查、断连保存/恢复/刷新 | 生产 D1 与平台身份隔离 |
| 桌面与手机 | 浏览器视口截图、导航及溢出检查 | 线上环境重复核心路线 |
| README 和演示路线 | README.md、investor-demo.md 已写 | 发布后更新部署结果 |
| GitHub、原站部署 | 原仓库 main 已推送 f85a77e（数据库与生产流程修复） | 原站部署与线上验收 |

## 外部部署问题

原 manifest 项目 `appgprj_6a9fb6af9a308191a68c7eab04637d80` 的 get_site 多轮返回 `project_not_found`，source credential 也曾返回相同错误。
当前 Sites 账户列表只含 wanglinhao4140 下其他项目，原 PaperFeed 曾属于 lij850601 账户。未创建替代站点、未更换项目 ID、未更改访问权限。需要恢复原账户/工作区的 Sites 访问，才能完成源码同步、原站部署与线上验收。

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
