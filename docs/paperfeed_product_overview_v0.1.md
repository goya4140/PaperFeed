# 论文兴趣分发与学术交流平台：产品说明文档

## 当前需求更新 · 2026-10-20

当前产品名称使用 **PaperPop**；下方 PaperFeed 为历史暂名。本节记录本轮确认的需求；与历史设想冲突时以本节为准。需求确认不代表已实现。现有实现边界见 implementation-status.md。

**核心体验：发现相关论文 → 通过结构化 Poster 快速理解 → 围绕论文交流 → 进入研究方向社区 → 收藏、记录与持续关注。**

### 本轮用户明确的需求

1. 每篇论文都可以直接交流。讨论属于论文，不依赖用户先加入某个社区。
2. 构建研究方向主导的交流社区，参考贴吧的方向聚合与知乎的问题、回答组织方式。
3. 每篇论文提供帮助快速理解的标准模板，采用论文 Poster 形式。音频不作为核心理解形式或首版交付条件；paper2poster 类开源框架作为待评估实现路径，尚未选型或接入。

### 功能 checklist（讨论版）

以下细化项为根据上述需求提出的设计建议，仍可在后续讨论中调整。P0 为首版核心闭环，P1 为后续增强，P2 为扩展。未勾选表示尚未按本清单验收，不表示当前完全没有相关代码。

#### A. 发现论文与兴趣反馈

- [ ] P0：选择、跳过及调整研究兴趣；支持按标题、作者、方向搜索。
- [ ] P0：信息流显示来源、发表时间、相关性说明和 Poster 可用状态。
- [ ] P0：提供收藏、不感兴趣及撤销；划过内容不直接视为负反馈。
- [ ] P0：持续更新内容，区分新论文、版本更新和解读发布时间。

#### B. 每篇论文直接交流

- [ ] P0：论文详情和 Poster 阅读页都有明确的讨论入口。
- [ ] P0：支持围绕论文发起问题、发表评论、回答及回复；登录后发布，浏览规则另行确定。
- [ ] P0：不同用户进入同一论文时看到同一组公开讨论；个人笔记与公开讨论明确区分。
- [ ] P0：回复有站内通知，点击可回到对应讨论；通知去重。
- [ ] P0：用户能管理自己发布的内容；具备举报、屏蔽及运营处理入口。
- [ ] P1：针对 Poster 的具体模块或原文图表发问，并保留引用位置和内容版本。
- [ ] P2：作者认证、作者答疑及精选问答。

验收：A 用户从论文页提问，B 用户从同一论文页看到并回复，A 收到通知并直达回复；提问无需先加入方向社区。

#### C. 研究方向社区

- [ ] P0：每个研究方向有独立社区主页、介绍、关注/加入入口和帖子列表。
- [ ] P0：支持问题帖与讨论帖；问题帖支持独立回答及回答下回复，讨论帖支持评论和回复。
- [ ] P0：帖子可关联论文；论文页可发现关联的方向讨论。
- [ ] P0：论文实体与论文讨论保持统一；跨方向关联时引用已有论文或讨论，不复制出多个互不相通的论文页。
- [ ] P0：支持最新排序、基础检索、置顶及精华内容；热门排序待有真实互动信号后补充。
- [ ] P0：明确社区规则和公开范围，并提供举报、屏蔽、内容管理与处理能力。
- [ ] P1：关注帖子、赞同优质回答、方向内精选及跨方向发现。
- [ ] P2：共读活动、方向主持人、同行关系与私信。

验收：用户能进入一个研究方向，找到论文相关或方向性问题，发帖并收到回答；从关联论文可回到该讨论。

#### D. 用 Poster 快速理解每篇论文

- [ ] P0：统一模板覆盖标题与来源、一句话结论、研究问题、已有方法缺口、核心方法、关键图解、主要结果、条件与局限、适用场景、原文入口及讨论入口。
- [ ] P0：模板根据论文类型适配；没有适用实验指标时不强行填充，缺少证据时明确标注。
- [ ] P0：手机端按模块纵向浏览，支持图表放大；优先保存结构化文本、图表和出处，避免仅有一张缩小后难读的大图。
- [ ] P0：关键结论、数字和图表可追溯到原文章节、页码或图表；区分原文、编辑解释与原创示意图。
- [ ] P0：记录论文版本、模板版本和 Poster 修订版本，支持纠错与重新生成。
- [ ] P0：已发布论文详情可访问，Poster 未就绪时提供摘要和原文；显示待生成、处理中、失败、待审核、已发布状态，不将缺失内容伪装为完成。
- [ ] P0：评估 paper2poster 类开源框架的输出质量、中文支持、手机可读性、结构化输出、部署成本及许可证；选型后通过独立适配层接入。
- [ ] P1：Poster 分享或导出，保留论文来源及版本信息。
- [ ] P2：音频/视频作为可选补充，不替代 Poster。

