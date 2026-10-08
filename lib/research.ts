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
        `${p.title} ${p.name} ${p.summary} ${p.topic}`
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
  return `# ${p.title}\n\n${p.authors.join(', ')} · ${p.date}\n\n原文：${source(p)}\n\n## 阅读导览（基于论文摘要整理，非作者原话）\n${p.summary}\n\n### 方法\n${p.method}\n\n### 阅读时留意\n${p.caution}\n\n## 我的笔记\n${s.notes[p.id] || '尚无笔记'}\n\n## 我的本地讨论\n${(s.comments[p.id] || []).join('\n\n') || '尚无讨论'}\n`;
}
export function download(content: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/plain;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
