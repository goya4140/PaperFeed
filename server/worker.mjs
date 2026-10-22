import { setTimeout as sleep } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { runOne } from './modules/tasks.mjs';
import { config } from './config.mjs';
import { db } from './database.mjs';
const controller=new AbortController(),owner=`${process.pid}-${randomUUID()}`;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>controller.abort(new Error('Worker shutdown')));
console.log('PaperPop worker started');
try {do{
 const result=await runOne({owner,signal:controller.signal});
 if(result)console.log('Task:',result.id,result.kind,result.status,result.error||'');
 if(process.argv.includes('--once'))break;
 if(!result)await sleep(config.workerPollMs,null,{signal:controller.signal});
}while(!controller.signal.aborted);}catch(e){if(!controller.signal.aborted)throw e;}finally{db.close();}