覆盖目标：每篇收录论文最终都有快速理解入口；初期可分批生成，明确覆盖率和未就绪状态。验收目标：用户阅读 Poster 后，能描述研究问题、核心方法、主要结果与局限，并找到原文证据和讨论入口。是否达到目标需要用户试用验证。

#### E. 个人知识与双端连续体验

- [ ] P0：收藏、稍后读、已读、分组、私人笔记、检索与引用/笔记导出。
- [ ] P0：保存状态可见，弱网保留本机操作并支持重试；重开可恢复阅读位置。
- [ ] P0：iOS 与 Web 使用统一论文、方向、帖子、回答、评论及用户标识。
- [ ] P0：真实账号隔离个人数据；支持访客浏览及登录后的个人数据处理方案。
- [ ] P1：跨设备接续、离线 Poster、系统分享导入及可控推送。

### 对现有框架的调整约束

- `lib/papers.ts`：从固定内容逐步转为统一内容 API，论文与版本、方向关联独立管理。
- `lib/deep-reads.ts`：现有深读内容作为 Poster 信息结构的素材；增加独立 Poster 模型与生成状态，不将分镜直接当作海报模板。
- `app/research-player.tsx` 与音频脚本：保留已有实现，后续优先级下降；本轮不删除或改写运行代码。
- `lib/state.ts`、`db/schema.ts` 与 `/api/state`：个人状态逐步拆分；论文讨论和社区帖子进入共享数据结构，不再仅存入各自的研究空间 JSON。
- 论文讨论与方向社区共享用户和内容身份，但保留不同上下文；问题、回答、评论分别有稳定 ID、作者、时间和引用关系。
- Poster 生成在服务端异步完成，基础产物按论文版本复用；iOS/Web 消费同一份结构化数据。

---

> **项目暂名：PaperFeed**
>
> **一句话定位：** 让论文像内容一样被发现，像帖子一样被讨论，像知识一样被带走。
>
> **产品形态：** App + Web 统一平台  
> **核心对象：** Paper，而不是 PDF。  
> **核心闭环：** Discover → Judge → Understand → Discuss → Save / Export → Feedback → Better Discovery

---

## 0. 背景与产品愿景

今天真正的问题已经不是“找不到论文”，而是**论文太多了**。

arXiv、会议论文集、实验室主页、X / 小红书、Hugging Face、alphaXiv、博客和 GitHub 每天都在产生大量新的研究内容。对于研究者来说，论文获取已经从一个“信息不足”的问题，转变成了一个典型的“信息过载”问题：

- 我不知道今天哪些论文真正值得看；
- 我不知道哪些高质量论文恰好与我当前的研究兴趣有关；
- 我甚至不知道应该搜索什么关键词，才能发现那些“我看到了才知道自己感兴趣”的研究；
- 当我终于找到一篇论文后，阅读、讨论、收藏和后续使用又分散在多个平台；
- 很多有价值的学术讨论发生在会议 Poster、微信群、Slack、X 或作者朋友圈里，随后迅速消失；
- 作者发布论文后，也缺少一个长期、统一、原生的阵地来解释自己的工作、补充材料并回答读者问题。

因此，我们希望构建的不是另一个论文搜索引擎，也不只是另一个 AI PDF Reader。

我们希望建立一个真正意义上的：

> **Research Discovery & Discussion Network**
>
> 一个以论文为内容单元、以研究兴趣为推荐基础、以学术社区为交流网络、以开放工作流为出口的论文平台。

它需要同时解决五件事：

1. **帮用户找到“高质量”的论文；**
2. **帮用户找到“自己真正感兴趣”的论文；**
3. **让论文成为可以持续交流和讨论的学术内容对象；**
4. **降低论文理解和快速判断的成本；**
5. **让论文和阅读结果能够自由进入用户已有的研究工作流。**

---

# 1. 使用场景 / 用户任务

## 1.1 场景一：每天快速发现“值得看”的论文

### 用户问题

研究者每天面对大量新论文，但没有时间逐篇浏览 arXiv 标题和摘要，也没有足够的信息判断：

> “今天到底有什么论文值得我花 30 分钟甚至几个小时认真读？”

传统 arXiv 的核心逻辑是“发布”，而不是“筛选”。

### 用户任务

用户每天打开 App / Web，希望在几分钟内完成：

