import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {fixture} from './helpers.mjs';
test('task dedupe, leases, real process interruption, finite retries and timeout',async t=>{
 const f=await fixture(t,{PAPERPOP_TASK_LEASE_MS:'600',PAPERPOP_TASK_TIMEOUT_MS:'1000'});
 Object.assign(process.env,{PAPERPOP_DATA_DIR:f.dir,PAPERPOP_TASK_LEASE_MS:'600',PAPERPOP_TASK_TIMEOUT_MS:'1000'});
 const {db}=await import('../database.mjs');t.after(()=>db.close());
 const {enqueue,claim,runOne,taskById,retryTask,enqueueCollection}=await import('../modules/tasks.mjs');
 const job=enqueue('probe',{},{dedupeKey:'probe-crash'});
 assert.equal(enqueue('probe',{},{dedupeKey:'probe-crash'}).id,job.id);
 const child=spawn(process.execPath,['--input-type=module','-e',"import {claim} from './server/modules/tasks.mjs';console.log(claim('crashed-process').id);setInterval(()=>{},1000);"],{env:f.env,stdio:['ignore','pipe','ignore']});
 t.after(()=>{if(child.exitCode===null)child.kill('SIGKILL');});
 const claimed=await new Promise((resolve,reject)=>{child.stdout.once('data',d=>resolve(d.toString().trim()));child.once('error',reject);});assert.equal(claimed,job.id);
 assert.equal(claim('competitor'),null);
 await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGKILL');});await sleep(700);
 const restored=await runOne({owner:'restarted-worker',registry:{probe:async()=>({restored:true})}});
 assert.equal(restored.status,'succeeded');assert.equal(restored.result.restored,true);
 assert(db.prepare("SELECT 1 FROM task_events WHERE taskId=? AND event='recovered'").get(job.id));
 const bad=enqueue('bad',{},{dedupeKey:'bad',maxAttempts:2});
 for(let i=0;i<2;i++){db.prepare('UPDATE tasks SET availableAt=0 WHERE id=?').run(bad.id);await runOne({registry:{bad:async()=>{throw new Error('expected fixture failure');}}});}
 assert.equal(taskById(bad.id).status,'failed');assert.match(taskById(bad.id).error,/expected fixture failure/);
 retryTask(bad.id);assert.equal((await runOne({registry:{bad:async()=>({fixed:true})}})).status,'succeeded');
 const timeout=enqueue('slow',{},{dedupeKey:'slow',maxAttempts:1});
 await runOne({registry:{slow:async(_,{signal})=>{await sleep(5000,null,{signal});return {};}}});
 assert.equal(taskById(timeout.id).status,'failed');assert.equal(taskById(timeout.id).error,'Task timed out');
 const first=enqueueCollection('arxiv-ai',{idList:'1706.03762'}),second=enqueueCollection('arxiv-ai',{idList:'1706.03762'});assert.equal(first.id,second.id);
});
