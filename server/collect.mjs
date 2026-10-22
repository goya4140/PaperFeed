import { createCollection,collect,sources } from './modules/collection.mjs';
import { db } from './database.mjs';
const args=process.argv.slice(2);const option=n=>args.includes(n)?args[args.indexOf(n)+1]:undefined;
try {
 const source=sources().find(s=>s.id===(option('--source')||'arxiv-ai'));if(!source)throw new Error('Unknown source');
 const id=option('--resume')||createCollection(source,{from:option('--from'),until:option('--until'),idList:option('--ids')});
 console.log('Collection run:',id);
 const result=await collect(id,{maxPages:source.maxPages,onProgress:r=>console.log('Progress:',r.nextStart,'/',r.total,r.status)});
 console.log(JSON.stringify(result));
} catch(e){console.error('Collection failed:',e.message);process.exitCode=1;}finally{db.close();}
