import { enqueueCollection,retryTask } from './modules/tasks.mjs';
import { db } from './database.mjs';
const args=process.argv.slice(2),option=n=>args.includes(n)?args[args.indexOf(n)+1]:undefined;
try{
 if(args[0]==='collect')console.log(JSON.stringify(enqueueCollection(option('--source')||'arxiv-ai',{from:option('--from'),until:option('--until'),idList:option('--ids')})));
 else if(args[0]==='retry')console.log(JSON.stringify(retryTask(args[1])));
 else if(args[0]==='list')console.table(db.prepare('SELECT id,kind,status,attempts,error FROM tasks ORDER BY createdAt DESC LIMIT 50').all());
 else throw new Error('Usage: node server/jobs.mjs collect [--source arxiv-ai] [--ids ID] | retry ID | list');
}catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}