- 今天有哪些值得关注的新论文？
- 哪些论文正在快速获得社区关注？
- 哪些论文有高质量代码、数据、Demo 或作者材料？
- 哪些论文值得加入稍后阅读列表？

### 产品体验

首页提供类似 Hugging Face Papers 的：

- Daily / Weekly / Monthly；
- Trending Papers；
- Community Upvote；
- Topic Trending；
- Rising Papers；
- 高质量论文榜单。

但平台不会只把“热门”直接等同于“高质量”。

平台可以逐步形成独立的 **Paper Quality Signal**：

- 社区 Upvote；
- 研究者收藏率；
- 阅读完成率；
- 高质量评论与讨论；
- 作者 / 专家推荐；
- Code / Dataset / Demo 完整度；
- Reproduction / Follow-up 信息；
- GitHub / Hugging Face 等外部研究资产；
- 论文在特定研究社区中的增长速度；
- 后续引用与真实使用情况。

最终回答：

> **What is worth reading?**

---

## 1.2 场景二：找到“我感兴趣，但我根本不会主动搜索”的论文

这是平台最核心的价值之一。

搜索的前提是：

> **用户已经知道自己想找什么。**

但真正有价值的新论文发现经常不是这样的。

例如，一个研究者最近在关注：

- Agent Harness；
- Continual Learning；
- Test-Time Training；
- Long-Horizon Agents；
- Research Memory。

他可能并不会想到搜索：

> “runtime procedural memory for agent execution”

但如果一篇论文的思想与他最近几周阅读、收藏和讨论的内容高度相关，那么平台应该主动把它送到他面前。

### 用户任务

用户不是“输入关键词找论文”，而是：

> **打开平台，让平台告诉我：今天有哪些论文是“为我而来的”。**

### 产品体验

平台建立 **Interest Feed**，像小红书 / 抖音一样，根据用户长期和短期兴趣进行论文推荐。

推荐信号可以包括：

- 用户选择的研究领域；
- Follow 的 Topic；
- Follow 的作者；
- 阅读过的论文；
- 收藏；
- Upvote；
- 评论；
- 分享；
- 阅读停留；
- 是否展开 AI Notes；
- 是否进入 PDF 深度阅读；
- 导入 Zotero / Obsidian 的行为；
- Swipe “感兴趣 / 不感兴趣”；
- 最近正在进行的研究项目。

需要区分两个完全不同的问题：

> **Quality：这篇论文好不好？**

和

> **Interest：这篇论文是不是适合我？**

一篇论文可以非常优秀，但与用户毫无关系。

另一篇论文可能不是全站最热门，却恰好直接解决用户当前研究中的一个问题。

我们的推荐系统需要同时理解这两个维度。

---

## 1.3 场景三：通勤、排队、吃饭时“刷论文”

论文阅读长期被设计成一个非常重的行为：

> 打开电脑 → 搜索 → 打开 PDF → 阅读十几页。

但“发现论文”和“完整阅读论文”其实是两个不同任务。

用户完全可以在手机上用几十秒判断：

- 这篇在解决什么问题？
- 和我有什么关系？
- 最大贡献是什么？
- 值不值得以后认真读？

### 产品体验：Paper Swipe

平台提供一个类似 Dating App / 短内容 Feed 的快速发现模式。

每次只显示一篇论文 Card：

- 标题；
- 一句话 TL;DR；
- 问题是什么；
- 核心 Idea；
- 最关键 Figure；
- 主要实验结果；
- Topic Tags；
- 作者；
- Code / Demo；
- 当前社区热度；
- “为什么推荐给你”。

用户通过极低成本行为表达：

- **Interested**
- **Not Interested**
- Save
- Upvote
- Read More

Swipe 不是一个视觉噱头。

它实际上提供了一种非常高密度的 **Preference Labeling Mechanism**：

> 用户每刷一篇论文，都在训练自己的 Research Feed。

因此：

> **刷论文本身，就是个性化推荐系统的持续学习过程。**

---

## 1.4 场景四：快速理解一篇论文，而不是立刻读完 20 页 PDF

找到论文之后，用户首先需要解决的通常不是：

> “帮我逐字阅读这篇论文。”

而是：

> “这篇论文到底值不值得我继续读？”

### 用户任务

用户希望在 1～5 分钟内知道：

1. 论文解决什么问题？
2. 为什么过去的方法不够？
3. 作者提出了什么核心方法？
4. 最重要的结果是什么？
5. 它和已有方法有什么区别？
6. 哪几张图 / 表最关键？
7. 论文有哪些局限？
8. 我应该重点读哪些 Section？

### 产品体验

