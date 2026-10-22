import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const directory=await mkdtemp(path.join(tmpdir(),'paperpop-api-'));
let child, base;
async function start() {
  child=spawn(process.execPath,['server/server.mjs'],{env:{...process.env,PORT:'0',PAPERPOP_DATA_DIR:directory},stdio:['ignore','pipe','pipe']});
  child.stderr.on('data',()=>{});
  base=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('API startup timeout')),15000);
    child.once('exit',code=>{clearTimeout(timer);reject(new Error(`Server exited: ${code}`));});
    child.stdout.on('data',chunk=>{const match=chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
  });
}
async function stop() {if(child && child.exitCode === null) await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});}
async function call(route,{method='GET',data,token,status=200}={}) {
  const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:data === undefined ? undefined : JSON.stringify(data)});
  const result=await response.json(); assert.equal(response.status,status,`${method} ${route}: ${JSON.stringify(result)}`); return result;
}
try {
  await start();
  assert.ok((await call('/v1/catalog')).papers.some(p=>p.id==='2303.11366'));
  await call('/v1/library',{status:401});
  const alice=await call('/v1/auth/register',{method:'POST',data:{name:'alice',password:'test-pass-123'}});
  const bob=await call('/v1/auth/register',{method:'POST',data:{name:'bob',password:'test-pass-456'}});
  await call('/v1/auth/register',{method:'POST',data:{name:'ALICE',password:'test-pass-123'},status:409});
  await call('/v1/auth/login',{method:'POST',data:{name:'alice',password:'wrong-password'},status:401});
  const note={id:randomUUID(),field:'notes',key:'2303.11366',value:'私人同步笔记'};
  const save={id:randomUUID(),field:'saved',key:'2303.11366',value:'true'};
  await call('/v1/library',{method:'POST',token:alice.token,data:{changes:[note,save]}});
  await call('/v1/library',{method:'POST',token:alice.token,data:{changes:[note,save]}});
  assert.deepEqual((await call('/v1/library',{token:alice.token})).saved,['2303.11366']);
  assert.deepEqual((await call('/v1/library',{token:bob.token})).notes,{});
  await call('/v1/library',{method:'POST',token:alice.token,data:{changes:[{...note,id:randomUUID(),key:'unknown'}]},status:422});
  const post={id:randomUUID(),title:'如何比较重试预算？',body:'固定调用次数后比较实验。',kind:'问题',topic:'Agent Memory',paperId:'2303.11366'};
  await call('/v1/posts',{method:'POST',data:post,status:401});
  await call('/v1/posts',{method:'POST',token:alice.token,data:post});
  await call('/v1/posts',{method:'POST',token:alice.token,data:post});
  assert.equal((await call('/v1/posts?paperId=2303.11366')).length,1);
  assert.equal((await call('/v1/posts?topic=World%20Models')).length,0);
  await call(`/v1/posts/${post.id}`,{method:'DELETE',token:bob.token,status:403});
  const reply={id:randomUUID(),body:'可以同时记录 token 预算。',parentId:null};
  await call(`/v1/posts/${post.id}/replies`,{method:'POST',token:bob.token,data:reply});
  await call(`/v1/posts/${post.id}/replies`,{method:'POST',token:bob.token,data:reply});
  assert.equal((await call(`/v1/posts/${post.id}`)).replies.length,1);
  const notices=await call('/v1/notifications',{token:alice.token});
  assert.equal(notices.length,1); assert.equal(notices[0].read,false);
  await call('/v1/notifications/read',{method:'POST',token:bob.token,data:{id:notices[0].id}});
  assert.equal((await call('/v1/notifications',{token:alice.token}))[0].read,false);
  await call('/v1/notifications/read',{method:'POST',token:alice.token,data:{id:notices[0].id}});
  assert.equal((await call('/v1/notifications',{token:alice.token}))[0].read,true);
  await call('/v1/reports',{method:'POST',token:alice.token,data:{targetType:'reply',targetId:reply.id,reason:'测试举报，不含真实违规'}});
  await call('/v1/blocks',{method:'POST',token:alice.token,data:{userId:bob.user.id}});
  assert.equal((await call(`/v1/posts/${post.id}`,{token:alice.token})).replies.length,0);
  assert.equal((await call('/v1/notifications',{token:alice.token})).length,0);
  assert.equal((await call('/v1/blocks',{token:alice.token})).length,1);
  await call('/v1/blocks',{method:'DELETE',token:alice.token,data:{userId:bob.user.id}});
  assert.equal((await call(`/v1/posts/${post.id}`,{token:alice.token})).replies.length,1);
  const invalid={...post,id:randomUUID(),topic:'World Models'};
  await call('/v1/posts',{method:'POST',token:alice.token,data:invalid,status:422});
  const second={...post,id:randomUUID(),title:'跨话题测试'};
  await call('/v1/posts',{method:'POST',token:bob.token,data:second});
  await call(`/v1/posts/${second.id}/replies`,{method:'POST',token:alice.token,data:{id:randomUUID(),body:'错误关联',parentId:reply.id},status:422});
  await stop(); await start();
  assert.equal((await call('/v1/library',{token:alice.token})).notes['2303.11366'],'私人同步笔记');
  assert.equal((await call(`/v1/posts/${post.id}`)).replies.length,1);
  await call('/v1/me',{method:'DELETE',token:bob.token});
  await call('/v1/me',{token:bob.token,status:401});
  assert.equal((await call(`/v1/posts/${post.id}`)).replies.length,0);
  await call('/v1/me',{method:'DELETE',token:alice.token});
  assert.equal((await call('/v1/posts')).length,0);
  console.log('PaperPop API: auth, isolation, library replay, public discussions, replies, notifications, ownership, moderation, restart persistence and deletion passed.');
} finally {await stop();await rm(directory,{recursive:true,force:true});}
