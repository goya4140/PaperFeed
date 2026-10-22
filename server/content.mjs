import { readFileSync } from 'node:fs';
import { upsertPaper } from './modules/papers.mjs';
import { db } from './database.mjs';
try {
  if(process.argv[2]!=='import'||!process.argv[3])throw new Error('Usage: node server/content.mjs import paper.json');
  const paper=JSON.parse(readFileSync(process.argv[3],'utf8'));
  console.log(upsertPaper(paper,{source:paper.source||'manual',sourceId:paper.sourceId||paper.id,version:paper.paperVersion||1}));
} finally {db.close();}
