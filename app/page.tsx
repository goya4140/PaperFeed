'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Toaster, toast } from '@/components/ui/toast';
import {
  Layers,
  Sparkles,
  ArrowUpRight,
  Bookmark,
  ArrowUp,
  MessageCircle,
  ArrowRight,
  Search,
  Check,
  X,
  Download,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Paper = {
  id: string;
  title: string;
  authors: string;
  topic: string;
  quality: number;
  interest: number;
  votes: number;
  comments: number;
  summary: string;
  method: string;
  result: string;
  limit: string;
  reason: string;
};
const papers: Paper[] = [
  {
    id: 'memory',
    title:
      'Beyond the Context Window: Learning to Remember in Long-Horizon Agents',
    authors: 'Lin Chen, Maya Patel et al.',
    topic: 'Agent Memory',
    quality: 92,
    interest: 98,
    votes: 128,
    comments: 24,
    summary:
      '让 Agent 把执行中的经验转化为可复用记忆，在长任务中少走弯路，而不只是扩大上下文窗口。',
    method:
      '将轨迹压缩为带触发条件的程序性记忆；下一次执行时先检索，再根据环境反馈更新。',
    result:
      '示例实验呈现：跨任务复用经验后，重复错误减少，长程任务表现更稳定。',
    limit: '记忆可能过时；跨环境迁移和错误记忆的识别仍需验证。',
    reason:
      '与你收藏的「Research Memory」及近期阅读的 Long-Horizon Agents 相关',
  },
  {
    id: 'testtime',
    title: 'Learning at Inference Time: A New Frontier for Adaptive Reasoning',
    authors: 'Sofia Kim, Alex Morgan et al.',
    topic: 'Test-Time Learning',
    quality: 95,
    interest: 89,
    votes: 246,
    comments: 38,
    summary:
      '让模型在解决问题的过程中适应新分布，把推理时间转化为可学习的计算资源。',
    method:
      '用当前输入构造自监督目标，更新小规模适配参数，并通过置信度决定计算预算。',
    result: '示例结果提示：面对分布变化时，适配机制可能优于固定计算策略。',
    limit: '额外计算开销明显；在线更新的稳定性和评估泄漏需要仔细检查。',
    reason: '你关注了 Continual Learning；这篇工作探索学习与推理的交叉点',
  },
  {
    id: 'harness',
    title: 'The Harness Matters: Evaluating Agents Beyond the Model',
    authors: 'Daniel Park, Rui Zhang et al.',
    topic: 'Agent Harness',
    quality: 88,
    interest: 96,
    votes: 86,
    comments: 17,
    summary:
      '同一个模型，不同的执行框架。把工具调用、反馈与恢复机制纳入 Agent 评估。',
    method: '固定模型，对执行器、工具反馈和失败恢复策略做控制变量比较。',
    result:
      '示例结论：系统设计可以改变任务成功率，单独比较模型无法解释全部差异。',
    limit: '评估依赖选定任务集；真实生产环境中的工具噪声仍待研究。',
    reason: '与你当前关注的 Agent Harness 高度匹配，虽然社区热度还不高',
  },
  {
    id: 'vision',
    title: 'Seeing the Unseen: Compositional World Models for Visual Planning',
    authors: 'Emma Liu, Noah Wilson et al.',
    topic: 'World Models',
    quality: 96,
    interest: 67,
    votes: 312,
    comments: 42,
    summary:
      '通过组合已有视觉概念，推演未见场景中的行动结果，探索视觉规划的新路径。',
    method: '将场景表示拆为对象及关系，并在潜空间中模拟行动对状态的影响。',
    result: '示例观察：组合表征在未见布局上的泛化优于整体场景记忆。',
    limit: '对象识别错误会传播到规划结果，动态场景仍是挑战。',
    reason: '跨领域探索：世界模型可能为你研究的长程 Agent 提供新视角',
  },
];
export default function Home() {
  const [view, setView] = useState('feed');
  const [topic, setTopic] = useState('全部');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [votes, setVotes] = useState<string[]>([]);
  const [selected, setSelected] = useState<Paper | null>(null);
  const [detail, setDetail] = useState('notes');
  const [tour, setTour] = useState(false);
  const [swipe, setSwipe] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, number>>({});
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const setMessage = (title: string) => toast.add({ title, type: 'success' });
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState<Record<string, string[]>>({});
  function save(id: string) {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function open(p: Paper, tab = 'notes') {
    setSelected(p);
    setDetail(tab);
    setDraft('');
  }
  function respond(value: number) {
    const p = papers[swipe];
    setFeedback((f) => ({ ...f, [p.id]: value }));
    setSwipe((s) => s + 1);
    setMessage(
      value > 0
        ? '已记录兴趣，相关主题在推荐中获得更高权重。'
        : '已记录负反馈，这篇论文将从为你推荐中隐藏。',
    );
  }
  function exportPaper(p: Paper, format: string) {
    const content =
      format === 'bib'
        ? `@misc{paperfeed_${p.id}_demo,\n  title = {${p.title}},\n  author = {${p.authors}},\n  note = {Fictional PaperFeed demonstration data, not a real publication}\n}`
        : `# ${p.title}\n\n> PaperFeed 虚构演示论文，非真实研究成果\n\n${p.authors}\n\n## TL;DR\n${p.summary}\n\n## 方法\n${p.method}\n\n## 局限\n${p.limit}\n\n## 我的讨论\n${(comments[p.id] || []).join('\n')}`;
    const url = URL.createObjectURL(
      new Blob([content], { type: 'text/plain;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `paperfeed-${p.id}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(
      `已导出 ${format === 'bib' ? 'BibTeX，可导入 Zotero' : 'Markdown，可放入 Obsidian'} 文件。`,
    );
  }
  const list = papers
    .filter(
      (p) =>
        (view !== 'library' || saved.includes(p.id)) &&
        (view !== 'feed' || feedback[p.id] !== -1) &&
        (topic === '全部' || p.topic === topic) &&
        `${p.title} ${p.topic} ${p.summary}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      view === 'trending'
        ? b.quality - a.quality
        : b.interest +
          (feedback[b.id] || 0) * 10 -
          (a.interest + (feedback[a.id] || 0) * 10),
    );
  function card(p: Paper) {
    return (
      <article className="paper" key={p.id}>
        <div className="paper-top">
          <span className="tag">{p.topic}</span>
          <span>RESEARCH PAPER</span>
          <span>· 演示样例</span>
        </div>
        <button className="paper-title" onClick={() => open(p)}>
          {p.title}
        </button>
        <p className="muted">{p.authors}</p>
        <p className="paper-summary">{p.summary}</p>
        <div className="signals">
          <span className="signal">
            <Sparkles size={13} /> 兴趣匹配{' '}
            {Math.min(99, p.interest + (feedback[p.id] || 0) * 3)}%
          </span>
          <span className="signal blue">社区质量 {p.quality}</span>
          <span className="tag">代码 · 作者解读</span>
        </div>
        <p className="reason">为什么推荐 · {p.reason}</p>
        <div className="paper-bottom">
          <div className="actions">
            <button
              className={`action ${votes.includes(p.id) ? 'selected' : ''}`}
              aria-label="赞同论文"
              onClick={() =>
                setVotes((s) =>
                  s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id],
                )
              }
            >
              <ArrowUp />
              {p.votes + (votes.includes(p.id) ? 1 : 0)}
            </button>
            <button className="action" onClick={() => open(p, 'discussion')}>
              <MessageCircle />
              {p.comments + (comments[p.id]?.length || 0)}
            </button>
            <button
              className={`action ${saved.includes(p.id) ? 'selected' : ''}`}
              onClick={() => save(p.id)}
            >
              <Bookmark fill={saved.includes(p.id) ? 'currentColor' : 'none'} />
              {saved.includes(p.id) ? '已收藏' : '收藏'}
            </button>
          </div>
          <button className="small-link" onClick={() => open(p)}>
            30 秒读懂 <ArrowUpRight size={15} style={{ display: 'inline' }} />
          </button>
        </div>
      </article>
    );
  }
  return (
    <>
      <header>
        <Link className="brand" href="/">
          <span className="brandmark">
            <Layers size={24} />
          </span>
          PaperFeed<span className="demo-label">PREVIEW</span>
        </Link>
        <div className="header-links">
          <label className="search">
            <Search size={16} />
            <input
              aria-label="搜索演示论文"
              placeholder="搜索论文、研究方向…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setView('feed');
              }}
            />
          </label>
          <button className="small-link" onClick={() => setTour(true)}>
            产品亮点 <ArrowUpRight size={14} style={{ display: 'inline' }} />
          </button>
          <div className="avatar" title="演示研究者">
            LC
          </div>
        </div>
      </header>
      <div className="layout">
        <main>
          <div className="intro">
            <div>
              <div className="eyebrow">YOUR DAILY RESEARCH, REIMAGINED</div>
              <h1>让好论文，主动找到你。</h1>
              <p>从一次发现，到下一个研究灵感。</p>
            </div>
            <button className="btn" onClick={() => setView('swipe')}>
              <Compass /> 刷一篇论文
            </button>
          </div>
          <section className="feature">
            <div>
              <div className="eyebrow">
                CURATED BY QUALITY. PERSONALIZED FOR YOU.
              </div>
              <h2>值得读，更值得你读。</h2>
              <p>
                连接社区的判断与你的研究兴趣，
                <br />
                发现那些你还不知道该如何搜索的论文。
              </p>
            </div>
            <div className="orbit" aria-label="Quality 乘 Interest">
              <span>Q × I</span>
              <small>为你而来</small>
            </div>
          </section>
          <Tabs
            value={view}
            onValueChange={(v) => {
              setView(String(v));
              setTopic('全部');
              setQuery('');
            }}
          >
            <TabsList variant="line" className="feed-tabs">
              <TabsTrigger value="feed">为你推荐</TabsTrigger>
              <TabsTrigger value="trending">社区精选</TabsTrigger>
              <TabsTrigger value="swipe">Paper Swipe</TabsTrigger>
              <TabsTrigger value="library">
                我的文库 <span className="count">{saved.length}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {view === 'swipe' ? (
            <div
              className="swipe-card"
              style={{ touchAction: 'pan-y' }}
              onTouchStart={(e) => {
                gesture.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                };
              }}
              onTouchEnd={(e) => {
                if (!gesture.current || swipe >= papers.length) return;
                const dx = e.changedTouches[0].clientX - gesture.current.x;
                const dy = e.changedTouches[0].clientY - gesture.current.y;
                gesture.current = null;
                if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5)
                  respond(dx > 0 ? 1 : -1);
              }}
            >
              <p className="muted">
                TEACH MY FEED · {Math.min(swipe + 1, 4)} / 4 · 左滑不感兴趣 ·
                右滑感兴趣 · 也可点击下方按钮
              </p>
              {swipe < papers.length ? (
                <>
                  {card(papers[swipe])}
                  <div className="swipe-actions">
                    <button className="btn" onClick={() => respond(-1)}>
                      <X />
                      不感兴趣
                    </button>
                    <button
                      className="btn"
                      onClick={() => setSwipe((s) => s + 1)}
                    >
                      跳过
                    </button>
                    <button className="btn primary" onClick={() => respond(1)}>
                      <Check />
                      感兴趣
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty">
                  <Sparkles style={{ margin: '0 auto 16px' }} />
                  <h2>你的 Feed，开始了解你了。</h2>
                  <p className="muted">
                    已记录 {Object.keys(feedback).length} 次偏好，返回查看变化。
                  </p>
                  <button
                    className="btn primary reset"
                    onClick={() => setView('feed')}
                  >
                    查看我的推荐 <ArrowRight />
                  </button>
                  <button className="btn reset" onClick={() => setSwipe(0)}>
                    再刷一轮
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="chips">
                {[
                  '全部',
                  'Agent Memory',
                  'Agent Harness',
                  'Test-Time Learning',
                  'World Models',
                ].map((t) => (
                  <button
                    key={t}
                    className={`chip ${topic === t ? 'active' : ''}`}
                    onClick={() => setTopic(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {view === 'trending' && (
                <p className="muted" style={{ marginBottom: 16 }}>
                  按社区质量排序 · 演示评分综合资源完整度、讨论及研究者反馈
                </p>
              )}
              {view === 'library' && (
                <p className="muted" style={{ marginBottom: 16 }}>
                  你的知识，随时带走。打开论文即可导出 Markdown 或 BibTeX。
                </p>
              )}
              {list.length ? (
                list.map(card)
              ) : (
                <div className="empty">
                  <Bookmark style={{ margin: '0 auto 15px' }} />
                  <h2>
                    {view === 'library'
                      ? '把下一篇灵感，留在这里。'
                      : '暂时没有匹配的论文'}
                  </h2>
                  <p className="muted">
                    {view === 'library'
                      ? '在推荐中收藏论文，它就会出现在你的文库。'
                      : '试试其他主题，或清空搜索和偏好。'}
                  </p>
                  <button
                    className="btn reset"
                    onClick={() => {
                      setView('feed');
                      setTopic('全部');
                      setQuery('');
                      setFeedback({});
                    }}
                  >
                    回到全部推荐
                  </button>
                </div>
              )}
            </>
          )}
        </main>
        <aside className="rail">
          <section className="rail-card">
            <h3>
              你的研究雷达{' '}
              <Sparkles
                size={16}
                style={{ float: 'right', color: '#148372' }}
              />
            </h3>
            <p>当前项目：构建会持续学习的 Agent</p>
            {[
              ['Agent Memory', 88],
              ['Agent Harness', 74],
              ['Continual Learning', 61],
            ].map(([t, n]) => (
              <div key={t}>
                <div className="interest">
                  <span>{t}</span>
                  <span>
                    {Math.min(
                      99,
                      Number(n) +
                        Object.values(feedback).filter((v) => v > 0).length * 3,
                    )}
                    %
                  </span>
                </div>
                <div className="bar">
                  <span
                    style={{
                      width: `${Math.min(99, Number(n) + Object.values(feedback).filter((v) => v > 0).length * 3)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <p style={{ marginTop: 18 }}>用兴趣反馈，探索你的下一个方向。</p>
            <button
              className="btn full"
              style={{ marginTop: 14 }}
              onClick={() => setView('swipe')}
            >
              训练我的 Feed <ArrowRight />
            </button>
          </section>
          <section className="rail-card">
            <h3>正在发生的研究</h3>
            {['Agent Memory', 'Test-Time Learning', 'World Models'].map(
              (t, i) => (
                <button
                  className="topics-row full"
                  style={{ textAlign: 'left', background: 'none', border: 0 }}
                  key={t}
                  onClick={() => {
                    setView('feed');
                    setTopic(t);
                  }}
                >
                  <b>0{i + 1}</b>
                  <span>
                    <strong>{t}</strong>
                    <small>
                      {
                        [
                          '从上下文，走向长期记忆',
                          '推理也是学习的时刻',
                          '为 Agent 理解世界',
                        ][i]
                      }
                    </small>
                  </span>
                </button>
              ),
            )}
          </section>
          <section className="rail-card" style={{ background: '#eaf4ef' }}>
            <div className="eyebrow">BUILT FOR YOUR WORKFLOW</div>
            <h3 style={{ margin: '12px 0' }}>
              发现留在这里。
              <br />
              知识跟你走。
            </h3>
            <p>
              Markdown → Obsidian
              <br />
              BibTeX → Zotero
            </p>
            <button
              className="small-link"
              style={{ marginTop: 14 }}
              onClick={() => {
                setView('library');
                setTopic('全部');
              }}
            >
              打开我的文库 ↗
            </button>
          </section>
          <p className="rail-foot">
            概念演示 v0.1 ·
            全部论文、人物、评分与讨论均为虚构样例。交互仅保留在当前页面，未连接推荐模型或外部账户。
          </p>
          <button
            className="small-link reset"
            onClick={() => {
              setSaved([]);
              setVotes([]);
              setFeedback({});
              setComments({});
              setSwipe(0);
              setView('feed');
              setTopic('全部');
              setQuery('');
              setMessage('已重置，可从头演示。');
            }}
          >
            <RotateCcw size={13} style={{ display: 'inline' }} /> 重置演示
          </button>
        </aside>
      </div>
      <Toaster />

      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
      >
        <DialogContent className="details">
          {selected && (
            <>
              <div className="eyebrow">PAPER AS A POST · 演示论文</div>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>
                {selected.authors} · 虚构研究内容，仅用于演示产品体验
              </DialogDescription>
              <div className="signals">
                <span className="signal">兴趣匹配 {selected.interest}%</span>
                <span className="signal blue">质量 {selected.quality}</span>
                <button
                  className="small-link"
                  onClick={() => save(selected.id)}
                >
                  {saved.includes(selected.id) ? '✓ 已加入文库' : '+ 加入文库'}
                </button>
              </div>
              <Tabs value={detail} onValueChange={(v) => setDetail(String(v))}>
                <TabsList className="detail-tabs">
                  <TabsTrigger value="notes">快速理解</TabsTrigger>
                  <TabsTrigger value="discussion">学术讨论</TabsTrigger>
                  <TabsTrigger value="resources">资源与导出</TabsTrigger>
                </TabsList>
              </Tabs>
              {detail === 'notes' ? (
                <>
                  <div className="note">
                    <div className="eyebrow">30 秒 · 核心观点</div>
                    <p style={{ marginTop: 10 }}>{selected.summary}</p>
                  </div>
                  <h3>01 / 这篇论文如何解决问题？</h3>
                  <p>{selected.method}</p>
                  <div className="flow-diagram" aria-label="研究理解流程">
                    <span>问题与输入</span>
                    <ArrowRight size={16} />
                    <span>{selected.topic}</span>
                    <ArrowRight size={16} />
                    <span>评估与反馈</span>
                  </div>
                  <h3>02 / 结果告诉我们什么？</h3>
                  <p>{selected.result}</p>
                  <h3>03 / 值得留意的局限</h3>
                  <p>{selected.limit}</p>
                  <p className="muted" style={{ marginTop: 20 }}>
                    阅读建议：先看方法，再看消融实验，最后检查适用边界。以上为预写演示笔记，未调用
                    AI。
                  </p>
                  <button
                    className="btn primary"
                    style={{ marginTop: 20 }}
                    onClick={() => setDetail('discussion')}
                  >
                    带着问题，加入讨论 <MessageCircle />
                  </button>
                </>
              ) : detail === 'discussion' ? (
                <>
                  <p className="muted">
                    让一次 Poster 交流，成为持续积累的社区知识。
                  </p>
                  <div className="comment">
                    <strong>研究者 · 示例提问</strong>
                    <span className="tag" style={{ marginLeft: 8 }}>
                      方法讨论
                    </span>
                    <p>
                      这个方法在环境发生变化后，还能保持稳定吗？有没有适用边界？
                    </p>
                  </div>
                  <div className="comment">
                    <strong>Lin · 示例作者</strong>
                    <span className="author-badge">作者回复 · 演示</span>
                    <p>
                      {selected.limit}{' '}
                      我们建议先用小规模任务验证，再考虑迁移到新的环境。
                    </p>
                  </div>
                  {(comments[selected.id] || []).map((c, i) => (
                    <div className="comment" key={i}>
                      <strong>你 · 本地演示</strong>
                      <p>{c}</p>
                    </div>
                  ))}
                  <form
                    className="comment-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (draft.trim()) {
                        setComments((c) => ({
                          ...c,
                          [selected.id]: [
                            ...(c[selected.id] || []),
                            draft.trim(),
                          ],
                        }));
                        setDraft('');
                      }
                    }}
                  >
                    <textarea
                      aria-label="输入讨论内容"
                      placeholder="提出一个问题，或分享你的复现发现…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={2000}
                    />
                    <button className="btn primary" disabled={!draft.trim()}>
                      添加本地讨论 <ArrowRight />
                    </button>
                    <p className="muted">仅在本页演示，不会发送给真实作者。</p>
                  </form>
                </>
              ) : (
                <>
                  <h3>开放研究工作流</h3>
                  <p>把论文信息、阅读笔记和你的讨论带回常用工具。</p>
                  <div className="export-options">
                    <button
                      className="btn primary"
                      onClick={() => exportPaper(selected, 'md')}
                    >
                      <Download />
                      Markdown / Obsidian
                    </button>
                    <button
                      className="btn"
                      onClick={() => exportPaper(selected, 'bib')}
                    >
                      <Download />
                      BibTeX / Zotero
                    </button>
                  </div>
                  <h3>作者资源中心</h3>
                  <p>
                    产品设计将统一收录
                    PDF、代码、数据集、演讲和后续版本。当前论文为虚构样例，因此不提供伪造的原文或代码链接。
                  </p>
                  <div className="note" style={{ marginTop: 20 }}>
                    <p>
                      下一阶段：作者认领与身份核验、真实论文接入、API / MCP /
                      CLI，以及账户同步。
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={tour} onOpenChange={setTour}>
        <DialogContent className="details">
          <div className="eyebrow">THE FEED FOR RESEARCH</div>
          <DialogTitle>从论文入口，到研究关系网络。</DialogTitle>
          <DialogDescription>
            用一条连续体验，连接发现、理解、讨论与知识沉淀。
          </DialogDescription>
          <div className="tour-grid">
            {[
              [
                '01 / DISCOVER',
                '质量 × 兴趣',
                '将社区判断与个人相关性分开呈现。切换「为你推荐」和「社区精选」，看到同一批论文的不同顺序。',
              ],
              [
                '02 / LEARN',
                '每一次选择，改善下一次发现',
                'Paper Swipe 同时收集正、负反馈。演示中，负反馈隐藏论文，正反馈提升排序。',
              ],
              [
                '03 / DISCUSS',
                '把 Poster Session 留下来',
                '论文拥有自己的讨论、作者回复与资源页。交流围绕论文持续积累，形成可复用的社区知识。',
              ],
              [
                '04 / OWN',
                '知识属于研究者',
                '把笔记和讨论导出到 Markdown 或 BibTeX，让发现自然进入现有研究工作流。',
              ],
            ].map(([n, t, d]) => (
              <section className="tour-item" key={n}>
                <b>{n}</b>
                <h3>{t}</h3>
                <p>{d}</p>
              </section>
            ))}
          </div>
          <div className="note">
            <p>
              <strong>价值飞轮：</strong>推荐 → 阅读与反馈 → 兴趣理解 →
              高质量讨论 → 知识沉淀 → 更好的推荐。
            </p>
          </div>
          <p className="muted">
            建议演示顺序：推荐差异 → 刷论文 → 快速理解 → 作者讨论 →
            收藏导出。当前版本验证体验与价值叙事；真实推荐效果、社区增长和商业模式仍待验证。
          </p>
          <button className="btn primary" onClick={() => setTour(false)}>
            开始体验 <ArrowRight />
          </button>
        </DialogContent>
      </Dialog>
      <footer
        className="rail-foot"
        style={{ textAlign: 'center', padding: 20 }}
      >
        PaperFeed · 概念演示，所有论文及社区数据均为虚构样例。
      </footer>
    </>
  );
}
