# PaperFeed · The Feed for Research

用于投资人现场演示的 Web 概念原型，依据 `paperfeed_product_overview_v0.1.md` 的产品设计实现。

## 体验主线

1. 在「为你推荐」与「社区精选」之间切换，观察兴趣排序与质量排序的区别。
2. 打开 Paper Swipe，点击感兴趣或不感兴趣，再返回推荐。正反馈增加该论文排序权重；负反馈隐藏该论文。
3. 打开论文，查看核心观点、方法、结果、局限与阅读建议。
4. 切换到学术讨论，查看示例作者回复，并添加仅在本页面保留的讨论。
5. 收藏论文，在「我的文库」打开，导出 Markdown（Obsidian）或 BibTeX（Zotero）。
6. 顶部「产品亮点」提供投资人演示引导；右侧「重置演示」清空本次会话状态。

## 范围与数据边界

- 所有论文、作者、质量分、匹配分、社区计数与讨论均为虚构样例，页面与导出文件均作了标注。
- 推荐为确定性前端规则，用于解释 Quality × Interest 的设计，不是训练好的推荐模型。
- 阅读笔记为预写内容，没有调用 AI；不需要 API 密钥。
- 收藏、偏好、赞同和讨论仅保留在本次页面会话中，刷新即重置；没有账户或云端持久化。
- Markdown 与 BibTeX 为真实文件下载。尚未连接 Zotero、Obsidian 或第三方账户。
- 作者认证、真实论文源、资源上传、实时社区、API/MCP/CLI 为后续阶段。
- 响应式布局覆盖桌面与移动宽度；使用 Base UI 对话框和 Tabs 提供焦点管理与键盘交互。

## 本地开发

需要 Node.js >=22.13.0。

```bash
npm ci
npm run dev
```

## 检查与构建

```bash
npm run lint
npx tsc --noEmit
npm run build
```

技术栈：React 19、Vinext、Base UI / Shadcn、Lucide、Tailwind CSS，Cloudflare Worker 运行时。Sites 项目关联保存在 `.openai/hosting.json`；凭据不进入代码库。

## 演示建议

用 3–5 分钟展示「为什么是这篇 → 30 秒理解 → 作者讨论 → 知识带走」；不要把演示评分当作真实用户数据，也不要将规则排序描述为已验证的推荐效果。

Lint 检查产品代码；生成的 `components/ui` 与 `hooks/use-mobile.ts` 存在上游规则不兼容，保持原样并排除 lint。TypeScript 检查仍覆盖全部组件。
