'use client';
import { useState } from 'react';
import Link from './native-link';
import { papers, topics, threads } from '@/lib/papers';
import { useDemo, toggle, updateDemo } from '@/lib/demo-store';
import { download } from '@/lib/research';
export const members = [
  {
    id: 'linyi',
    name: '林一',
    role: 'Agent 研究生',
    topics: ['Agent Memory', 'Agent Systems'],
    papers: ['2303.11366', '2210.03629'],
    intro: '希望对照纯重试和反思记忆，记录错误归因。',
  },
  {
    id: 'chenke',
    name: '陈可',
    role: '独立研究者',
    topics: ['Agent Memory', 'World Models'],
    papers: ['2310.08560', '2301.04104'],
    intro: '关注记忆过期、冲突与主动遗忘。',
  },
  {
    id: 'zhouran',
    name: '周然',
    role: 'Code Agent 开发者',
    topics: ['Agent Systems', 'Efficient Models'],
    papers: ['2310.06770', '2405.04434'],
    intro: '尝试整理可以重复运行的仓库评估环境。',
  },
  {
    id: 'xuning',
    name: '许宁',
    role: '序列建模研究者',
    topics: ['Test-Time Learning', 'Efficient Models'],
    papers: ['2407.04620', 'openai-o1'],
    intro: '想厘清测试时计算、隐藏状态更新和参数训练。',
  },
];
export function Replies({ id }: { id: string }) {
  const s = useDemo();
  const [value, setValue] = useState('');
  return (
    <div className="reply-box">
      {(s.replies[id] || []).map((r, i) => (
        <p className="user-reply" key={i}>
          <strong>你 · 演示身份</strong>
          {r}
        </p>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          updateDemo((d) => ({
            ...d,
            replies: {
              ...d.replies,
              [id]: [...(d.replies[id] || []), value.trim()],
            },
          }));
          setValue('');
        }}
      >
        <label htmlFor={`reply-${id}`}>补充或回复</label>
        <div>
          <input
            id={`reply-${id}`}
            value={value}
            maxLength={2000}
            onChange={(e) => setValue(e.target.value)}
            placeholder="带上你的理由或实验条件…"
          />
          <button className="btn" disabled={!value.trim()}>
            保存回复
          </button>
        </div>
      </form>
    </div>
  );
}
export function Nearby({ topic }: { topic?: string }) {
  const s = useDemo();
  const list = members
    .filter((m) => !topic || m.topics.includes(topic))
    .map((m) => ({
      ...m,
      commonTopics: m.topics.filter((x) => s.following.includes(x)),
      commonPapers: m.papers.filter(
        (x) => s.saved.includes(x) || s.read.includes(x),
      ),
    }))
    .sort(
      (a, b) =>
        b.commonPapers.length * 2 +
        b.commonTopics.length -
        (a.commonPapers.length * 2 + a.commonTopics.length),
    );
  return (
    <section className="nearby">
      <h2 className="section-title">研究兴趣上的附近</h2>
      <p className="muted">
        按共同方向、已读与收藏匹配。以下人物为示例，关注保存在你的演示空间。
      </p>
      <div className="member-grid">
        {list.map((m) => (
          <article key={m.id}>
            <div className="member-top">
              <span className="member-avatar">{m.name.slice(0, 1)}</span>
              <div>
                <strong>
                  {m.name} <small>示例</small>
                </strong>
                <p>{m.role}</p>
              </div>
              <button
                className="btn"
                onClick={() => toggle('people', m.id)}
                aria-pressed={s.people.includes(m.id)}
              >
                {s.people.includes(m.id) ? '已关注' : '+ 关注'}
              </button>
            </div>
            <p>{m.intro}</p>
            <div className="member-common">
              {m.commonTopics.length
                ? `共同方向：${m.commonTopics.join('、')}`
                : '可探索的新方向'}
              {m.commonPapers.length > 0 && (
                <p>
                  共同阅读：
                  {m.commonPapers.map((id) => (
                    <Link href={`/paper/${id}`} key={id}>
                      {papers.find((p) => p.id === id)?.name} ↗{' '}
                    </Link>
                  ))}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export function Community({ topic }: { topic: string }) {
  const s = useDemo();
  const [title, setTitle] = useState(''),
    [text, setText] = useState('');
  const club = `club:${topic}`;
  const first = papers.find((p) => p.topic === topic)!;
  const posts = s.posts.filter((p) => p.topic === topic);
  return (
    <section className="community-panel">
      <div className="community-heading">
        <div>
          <h2>方向社区</h2>
          <p>跨论文讨论方法、实验和研究问题。</p>
        </div>
        <button className="btn primary" onClick={() => toggle('joined', topic)}>
          {s.joined.includes(topic) ? '退出社区' : '加入社区'}
        </button>
      </div>
      <div className="reading-club">
        <p className="eyebrow">同篇在读 · 演示读书会</p>
        <h3>一起读 {first.name}</h3>
        <p>阅读顺序：速读 → 方法图 → 实验条件 → 提出一个可验证的问题。</p>
        <p>讨论提纲：{first.question}</p>
        <div className="detail-actions">
          <Link className="btn" href={`/paper/${first.id}?tab=deep`}>
            打开阅读材料
          </Link>
          <button
            className="btn"
            onClick={() => {
              toggle('clubs', club);
              if (!s.joined.includes(topic) && !s.clubs.includes(club))
                toggle('joined', topic);
            }}
          >
            {s.clubs.includes(club) ? '退出共读' : '加入共读'}
          </button>
          <button
            className="btn"
            onClick={() =>
              download(
                `# ${first.name} 共读提纲\n\n原文与解读：/paper/${first.id}\n\n1. 画出方法\n2. 核对实验预算\n3. ${first.question}\n\n我的笔记：\n${s.notes[first.id] || ''}\n\n社区讨论：\n${posts.map((p) => p.title + '\n' + p.text).join('\n\n')}`,
                `${first.name}-reading-club.md`,
              )
            }
          >
            导出提纲
          </button>
        </div>
        {s.clubs.includes(club) && (
          <div className="club-joined">
            <strong>你已加入这场演示共读</strong>
            <p>
              在下方发布你的问题或复现计划，回到个人空间可继续找到这里。没有向示例人物发送邀请。
            </p>
          </div>
        )}
      </div>
      <h3>社区讨论</h3>
      <p className="source-note">
        历史话题和成员为示例；你新增的讨论与回复会实际保存。
      </p>
      {threads
        .filter((t) => papers.find((p) => p.id === t.paper)?.topic === topic)
        .map((t) => (
          <article className="community-post" key={t.id}>
            <small>{t.person} · 示例话题</small>
            <h3>{t.title}</h3>
            <p>{t.text}</p>
            <Link
              className="text-link"
              href={`/paper/${t.paper}?tab=discussion`}
            >
              回到论文讨论 ↗
            </Link>
            <Replies id={t.id} />
          </article>
        ))}
      {posts.map((p) => (
        <article className="community-post" key={p.id}>
          <small>你 · 演示身份</small>
          <h3>{p.title}</h3>
          <p>{p.text}</p>
          <Replies id={p.id} />
        </article>
      ))}
      {!posts.length && (
        <p className="muted">还没有你发布的主题。可以从一个具体问题开始。</p>
      )}
      <form
        className="community-compose"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !text.trim()) return;
          updateDemo((d) => ({
            ...d,
            posts: [
              ...d.posts,
              {
                id: crypto.randomUUID(),
                topic,
                title: title.trim(),
                text: text.trim(),
                replies: [],
              },
            ],
          }));
          setTitle('');
          setText('');
        }}
      >
        <h3>发起一个讨论</h3>
        <label htmlFor="community-title">主题</label>
        <input
          id="community-title"
          required
          maxLength={150}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：复现时如何固定重试预算？"
        />
        <label htmlFor="community-body">问题、想法或复现计划</label>
        <textarea
          id="community-body"
          required
          maxLength={5000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="写清场景和你已经尝试过的方法。"
        />
        <button
          className="btn primary"
          disabled={!title.trim() || !text.trim()}
        >
          保存讨论
        </button>
      </form>
      <Nearby topic={topic} />
    </section>
  );
}
export function CommunityRecords() {
  const s = useDemo();
  return (
    <section className="community-records">
      <h2 className="section-title">我的社区与同行</h2>
      <div className="chips">
        {s.joined.map((t) => (
          <Link
            className="chip"
            key={t}
            href={`/topic/${encodeURIComponent(t)}`}
          >
            {t} ↗
          </Link>
        ))}
      </div>
      {!s.joined.length && (
        <p className="muted">还未加入社区，去探索页找一个方向。</p>
      )}
      {members
        .filter((m) => s.people.includes(m.id))
        .map((m) => (
          <div className="record-row" key={m.id}>
            <Link href={`/topic/${encodeURIComponent(m.topics[0])}`}>
              {m.name} · {m.role} · 示例
            </Link>
            <button className="btn" onClick={() => toggle('people', m.id)}>
              取消关注
            </button>
          </div>
        ))}
      <h3>我的共读</h3>
      {s.clubs.map((c) => (
        <p key={c}>
          <Link
            className="text-link"
            href={`/topic/${encodeURIComponent(c.replace('club:', ''))}`}
          >
            {c.replace('club:', '')} 共读 ↗
          </Link>
        </p>
      ))}
      <h3>我发起的讨论</h3>
      {s.posts.map((p) => (
        <article className="community-post" key={p.id}>
          <Link
            className="text-link"
            href={`/topic/${encodeURIComponent(p.topic)}`}
          >
            {p.title} ↗
          </Link>
          <p>{p.text}</p>
        </article>
      ))}
      <h3>我的回复</h3>
      {Object.entries(s.replies)
        .filter(([, rs]) => rs.length)
        .map(([id, rs]) => {
          const post = s.posts.find((p) => p.id === id);
          const thread = threads.find((t) => t.id === id);
          const paperId = id.startsWith('comment:')
            ? id.split(':')[1]
            : thread?.paper;
          return (
            <div className="record-row" key={id}>
              <div>
                <Link
                  href={
                    post
                      ? `/topic/${encodeURIComponent(post.topic)}`
                      : paperId
                        ? `/paper/${paperId}?tab=discussion`
                        : '/discussions'
                  }
                >
                  {post?.title || thread?.title || '论文评论'} ↗
                </Link>
                {rs.map((r, i) => (
                  <p key={i}>{r}</p>
                ))}
              </div>
            </div>
          );
        })}
    </section>
  );
}