参考 Papers.cool、alphaXiv 一类增强阅读产品，每篇 Paper Page 默认提供：

- One-sentence TL;DR；
- 30 秒版本；
- 3 分钟版本；
- Problem / Method / Result；
- Key Contributions；
- Key Figures；
- Related Papers；
- Limitations；
- Community Notes；
- AI Q&A；
- 原始 PDF / HTML 阅读。

核心原则是：

> **AI 不替代论文，而是降低“进入论文”的门槛。**

---

## 1.5 场景五：把“论文页面”变成线上 Poster

今天的大部分论文页仍然是静态页面：

> Title + Authors + Abstract + PDF。

但论文真正有价值的信息往往远远超过 PDF。

例如：

- 作者自己的 Blog；
- Project Page；
- GitHub；
- Demo；
- Hugging Face Model；
- Dataset；
- Slides；
- Poster；
- Talk Video；
- Twitter / X Thread；
- FAQ；
- Errata；
- Follow-up Work。

### 产品体验：Paper as a Post

在我们的平台里：

> **每一篇论文，本质上是一篇特殊的“帖子”。**

Paper Page 同时是：

- 论文主页；
- 阅读入口；
- 讨论区；
- 作者主页的一部分；
- 相关资源中心；
- 长期维护的学术交流空间。

作者可以 Claim 自己的 Paper，并补充：

- Project URL；
- GitHub；
- Model / Dataset；
- Slides；
- Poster；
- Demo；
- Video；
- Blog；
- 推荐阅读顺序；
- 作者 TL;DR；
- FAQ；
- 后续版本和更新。

于是论文发布不再是：

> 上传 arXiv → 发一条 X → 信息迅速沉底。

而是拥有一个**持续存在的学术内容页面**。

---

## 1.6 场景六：把线下 Poster Q&A 搬到线上，而且让它永久存在

学术会议 Poster Session 很有价值，因为读者可以直接问：

- 为什么这样设计？
- 这个 baseline 为什么没有比较？
- 这里是不是存在 data leakage？
- 这个方法能不能应用到另一个场景？
- 作者后来有没有做这个实验？

但 Poster Session 最大的问题是：

> **交流只存在于那几十分钟里。**

### 产品体验：Paper-native Discussion

每篇 Paper 下都可以：

- 评论；
- 提问；
- 回复；
- Upvote；
- 引用论文具体段落 / Figure；
- @作者；
- 标记作者回复；
- Follow Discussion。

讨论可以被组织为：

- Question；
- Research Discussion；
- Critique；
- Reproduction；
- Resource；
- Follow-up Idea；
- Author Response。

作者经过身份验证后，可以直接回答。

高价值讨论也可以继续被其他研究者补充。

这样，一篇论文的理解不再只来自 PDF，而来自：

> **Paper + Authors + Readers + Community Knowledge**

这相当于把一次性的 Poster Session 变成一个长期存在、全世界可参与的 **Asynchronous Poster Session**。

---

## 1.7 场景七：作者主动经营论文，而不是只能“发链接宣传”

平台不仅服务 Reader，也服务 Author。

### 作者任务

论文发布以后，作者需要：

- 让真正感兴趣的人看到论文；
- 解释论文贡献；
- 提供代码和 Demo；
- 回答读者问题；
- 纠正常见误解；
- 获取真实反馈；
- 找潜在合作伙伴；
- 让论文在发布几个月以后仍然能够被重新发现。

### 产品价值

平台天然知道：

> **哪些用户长期阅读与这篇论文高度相关的主题。**

因此作者不需要把论文“广播给所有人”，平台可以把它分发给：

> **最可能真正理解和使用这项工作的人。**

这比单纯的社交媒体曝光更接近真正的 Academic Distribution。

---

## 1.8 场景八：收藏不是终点——把论文带回自己的工作流

研究者已经有自己的工作方式：

- Zotero；
- Obsidian；
- Notion；
- Markdown；
- BibTeX；
- VS Code；
- Codex；
- Claude Code；
- Notebook；
- 自己的 Agent / Research Harness。

因此，我们不应该尝试把用户锁在平台内。

### 用户任务

看到一篇论文后，用户应该能够：

- Add to Zotero；
- Export BibTeX / RIS；
- Export Markdown；
- Save to Obsidian；
- 保存 AI Notes；
- 保存自己的 Annotation；
- 导出讨论；
- 复制标准 Citation；
- 通过 API / MCP / CLI 读取；
- 发送给 Codex / Agent 继续分析；
- 批量导出自己的 Library。

### 产品原则

> **我们的目标不是拥有用户的知识，而是帮助用户获得知识。**

