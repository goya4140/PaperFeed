import { randomUUID,createHash } from 'node:crypto';
import { db,transaction } from '../database.mjs';
import { config } from '../config.mjs';
import { collect,createCollection,sources } from './collection.mjs';
const stamp=()=>new Date().toISOString();
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function event(task,event,message=''){db.prepare('INSERT INTO task_events(taskId,event,attempt,message,createdAt) VALUES(?,?,?,?,?)').run(task.id,event,task.attempts,message.slice(0,2000),stamp());}
export function taskById(id){const r=db.prepare('SELECT * FROM tasks WHERE id=?').get(id);if(!r)return null;return {...r,payload:JSON.parse(r.payload),progress:JSON.parse(r.progress),result:r.result?JSON.parse(r.result):null};}
export function enqueue(kind,payload,{dedupeKey,activeKey=dedupeKey,maxAttempts=3}={}) {
 if(!dedupeKey||!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>10)throw new Error('Invalid task options');
 const old=db.prepare("SELECT id FROM tasks WHERE dedupeKey=? OR (activeKey=? AND status IN ('pending','processing'))").get(dedupeKey,activeKey);if(old)return taskById(old.id);
 const id=randomUUID(),now=stamp();
 db.prepare('INSERT OR IGNORE INTO tasks(id,kind,dedupeKey,payload,availableAt,createdAt,updatedAt,activeKey,maxAttempts) VALUES(?,?,?,?,?,?,?,?,?)').run(id,kind,dedupeKey,JSON.stringify(payload),Date.now(),now,now,activeKey,maxAttempts);
 const task=db.prepare("SELECT id FROM tasks WHERE dedupeKey=? OR (activeKey=? AND status IN ('pending','processing'))").get(dedupeKey,activeKey);
 if(!task)throw new Error('Task enqueue failed');return taskById(task.id);
}
export function enqueueCollection(sourceId,options={}) {
 const source=sources().find(s=>s.id===sourceId);if(!source)throw new Error('Unknown collection source');
 const opts={from:options.from||null,until:options.until||null,idList:options.idList||null};
 const key='collect:'+sourceId+':'+digest(opts);
 return transaction(()=>{
  const current=db.prepare("SELECT id FROM tasks WHERE activeKey=? AND status IN ('pending','processing')").get(key);if(current)return taskById(current.id);
  // Adopt a resumable CLI run rather than create an overlapping collection.
  const pending=Object.values(opts).every(v=>v===null)?db.prepare("SELECT id FROM collection_runs WHERE sourceKey=? AND status IN ('pending','failed','processing') ORDER BY createdAt LIMIT 1").get(sourceId):null;
  const runId=pending?.id||createCollection(source,{from:opts.from||undefined,until:opts.until||undefined,idList:opts.idList||undefined});
  return enqueue('collect',{sourceId,runId},{dedupeKey:'collection-run:'+runId,activeKey:key});
 });
}
export function recoverExpired() {
 return transaction(()=>{
  const expired=db.prepare("SELECT * FROM tasks WHERE status='processing' AND leaseUntil<?").all(Date.now());
  for(const task of expired){
   db.prepare("UPDATE tasks SET status=?,owner=NULL,leaseUntil=NULL,availableAt=?,error=?,updatedAt=? WHERE id=?").run(task.attempts<task.maxAttempts?'pending':'failed',Date.now(),'Worker lease expired; safe to replay from persisted progress',stamp(),task.id);
   event(task,'recovered','Worker lease expired');
  }
  return expired.length;
 });
}
export function claim(owner) {
 recoverExpired();
 return transaction(()=>{
  const row=db.prepare("SELECT * FROM tasks WHERE status='pending' AND availableAt<=? ORDER BY availableAt,createdAt,id LIMIT 1").get(Date.now());if(!row)return null;
  db.prepare("UPDATE tasks SET status='processing',owner=?,leaseUntil=?,attempts=attempts+1,updatedAt=? WHERE id=? AND status='pending'").run(owner,Date.now()+config.taskLeaseMs,stamp(),row.id);
  const task=taskById(row.id);event(task,'started');return task;
 });
}
export function retryTask(id) {
 return transaction(()=>{
  const task=taskById(id);if(!task)throw new Error('Task not found');
  if(task.status!=='failed')throw new Error('Only failed tasks can be retried');
  const other=db.prepare("SELECT id FROM tasks WHERE activeKey=? AND status IN ('pending','processing')").get(task.activeKey);if(other)throw new Error('An equivalent task is already active');
  db.prepare("UPDATE tasks SET status='pending',attempts=0,availableAt=?,owner=NULL,leaseUntil=NULL,updatedAt=? WHERE id=?").run(Date.now(),stamp(),id);event(task,'manual-retry');return taskById(id);
 });
}
export const handlers={
 async collect(task,{signal,progress,assertActive}) {
  const result=await collect(task.payload.runId,{signal,assertActive,maxPages:1,onProgress:r=>progress({runId:r.id,nextStart:r.nextStart,total:r.total,changed:r.changed})});
  return {continue:result.status!=='succeeded',runId:result.id,processed:result.processed,changed:result.changed};
 }
};
export async function runOne({owner=randomUUID(),signal,registry=handlers}={}) {
 const task=claim(owner);if(!task)return null;
 const controller=new AbortController();
 const stop=()=>controller.abort(signal.reason||new Error('Worker interrupted'));if(signal?.aborted)stop();else signal?.addEventListener('abort',stop,{once:true});
 const timeout=setTimeout(()=>controller.abort(new Error('Task timed out')),config.taskTimeoutMs);
 const heartbeat=setInterval(()=>{
  const result=db.prepare("UPDATE tasks SET leaseUntil=? WHERE id=? AND owner=? AND status='processing'").run(Date.now()+config.taskLeaseMs,task.id,owner);
  if(!result.changes)controller.abort(new Error('Task lease lost'));
 },Math.max(200,Math.floor(config.taskLeaseMs/3)));
 const assertActive=()=>{controller.signal.throwIfAborted();if(!db.prepare("SELECT 1 FROM tasks WHERE id=? AND owner=? AND status='processing' AND leaseUntil>?").get(task.id,owner,Date.now()))throw new Error("Task lease lost");};
 const progress=data=>{assertActive();const r=db.prepare("UPDATE tasks SET progress=?,updatedAt=? WHERE id=? AND owner=? AND status='processing'").run(JSON.stringify(data),stamp(),task.id,owner);if(!r.changes)throw new Error('Task lease lost');};
 try{
  if(!registry[task.kind])throw new Error('Unsupported task kind: '+task.kind);
  const result=await registry[task.kind](task,{signal:controller.signal,progress,assertActive});controller.signal.throwIfAborted();
  transaction(()=>{
   const r=db.prepare("UPDATE tasks SET status=?,result=?,attempts=attempts-?,availableAt=?,error=NULL,owner=NULL,leaseUntil=NULL,updatedAt=? WHERE id=? AND owner=? AND status='processing'").run(result?.continue?'pending':'succeeded',JSON.stringify(result??{}),result?.continue?1:0,Date.now(),stamp(),task.id,owner);
   if(r.changes)event(task,result?.continue?'continued':'succeeded');
  });
 }catch(e){
  const interrupted=signal?.aborted;
  const error=String(controller.signal.reason?.message||e.message).slice(0,2000);
  transaction(()=>{
   const r=db.prepare("UPDATE tasks SET status=?,availableAt=?,attempts=attempts-?,error=?,owner=NULL,leaseUntil=NULL,updatedAt=? WHERE id=? AND owner=? AND status='processing'").run(interrupted||task.attempts<task.maxAttempts?'pending':'failed',Date.now()+(interrupted?0:Math.min(60000,1000*2**task.attempts)),interrupted?1:0,error,stamp(),task.id,owner);
   if(r.changes)event(task,interrupted?'interrupted':'error',error);
  });
 }finally{clearTimeout(timeout);clearInterval(heartbeat);signal?.removeEventListener('abort',stop);}
 return taskById(task.id);
}
export async function route(){return undefined;}
