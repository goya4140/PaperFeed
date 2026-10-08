import { deepReads } from './deep-reads';
import { papers, source, type Paper } from './papers';
import type { DemoState } from './demo-store';
export function relevance(p: Paper, s: DemoState) {
  const related = Object.entries(s.feedback).reduce(
    (n, [id, v]) =>
      n + (papers.find((x) => x.id === id)?.topic === p.topic ? v * 4 : 0),
    0,
  );
  const saved = s.saved.filter(
    (id) => papers.find((x) => x.id === id)?.topic === p.topic,
  ).length;
  const read = s.read.filter(
    (id) => papers.find((x) => x.id === id)?.topic === p.topic,
  ).length;
  return Math.max(
    0,
    Math.min(
      99,
      45 +
        p.interest * 0.2 +
        (s.following.includes(p.topic) ? 18 : 0) +
        related +
        saved * 3 +
        read * 2,
    ),
  );
}
export function rankPapers(
  s: DemoState,
  mode: string,
  topic = '全部',
  query = '',
) {
  return papers
    .filter(
      (p) =>
        (mode !== 'personal' || s.feedback[p.id] !== -1) &&
        (mode !== 'following' || s.following.includes(p.topic)) &&
        (topic === '全部' || p.topic === topic) &&
        `${p.title} ${p.name} ${p.summary} ${p.topic} ${p.authors.join(' ')} ${p.publisher || ''} ${p.tags.join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      mode === 'quality'
        ? b.quality - a.quality
        : mode === 'recent'
          ? b.date.localeCompare(a.date)
          : relevance(b, s) - relevance(a, s),
    );
}
function bibEscape(s: string) {
  return s.replace(/[{}]/g, '').replace(/&/g, '\\&');
}
export function bibtex(p: Paper) {
  if (p.sourceUrl)
    return `@misc{paperfeed_${p.id.replace(/[^a-z0-9]/gi, '')},\n  title = {${bibEscape(p.title)}},\n  author = {${p.authors.map(bibEscape).join(' and ')}},\n  year = {${p.date.slice(0, 4)}},\n  howpublished = {${bibEscape(p.publisher || '')}},\n  url = {${source(p)}}\n}`;
  return `@article{paperfeed_${p.id.replace('.', '')},\n  title = {${bibEscape(p.title)}},\n  author = {${p.authors.map(bibEscape).join(' and ')}},\n  year = {${p.date.slice(0, 4)}},\n  journal = {arXiv preprint arXiv:${p.id}},\n  eprint = {${p.id}},\n  archivePrefix = {arXiv},\n  url = {${source(p)}}\n}`;
}
export function markdown(p: Paper, s: DemoState) {
  const deep = deepReads[p.id];
  const full = deep
    ? `\n## 深入图文解读\n${deep.headline}\n\n${deep.hook}\n\n机制：${deep.flow.join(' → ')}\n\n${deep.sections.map((x) => `### ${x.title}\n${x.label}\n\n${x.text}`).join('\n\n')}\n\n证据：\n${deep.evidence.map((x) => `${x.label}：${x.value} — ${x.context}`).join('\n')}\n\n深读来源：${deep.source}\n`
    : '';
  const discussion = (s.comments[p.id] || [])
    .map(
      (c, i) =>
        `${c}\n${(s.replies[`comment:${p.id}:${i}`] || []).map((r) => '回复：' + r).join('\n')}`,
    )
    .join('\n\n');
  return `# ${p.title}\n\n${p.authors.join(', ')} · ${p.date} · ${p.kind || '论文'}\n\n原文：${source(p)}\n\n## 阅读导览（基于公开原文整理，非作者原话）\n${p.summary}\n\n### 问题\n${p.problem}\n\n### 方法\n${p.method}\n\n### 原文报告\n${p.result}\n\n### 局限与条件（编辑导览）\n${p.caution}\n\n### 与研究的关系（编辑解读）\n${p.take}\n\n### 讨论问题\n${p.question}\n${full}\n## 我的笔记\n${s.notes[p.id] || '尚无笔记'}\n\n## 我的讨论与回复\n${discussion || '尚无讨论'}\n`;
}
export function knowledgeExport(s: DemoState) {
  const research = papers
    .filter(
      (p) =>
        s.saved.includes(p.id) || s.notes[p.id] || s.comments[p.id]?.length,
    )
    .map((p) => markdown(p, s))
    .join('\n---\n');
  return `# PaperFeed 研究空间\n\n导出于 ${new Date().toISOString()}\n\n${research}\n\n## 社区讨论\n${s.posts.map((p) => `### ${p.title}\n方向：${p.topic}\n\n${p.text}\n${(s.replies[p.id] || []).map((r) => '回复：' + r).join('\n')}`).join('\n\n')}\n\n## 全部回复记录\n${Object.entries(
    s.replies,
  )
    .map(([id, rs]) => `${id}\n${rs.join('\n')}`)
    .join(
      '\n\n',
    )}\n\n## 关注方向\n${s.following.join('、')}\n\n## 加入社区\n${s.joined.join('、')}\n\n## 同行关注（示例人物 ID）\n${s.people.join('、')}\n\n## 共读\n${s.clubs.join('、')}`;
}
export function download(content: string, name: string) {
  // A real HTTP attachment works in browsers that cannot save blob: URLs.
  const frame = document.createElement('iframe');
  frame.hidden = true;
  frame.name = `export-${crypto.randomUUID()}`;
  document.body.appendChild(frame);
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/export';
  form.target = frame.name;
  form.hidden = true;
  for (const [key, value] of Object.entries({ content, name })) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
  setTimeout(() => frame.remove(), 60000);
}

export function recommendationReason(p: Paper, s: DemoState) {
  const common = papers.filter(
    (x) => x.topic === p.topic && s.saved.includes(x.id) && x.id !== p.id,
  );
  return [
    s.following.includes(p.topic) ? `你关注了 ${p.topic}` : `探索 ${p.topic}`,
    common.length ? `你收藏过 ${common[0].name}` : '',
    Object.entries(s.feedback).some(
      ([id, v]) => v > 0 && papers.find((x) => x.id === id)?.topic === p.topic,
    )
      ? '你对同方向内容表达过兴趣'
      : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