平台应该是一个开放的 Research Interface，而不是一个新的知识孤岛。

---

# 2. 当前类似平台的痛点

## 2.1 真正的问题不是“没有工具”，而是工具链被切碎了

今天已经存在大量优秀产品：

| 平台类型 | 代表 | 擅长解决的问题 |
|---|---|---|
| 论文源 | arXiv | 全量论文发布与检索 |
| 社区筛选 | Hugging Face Papers | Trending、Upvote、研究资源聚合 |
| 个性推荐 | Scholar Inbox | 基于用户反馈的论文推荐、Semantic Search |
| 论文讨论 | alphaXiv | 围绕论文直接评论与讨论 |
| AI 阅读 | alphaXiv、Papers.cool 等 | 摘要、解释、辅助理解 |
| 文献管理 | Zotero | 收藏、管理、Annotation、Citation |
| 知识管理 | Obsidian | Markdown、本地知识库、自由组织 |
| 泛社交网络 | X、小红书、微信群等 | 传播、讨论、研究者关注 |

问题在于：

> **用户完成一次完整的“论文消费”需要在多个产品之间不断跳转。**

典型流程可能是：

```text
X / 微信看到论文
        ↓
打开 arXiv
        ↓
去 Hugging Face 看热度
        ↓
去 alphaXiv / AI 工具看解释
        ↓
打开 PDF
        ↓
去 GitHub 找代码
        ↓
回 X 找作者讨论
        ↓
复制到 Zotero
        ↓
把笔记写进 Obsidian
```

真正缺少的是一个统一的：

> **Paper Discovery → Reading → Discussion → Knowledge Workflow**

---

## 2.2 痛点一：arXiv 解决了“有没有”，没有解决“值不值得看”

arXiv 的价值是完整、开放、及时。

但其基础信息架构仍然主要围绕：

- Category；
- 时间；
- Keyword；
- 作者。

这意味着用户需要自己承担：

> **Quality Filtering**

每天新增论文越多，这个问题越严重。

---

## 2.3 痛点二：高质量推荐 ≠ 个性化推荐

Hugging Face Papers 的社区 Upvote、Daily / Weekly / Monthly Trending 和研究资源聚合非常适合回答：

> **最近 AI 社区在关注什么？**

但：

> **全社区最火的论文，不一定是我今天最需要读的论文。**

如果一个研究者只关注一个非常窄的 Topic，那么一个全站只有几十个 Upvote 的论文，对他而言可能比一个数千 Upvote 的热门模型论文更重要。

现有平台经常将：

> Popularity

误认为：

> Relevance。

我们需要同时建模：

```text
Paper Quality
      ×
User Interest
      ×
Freshness
      ×
Exploration / Diversity
```

---

## 2.4 痛点三：个性推荐已经存在，但“推荐”仍然是一个孤立模块

Scholar Inbox 已经证明：

- 可以通过用户正 / 负反馈学习研究兴趣；
- 可以持续推荐最新论文；
- 可以提供 Semantic Search、Visual Summary 和 Science Map。

这说明：

> **“论文个性化推荐”本身不是空白市场。**

但推荐仍然可以进一步与以下东西结合：

- 社区质量信号；
- Paper-native Discussion；
- Verified Author；
- 作者资源；
- Mobile Swipe；
- 学术社交网络；
- 阅读行为；
- Zotero / Obsidian / Agent 工作流；
- Paper 生命周期。

我们的机会不只是做一个 Recommendation Algorithm，而是建立：

> **围绕论文推荐形成的完整行为闭环。**

---

## 2.5 痛点四：搜索天然无法解决“未知兴趣发现”

Google Scholar、Semantic Search、arXiv Search 都属于：

> **Pull-based Discovery**

用户必须先提出 Query。

但大量最有价值的发现属于：

> **Push-based Discovery**

用户只有在看到论文以后才会意识到：

> “原来这个问题还能这么做。”

这也是为什么抖音、小红书、YouTube Feed 的信息发现效率在很多场景中高于纯搜索。

学术信息长期缺少一个真正成熟的：

> **Interest-driven Feed**

---

## 2.6 痛点五：论文阅读工具解决“读”，但没有解决“为什么是这篇”

AI Paper Reader 可以：

- 总结；
- 翻译；
- QA；
- 解释公式；
- 提炼贡献。

但它们往往发生在用户已经打开论文以后。

真正前置的问题仍然没有解决：

> **在今天的几千篇候选论文里，为什么我要打开这一篇？**

因此 Discovery 和 Reading 不应该被拆成两个产品。

---

## 2.7 痛点六：论文讨论存在，但没有形成真正的“学术社交网络”

