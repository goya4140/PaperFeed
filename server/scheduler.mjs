import { collect,createCollection,sources } from './modules/collection.mjs';
import { db } from './database.mjs';
import { setTimeout as sleep } from 'node:timers/promises';
const control=new AbortController();
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>control.abort());
async function tick(){
 for(const source of sources().filter(s=>s.enabled)){
  const pending=db.prepare("SELECT id FROM collection_runs WHERE sourceKey=? AND status IN ('pending','failed','processing') ORDER BY createdAt DESC LIMIT 1").get(source.id);
  const last=db.prepare('SELECT lastAttemptAt FROM collection_schedule WHERE sourceKey=?').get(source.id)?.lastAttemptAt||0;
  if(Date.now()-last<(pending?60000:source.everyHours*3600000))continue;
  db.prepare('INSERT INTO collection_schedule VALUES(?,?) ON CONFLICT(sourceKey) DO UPDATE SET lastAttemptAt=excluded.lastAttemptAt').run(source.id,Date.now());
  const id=pending?.id||createCollection(source);
  try{const r=await collect(id,{maxPages:source.maxPages,signal:control.signal});console.log('Scheduled collection:',source.id,id,r.status,r.nextStart);}catch(e){console.error('Scheduled collection failed:',source.id,id,e.message);}
 }
}
try{do{await tick();if(process.argv.includes('--once'))break;await sleep(30000,null,{signal:control.signal});}while(!control.signal.aborted);}catch(e){if(!control.signal.aborted)throw e;}finally{db.close();}
