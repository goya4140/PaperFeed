import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const compile = (path) =>
  ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const moduleUrl = (s) =>
  'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const dataUrl = moduleUrl(compile('../lib/papers.ts'));
const { papers, topics } = await import(dataUrl);
const research = compile('../lib/research.ts').replace(
  "'./papers'",
  JSON.stringify(dataUrl),
);
const { rankPapers, relevance, bibtex, markdown } = await import(
  moduleUrl(research)
);
const base = {
  saved: [],
  read: [],
  votes: [],
  following: ['Agent Memory', 'Agent Systems'],
  feedback: {},
  notes: {},
  comments: {},
  folders: {},
  threadVotes: [],
  followThreads: [],
};
assert.equal(papers.length, 8);
assert.equal(new Set(papers.map((p) => p.id)).size, papers.length);
for (const p of papers) {
  assert(topics.some((t) => t.name === p.topic));
  assert.equal(p.steps.length, 4);
  assert(p.authors.length);
  assert(p.method && p.problem && p.caution);
}
const personal = rankPapers(base, 'personal');
const quality = rankPapers(base, 'quality');
assert.notEqual(
  personal[0].id,
  quality[0].id,
  'Dual-axis views must have different orders',
);
const rejected = { ...base, feedback: { [papers[0].id]: -1 } };
assert(!rankPapers(rejected, 'personal').some((p) => p.id === papers[0].id));
assert(
  rankPapers(rejected, 'quality').some((p) => p.id === papers[0].id),
  'Negative interest must not erase the quality catalog',
);
assert(
  relevance(papers[1], rejected) < relevance(papers[1], base),
  'Negative feedback changes related papers',
);
assert(
  relevance(papers[1], { ...base, following: [] }) < relevance(papers[1], base),
  'Following controls recommendations',
);
assert.equal(
  rankPapers(base, 'personal', '全部', 'memgpt')[0].id,
  '2310.08560',
);
assert(
  rankPapers(base, 'personal', 'Agent Memory').every(
    (p) => p.topic === 'Agent Memory',
  ),
);
assert.equal(rankPapers(base, 'recent')[0].id, '2407.04620');
const citation = bibtex(papers[0]);
assert(citation.includes('Noah Shinn and Federico Cassano'));
assert(citation.includes('https://arxiv.org/abs/2303.11366'));
assert(citation.includes('year = {2023}'));
const note = markdown(papers[0], {
  ...base,
  notes: { [papers[0].id]: '我的新想法' },
  comments: { [papers[0].id]: ['[问题] 如何复现？'] },
});
assert(note.includes('我的新想法'));
assert(note.includes('如何复现？'));
assert(note.includes('非作者原话'));
console.log(
  'Verified 8 paper records, recommendation independence, negative feedback, topic follows, search, dates, citations and note exports.',
);