alphaXiv 已经很好地证明了：

> **评论应该发生在论文之上。**

但一个完整的学术社区还可以进一步拥有：

- Follow Author；
- Follow Topic；
- Follow Paper；
- Follow Discussion；
- Verified Author；
- 作者回复；
- 研究者 Profile；
- 研究兴趣图谱；
- Reputation；
- Reading Activity；
- Collection；
- Research Graph。

最终让：

> Paper Graph

和：

> People Graph

连接起来。

---

## 2.8 痛点七：泛社交网络传播快，但学术信息结构非常差

研究者会在 X、微信群、小红书、Slack 等地方分享论文。

这些平台的优点是：

- 快；
- 有人；
- 有关注关系。

但缺点也非常明显：

- Discussion 与论文正文分离；
- 同一论文的讨论散落在几十个 Post；
- 很难找到作者的正式回复；
- 无法自然连接论文版本、代码、数据和 Demo；
- 优质讨论很快被 Timeline 淹没；
- 无法形成长期可检索的 Paper Knowledge。

因此我们的目标不是复制一个泛社交平台，而是：

> **让 Social Network 以 Paper 为原生对象。**

---

## 2.9 痛点八：个人知识管理工具位于工作流末端，缺乏发现层

Zotero 非常适合：

- Collect；
- Organize；
- Annotate；
- Cite。

Obsidian 非常适合：

- Markdown；
- 本地知识；
- Linking；
- 自定义工作流。

但这些工具并不以：

> **“今天主动给我推荐 20 篇值得看的新论文”**

作为核心任务。

我们的产品应该成为它们的上游，而不是替代它们：

```text
Our Platform
     ↓
发现 / 筛选 / 理解 / 讨论
     ↓
Zotero / Obsidian / Codex / Agent / Personal KB
```

---

# 3. 我们的核心亮点

## 3.1 Highlight 1：Quality × Interest 双轴论文推荐

这是整个产品最核心的思想。

现有论文推荐经常只优化一个问题：

### A. 什么论文最好？

或者：

### B. 什么论文最像我以前看过的？

我们同时优化：

> **Worth Reading × Worth Reading for You**

即：

```text
Quality Score
      ×
Personal Interest Score
      ×
Freshness
      ×
Diversity / Exploration
```

### Quality Signal

回答：

> “这篇论文在研究社区中值不值得看？”

### Interest Signal

回答：

> “这篇论文对当前这个用户值不值得看？”

这是比单一 Trending 或单一 Semantic Similarity 更符合真实研究行为的推荐模型。

---

## 3.2 Highlight 2：把论文从 Document 变成 Content

今天论文产品大多数仍然把 Paper 看作：

> PDF Document。

我们的产品把 Paper 看成：

> **Research Content Object。**

它拥有：

- Feed Card；
- Topic；
- Upvote；
- Save；
- Comment；
- Author；
- Followers；
- Resource；
- Version；
- AI Notes；
- Discussion；
- Recommendation；
- Export。

这让论文第一次真正进入现代 Content Distribution System。

---

## 3.3 Highlight 3：PaperTok —— 真正适合手机的论文发现体验

手机不是用来完整阅读 30 页论文的。

但手机非常适合：

> **决定下一篇值得读什么。**

因此 App 的核心任务不是把桌面 PDF Viewer 缩小到手机，而是重新设计论文发现：

```text
30 秒
了解论文

↓ Swipe

Interested / Not Interested

↓
Save / Read Later

↓
推荐系统变得更懂你
```

让用户在：

- 地铁；
- 出租车；
- 排队；
- 吃饭；
- 睡前；

都可以低成本获取最新研究。

---

## 3.4 Highlight 4：Swipe = Recommendation Training

左右滑最重要的意义不是“像 Tinder”。

而是把推荐系统最缺少的：

> **Explicit Negative Feedback**

变得极其自然。

传统学术产品通常只知道：

- 你收藏了什么；
- 你点开了什么。

但不知道：

> “我认真看到了这篇论文，但我明确不感兴趣。”

Swipe 可以持续获得：

```text
Positive Preference
Negative Preference
Skip
Save
Deep Read
```

因此用户不是被动接受算法。

用户是在不断：

> **Teach My Feed**

---

## 3.5 Highlight 5：Paper-as-Post 学术社区

每篇论文都拥有自己的社区页面。

不是：

> “论文下面顺便有评论区。”

而是：

> **论文就是 Post。**

作者、读者、复现者和后续工作作者，都围绕同一个 Paper Object 长期交流。

可以形成：

- Question；
- Critique；
- Reproduction；
- Resource；
- Follow-up；
- Author Response。

