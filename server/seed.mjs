import { readFileSync } from 'node:fs';
export function seedContent(db,transaction) {
  if(db.prepare("SELECT 1 FROM content_meta WHERE key='seed-v1'").get())return;
  const catalog=JSON.parse(readFileSync(new URL('../ios/PaperPop/Resources/catalog.json',import.meta.url),'utf8'));
  transaction(()=>{
    const now=new Date().toISOString();
    for(const t of catalog.topics)db.prepare('INSERT OR IGNORE INTO topics VALUES(?,?,?,?)').run(t.id,t.name,t.description,t.prompt||'');
    for(const p of catalog.papers) {
      const {poster,...metadata}=p;
      db.prepare('INSERT OR IGNORE INTO papers VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(p.id,p.topic,'seed',p.id,1,p.date,p.date,now,'public',poster?1:0,JSON.stringify(metadata));
      db.prepare('INSERT OR IGNORE INTO paper_versions VALUES(?,?,?,?,?)').run(p.id,1,p.date,now,JSON.stringify(metadata));
      if(poster)db.prepare('INSERT OR IGNORE INTO interpretations(id,paperId,paperVersion,status,data,provenance,createdAt,updatedAt,publishedAt) VALUES(?,?,?,?,?,?,?,?,?)').run('seed-'+p.id,p.id,1,'published',JSON.stringify(poster),JSON.stringify({source:'curated seed',sourceUrl:p.sourceUrl}),now,now,now);
    }
    db.prepare("INSERT INTO content_meta VALUES('seed-v1',?)").run(now);
  });
}
