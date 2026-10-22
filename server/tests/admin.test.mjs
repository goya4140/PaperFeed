import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fixture } from './helpers.mjs';
test('administrator isolation, drafts, publication, moderation and audit are enforced by API',async t=>{
 const f=await fixture(t);
 const initialized=spawnSync(process.execPath,['server/admin-init.mjs'],{env:{...f.env,PAPERPOP_ADMIN_NAME:'editor',PAPERPOP_ADMIN_PASSWORD:'synthetic-admin-password'},encoding:'utf8'});assert.equal(initialized.status,0,initialized.stderr);
 const a=await f.call('/v1/auth/register',{method:'POST',data:{name:'ordinary-user',password:'synthetic-user-password'}});
 await f.call('/admin/api/papers',{token:a.token,status:401});
 const session=await fetch(f.base+'/admin/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'editor',password:'synthetic-admin-password'})});
 assert.equal(session.status,200);const cookie=session.headers.get('set-cookie').split(';')[0];assert.match(session.headers.get('set-cookie'),/HttpOnly/);const {csrf}=await session.json();
 async function admin(p,{method='GET',data,status=200,headers={}}={}){const r=await fetch(f.base+'/admin/api/'+p,{method,headers:{'Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf,...headers},body:data===undefined?undefined:JSON.stringify(data)});const json=await r.json();assert.equal(r.status,status,JSON.stringify(json));return json;}
 await admin('collect',{method:'POST',data:{sourceId:'arxiv-ai'},headers:{'X-CSRF-Token':''},status:403});
 await admin('overview',{headers:{Origin:'https://attacker.example'},status:403});
 const pp={id:'admin-new-paper',title:'Admin added paper',summary:'Only an abstract.',date:'2026-10-22',topic:'Agent Memory',authors:['Fixture'],sourceUrl:'https://arxiv.org/abs/2303.11366'};
 await admin('papers',{method:'POST',data:pp});
 const poster={title:'Manual editorial draft',sections:[{title:'问题',label:'原文摘要 · 人工编辑',text:'An explicitly sourced abstract summary.'}]};
 let draft=await admin('papers/'+pp.id+'/drafts',{method:'POST',data:{poster}});
 assert.equal((await f.call('/v1/papers/'+pp.id)).poster,null);
 assert(!(JSON.stringify(await f.call('/v1/catalog'))).includes(poster.title));
 await admin('interpretations/'+draft.id,{method:'PUT',data:{poster:{...poster,title:'Bad stale edit'},revision:999},status:409});
 draft=await admin('interpretations/'+draft.id,{method:'PUT',data:{poster:{...poster,title:'Edited draft'},revision:draft.revision}});
 draft=await admin('interpretations/'+draft.id+'/publish',{method:'POST',data:{revision:draft.revision}});
 assert.equal((await f.call('/v1/papers/'+pp.id)).poster.title,'Edited draft');
 await admin('papers/'+pp.id+'/drafts',{method:'POST',data:{poster:{...poster,title:'Unpublished second draft'}}});
 assert.equal((await f.call('/v1/papers/'+pp.id)).poster.title,'Edited draft');
 await admin('interpretations/'+draft.id+'/withdraw',{method:'POST',data:{revision:draft.revision}});
 assert.equal((await f.call('/v1/papers/'+pp.id)).poster,null);
 const post=await f.call('/v1/posts',{method:'POST',token:a.token,data:{id:randomUUID(),topic:pp.topic,paperId:pp.id,kind:'问题',title:'Moderation test',body:'Synthetic fixture'}});
 const replyID=randomUUID();await f.call('/v1/posts/'+post.id+'/replies',{method:'POST',token:a.token,data:{id:replyID,body:'Synthetic reply'}});
 for(const [type,id] of [['reply',replyID],['post',post.id]]){
  await f.call('/v1/reports',{method:'POST',token:a.token,data:{targetType:type,targetId:id,reason:'Synthetic moderation test'}});
  const report=(await admin('reports')).items.find(r=>r.targetType===type);
  await admin('reports/'+report.id+'/resolve',{method:'POST',data:{resolution:'hidden',notes:'Test fixture hidden'}});
 }
 await f.call('/v1/posts/'+post.id,{status:404});assert.equal((await f.call('/v1/posts')).length,0);
 await admin('users/'+a.user.id+'/restriction',{method:'POST',data:{restricted:true,reason:'Synthetic restriction'}});
 await f.call('/v1/library',{token:a.token,status:403});
 await f.call('/v1/auth/login',{method:'POST',data:{name:'ordinary-user',password:'synthetic-user-password'},status:403});
 await admin('users/'+a.user.id+'/restriction',{method:'POST',data:{restricted:false,reason:'Restriction lifted'}});
 await f.call('/v1/library',{token:a.token});
 assert((await admin('audit')).items.some(e=>e.action==='interpretation-publish'));
 const task=await admin('collect',{method:'POST',data:{sourceId:'arxiv-ai',idList:'1706.03762'}});
 const duplicate=await admin('collect',{method:'POST',data:{sourceId:'arxiv-ai',idList:'1706.03762'}});assert.equal(task.id,duplicate.id);
 await f.restart();assert((await admin('reports')).items.every(r=>r.resolution==='hidden'));
 const fresh=await fetch(f.base+'/admin/');assert.match(fresh.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(await fresh.text(),/编辑工作台/);
 await admin('logout',{method:'POST'});await admin('papers',{status:401});
});
