import { papers, source, type Paper } from './papers';
import type { DemoState } from './demo-store';
export function relevance(p: Paper, s: DemoState) {
  const related = Object.entries(s.feedback).reduce(
    (n, [id, v]) =>
      n + (papers.find((x) => x.id === id)?.topic === p.topic ? v * 4 : 0),
    0,
  );
  return Math.max(
    35,
    Math.min(
      99,
      p.interest + (s.following.includes(p.topic) ? 2 : -8) + related,
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