让论文拥有长期社区生命。

---

## 3.6 Highlight 6：Verified Author + Author-owned Paper Page

作者可以认领论文。

认证后获得：

- Verified Author；
- Author Response 标识；
- 编辑论文附加资源；
- 发布更新；
- 发布 FAQ；
- 添加 Talk / Slides / Demo；
- 解释常见误解；
- 回答社区问题。

因此我们的平台不仅是 Reader Product，也是：

> **Researcher Distribution Platform。**

---

## 3.7 Highlight 7：把 Poster Session 变成永久在线空间

会议最大的价值之一不是 PDF，而是：

> **人与人的讨论。**

我们的 Paper Discussion 可以成为：

> **24/7 Global Poster Session**

它突破：

- 地域；
- 会议门票；
- 时区；
- Poster 时间；
- 现场人数。

同时讨论永久留在 Paper Page 上，成为后续所有读者都可以使用的 Community Knowledge。

---

## 3.8 Highlight 8：AI Reading Layer，但不把产品退化成“AI 总结器”

AI 是非常重要的一层，但不是产品本身。

我们不应该把产品定位成：

> “上传 PDF → Chat with PDF。”

AI 应该贯穿：

### Before Reading

- Personalized TL;DR；
- Why Recommended；
- 与用户已有 Library 的关系；
- 是否值得深读。

### During Reading

- Explain；
- QA；
- Figure；
- Equation；
- Related Work；
- Compare。

### After Reading

- Notes；
- Summary；
- Knowledge Card；
- Export；
- Follow-up Papers；
- Discussion Summary。

因此 AI 服务于：

> **Discover → Understand → Retain**

而不是成为一个孤立 Chatbox。

---

## 3.9 Highlight 9：作者原生研究资源中心

作者可以把所有宣传和研究资产统一挂到论文：

```text
Paper
├── PDF
├── Project Page
├── GitHub
├── Model
├── Dataset
├── Demo
├── Blog
├── Poster
├── Slides
├── Talk
├── FAQ
└── Follow-up
```

论文页面因此不再只是一个 PDF 下载链接，而成为：

> **Canonical Research Page。**

---

## 3.10 Highlight 10：开放，而不是再造一个数据孤岛

这是非常重要的产品哲学。

我们应该原生支持：

- Zotero；
- Obsidian；
- BibTeX；
- RIS；
- Markdown；
- JSON；
- API；
- MCP；
- CLI；
- Codex / Agent；
- Personal Knowledge Base。

用户的：

- 收藏；
- Annotation；
- AI Notes；
- Reading List；
- Discussion；
- Metadata；

应该尽可能可导出、可编辑、可自动化。

我们的竞争力不来自：

> **“把用户锁住。”**

而来自：

> **“即使用户可以随时把数据带走，他仍然愿意每天回来发现新论文。”**

---

# 4. 产品真正形成的完整闭环

整个产品可以浓缩成下面这条链路：

```text
                    ┌──────────────┐
                    │ New Papers   │
                    │ arXiv / ...  │
                    └──────┬───────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │ Quality Ranking  │
                 │ 什么值得读？     │
                 └────────┬─────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │ Personal Interest    │
              │ 什么适合“我”读？    │
              └──────────┬───────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Feed / Swipe │
                  │ 主动发现论文 │
                  └──────┬───────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Not Interested    Save         Deep Read
          │              │              │
          │              │              ▼
          │              │        ┌─────────────┐
          │              │        │ AI Reading  │
          │              │        └──────┬──────┘
          │              │               │
          │              │               ▼
          │              │        ┌─────────────┐
          │              │        │ Discussion  │
          │              │        │ Author Q&A  │
          │              │        └──────┬──────┘
          │              │               │
          └──────────────┼───────────────┘
                         │
                         ▼
                  Preference Update
                         │
                         ▼
                  Better Recommendation

                         +
                         │
                         ▼
            Zotero / Obsidian / Codex
            API / MCP / Personal KB
```

这是一个持续自我增强的 Flywheel：

> **推荐产生行为 → 行为产生偏好数据 → 偏好改善推荐 → 更好的论文产生更多高质量行为。**

同时：

> **讨论产生社区知识 → 社区知识提高论文理解效率 → 更多作者参与 → 作者参与提高内容质量 → 更强的社区。**

---

# 5. 我们与现有产品的核心区别

如果必须用一张表解释：

