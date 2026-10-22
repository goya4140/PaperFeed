import http from 'node:http';
import { db } from './database.mjs';
import { config } from './config.mjs';
import { fail, limit } from './modules/shared.mjs';
import { route as accounts } from './modules/accounts.mjs';
import { route as library } from './modules/library.mjs';
import { route as papers } from './modules/papers.mjs';
import { route as interpretations } from './modules/interpretations.mjs';
import { route as community } from './modules/community.mjs';
import { route as recommendations } from './modules/recommendations.mjs';
import { route as tasks } from './modules/tasks.mjs';
import { route as admin } from './modules/admin.mjs';
const routes=[accounts,library,papers,interpretations,community,recommendations,tasks,admin];
const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
  try {
    limit(req,'all',300);
    const url=new URL(req.url,'http://localhost');
    let result;
    if(req.method==='GET' && url.pathname==='/health')result={ok:true,service:'paperpop',version:'0.2.0'};
    else for(const route of routes) { result=await route(req,url); if(result!==undefined)break; }
    if(result===undefined)fail(404,'接口不存在');
    res.writeHead(200); res.end(JSON.stringify(result));
  } catch(e) {
    const status=e.status || 500;
    if(status === 500) console.error('PaperPop request failed:', e.message);
    res.writeHead(status); res.end(JSON.stringify({error: status === 500 ? '服务器暂时不可用，请重试' : e.message}));
  }
});
server.requestTimeout=20000; server.headersTimeout=10000;
const {port,host}=config;
server.listen(port,host,()=>console.log(`PaperPop API listening at http://${host}:${server.address().port}`));
for(const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
