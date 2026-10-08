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
assert.equal(papers.length, 12);
assert.equal(papers.filter((p) => p.sourceUrl).length, 4);
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
assert.equal(rankPapers(base, 'recent')[0].id, 'gemini-robotics');
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
  'Verified 12 research records, recommendation independence, negative feedback, topic follows, search, dates, citations and note exports.',
);

assert(
  relevance(papers[0], { ...base, saved: [papers[1].id] }) >
    relevance(papers[0], base),
  'Saving related research changes ranking',
);
assert(
  rankPapers({ ...base, following: ['World Models'] }, 'following').every(
    (p) => p.topic === 'World Models',
  ),
);
const official = papers.find((p) => p.id === 'openai-o1');
assert(bibtex(official).includes('@misc'));
assert(!bibtex(official).includes('arXiv'));
const { deepReads } = await import(moduleUrl(compile('../lib/deep-reads.ts')));
assert.equal(Object.keys(deepReads).length, 3);
for (const [id, article] of Object.entries(deepReads)) {
  assert(papers.some((p) => p.id === id));
  assert.equal(article.sections.length, 6);
  assert.equal(article.flow.length, 4);
  assert(article.evidence.length >= 2);
}
const clips = JSON.parse(
  readFileSync(new URL('../lib/clips.json', import.meta.url), 'utf8'),
);
assert.equal(clips.length, 3);
for (const clip of clips) {
  assert(deepReads[clip.id]);
  assert.equal(clip.scenes.length, 5);
  for (const scene of clip.scenes) {
    assert(scene.duration > 0);
    assert(scene.text && scene.nodes.length === 3);
    const asset = readFileSync(
      new URL('../public' + scene.audio, import.meta.url),
    );
    assert(asset.length > 1000);
    assert.equal(asset.subarray(4, 8).toString(), 'ftyp');
  }
}
console.log(
  'Verified save/read ranking signals, official-source citations, three deep articles, and 15 actual AAC media files.',
);