| 能力 | arXiv | HF Papers | Scholar Inbox | alphaXiv | Zotero | 我们 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 全量论文入口 | ✅ | ◐ | ✅ | ✅ | ◐ | ✅ |
| 社区质量筛选 | ❌ | ✅ | ❌/弱 | ◐ | ❌ | ✅ |
| 个性化兴趣推荐 | ❌ | ◐ | ✅ | ◐ | ❌ | ✅ |
| 显式负反馈 | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Mobile Swipe | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| AI 快速阅读 | ❌ | ◐ | ✅ | ✅ | ◐ | ✅ |
| Paper-native Discussion | ❌ | ◐ | ❌/弱 | ✅ | ❌ | ✅ |
| Verified Author Interaction | ❌ | ◐ | ❌/弱 | ◐ | ❌ | ✅ |
| 作者资源中心 | ❌ | ✅ | ◐ | ✅ | ❌ | ✅ |
| 学术 Social Graph | ❌ | ◐ | ❌/弱 | ◐ | ❌ | ✅ |
| Zotero / Obsidian 工作流 | ❌ | ❌ | ◐ | ❌ | ✅ | ✅ |
| API / MCP / Agent 开放性 | ◐ | ◐ | ◐ | ◐ | ◐ | ✅ |
| Discovery → Read → Discuss → Export 闭环 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

> 注：这里的比较用于描述各产品的**核心产品重心**，而不是判断某个平台是否绝对不存在某个边缘功能。

---

# 6. 最核心的产品价值总结

我们最终解决的不是一个问题，而是五个连续问题。

## 6.1 帮大家找到高质量文献

> **Quality Discovery**

继承 Hugging Face Papers 的社区筛选价值，并构建更丰富的 Paper Quality Signal。

---

## 6.2 帮大家找到高兴趣文献

> **Personalized Discovery**

借鉴现代内容推荐产品：

> 不要求用户永远主动搜索，而是主动把可能改变其研究方向的内容送到面前。

---

## 6.3 帮大家建立统一的线上学术交流平台

> **Academic Social Network**

Paper-as-Post + Author Claim + Comments + Author Response + Community Discussion。

让学术交流从瞬时的 Poster / Timeline 变成长期积累的 Research Knowledge。

---

## 6.4 帮大家更快完成论文理解

> **AI-assisted Reading**

从“是否值得看”到“快速理解”再到“深度阅读”，逐层降低认知成本。

---

## 6.5 帮大家把知识自由带回自己的工具

> **Open Research Workflow**

Zotero / Obsidian / Markdown / API / MCP / Codex / Agent。

平台负责：

> **发现和连接。**

用户负责：

> **拥有自己的知识。**

---

# 7. 最终产品定位

我们不是：

- 第二个 arXiv；
- 第二个 Google Scholar；
- 第二个 Zotero；
- 第二个 ChatPDF；
- 第二个 Hugging Face Papers；
- 第二个 alphaXiv；
- 一个简单的论文推荐算法。

我们真正希望建立的是：

> # **The Feed for Research**
>
> 一个知道：
>
> **什么论文值得读、什么论文值得你读、谁正在讨论它，以及读完之后知识应该去哪里的论文网络。**

或者更产品化地表达：

> **TikTok / Xiaohongshu for Paper Discovery  
> + Hugging Face Papers for Quality  
> + alphaXiv for Discussion  
> + AI Reader for Understanding  
> + Zotero / Obsidian / Agent for Ownership**

但最终它应该不是这些产品的简单拼接。

真正形成壁垒的是这一条完整飞轮：

> **Paper → Recommendation → Interaction → Interest → Discussion → Knowledge → Better Recommendation**

当这个闭环建立以后，平台拥有的就不再只是论文数据库，而是一个不断增长的：

- **Research Interest Graph**
- **Paper Quality Graph**
- **Researcher Social Graph**
- **Paper Discussion Graph**
- **Personal Knowledge Interface**

这才是产品长期最有价值的部分。

---

# 8. 一句话总结

> **过去的论文平台让用户“搜索论文”；我们希望让真正重要、真正适合你的论文主动找到你，并让发现、理解、讨论和知识沉淀发生在同一个连续体验里。**

---

## 参考产品与资料

本文档在产品能力梳理时参考了以下公开产品 / 资料（核验日期：2026-09-08）：

1. Hugging Face — Trending Papers / Daily Papers；
2. Hugging Face Blog — Daily Papers 功能介绍；
3. alphaXiv — Paper Discussion 与 Comment Guidelines；
4. Flicke et al., *Scholar Inbox: Personalized Paper Recommendations for Scientists*, ACL 2025 System Demonstrations；
5. Zotero — 官方产品与功能文档；
6. Obsidian — Web Clipper 官方文档；
7. Papers.cool — 作为 AI 辅助快速论文阅读类产品参考。

