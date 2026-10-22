import { randomBytes,scryptSync,timingSafeEqual } from 'node:crypto';
import { db,transaction } from '../database.mjs';
import { fail,hash,now,text,body,limit } from './shared.mjs';
import { getPaper,upsertPaper } from './papers.mjs';
import { interpretation,saveDraft,publish,withdraw } from './interpretations.mjs';
import { enqueueCollection,taskById,retryTask } from './tasks.mjs';
import { sources } from './collection.mjs';
function audit(admin,action,target,details={}){db.prepare('INSERT INTO admin_audit(adminId,action,target,details,createdAt) VALUES(?,?,?,?,?)').run(admin.id,action,target,JSON.stringify(details),now());}
export function authenticateAdmin(req) {
 const token=req.headers.cookie?.match(/(?:^|;\s*)paperpop_admin=([a-f0-9]{64})(?:;|$)/)?.[1];
 const session=token&&db.prepare('SELECT a.id,a.name,s.csrf FROM admins a JOIN admin_sessions s ON a.id=s.adminId WHERE s.hash=? AND s.expires>?').get(hash(token),Date.now());
 if(!session)fail(401,'请使用管理员账号登录');
 if(!['GET','HEAD'].includes(req.method)&&req.headers['x-csrf-token']!==session.csrf)fail(403,'管理请求校验失败，请重新登录');
 return session;
}
const page=url=>{const limit=Math.max(1,Math.min(100,Number(url.searchParams.get('limit'))||30));const offset=Math.max(0,Math.min(100000,Number(url.searchParams.get('offset'))||0));return {limit,offset};};
export async function route(req,url,res) {
 const p=url.pathname,method=req.method;if(!p.startsWith('/admin/api/'))return;
 if(method==='POST'&&p==='/admin/api/login') {
  limit(req,'admin-auth',10);const d=await body(req);const name=text(d.name,64,'管理员名称');
  if(typeof d.password!=='string'||d.password.length>128)fail(422,'密码无效');
  const admin=db.prepare('SELECT * FROM admins WHERE name=?').get(name);
  const candidate=scryptSync(d.password,admin?.salt||'missing-admin',64);
  if(!admin||!timingSafeEqual(candidate,Buffer.from(admin.password,'hex')))fail(401,'管理员账号或密码不正确');
  const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex');
  db.prepare('DELETE FROM admin_sessions WHERE expires<?').run(Date.now());
  db.prepare('INSERT INTO admin_sessions VALUES(?,?,?,?)').run(hash(token),admin.id,csrf,Date.now()+8*3600000);
  res.setHeader('Set-Cookie',`paperpop_admin=${token}; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=28800`);
  audit(admin,'login',admin.id);return {name:admin.name,csrf};
 }
 const admin=authenticateAdmin(req);
 if(method==='GET'&&p==='/admin/api/me')return {name:admin.name,csrf:admin.csrf};
 if(method==='POST'&&p==='/admin/api/logout') {
  const token=req.headers.cookie.match(/paperpop_admin=([a-f0-9]{64})/)[1];db.prepare('DELETE FROM admin_sessions WHERE hash=?').run(hash(token));
  res.setHeader('Set-Cookie','paperpop_admin=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0');audit(admin,'logout',admin.id);return {ok:true};
 }
 if(method==='GET'&&p==='/admin/api/overview')return {papers:db.prepare('SELECT count(*) n FROM papers').get().n,drafts:db.prepare("SELECT count(*) n FROM interpretations WHERE status='draft'").get().n,pendingTasks:db.prepare("SELECT count(*) n FROM tasks WHERE status IN ('pending','processing')").get().n,reports:db.prepare('SELECT count(*) n FROM reports WHERE id NOT IN (SELECT reportId FROM report_actions)').get().n,topics:db.prepare('SELECT * FROM topics').all(),sources:sources()};
 if(method==='GET'&&p==='/admin/api/papers') {
  const {limit,offset}=page(url),q=(url.searchParams.get('q')||'').slice(0,300);
  const rows=db.prepare('SELECT id,visibility FROM papers WHERE instr(lower(data),lower(?))>0 OR instr(id,?)>0 ORDER BY ingestedAt DESC,id LIMIT ? OFFSET ?').all(q,q,limit+1,offset);
  return {items:rows.slice(0,limit).map(r=>({...getPaper(r.id,{privateContent:true}),visibility:r.visibility})),nextOffset:rows.length>limit?offset+limit:null};
 }
 if(method==='POST'&&p==='/admin/api/papers') {
  const d=await body(req);const result=upsertPaper(d);audit(admin,'paper-create',result.id);return result;
 }
 const pm=p.match(/^\/admin\/api\/papers\/([^/]+)$/);
 if(pm) {
  const id=decodeURIComponent(pm[1]),paper=db.prepare('SELECT * FROM papers WHERE id=?').get(id);if(!paper)fail(404,'论文不存在');
  if(method==='GET')return {...getPaper(id,{privateContent:true}),visibility:paper.visibility,versions:db.prepare('SELECT version FROM paper_versions WHERE paperId=? ORDER BY version').all(id).map(v=>v.version),interpretations:db.prepare('SELECT id FROM interpretations WHERE paperId=? ORDER BY createdAt DESC,id').all(id).map(r=>interpretation(r.id))};
  if(method==='PUT') {
   const d=await body(req);const existing=JSON.parse(paper.data);
   const allowed=['name','title','authors','summary','topic','tags','sourceUrl'];
   const patch=Object.fromEntries(allowed.filter(k=>Object.hasOwn(d,k)).map(k=>[k,d[k]]));
   // Editorial changes are independent from immutable source versions.
   const merged={...existing,...patch,id,topic:patch.topic||paper.topic,date:paper.publishedAt};
   if(typeof merged.title!=='string'||!merged.title.trim()||merged.title.length>1000||typeof merged.summary!=='string'||!merged.summary.trim()||merged.summary.length>50000||!Array.isArray(merged.authors)||!merged.authors.every(x=>typeof x==='string')||!Array.isArray(merged.tags)||!merged.tags.every(x=>typeof x==='string')||!db.prepare('SELECT 1 FROM topics WHERE id=?').get(merged.topic))fail(422,'论文信息无效');
   let link;try{link=new URL(merged.sourceUrl);}catch{fail(422,'链接无效');}if(!['https:','http:'].includes(link.protocol))fail(422,'链接无效');
   if(d.visibility!==undefined&&!['public','withdrawn'].includes(d.visibility))fail(422,'可见性无效');
   transaction(()=>{
    db.prepare('UPDATE papers SET data=?,topic=?,visibility=?,featured=? WHERE id=?').run(JSON.stringify(merged),merged.topic,d.visibility||paper.visibility,d.featured===undefined?paper.featured:d.featured?1:0,id);
    audit(admin,'paper-edit',id,{fields:Object.keys(patch),visibility:d.visibility,featured:d.featured});
   });return {ok:true};
  }
 }
 const draft=p.match(/^\/admin\/api\/papers\/([^/]+)\/drafts$/);
 if(draft&&method==='POST') {const d=await body(req);return transaction(()=>{const result=saveDraft(decodeURIComponent(draft[1]),d);audit(admin,'draft-create',result.id);return result;});}
 const im=p.match(/^\/admin\/api\/interpretations\/([^/]+)(?:\/(publish|withdraw))?$/);
 if(im) {
  const id=im[1],existing=interpretation(id);if(!existing)fail(404,'解读不存在');
  if(method==='GET'&&!im[2])return existing;
  if(method==='PUT'&&!im[2]){const d=await body(req);return transaction(()=>{const r=saveDraft(existing.paperId,d,{id,revision:d.revision});audit(admin,'draft-edit',id);return r;});}
  if(method==='POST'&&im[2]){const d=await body(req);return im[2]==='publish'?publish(id,d.revision,()=>audit(admin,'interpretation-publish',id)):transaction(()=>{const r=withdraw(id,d.revision);audit(admin,'interpretation-withdraw',id);return r;});}
 }
 if(method==='GET'&&p==='/admin/api/tasks') {const {limit,offset}=page(url);return {items:db.prepare('SELECT id FROM tasks ORDER BY createdAt DESC,id LIMIT ? OFFSET ?').all(limit,offset).map(t=>taskById(t.id)),runs:db.prepare('SELECT * FROM collection_runs ORDER BY createdAt DESC LIMIT 20').all()};}
 if(method==='POST'&&p==='/admin/api/collect'){const d=await body(req);let r;try{r=enqueueCollection(d.sourceId,{from:d.from,until:d.until,idList:d.idList});}catch(e){fail(422,e.message);}audit(admin,'collect-enqueue',r.id);return r;}
 const tm=p.match(/^\/admin\/api\/tasks\/([^/]+)(\/retry)?$/);
 if(tm){if(method==='GET'&&!tm[2]){const r=taskById(tm[1]);if(!r)fail(404,'任务不存在');return {...r,events:db.prepare('SELECT * FROM task_events WHERE taskId=? ORDER BY id').all(r.id)};}if(method==='POST'&&tm[2]){let r;try{r=retryTask(tm[1]);}catch(e){fail(409,e.message);}audit(admin,'task-retry',r.id);return r;}}
 if(method==='GET'&&p==='/admin/api/reports'){const {limit,offset}=page(url);return {items:db.prepare('SELECT r.*,a.resolution,a.notes FROM reports r LEFT JOIN report_actions a ON r.id=a.reportId ORDER BY r.createdAt DESC LIMIT ? OFFSET ?').all(limit,offset)};}
 const rm=p.match(/^\/admin\/api\/reports\/([^/]+)\/resolve$/);
 if(rm&&method==='POST') {
  const d=await body(req),report=db.prepare('SELECT * FROM reports WHERE id=?').get(rm[1]);if(!report)fail(404,'举报不存在');
  if(!['dismissed','hidden'].includes(d.resolution))fail(422,'处理结果无效');const notes=text(d.notes,2000,'处理说明');
  transaction(()=>{
   db.prepare('INSERT INTO report_actions VALUES(?,?,?,?,?) ON CONFLICT(reportId) DO UPDATE SET adminId=excluded.adminId,resolution=excluded.resolution,notes=excluded.notes,updatedAt=excluded.updatedAt').run(report.id,admin.id,d.resolution,notes,now());
   if(d.resolution==='hidden'){
    if(report.targetType==='paper')db.prepare("UPDATE papers SET visibility='withdrawn' WHERE id=?").run(report.targetId);
    else db.prepare('INSERT INTO content_moderation VALUES(?,?,1,?,?) ON CONFLICT(targetType,targetId) DO UPDATE SET hidden=1,reason=excluded.reason,updatedAt=excluded.updatedAt').run(report.targetType,report.targetId,notes,now());
   }
   audit(admin,'report-resolve',report.id,{resolution:d.resolution,notes});
  });return {ok:true};
 }
 if(method==='GET'&&p==='/admin/api/users'){const {limit,offset}=page(url);return {items:db.prepare('SELECT u.id,u.name,u.created,COALESCE(r.restricted,0) restricted,r.reason FROM users u LEFT JOIN user_restrictions r ON u.id=r.userId ORDER BY u.created DESC,u.id LIMIT ? OFFSET ?').all(limit,offset)};}
 const um=p.match(/^\/admin\/api\/users\/([^/]+)\/restriction$/);
 if(um&&method==='POST'){
  const d=await body(req);if(typeof d.restricted!=='boolean'||!db.prepare('SELECT 1 FROM users WHERE id=?').get(um[1]))fail(422,'账号或限制状态无效');
  const reason=text(d.reason,2000,'限制说明');
  transaction(()=>{db.prepare('INSERT INTO user_restrictions VALUES(?,?,?,?) ON CONFLICT(userId) DO UPDATE SET restricted=excluded.restricted,reason=excluded.reason,updatedAt=excluded.updatedAt').run(um[1],d.restricted?1:0,reason,now());audit(admin,'account-restriction',um[1],{restricted:d.restricted,reason});});return {ok:true};
 }
 if(method==='GET'&&p==='/admin/api/audit'){const {limit,offset}=page(url);return {items:db.prepare('SELECT a.*,u.name admin FROM admin_audit a JOIN admins u ON a.adminId=u.id ORDER BY a.id DESC LIMIT ? OFFSET ?').all(limit,offset)};}
 fail(404,'管理接口不存在');
}
