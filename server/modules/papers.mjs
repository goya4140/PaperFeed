import { db,transaction } from '../database.mjs';
function invalid(message) {const e=new Error(message);e.status=422;throw e;}
const stamp=()=>new Date().toISOString();
export const topics={has:id=>!!db.prepare('SELECT 1 FROM topics WHERE id=?').get(id)};
export const papers={has:id=>!!db.prepare("SELECT 1 FROM papers WHERE id=? AND visibility='public'").get(id),get:id=>getPaper(id)};
export function getPaper(id,{privateContent=false}={}) {
  const row=db.prepare(`SELECT * FROM papers WHERE id=? ${privateContent?'':"AND visibility='public'"}`).get(id);
  if(!row)return null;
  const interpretation=db.prepare("SELECT data FROM interpretations WHERE paperId=? AND status='published'").get(id);
  return {...JSON.parse(row.data),id:row.id,topic:row.topic,date:row.publishedAt.slice(0,10),publishedAt:row.publishedAt,updatedAt:row.updatedAt,ingestedAt:row.ingestedAt,paperVersion:row.latestVersion,featured:!!row.featured,poster:interpretation?JSON.parse(interpretation.data):null};
}
export function getCatalog() {
  return {version:2,generatedAt:stamp(),topics:db.prepare('SELECT * FROM topics ORDER BY rowid').all(),papers:db.prepare("SELECT id FROM papers WHERE visibility='public' ORDER BY publishedAt DESC,id").all().map(r=>getPaper(r.id))};
}
export function upsertPaper(input,{source='manual',sourceId=input.id,version=1}={}) {
  if(typeof input.id!=='string'||!input.id.trim()||input.id.length>120||/[\s?#]/.test(input.id))invalid('论文 ID 无效');
  if(!topics.has(input.topic))invalid('研究方向不存在');
  for(const key of ['title','summary','sourceUrl'])if(typeof input[key]!=='string'||!input[key].trim())invalid(`论文 ${key} 不能为空`);
  if(input.title.length>1000||input.summary.length>50000)invalid('论文内容过长');
  if(!Array.isArray(input.authors)||!input.authors.every(a=>typeof a==='string'))invalid('作者列表无效');
  const url=new URL(input.sourceUrl);if(!['https:','http:'].includes(url.protocol))invalid('原文链接无效');
  if(!Number.isSafeInteger(version)||version<1)invalid('论文版本无效');
  const published=input.publishedAt||input.date,updated=input.updatedAt||published;
  if(!published||!Number.isFinite(Date.parse(published))||!Number.isFinite(Date.parse(updated)))invalid('论文日期无效');
  const now=stamp();
  const {poster,...metadata}=input;
  const data={...metadata,name:input.name||input.title,kind:input.kind||'论文',tags:input.tags||[],date:published.slice(0,10)};
  return transaction(()=>{
    const old=db.prepare('SELECT * FROM papers WHERE id=?').get(input.id);
    if(old&&!(old.source==='seed'&&source==='arxiv')&&(old.source!==source||old.sourceId!==sourceId))invalid('论文来源与既有 ID 冲突');
    if(old&&version<old.latestVersion)return {id:input.id,changed:false,reason:'older-version'};
    if(old&&source==='arxiv'&&old.source==='arxiv'&&version===old.latestVersion)return {id:input.id,changed:false,reason:'same-version'};
    const same=db.prepare('SELECT 1 FROM paper_versions WHERE paperId=? AND version=?').get(input.id,version);
    db.prepare(`INSERT INTO papers VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source=excluded.source,sourceId=excluded.sourceId,topic=excluded.topic,latestVersion=excluded.latestVersion,publishedAt=excluded.publishedAt,updatedAt=excluded.updatedAt,data=excluded.data`).run(input.id,input.topic,source,sourceId,version,new Date(published).toISOString(),new Date(updated).toISOString(),now,'public',0,JSON.stringify(data));
    // Immutable source snapshots; editorial changes live on papers, never erase an old version.
    if(!same)db.prepare('INSERT INTO paper_versions VALUES(?,?,?,?,?)').run(input.id,version,updated,now,JSON.stringify(data));
    return {id:input.id,changed:!same,version};
  });
}
export async function route(req,url) {
  if(req.method!=='GET')return;
  if(url.pathname==='/v1/catalog')return getCatalog();
  if(url.pathname.startsWith('/v1/papers/')) {
    const paper=getPaper(decodeURIComponent(url.pathname.slice('/v1/papers/'.length)));
    if(!paper){const e=new Error('论文不存在或未公开');e.status=404;throw e;}
    return paper;
  }
}
