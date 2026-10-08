'use client';
import { StorageStatus } from './storage-status';
import { Community, CommunityRecords, Nearby, Replies } from './community';
import { DeepArticle } from './deep-read';
import { ResearchPlayer, clips } from './research-player';
import { InterestPicker } from './interest-picker';
import { deepReads } from '@/lib/deep-reads';
import { useRef, useState, type ReactNode } from 'react';
import Link from './native-link';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Bookmark,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Download,
  FileText,
  Folder,
  Heart,
  Layers,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Target,
  X,
  RotateCcw,
  CheckCheck,
  Send,
  Lightbulb,
  NotebookPen,
  Globe,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Toaster, toast } from '@/components/ui/toast';
import {
  papers,
  topics,
  threads,
  collections,
  source,
  type Paper,
} from '@/lib/papers';
import { useDemo, toggle, updateDemo, resetDemo } from '@/lib/demo-store';
import {
  recommendationReason,
  knowledgeExport,
  relevance,
  rankPapers,
  bibtex,
  markdown,
  download,
} from '@/lib/research';
const nav = [
  { href: '/', label: '发现论文', icon: Compass },
  { href: '/explore', label: '探索主题', icon: Globe },
  { href: '/swipe', label: '刷一篇', icon: Layers },
  { href: '/discussions', label: '学术讨论', icon: MessageCircle },
  { href: '/library', label: '我的文库', icon: Bookmark },
];
const tell = (title: string) => toast.add({ title, type: 'success' });
function Avatar({
  name = '林',
  color = 'orange',
  large = false,
}: {
  name?: string;
  color?: string;
  large?: boolean;
}) {
  return (
    <span className={`avatar ${color} ${large ? 'large' : ''}`}>{name}</span>
  );
}
export function Diagram({ p, large = false }: { p: Paper; large?: boolean }) {
  return (
    <figure
      className={`diagram ${p.color} ${large ? 'diagram-large' : ''}`}
      aria-label={`${p.name} 方法概念示意，非论文原图`}
    >
      <div className="diagram-label">
        {p.name.toUpperCase()} <span>METHOD MAP</span>
      </div>
      <div className="diagram-flow">
        {p.steps.map((step, i) => (
          <div className="diagram-step" key={step}>
            <span>{step}</span>
            {i < 3 && <ArrowRight size={14} />}
          </div>
        ))}
      </div>
      <div className="diagram-loop">
        <span /> 反馈连接下一步 <span />
      </div>
      <figcaption>方法示意 · PaperFeed 整理</figcaption>
    </figure>
  );
}
function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="btn">
      {children}
      <ArrowUpRight size={15} />
    </a>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <BookOpen size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
      <Link className="btn primary" href="/">
        去发现论文 <ArrowRight size={16} />
      </Link>
    </div>
  );
}
function PaperCard({ p, compact = false }: { p: Paper; compact?: boolean }) {
  const s = useDemo();
  return (
    <article className={`paper-card ${compact ? 'compact' : ''}`}>
      <div className="paper-card-body">
        <div className="meta">
          <Link
            href={`/topic/${encodeURIComponent(p.topic)}`}
            className={`tag ${p.color}`}
          >
            {p.topic}
          </Link>
          <span>{p.date.slice(0, 7).replace('-', ' · ')}</span>
          <span>
            {p.publisher || 'arXiv'} · {p.kind || '论文'}
          </span>
        </div>
        <Link className="paper-title" href={`/paper/${p.id}`}>
          {p.title}
        </Link>
        <p className="authors">
          {p.authors.slice(0, 2).join(', ')}
          {p.authors.length > 2 ? ' 等' : ''}
        </p>
        <p className="summary">{p.summary}</p>
        <div className="card-reason">
          <Target size={14} />
          {recommendationReason(p, s)}
          <small>演示</small>
        </div>
        <div className="paper-actions">
          <button
            className={`action vote ${s.votes.includes(p.id) ? 'selected' : ''}`}
            onClick={() => toggle('votes', p.id)}
            aria-label={`赞同 ${p.name}`}
            aria-pressed={s.votes.includes(p.id)}
          >
            <ArrowUp />
            {p.votes + (s.votes.includes(p.id) ? 1 : 0)}
          </button>
          <Link className="action" href={`/paper/${p.id}?tab=discussion`}>
            <MessageCircle />
            讨论
          </Link>
          <button
            className={`action ${s.saved.includes(p.id) ? 'selected' : ''}`}
            onClick={() => {
              toggle('saved', p.id);
              tell(s.saved.includes(p.id) ? '已移出文库' : '已保存到我的文库');
            }}
            aria-pressed={s.saved.includes(p.id)}
          >
            <Bookmark fill={s.saved.includes(p.id) ? 'currentColor' : 'none'} />
            {s.saved.includes(p.id) ? '已收藏' : '收藏'}
          </button>
          <Link className="read-link" href={`/paper/${p.id}`}>
            阅读导览 <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      {!compact && (
        <Link
          href={`/paper/${p.id}`}
          className="paper-figure"
          aria-label={`打开 ${p.name}`}
        >
          <Diagram p={p} />
        </Link>
      )}
    </article>
  );
}
function RightRail() {
  const s = useDemo();
  return (
    <aside className="right-rail">
      <section className="rail-section">
        <div className="section-label">
          你的研究方向{' '}
          <Link href="/profile">
            <Settings2 size={16} />
          </Link>
        </div>
        <p className="rail-sub">Agent 的记忆、工具与长期学习</p>
        <div className="topic-pills">
          {s.following.map((t) => (
            <Link key={t} href={`/topic/${encodeURIComponent(t)}`}>
              {t}
            </Link>
          ))}
        </div>
        <Link className="text-link" href="/explore">
          发现更多方向 <ArrowRight size={14} />
        </Link>
      </section>
      <section className="rail-section">
        <div className="section-label">
          继续上次的阅读 <BookOpen size={16} />
        </div>
        <Link href="/paper/2310.08560" className="continue-card">
          <span className="tag blue">MEMORY</span>
          <h3>MemGPT</h3>
          <p>把长期记忆，交给一个调度器。</p>
          <span className="text-link">
            打开阅读导览 <ArrowRight size={14} />
          </span>
        </Link>
      </section>
      <section className="rail-section">
        <div className="section-label">
          值得加入的讨论 <MessageCircle size={16} />
        </div>
        {threads.slice(0, 3).map((t) => (
          <Link
            className="rail-thread"
            href={`/paper/${t.paper}?tab=discussion`}
            key={t.id}
          >
            <span className="tiny">
              {t.kind} · {papers.find((p) => p.id === t.paper)?.name}
            </span>
            <h4>{t.title}</h4>
            <span className="tiny">
              {t.person} · {t.replies} 条示例回复
            </span>
          </Link>
        ))}
      </section>
      <section className="mini-collection">
        <span className="eyebrow">READING LIST / 01</span>
        <h3>
          Agent 如何
          <br />
          从经验中学习？
        </h3>
        <p>
          从 ReAct 到 Reflexion，
          <br />
          再到 MemGPT 与 Voyager。
        </p>
        <Link href="/topic/Agent%20Memory" className="text-link">
          开始这条阅读线索 <ArrowUpRight size={15} />
        </Link>
      </section>
      <p className="footnote">
        真实论文精选 · 非实时信息流
        <br />
        社区与推荐分数为演示数据
        <br />
        你的操作保存在演示研究空间
      </p>
    </aside>
  );
}
export default function Experience({
  route = '/',
  paperId,
  topicName,
  initialTab = 'overview',
  searchQuery = '',
}: {
  route?: string;
  paperId?: string;
  topicName?: string;
  initialTab?: string;
  searchQuery?: string;
}) {
  const s = useDemo();
  const [search, setSearch] = useState('');
  const [about, setAbout] = useState(false);
  const active = nav.find((n) => n.href === route);
  return (
    <SidebarProvider
      style={{ '--sidebar-width': '226px' } as React.CSSProperties}
    >
      <Sidebar className="app-sidebar">
        <SidebarHeader>
          <Link href="/" className="brand">
            <span className="brand-icon">
              <Layers size={22} />
            </span>
            paperfeed<span className="brand-dot">.</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <p className="nav-caption">你的研究空间</p>
          <SidebarMenu>
            {nav.map((n) => (
              <SidebarMenuItem key={n.href}>
                <SidebarMenuButton
                  isActive={route === n.href}
                  render={<Link href={n.href} />}
                  className="nav-item"
                >
                  <n.icon size={19} />
                  <span>{n.label}</span>
                  {n.href === '/library' && <small>{s.saved.length}</small>}
                  {n.href === '/swipe' && (
                    <span className="new-label">NEW</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="nav-divider" />
          <p className="nav-caption">
            关注的主题{' '}
            <Link href="/explore" aria-label="添加关注主题">
              <Plus size={14} />
            </Link>
          </p>
          {s.following.map((t) => (
            <Link
              key={t}
              className="nav-topic"
              href={`/topic/${encodeURIComponent(t)}`}
            >
              <i
                className={topics.find((x) => x.name === t)?.color || 'orange'}
              />
              {t}
              <span>{papers.filter((p) => p.topic === t).length}</span>
            </Link>
          ))}
          <div className="side-note">
            <div className="tiny">一个小习惯</div>
            <h4>
              留 5 分钟，
              <br />
              给新的研究思路。
            </h4>
            <Link href="/swipe">
              今天先读一篇 <ArrowUpRight size={14} />
            </Link>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <button className="about-button" onClick={() => setAbout(true)}>
            <Lightbulb size={17} /> 关于这个 Demo
          </button>
          <Link href="/profile" className="profile-link">
            <Avatar name="LC" />
            <span>
              <strong>Lin Chen</strong>
              <small>我的研究主页</small>
            </span>
            <ChevronRight size={16} />
          </Link>
        </SidebarFooter>
      </Sidebar>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <SidebarTrigger className="mobile-trigger" />
            {paperId
              ? '论文 / 阅读空间'
              : topicName
                ? '探索 / ' + topicName
                : active?.label || '研究者主页'}
          </div>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.assign('/?q=' + encodeURIComponent(search));
            }}
          >
            <Search size={17} />
            <input
              aria-label="搜索论文、作者和主题"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索论文、主题…"
            />
            <kbd>↵</kbd>
          </form>
          <span className="demo-pill">
            <i /> DEMO v0.3
          </span>
          <Link href="/profile" aria-label="我的主页">
            <Avatar name="LC" />
          </Link>
        </header>
        <div className={`workspace ${paperId ? 'reading-workspace' : ''}`}>
          <StorageStatus />
          {paperId ? (
            <PaperPage id={paperId} initialTab={initialTab} />
          ) : topicName ? (
            <TopicPage name={topicName} />
          ) : route === '/explore' ? (
            <Explore />
          ) : route === '/discussions' ? (
            <Discussions />
          ) : route === '/library' ? (
            <Library />
          ) : route === '/swipe' ? (
            <Swipe />
          ) : route === '/profile' ? (
            <Profile />
          ) : (
            <Feed initialQuery={searchQuery} />
          )}
        </div>
        <footer className="page-footer">
          PaperFeed · 发现、交流、带走知识。
          <span>论文来自公开资料 · 社区与推荐为演示</span>
        </footer>
      </div>
      <Toaster />
      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent className="about-dialog">
          <span className="eyebrow">RESEARCH DISCOVERY & DISCUSSION</span>
          <DialogTitle>论文之间，还有人的连接。</DialogTitle>
          <DialogDescription>
            PaperFeed 把发现、理解、讨论和知识沉淀放进同一个研究工作流。
          </DialogDescription>
          <div className="about-grid">
            {[
              [
                '找到适合你的',
                '质量和兴趣分开展示。主题关注、收藏与正负反馈会改变推荐排序。',
              ],
              [
                '让讨论留得住',
                '论文有独立讨论空间，可添加问题、回应与阅读笔记。',
              ],
              [
                '把知识带回去',
                '文库支持阅读状态、分组、Markdown 和 BibTeX 导出。',
              ],
            ].map(([a, b]) => (
              <section key={a}>
                <h3>{a}</h3>
                <p>{b}</p>
              </section>
            ))}
          </div>
          <p className="footnote">
            十二条研究内容保留核验来源，三篇提供深入图文和配音分镜。原文报告、编辑例子和建议分别标注。社区人物与历史互动为示例，新增操作写入个人演示空间。推荐采用规则，未接入实时采集、作者认证或真实社交消息。
          </p>
          <Link
            className="btn primary"
            href="/swipe"
            onClick={() => setAbout(false)}
          >
            从一次发现开始 <ArrowRight size={16} />
          </Link>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
function Feed({ initialQuery }: { initialQuery: string }) {
  const s = useDemo();
  const [mode, setMode] = useState('personal');
  const [topic, setTopic] = useState('全部');
  const [query, setQuery] = useState(initialQuery);
  const search = query;
  const [contentType, setContentType] = useState('全部类型');
  const list = rankPapers(s, mode, topic, search).filter(
    (p) => contentType === '全部类型' || (p.kind || '论文') === contentType,
  );
  return (
    <div className="content-columns">
      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">THE RESEARCH EDIT · 精选阅读</p>
            <h1>今天，读点有意思的。</h1>
            <p>沿着你的兴趣，也看看意料之外的方向。</p>
          </div>
          <Link className="btn" href="/swipe">
            <Layers size={16} />
            刷一篇
          </Link>
        </div>
        <div className="interest-toolbar">
          <InterestPicker />
          <span className="tiny">精选研究样本 · 非实时资讯流</span>
        </div>
        <section className="editor-pick">
          <div>
            <div className="editor-kicker">
              <span>本期阅读线索</span>
              <small>01 — AGENT MEMORY</small>
            </div>
            <h2>
              Agent 不缺上下文，
              <br />
              它需要可用的经验。
            </h2>
            <p>
              从一次行动，到一次反思，再到长期记忆。
              <br />
              用三篇论文，串起这条研究路径。
            </p>
            <div className="editor-bottom">
              <Link href="/topic/Agent%20Memory">
                进入专题 <ArrowRight size={16} />
              </Link>
              <span>3 篇关联阅读 · 约 15 分钟导览</span>
            </div>
          </div>
          <div className="reading-path">
            <span>
              ReAct <small>行动</small>
            </span>
            <i />
            <span>
              Reflexion <small>反思</small>
            </span>
            <i />
            <span>
              MemGPT <small>记忆</small>
            </span>
          </div>
        </section>
        <Tabs value={mode} onValueChange={(v) => setMode(String(v))}>
          <TabsList variant="line" className="feed-tabs">
            <TabsTrigger value="personal">为你推荐</TabsTrigger>
            <TabsTrigger value="quality">前沿热点</TabsTrigger>
            <TabsTrigger value="following">关注动态</TabsTrigger>
            <TabsTrigger value="recent">按发表时间</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="filter-row">
          <div className="chips">
            {['全部', ...topics.map((t) => t.name)].map((t) => (
              <button
                aria-pressed={topic === t}
                onClick={() => setTopic(t)}
                key={t}
                className={`chip ${topic === t ? 'active' : ''}`}
              >
                {t === '全部' ? '全部方向' : t}
              </button>
            ))}
          </div>
          <label className="content-type">
            内容类型{' '}
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              {['全部类型', '论文', '研究博客', '技术报告', '项目发布'].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </label>
          <span className="tiny">{list.length} 条内容</span>
        </div>
        {search && (
          <div className="search-results">
            搜索“{search}”
            <button
              onClick={() => {
                setQuery('');
                window.location.replace('/');
              }}
            >
              <X size={14} />
              清除
            </button>
          </div>
        )}

        {list.map((p) => (
          <PaperCard p={p} key={p.id} />
        ))}
        {!list.length && (
          <Empty
            title="没有找到这篇论文"
            text="试试论文简称或研究方向，例如 MemGPT、Agent。"
          />
        )}
        <div className="feed-end">
          本期精选已看完 <span>·</span>{' '}
          <Link href="/explore">再找一个新方向 ↗</Link>
        </div>
      </main>
      <RightRail />
    </div>
  );
}
function Explore() {
  const s = useDemo();
  const [q, setQ] = useState('');
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EXPLORE</p>
          <h1>你的下一个研究方向</h1>
          <p>从一个问题出发，找到相关的论文和讨论。</p>
        </div>
        <label className="inline-search">
          <Search size={17} />
          <input
            aria-label="搜索研究方向"
            placeholder="查找研究方向"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>
      <div className="topic-grid">
        {topics
          .filter((t) =>
            `${t.name} ${t.desc}`.toLowerCase().includes(q.toLowerCase()),
          )
          .map((t, i) => (
            <article className={`topic-card ${t.color}`} key={t.name}>
              <div className="topic-card-top">
                <span className="topic-number">0{i + 1}</span>
                <button
                  className={`btn ${s.following.includes(t.name) ? 'following' : ''}`}
                  onClick={() => toggle('following', t.name)}
                >
                  {s.following.includes(t.name) ? (
                    <Check size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  {s.following.includes(t.name) ? '已关注' : '关注'}
                </button>
              </div>
              <Link href={`/topic/${encodeURIComponent(t.name)}`}>
                <h2>{t.name}</h2>
                <p>{t.desc}</p>
                <div className="topic-question">{t.prompt}</div>
                <div className="topic-footer">
                  {papers.filter((p) => p.topic === t.name).length} 篇精选论文{' '}
                  <ArrowUpRight size={18} />
                </div>
              </Link>
            </article>
          ))}
      </div>
      {!topics.some((t) =>
        `${t.name} ${t.desc}`.toLowerCase().includes(q.toLowerCase()),
      ) && (
        <Empty title="还没有这个方向" text="试试 Memory、Agent 或 Learning。" />
      )}
      <section className="reading-trail">
        <div>
          <p className="eyebrow">CONNECT THE DOTS</p>
          <h2>不按热度，按问题阅读。</h2>
          <p>
            “怎样让 Agent 从经验中学习？”
            <br />
            这个问题连接了系统设计、记忆管理和持续学习。
          </p>
        </div>
        <ol>
          {[papers[2], papers[0], papers[1], papers[3]].map((p, i) => (
            <li key={p.id}>
              <span>0{i + 1}</span>
              <Link href={`/paper/${p.id}`}>
                <strong>{p.name}</strong>
                <small>{p.steps.join(' → ')}</small>
              </Link>
              <ArrowUpRight size={17} />
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
function TopicPage({ name }: { name: string }) {
  const s = useDemo();
  const t = topics.find((t) => t.name === name);
  if (!t)
    return (
      <Empty
        title="暂未收录这个主题"
        text="返回发现页，或者从探索页选择研究方向。"
      />
    );
  const list = papers.filter((p) => p.topic === name);
  return (
    <div className="content-columns">
      <main>
        <Link href="/explore" className="back-link">
          <ArrowLeft size={16} />
          全部主题
        </Link>
        <section className={`topic-hero ${t.color}`}>
          <p className="eyebrow">RESEARCH TOPIC</p>
          <h1>{name}</h1>
          <p>{t.desc}</p>
          <div className="topic-hero-footer">
            <span>
              {list.length} 篇精选 ·{' '}
              {threads.filter((x) => list.some((p) => p.id === x.paper)).length}{' '}
              个讨论话题
            </span>
            <button
              className="btn primary"
              onClick={() => toggle('following', name)}
            >
              {s.following.includes(name) ? (
                <Check size={16} />
              ) : (
                <Plus size={16} />
              )}
              {s.following.includes(name) ? '已关注这个方向' : '关注这个方向'}
            </button>
          </div>
        </section>
        <Community topic={name} />
        <h2 className="section-title">从这些论文开始</h2>
        {list.map((p) => (
          <PaperCard p={p} key={p.id} />
        ))}
        <h2 className="section-title">顺着线索继续读</h2>
        {papers
          .filter((p) => !list.includes(p))
          .slice(0, 2)
          .map((p) => (
            <PaperCard p={p} key={p.id} compact />
          ))}
      </main>
      <RightRail />
    </div>
  );
}
function PaperPage({ id, initialTab }: { id: string; initialTab: string }) {
  const p = papers.find((p) => p.id === id);
  const s = useDemo();
  const [tab, setTab] = useState(initialTab);
  const [note, setNote] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [kind, setKind] = useState('问题');
  const [exportOpen, setExportOpen] = useState(false);
  if (!p)
    return (
      <Empty title="没有找到这篇论文" text="请从精选论文中选择一篇开始阅读。" />
    );
  const related = threads.filter((t) => t.paper === p.id);
  const value = note ?? s.notes[p.id] ?? '';
  function exportFile(format: string) {
    download(
      format === 'bib' ? bibtex(p!) : markdown(p!, s),
      `${p!.name}.${format}`,
    );
    tell('文件已生成，包含原文来源');
    setExportOpen(false);
  }
  return (
    <>
      <Link href="/" className="back-link">
        <ArrowLeft size={16} />
        返回发现
      </Link>
      <div className="paper-layout">
        <main className="paper-reader">
          <div className="meta">
            <Link
              className={`tag ${p.color}`}
              href={`/topic/${encodeURIComponent(p.topic)}`}
            >
              {p.topic}
            </Link>
            <span>首次发表 {p.date}</span>
            <span>
              {p.publisher || `arXiv:${p.id}`} · {p.kind || '论文'}
            </span>
          </div>
          <h1 className="detail-title">{p.title}</h1>
          <p className="detail-authors">{p.authors.join(' · ')}</p>
          <div className="detail-actions">
            <External href={source(p)}>
              <FileText size={16} />
              查看原文
            </External>
            {p.project && <External href={p.project}>项目与代码</External>}
            <button
              className={`btn ${s.saved.includes(p.id) ? 'following' : ''}`}
              onClick={() => toggle('saved', p.id)}
            >
              <Bookmark size={16} />
              {s.saved.includes(p.id) ? '已在文库' : '收藏论文'}
            </button>
            <button className="btn" onClick={() => setExportOpen(true)}>
              <Download size={16} />
              导出
            </button>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
            <TabsList variant="line" className="feed-tabs">
              <TabsTrigger value="overview">快速解读</TabsTrigger>
              {deepReads[p.id] && (
                <TabsTrigger value="deep">深入图文</TabsTrigger>
              )}
              <TabsTrigger value="discussion">
                讨论{' '}
                <span className="count">
                  {related.length + (s.comments[p.id]?.length || 0)}
                </span>
              </TabsTrigger>
              <TabsTrigger value="notes">
                我的笔记{value && <span className="saved-dot" />}
              </TabsTrigger>
              <TabsTrigger value="resources">研究资源</TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === 'overview' ? (
            <>
              <div className="reading-summary">
                <div className="summary-heading">
                  <span>
                    <Sparkles size={16} />
                    先读这一段
                  </span>
                  <small>30 秒读懂亮点</small>
                </div>
                <p>{p.summary}</p>
              </div>
              <p className="source-note">
                基于{' '}
                <a href={source(p)} target="_blank" rel="noreferrer">
                  原始来源 ↗
                </a>{' '}
                整理 · 编辑导览，不是作者原话或实时 AI 回答
              </p>
              <Diagram p={p} large />
              <section className="reading-section">
                <span>01</span>
                <div>
                  <h2>它在解决什么问题？</h2>
                  <p>{p.problem}</p>
                </div>
              </section>
              <section className="reading-section">
                <span>02</span>
                <div>
                  <h2>核心方法</h2>
                  <p>{p.method}</p>
                </div>
              </section>
              <section className="reading-section">
                <span>03</span>
                <div>
                  <h2>原文报告的关键证据</h2>
                  <p>{p.result}</p>
                  <small>来源：上方原文；作者报告，不代表独立复现</small>
                </div>
              </section>
              <section className="reading-section">
                <span>04</span>
                <div>
                  <h2>与你的研究有什么关系？</h2>
                  <p>{p.take}</p>
                  <small>编辑解读，可作为讨论起点</small>
                </div>
              </section>
              <div className="reading-caution">
                <Lightbulb size={21} />
                <div>
                  <h3>阅读时留意</h3>
                  <p>{p.caution}</p>
                  <small>编辑建议</small>
                </div>
              </div>
              <div className="read-next">
                <button
                  className="btn primary"
                  onClick={() => toggle('read', p.id)}
                >
                  <CheckCheck size={17} />
                  {s.read.includes(p.id) ? '已读 · 点击撤销' : '标记已读'}
                </button>
                <button className="text-link" onClick={() => setTab('notes')}>
                  记下一个想法 <NotebookPen size={16} />
                </button>
              </div>
              <h2 className="section-title">带着一个问题继续</h2>
              <Link
                href={`/paper/${p.id}?tab=discussion`}
                onClick={(e) => {
                  e.preventDefault();
                  setTab('discussion');
                }}
                className="question-callout"
              >
                <MessageCircle size={21} />
                <span>{p.question}</span>
                <ArrowRight size={18} />
              </Link>
            </>
          ) : tab === 'deep' ? (
            <DeepArticle id={p.id} />
          ) : tab === 'discussion' ? (
            <>
              <div className="discussion-intro">
                <h2>一起把这篇论文读深一点。</h2>
                <p>问题、复现经验和下一步想法，都可以留在这里。</p>
                <span className="tiny">
                  以下社区人物和讨论均为演示；不代表论文作者发言。
                </span>
              </div>
              {related.map((t) => (
                <Thread key={t.id} thread={t} expanded />
              ))}
              {!related.length && (
                <div className="discussion-seed">
                  <Avatar name="编" color={p.color} />
                  <div>
                    <strong>阅读小组 · 示例话题</strong>
                    <h3>{p.question}</h3>
                    <p>{p.take}</p>
                  </div>
                </div>
              )}
              {(s.comments[p.id] || []).map((c, i) => (
                <div key={i} className="local-comment">
                  <Avatar name="LC" />
                  <div>
                    <strong>
                      Lin Chen <span>你 · 演示身份</span>
                    </strong>
                    <p>{c}</p>
                    <Replies id={`comment:${p.id}:${i}`} />
                  </div>
                </div>
              ))}
              <form
                className="compose"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!comment.trim()) return;
                  updateDemo((d) => ({
                    ...d,
                    comments: {
                      ...d.comments,
                      [p.id]: [
                        ...(d.comments[p.id] || []),
                        `[${kind}] ${comment.trim()}`,
                      ],
                    },
                  }));
                  setComment('');
                  tell('讨论已记录，保存状态见页面上方');
                }}
              >
                <h3>说说你的看法</h3>
                <Tabs value={kind} onValueChange={(v) => setKind(String(v))}>
                  <TabsList>
                    {['问题', '复现', '想法'].map((x) => (
                      <TabsTrigger value={x} key={x}>
                        {x}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <textarea
                  aria-label="讨论内容"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="具体的问题，常常是下一次研究的起点。"
                  maxLength={1800}
                />
                <div>
                  <small>保存在你的演示空间，不向示例人物发送。</small>
                  <button className="btn primary" disabled={!comment.trim()}>
                    <Send size={16} />
                    添加讨论
                  </button>
                </div>
              </form>
            </>
          ) : tab === 'notes' ? (
            <section className="notes-editor">
              <div className="section-title-row">
                <h2>留给未来的自己</h2>
                <span className="tiny">演示空间笔记</span>
              </div>
              <p>贡献、疑问，或者与你手头项目的连接。</p>
              <textarea
                value={value}
                aria-label="论文阅读笔记"
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：这个记忆机制能否用于我的工具 Agent？下一步先做一个小实验…"
                maxLength={20000}
              />
              <div className="read-next">
                <button
                  className="btn primary"
                  onClick={() => {
                    updateDemo((d) => ({
                      ...d,
                      notes: { ...d.notes, [p.id]: value },
                      saved: d.saved.includes(p.id)
                        ? d.saved
                        : [...d.saved, p.id],
                    }));
                    setNote(null);
                    tell('笔记已记录，保存状态见页面上方');
                  }}
                >
                  保存笔记 <Check size={16} />
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    download(
                      markdown(p, {
                        ...s,
                        notes: { ...s.notes, [p.id]: value },
                      }),
                      `${p.name}.md`,
                    );
                    tell('已导出笔记');
                  }}
                >
                  <Download size={16} />
                  导出 Markdown
                </button>
              </div>
            </section>
          ) : (
            <>
              <h2 className="section-title">原文与研究资源</h2>
              <a
                className="resource-row"
                href={source(p)}
                target="_blank"
                rel="noreferrer"
              >
                <FileText />
                <div>
                  <h3>{p.publisher || 'arXiv'} 原文</h3>
                  <p>查看原始研究、发表信息与完整材料</p>
                </div>
                <ArrowUpRight />
              </a>
              {p.project && (
                <a
                  className="resource-row"
                  href={p.project}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe />
                  <div>
                    <h3>研究项目主页</h3>
                    <p>访问作者提供的项目与相关资源</p>
                  </div>
                  <ArrowUpRight />
                </a>
              )}
              <div className="resource-row">
                <Download />
                <div>
                  <h3>带回你的工作流</h3>
                  <p>Markdown 用于 Obsidian；BibTeX 可导入 Zotero。</p>
                  <div className="detail-actions">
                    <button className="btn" onClick={() => exportFile('md')}>
                      Markdown
                    </button>
                    <button className="btn" onClick={() => exportFile('bib')}>
                      BibTeX
                    </button>
                  </div>
                </div>
              </div>
              <p className="source-note">
                资料核验：2026-09-08。资源链接来自论文元数据；未复制或托管论文
                PDF。
              </p>
            </>
          )}
        </main>
        <aside className="paper-side">
          <div className="match-card">
            <p className="eyebrow">WHY THIS PAPER</p>
            <div className="match-number">
              {relevance(p, s)}
              <span>%</span>
            </div>
            <h3>与你的兴趣相关</h3>
            <p>{p.reason}</p>
            <div className="match-quality">
              <span>社区质量信号</span>
              <strong>{p.quality} / 100</strong>
            </div>
            <small>分数为演示，不是研究质量的客观评判。</small>
          </div>
          <section className="rail-section">
            <h3 className="section-label">阅读安排</h3>
            <p className="rail-sub">给这篇论文留一个位置。</p>
            <button className="btn full" onClick={() => toggle('read', p.id)}>
              {s.read.includes(p.id) ? (
                <CheckCheck size={16} />
              ) : (
                <BookOpen size={16} />
              )}
              {s.read.includes(p.id) ? '已读，点击改为未读' : '标记为已读'}
            </button>
            <label className="folder-select">
              收进文库分组
              <select
                value={s.folders[p.id] || 'reading'}
                onChange={(e) => {
                  const folder = e.target.value;
                  updateDemo((d) => ({
                    ...d,
                    folders: { ...d.folders, [p.id]: folder },
                    saved: d.saved.includes(p.id)
                      ? d.saved
                      : [...d.saved, p.id],
                  }));
                  tell('已更新文库分组');
                }}
              >
                {collections.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="rail-section">
            <h3 className="section-label">相关论文</h3>
            {papers
              .filter((x) => x.id !== p.id)
              .sort(
                (a, b) =>
                  Number(b.topic === p.topic) - Number(a.topic === p.topic),
              )
              .slice(0, 3)
              .map((x) => (
                <Link
                  className="related-paper"
                  href={`/paper/${x.id}`}
                  key={x.id}
                >
                  <span className={`mini-mark ${x.color}`}>
                    {x.name.slice(0, 1)}
                  </span>
                  <div>
                    <strong>{x.name}</strong>
                    <small>{x.topic}</small>
                  </div>
                  <ArrowUpRight size={15} />
                </Link>
              ))}
          </section>
        </aside>
      </div>
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="export-dialog">
          <DialogTitle>把知识带回你的工作流</DialogTitle>
          <DialogDescription>
            {p.name} · 含原文链接与标准元数据
          </DialogDescription>
          <button
            className="btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${p.authors.join(', ')} (${p.date.slice(0, 4)}). ${p.title}. ${source(p)}`,
                );
                tell('引用已复制');
              } catch {
                toast.add({
                  title: '剪贴板不可用，请选中下方引用手动复制',
                  type: 'error',
                });
              }
            }}
          >
            复制引用
          </button>
          <textarea
            className="citation-text"
            aria-label="可手动复制的引用"
            readOnly
            value={`${p.authors.join(', ')} (${p.date.slice(0, 4)}). ${p.title}. ${source(p)}`}
          />
          <button className="export-choice" onClick={() => exportFile('md')}>
            <NotebookPen />
            <span>
              <strong>Markdown</strong>
              <small>深入解读 + 已保存笔记 + 讨论</small>
            </span>
            <Download />
          </button>
          <button className="export-choice" onClick={() => exportFile('bib')}>
            <FileText />
            <span>
              <strong>BibTeX</strong>
              <small>作者、标题、发表年份与原始来源</small>
            </span>
            <Download />
          </button>
          <p className="tiny">下载文件后可导入常用工具，无需连接外部账户。</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
function Thread({
  thread: t,
  expanded = false,
}: {
  thread: (typeof threads)[number];
  expanded?: boolean;
}) {
  const s = useDemo();
  const p = papers.find((x) => x.id === t.paper)!;
  return (
    <article className="thread-card">
      <div className="thread-person">
        <Avatar name={t.initials} color={t.color} />
        <div>
          <strong>{t.person}</strong>
          <small>{t.role} · 示例人物</small>
        </div>
        <span className={`tag ${t.color}`}>{t.kind}</span>
      </div>
      <Link href={`/paper/${t.paper}?tab=discussion`} className="thread-title">
        {t.title}
      </Link>
      <p>{t.text}</p>
      <Link className="thread-paper" href={`/paper/${t.paper}`}>
        <FileText size={15} />
        {p.name}
        <ArrowUpRight size={14} />
      </Link>
      {expanded && (
        <div className="thread-reply">
          <strong>
            {t.replyPerson} <span>示例回复</span>
          </strong>
          <p>{t.reply}</p>
        </div>
      )}
      <div className="thread-actions">
        <button
          className={`action ${s.threadVotes.includes(t.id) ? 'selected' : ''}`}
          onClick={() => toggle('threadVotes', t.id)}
        >
          <ArrowUp />
          {t.likes + (s.threadVotes.includes(t.id) ? 1 : 0)}
        </button>
        <Link className="action" href={`/paper/${t.paper}?tab=discussion`}>
          <MessageCircle />
          {t.replies} 条示例回复
        </Link>
        <button
          className="text-link"
          onClick={() => toggle('followThreads', t.id)}
        >
          {s.followThreads.includes(t.id) ? (
            <Check size={14} />
          ) : (
            <Plus size={14} />
          )}
          {s.followThreads.includes(t.id) ? '已关注讨论' : '关注讨论'}
        </button>
      </div>
      <Replies id={t.id} />
    </article>
  );
}
function Discussions() {
  const s = useDemo();
  const [kind, setKind] = useState('全部');
  return (
    <div className="content-columns">
      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">THE CONVERSATION CONTINUES</p>
            <h1>好问题，值得留在论文旁。</h1>
            <p>一起拆解方法，交换复现经验，也记录还没想通的地方。</p>
          </div>
        </div>
        <div className="community-strip">
          <div className="avatar-stack">
            <Avatar name="LY" />
            <Avatar name="CK" color="green" />
            <Avatar name="ZR" color="blue" />
          </div>
          <p>
            围绕论文的异步交流 <small>人物与内容为社区演示样例</small>
          </p>
        </div>
        <div className="chips">
          {topics.map((t) => (
            <Link
              key={t.name}
              className="chip"
              href={`/topic/${encodeURIComponent(t.name)}`}
            >
              {t.name} 社区 ↗
            </Link>
          ))}
        </div>
        {s.posts.map((p) => (
          <article key={p.id} className="community-post">
            <small>你 · {p.topic}</small>
            <h3>
              <Link href={`/topic/${encodeURIComponent(p.topic)}`}>
                {p.title} ↗
              </Link>
            </h3>
            <p>{p.text}</p>
            <Replies id={p.id} />
          </article>
        ))}
        <Tabs value={kind} onValueChange={(v) => setKind(String(v))}>
          <TabsList variant="line" className="feed-tabs">
            {['全部', '问题', '复现', '阅读笔记', '我关注的'].map((x) => (
              <TabsTrigger key={x} value={x}>
                {x}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {threads
          .filter(
            (t) =>
              kind === '全部' ||
              (kind === '我关注的'
                ? s.followThreads.includes(t.id)
                : t.kind === kind),
          )
          .map((t) => (
            <Thread key={t.id} thread={t} />
          ))}
        {kind === '我关注的' && !s.followThreads.length && (
          <Empty
            title="关注一个值得继续的问题"
            text="点击讨论下方的关注按钮，之后在这里继续阅读。"
          />
        )}
        <Nearby />
      </main>
      <RightRail />
    </div>
  );
}
function Library() {
  const s = useDemo();
  const [folder, setFolder] = useState('all');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const list = papers.filter(
    (p) =>
      s.saved.includes(p.id) &&
      (folder === 'all' || (s.folders[p.id] || 'reading') === folder) &&
      (status === 'all' ||
        (status === 'read' ? s.read.includes(p.id) : !s.read.includes(p.id))) &&
      `${p.title} ${s.notes[p.id] || ''}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR RESEARCH LIBRARY</p>
          <h1>读过的，想读的，想到的。</h1>
          <p>
            {s.saved.length} 篇收藏 ·{' '}
            {s.saved.filter((id) => s.read.includes(id)).length} 篇已读 ·{' '}
            {Object.values(s.notes).filter(Boolean).length} 份笔记{' '}
            <span className="local-label">研究空间保存</span>
          </p>
        </div>
        <button
          className="btn"
          disabled={!list.length}
          onClick={() => {
            download(
              list.map((p) => bibtex(p)).join('\n\n'),
              'paperfeed-library.bib',
            );
            tell(`已导出当前列表的 ${list.length} 篇论文`);
          }}
        >
          <Download size={16} />
          导出当前列表
        </button>
      </div>
      <div className="collection-grid">
        {[
          {
            id: 'all',
            name: '全部论文',
            desc: '每一条研究线索',
            color: 'gray',
          },
          ...collections,
        ].map((c) => (
          <button
            key={c.id}
            className={`collection-card ${c.color} ${folder === c.id ? 'active' : ''}`}
            onClick={() => setFolder(c.id)}
          >
            <Folder size={23} />
            <h3>{c.name}</h3>
            <p>{c.desc}</p>
            <span>
              {c.id === 'all'
                ? s.saved.length
                : s.saved.filter((id) => (s.folders[id] || 'reading') === c.id)
                    .length}{' '}
              篇 <ArrowUpRight size={16} />
            </span>
          </button>
        ))}
      </div>
      <div className="library-toolbar">
        <Tabs value={status} onValueChange={(v) => setStatus(String(v))}>
          <TabsList variant="line" className="feed-tabs">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="unread">待阅读</TabsTrigger>
            <TabsTrigger value="read">已读</TabsTrigger>
          </TabsList>
        </Tabs>
        <label className="inline-search">
          <Search size={16} />
          <input
            aria-label="搜索文库或笔记"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索文库或笔记"
          />
        </label>
      </div>
      {list.map((p) => (
        <article className="library-row" key={p.id}>
          <span className={`library-symbol ${p.color}`}>
            <FileText size={24} />
          </span>
          <div className="library-info">
            <div className="meta">
              <span>{p.topic}</span>
              <span>{p.date.slice(0, 4)}</span>
              {s.read.includes(p.id) && (
                <span className="read-badge">✓ 已读</span>
              )}
            </div>
            <Link href={`/paper/${p.id}`}>{p.title}</Link>
            {s.notes[p.id] && (
              <p>
                <NotebookPen size={14} />
                {s.notes[p.id]}
              </p>
            )}
          </div>
          <div className="library-row-actions">
            <button
              className="action"
              onClick={() => toggle('read', p.id)}
              aria-label={`切换 ${p.name} 阅读状态`}
            >
              <CheckCheck className={s.read.includes(p.id) ? 'selected' : ''} />
            </button>
            <Link
              className="action"
              href={`/paper/${p.id}?tab=notes`}
              aria-label={`编辑 ${p.name} 笔记`}
            >
              <NotebookPen />
            </Link>
            <button
              className="action"
              onClick={() => {
                download(markdown(p, s), `${p.name}.md`);
                tell('已导出 Markdown');
              }}
              aria-label={`导出 ${p.name}`}
            >
              <Download />
            </button>
            <button
              className="action"
              onClick={() => toggle('saved', p.id)}
              aria-label={`从文库移除 ${p.name}`}
            >
              <X />
            </button>
          </div>
        </article>
      ))}
      {!list.length && (
        <Empty
          title="这个位置，留给下一篇好论文。"
          text="试试其他分组，或从发现页收藏一篇。"
        />
      )}
      <p className="footnote" style={{ marginTop: 25 }}>
        收藏、笔记与分组保存在你的研究空间；数据库状态见页面上方。导出文件由你保管。
      </p>
    </>
  );
}
function Swipe() {
  const s = useDemo();
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<
    { index: number; id: string; previous: number | undefined }[]
  >([]);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const shortPapers = clips.map((c) => papers.find((p) => p.id === c.id)!);
  const p = shortPapers[index];
  function respond(v: number) {
    if (!p) return;
    setHistory((h) => [...h, { index, id: p.id, previous: s.feedback[p.id] }]);
    if (v !== 0)
      updateDemo((d) => ({ ...d, feedback: { ...d.feedback, [p.id]: v } }));
    setIndex((i) => i + 1);
    tell(
      v === 1
        ? `已增加 ${p.topic} 的推荐权重`
        : v === -1
          ? '已减少同方向权重，并隐藏这篇论文'
          : '已跳过，不改变推荐偏好',
    );
  }
  return (
    <div className="swipe-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">A LITTLE CURIOSITY, EVERY DAY</p>
          <h1>这篇，有没有让你想到什么？</h1>
          <p>不用读完再决定。先给一个直觉。</p>
        </div>
        <span className="swipe-counter">
          {Math.min(index + 1, shortPapers.length)}{' '}
          <small>/ {shortPapers.length}</small>
        </span>
      </div>
      <div className="swipe-progress">
        {shortPapers.map((x, i) => (
          <span
            key={x.id}
            className={i < index ? 'done' : i === index ? 'current' : ''}
          />
        ))}
      </div>
      {p ? (
        <>
          <div
            className="swipe-paper"
            style={{ touchAction: 'pan-y' }}
            tabIndex={0}
            aria-label="研究短内容，左右方向键切换"
            onKeyDown={(e) => {
              if ((e.target as HTMLElement).closest('input,button,a')) return;
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setIndex((i) =>
                  Math.max(
                    0,
                    Math.min(
                      shortPapers.length - 1,
                      i + (e.key === 'ArrowRight' ? 1 : -1),
                    ),
                  ),
                );
              }
            }}
            onTouchStart={(e) => {
              if ((e.target as HTMLElement).closest('input,button,a')) {
                touch.current = null;
                return;
              }
              touch.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
              };
            }}
            onTouchEnd={(e) => {
              if (!touch.current) return;
              const dx = e.changedTouches[0].clientX - touch.current.x;
              const dy = e.changedTouches[0].clientY - touch.current.y;
              touch.current = null;
              if (Math.abs(dy) > 100 && Math.abs(dy) > Math.abs(dx) * 1.5) {
                setIndex((i) =>
                  Math.max(
                    0,
                    Math.min(shortPapers.length - 1, i + (dy < 0 ? 1 : -1)),
                  ),
                );
                return;
              }
              if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5)
                respond(dx > 0 ? 1 : -1);
            }}
          >
            <div className="meta">
              <span className={`tag ${p.color}`}>{p.topic}</span>
              <span>{p.date.slice(0, 4)}</span>
              <span className="push-right">
                {Math.round(relevance(p, s))}% 兴趣匹配 · 演示
              </span>
            </div>
            <h2>{p.title}</h2>
            <p className="authors">{p.authors[0]} 等</p>
            <ResearchPlayer key={p.id} id={p.id} />
            <p className="swipe-summary">{p.summary}</p>
            <p className="source-note">
              <Target size={14} />
              {p.reason}
            </p>
            <Link className="text-link" href={`/paper/${p.id}`}>
              展开完整阅读 <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="swipe-controls">
            <button className="swipe-no" onClick={() => respond(-1)}>
              <X />
              不感兴趣
            </button>
            <button
              className="swipe-save"
              onClick={() => {
                toggle('saved', p.id);
                tell(s.saved.includes(p.id) ? '已取消收藏' : '已加入文库');
              }}
            >
              <Bookmark
                fill={s.saved.includes(p.id) ? 'currentColor' : 'none'}
              />
              {s.saved.includes(p.id) ? '已收藏' : '稍后读'}
            </button>
            <button className="swipe-yes" onClick={() => respond(1)}>
              <Heart />
              有意思
            </button>
          </div>
          <div className="swipe-extra">
            <button
              disabled={!history.length}
              onClick={() => {
                const last = history[history.length - 1];
                updateDemo((d) => {
                  const feedback = { ...d.feedback };
                  if (last.previous === undefined) delete feedback[last.id];
                  else feedback[last.id] = last.previous;
                  return { ...d, feedback };
                });
                setIndex(last.index);
                setHistory((h) => h.slice(0, -1));
                tell('已撤销上一次选择');
              }}
            >
              <RotateCcw size={14} />
              撤销
            </button>
            <span>左右滑表达兴趣 · 上下滑切换</span>
            <button
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              上一条
            </button>
            <button onClick={() => respond(0)}>
              跳过这篇 <ArrowRight size={14} />
            </button>
          </div>
        </>
      ) : (
        <div className="swipe-finish">
          <Check size={34} />
          <h2>今天的好奇心，已收好。</h2>
          <p>
            这些选择会调整你的研究空间中的推荐排序。
            <br />
            看看你的 Feed 有什么变化。
          </p>
          <Link className="btn primary" href="/">
            回到我的推荐 <ArrowRight size={16} />
          </Link>
          <button
            className="btn"
            onClick={() => {
              setIndex(0);
              setHistory([]);
            }}
          >
            再读一轮
          </button>
        </div>
      )}
    </div>
  );
}
function Profile() {
  const s = useDemo();
  const [reset, setReset] = useState(false);
  return (
    <>
      <section className="profile-cover">
        <span>RESEARCH IS A CONVERSATION.</span>
      </section>
      <div className="profile-heading">
        <Avatar name="LC" large />
        <div>
          <h1>
            Lin Chen <span>演示研究者</span>
          </h1>
          <p>关注 Agent 的长期记忆、工具使用与持续学习。</p>
          <div className="profile-meta">
            <Target size={14} />
            当前项目：让 Agent 从执行经验中学习
          </div>
        </div>
      </div>
      <div className="profile-stats">
        {[
          [s.saved.length, '收藏论文'],
          [s.read.length, '已读论文'],
          [Object.values(s.notes).filter(Boolean).length, '研究笔记'],
          [s.following.length, '关注方向'],
        ].map(([n, l]) => (
          <div key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <CommunityRecords />
      <div className="profile-columns">
        <section>
          <h2 className="section-title">我的研究兴趣</h2>
          <p className="muted">调整关注方向，首页推荐会随之变化。</p>
          <div className="profile-topics">
            {topics.map((t) => (
              <div key={t.name}>
                <span className={`topic-dot ${t.color}`} />
                <div>
                  <strong>{t.name}</strong>
                  <p>{t.desc}</p>
                </div>
                <button
                  className={`btn ${s.following.includes(t.name) ? 'following' : ''}`}
                  onClick={() => toggle('following', t.name)}
                >
                  {s.following.includes(t.name) ? '已关注' : '+ 关注'}
                </button>
              </div>
            ))}
          </div>
          <h2 className="section-title">我的阅读记录</h2>
          <div className="chips">
            {papers
              .filter((p) => s.read.includes(p.id))
              .map((p) => (
                <Link className="chip" key={p.id} href={`/paper/${p.id}`}>
                  {p.name} ↗
                </Link>
              ))}
          </div>
          <h2 className="section-title">我的论文讨论</h2>
          {Object.entries(s.comments)
            .filter(([, cs]) => cs.length)
            .map(([id, cs]) => (
              <Link
                className="profile-note"
                key={id}
                href={`/paper/${id}?tab=discussion`}
              >
                <strong>{papers.find((p) => p.id === id)?.name} ↗</strong>
                <p>{cs.join('\n')}</p>
              </Link>
            ))}
          <h2 className="section-title">我的阅读笔记</h2>
          {papers
            .filter((p) => s.notes[p.id])
            .map((p) => (
              <Link
                className="profile-note"
                href={`/paper/${p.id}?tab=notes`}
                key={p.id}
              >
                <span>
                  <NotebookPen size={16} />
                  {p.name}
                  <ArrowUpRight size={15} />
                </span>
                <p>{s.notes[p.id]}</p>
              </Link>
            ))}
          {!Object.values(s.notes).some(Boolean) && (
            <p className="muted">还没有笔记。打开论文，把第一个问题记下来。</p>
          )}
        </section>
        <aside>
          <section className="match-card">
            <h3>知识，随时可以带走。</h3>
            <p>将收藏和阅读笔记导出，继续在你熟悉的工具里研究。</p>
            <button
              className="btn full"
              onClick={() => {
                download(knowledgeExport(s), 'paperfeed-notes.md');
                tell('已生成知识库文件，浏览器将开始下载');
              }}
            >
              <Download size={16} />
              导出我的知识库
            </button>
          </section>
          <section className="demo-settings">
            <h3>演示设置</h3>
            <p>
              研究空间使用数据库持久化，本机缓存用于恢复未完成的保存。未登录时按此浏览器区分；重置后恢复演示种子。
            </p>
            <button className="btn" onClick={() => setReset(true)}>
              <RotateCcw size={16} />
              重置演示
            </button>
          </section>
        </aside>
      </div>
      <Dialog open={reset} onOpenChange={setReset}>
        <DialogContent>
          <DialogTitle>恢复初始演示状态？</DialogTitle>
          <DialogDescription>
            当前演示空间新增的笔记、收藏和讨论将被清除。需要保留的内容可先导出。
          </DialogDescription>
          <button className="btn" onClick={() => setReset(false)}>
            保留当前内容
          </button>
          <button
            className="btn primary"
            onClick={() => {
              resetDemo();
              setReset(false);
              tell('已恢复初始演示内容');
            }}
          >
            恢复初始状态
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
