import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS }}).outputText, { exports });
  return exports;
}
const {papers, topics} = load('lib/papers.ts');
const {deepReads} = load('lib/deep-reads.ts');
const catalog = {
  version: 1, generatedAt: '2026-10-20',
  topics: topics.map(t => ({id:t.name, name:t.name, description:t.desc, prompt:t.prompt})),
  papers: papers.map(p => {
    const deep = deepReads[p.id];
    const sourceUrl = deep?.source || p.sourceUrl || `https://arxiv.org/abs/${p.id}`;
    return {
      id:p.id, name:p.name, title:p.title, authors:p.authors, date:p.date,
      kind:p.kind || '论文', topic:p.topic, tags:p.tags, summary:p.summary,
      problem:p.problem, method:p.method, result:p.result, limitation:p.caution,
      steps:p.steps, sourceUrl, projectUrl:p.project || null,
      poster: deep ? {
        title:deep.headline, hook:deep.hook, status:'curated', sourceUrl,
        version:'editorial-1', flow:deep.flow, sections:deep.sections,
        example:deep.example, evidence:deep.evidence, related:deep.related
      } : null
    };
  })
};
fs.writeFileSync('ios/PaperPop/Resources/catalog.json', JSON.stringify(catalog, null, 2)+'\n');
console.log(`Exported ${catalog.papers.length} papers, ${catalog.papers.filter(p=>p.poster).length} curated posters, ${catalog.topics.length} topics.`);
