import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { db,transaction } from '../database.mjs';
import { config } from '../config.mjs';
import { upsertPaper,topics } from './papers.mjs';
export function sources() {
 const values=JSON.parse(readFileSync(process.env.PAPERPOP_SOURCES_FILE||new URL('../config/sources.json',import.meta.url),'utf8'));
 for(const s of values)if(!/^[a-z0-9-]+$/.test(s.id)||!topics.has(s.topic)||!/^([a-z-]+\.)?[A-Za-z-]+$/.test(s.category)||!Number.isInteger(s.pageSize)||s.pageSize<1||s.pageSize>100||!Number.isInteger(s.maxPages)||s.maxPages<1||s.maxPages>100||!Number.isFinite(s.everyHours)||s.everyHours<1)throw new Error('Invalid collection source configuration');
 return values;
}
export function parseFeed(xml) {
 const p=spawnSync('python3',[fileURLToPath(new URL('../parse-arxiv.py',import.meta.url))],{input:xml,encoding:'utf8',maxBuffer:5_000_000});
 if(p.status!==0)throw new Error('Invalid arXiv XML: '+p.stderr.slice(-500));
 return JSON.parse(p.stdout);
}
const stamp=()=>new Date().toISOString();
const dateQuery=date=>new Date(date).toISOString().replace(/[-:T]/g,'').slice(0,12);
export function createCollection(source,{from,until=stamp(),idList}={}) {
 if(!topics.has(source.topic))throw new Error('Unknown source topic');
 const watermark=db.prepare('SELECT updatedThrough FROM collection_watermarks WHERE sourceKey=?').get(source.id);
 const since=from|| (watermark?new Date(Date.parse(watermark.updatedThrough)-86400000).toISOString():new Date(Date.now()-7*86400000).toISOString());
 if(!Number.isFinite(Date.parse(since))||!Number.isFinite(Date.parse(until))||Date.parse(since)>Date.parse(until))throw new Error('Invalid collection time range');
 if(idList&&!/^([a-z-]+(\.[A-Z]{2})?\/\d{7}|\d{4}\.\d{4,5})(v\d+)?(,([a-z-]+(\.[A-Z]{2})?\/\d{7}|\d{4}\.\d{4,5})(v\d+)?)*$/.test(idList))throw new Error('Invalid arXiv id list');
 const query=JSON.stringify({search_query:`cat:${source.category} AND lastUpdatedDate:[${dateQuery(since)} TO ${dateQuery(until)}]`,until,since,idList:idList||null,backfill:!!from});
 const id=randomUUID(),now=stamp();
 db.prepare('INSERT INTO collection_runs(id,sourceKey,query,topic,pageSize,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?)').run(id,source.id,query,source.topic,source.pageSize,now,now);return id;
}
async function reserveSlot(signal) {
 const owner=randomUUID();
 while(true) {
  signal?.throwIfAborted();
  const wait=transaction(()=>{
   const old=db.prepare("SELECT * FROM source_limits WHERE source='arxiv'").get();
   const at=Math.max(Date.now(),old?.nextRequestAt||0,old?.leaseUntil||0);
   if(at>Date.now())return at-Date.now();
   db.prepare("INSERT INTO source_limits(source,nextRequestAt,owner,leaseUntil) VALUES('arxiv',?,?,?) ON CONFLICT(source) DO UPDATE SET nextRequestAt=excluded.nextRequestAt,owner=excluded.owner,leaseUntil=excluded.leaseUntil").run(Date.now()+config.arxivIntervalMs,owner,Date.now()+45000);
   return 0;
  });
  if(!wait)return ()=>db.prepare("UPDATE source_limits SET owner=NULL,leaseUntil=NULL,nextRequestAt=MAX(nextRequestAt,?) WHERE source='arxiv' AND owner=?").run(Date.now()+config.arxivIntervalMs,owner);
  await sleep(Math.min(wait,1000),null,{signal});
 }
}
async function download(url,signal) {
 const response=await fetch(url,{headers:{'User-Agent':'PaperPopLocal/0.2 (local research reader)','Accept':'application/atom+xml'},signal:AbortSignal.any([AbortSignal.timeout(30000),...(signal?[signal]:[])])});
 if(!response.ok){const e=new Error(`arXiv HTTP ${response.status}`);e.retryAfter=Math.min(60000,Math.max(0,Number(response.headers.get('retry-after'))*1000||0));throw e;}
 const chunks=[];let count=0;for await(const chunk of response.body){count+=chunk.length;if(count>4_000_000){await response.body.cancel().catch(()=>{});throw new Error('arXiv response too large');}chunks.push(chunk);}
 return Buffer.concat(chunks).toString('utf8');
}
export async function collect(runId,{maxPages=2,signal,fetchPage=download,onProgress=()=>{},assertActive=()=>{}}={}) {
 let run=db.prepare('SELECT * FROM collection_runs WHERE id=?').get(runId);if(!run)throw new Error('Collection run not found');
 if(run.status==='succeeded')return run;
 const query=JSON.parse(run.query);
 assertActive();
 db.prepare("UPDATE collection_runs SET status='processing',error=NULL,updatedAt=? WHERE id=?").run(stamp(),runId);
 try {
  for(let page=0;page<maxPages;page++) {
   signal?.throwIfAborted();
   const url=new URL(config.arxivURL);if(query.idList)url.searchParams.set('id_list',query.idList);else url.searchParams.set('search_query',query.search_query);
   url.searchParams.set('start',run.nextStart);url.searchParams.set('max_results',run.pageSize);url.searchParams.set('sortBy','lastUpdatedDate');url.searchParams.set('sortOrder','ascending');
   let feed;
   for(let attempt=0;attempt<3;attempt++) {
    const release=await reserveSlot(signal);
    try {feed=parseFeed(await fetchPage(url,signal));break;}
    catch(e){if(signal?.aborted||attempt===2)throw e;await sleep(e.retryAfter||Math.min(15000,1000*2**attempt),null,{signal});}finally{release();}
   }
   signal?.throwIfAborted();
   let changed=0;
   for(const entry of feed.entries) {
    const match=entry.idURL.match(/^https?:\/\/arxiv\.org\/abs\/((?:[a-z-]+(?:\.[A-Z]{2})?\/\d{7})|(?:\d{4}\.\d{4,5}))(?:v(\d+))?$/);
    if(!match)throw new Error('Invalid arXiv paper identifier');
    const id=match[1],version=Number(match[2]||1);
    assertActive();
    const result=upsertPaper({...entry,id,name:entry.title,topic:run.topic,tags:entry.categories,date:entry.publishedAt.slice(0,10),sourceUrl:`https://arxiv.org/abs/${id}`,sourceVersionURL:entry.idURL},{source:'arxiv',sourceId:id,version});
    if(result.changed)changed++;
   }
   const next=run.nextStart+feed.entries.length;
   const done=next>=feed.total||feed.entries.length<run.pageSize;
   if(feed.entries.length===0&&next<feed.total)throw new Error('Unexpected empty arXiv page; cursor preserved');
   assertActive();
   transaction(()=>{
    db.prepare('UPDATE collection_runs SET nextStart=?,total=?,processed=processed+?,changed=changed+?,status=?,updatedAt=? WHERE id=?').run(next,feed.total,feed.entries.length,changed,done?'succeeded':'pending',stamp(),runId);
    if(done&&!query.idList&&!query.backfill)db.prepare('INSERT INTO collection_watermarks VALUES(?,?) ON CONFLICT(sourceKey) DO UPDATE SET updatedThrough=MAX(updatedThrough,excluded.updatedThrough)').run(run.sourceKey,query.until);
   });
   run=db.prepare('SELECT * FROM collection_runs WHERE id=?').get(runId);onProgress(run);
   if(done)break;
  }
  return run;
 }catch(e){assertActive();db.prepare("UPDATE collection_runs SET status='failed',error=?,updatedAt=? WHERE id=?").run(String(e.message).slice(0,2000),stamp(),runId);throw e;}
}
