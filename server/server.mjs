import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(path.join(root, '../ios/PaperPop/Resources/catalog.json'), 'utf8'));
const topics = new Set(catalog.topics.map(t => t.id));
const papers = new Map(catalog.papers.map(p => [p.id, p]));
const directory = process.env.PAPERPOP_DATA_DIR || path.join(root, '.data');
mkdirSync(directory, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(path.join(directory, 'paperpop.sqlite'));
db.exec(`
PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, password TEXT NOT NULL, salt TEXT NOT NULL, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY, authorId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, topic TEXT NOT NULL, paperId TEXT, kind TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS replies(id TEXT PRIMARY KEY, postId TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, parentId TEXT REFERENCES replies(id) ON DELETE SET NULL, authorId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, actorId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, postId TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, title TEXT NOT NULL, body TEXT NOT NULL, createdAt TEXT NOT NULL, isRead INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS preferences(userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, field TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(userId,field,key));
CREATE TABLE IF NOT EXISTS commands(userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, id TEXT NOT NULL, createdAt TEXT NOT NULL, PRIMARY KEY(userId,id));
CREATE TABLE IF NOT EXISTS blocks(userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, targetId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(userId,targetId));
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, targetType TEXT NOT NULL, targetId TEXT NOT NULL, reason TEXT NOT NULL, createdAt TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS posts_topic_date ON posts(topic,createdAt);
CREATE INDEX IF NOT EXISTS posts_paper ON posts(paperId);
CREATE INDEX IF NOT EXISTS replies_post ON replies(postId,createdAt);
CREATE INDEX IF NOT EXISTS notices_user ON notifications(userId,createdAt);
`);
const rate = new Map();
const hash = value => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
function text(value, max, label, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(422, `${label}长度须在 ${min}–${max} 字之间`);
  return value.trim();
}
function identifier(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(value)) fail(422, '操作标识无效');
  return value;
}
function authenticate(req, required = true) {
  const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  const user = token && db.prepare('SELECT u.id,u.name FROM users u JOIN sessions s ON u.id=s.userId WHERE s.hash=? AND s.expires>?').get(hash(token), Date.now());
  if (!user && required) fail(401, '请登录后操作');
  return user || null;
}
function session(user) {
  const token = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token), user.id, Date.now() + 30 * 86400000);
  return { token, user: { id: user.id, name: user.name } };
}
function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const value = fn(); db.exec('COMMIT'); return value; } catch (e) { db.exec('ROLLBACK'); throw e; }
}
function visible(user, authorId) { return !user || !db.prepare('SELECT 1 FROM blocks WHERE userId=? AND targetId=?').get(user.id, authorId); }
function post(id, user) {
  const row = db.prepare(`SELECT p.*,u.name author,(SELECT COUNT(*) FROM replies r WHERE r.postId=p.id AND NOT EXISTS(SELECT 1 FROM blocks b WHERE b.userId=? AND b.targetId=r.authorId)) replies FROM posts p JOIN users u ON u.id=p.authorId WHERE p.id=?`).get(user?.id || '', id);
  if (!row || !visible(user, row.authorId)) fail(404, '讨论不存在或已被屏蔽');
  return row;
}
function library(userId) {
  const result = { saved:[], read:[], interests:[], joined:[], hidden:[], notes:{}, folders:{}, positions:{} };
  for (const row of db.prepare('SELECT field,key,value FROM preferences WHERE userId=?').all(userId)) {
    if (Array.isArray(result[row.field])) { if (row.value === 'true') result[row.field].push(row.key); }
    else result[row.field][row.key] = row.value;
  }
  return result;
}
async function body(req) {
  let size = 0; const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256000) fail(413, '请求内容过大');
    chunks.push(chunk);
  }
  try { const parsed = JSON.parse(Buffer.concat(chunks).toString()); if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') fail(400, '请求格式无效'); return parsed; }
  catch(e) { if (e.status) throw e; fail(400, 'JSON 格式无效'); }
}
function limit(req, bucket, maximum) {
  const key = `${req.socket.remoteAddress}:${bucket}`;
  const time = Date.now();
  let entry = rate.get(key);
  if (!entry || entry.reset < time) { entry = { count:0, reset:time + 60000 }; rate.set(key,entry); }
  if (++entry.count > maximum) fail(429, '操作频繁，请一分钟后重试');
  if (rate.size > 10000) for (const [k,v] of rate) if(v.reset < time) rate.delete(k);
}
async function route(req, url) {
  const p = url.pathname; const method = req.method;
  if (method === 'GET' && p === '/health') return { ok:true, service:'paperpop', version:'0.1.0' };
  if (method === 'GET' && p === '/v1/catalog') return catalog;
  if (method === 'POST' && ['/v1/auth/register','/v1/auth/login'].includes(p)) {
    limit(req,'auth',12);
    const data = await body(req);
    const name = text(data.name,32,'用户名',2);
    if (!/^[\p{L}\p{N}_-]+$/u.test(name)) fail(422,'用户名只能包含文字、数字、下划线或连字符');
    if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128) fail(422,'密码须为 8–128 字符');
    if (p.endsWith('register')) {
      const salt = randomBytes(16).toString('hex');
      const password = scryptSync(data.password,salt,64).toString('hex');
      const user = {id:randomUUID(), name};
      try { db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(user.id,name,password,salt,now()); }
      catch(e) { if (String(e).includes('UNIQUE')) fail(409,'用户名已被使用'); throw e; }
      return session(user);
    }
    const user = db.prepare('SELECT * FROM users WHERE name=? COLLATE NOCASE').get(name);
    const candidate = scryptSync(data.password,user?.salt || 'unregistered',64);
    if (!user || !timingSafeEqual(candidate, Buffer.from(user.password,'hex'))) fail(401,'用户名或密码不正确');
    return session(user);
  }
  if (method === 'GET' && p === '/v1/me') return authenticate(req);
  if (method === 'POST' && p === '/v1/auth/logout') {
    authenticate(req); db.prepare('DELETE FROM sessions WHERE hash=?').run(hash(req.headers.authorization.slice(7))); return {ok:true};
  }
  if (method === 'DELETE' && p === '/v1/me') {
    const user=authenticate(req); db.prepare('DELETE FROM users WHERE id=?').run(user.id); return {ok:true};
  }
  if (p === '/v1/library') {
    const user=authenticate(req);
    if(method === 'GET') return library(user.id);
    if(method === 'POST') {
      limit(req,'library',120);
      const data=await body(req);
      if(!Array.isArray(data.changes) || data.changes.length > 100) fail(422,'每批最多同步 100 个操作');
      const arrays=['saved','read','interests','joined','hidden'];
      const maps=['notes','folders','positions'];
      for(const c of data.changes) {
        identifier(c.id);
        if(![...arrays,...maps].includes(c.field)) fail(422,'同步字段无效');
        text(c.key,200,'记录标识');
        if(typeof c.value !== 'string' || c.value.length > 50000) fail(422,'同步内容过大或格式无效');
        if(arrays.includes(c.field) && !['true','false'].includes(c.value)) fail(422,'状态无效');
        if(['interests','joined'].includes(c.field) ? !topics.has(c.key) : !papers.has(c.key)) fail(422,'内容不存在');
      }
      transaction(()=>{
        for(const c of data.changes) {
          if(db.prepare('SELECT 1 FROM commands WHERE userId=? AND id=?').get(user.id,c.id)) continue;
          db.prepare('INSERT INTO commands VALUES(?,?,?)').run(user.id,c.id,now());
          if(c.value === '') db.prepare('DELETE FROM preferences WHERE userId=? AND field=? AND key=?').run(user.id,c.field,c.key);
          else db.prepare('INSERT INTO preferences VALUES(?,?,?,?) ON CONFLICT(userId,field,key) DO UPDATE SET value=excluded.value').run(user.id,c.field,c.key,c.value);
        }
      });
      return library(user.id);
    }
  }
  if(p === '/v1/posts' && method === 'GET') {
    const user=authenticate(req,false);
    const topic=url.searchParams.get('topic'), paperId=url.searchParams.get('paperId');
    const offset=Math.max(0, Math.min(100000,Number(url.searchParams.get('offset')) || 0));
    return db.prepare(`SELECT p.*,u.name author,(SELECT COUNT(*) FROM replies r WHERE r.postId=p.id AND NOT EXISTS(SELECT 1 FROM blocks b WHERE b.userId=? AND b.targetId=r.authorId)) replies FROM posts p JOIN users u ON u.id=p.authorId WHERE (? IS NULL OR p.topic=?) AND (? IS NULL OR p.paperId=?) AND NOT EXISTS(SELECT 1 FROM blocks b WHERE b.userId=? AND b.targetId=p.authorId) ORDER BY p.createdAt DESC,p.id LIMIT 50 OFFSET ?`).all(user?.id || '',topic,topic,paperId,paperId,user?.id || '',offset);
  }
  if(p === '/v1/posts' && method === 'POST') {
    const user=authenticate(req); limit(req,'publish',30);
    const d=await body(req); const id=identifier(d.id);
    const existing=db.prepare('SELECT authorId FROM posts WHERE id=?').get(id);
    if(existing) {if(existing.authorId !== user.id) fail(409,'操作标识冲突'); return post(id,user);}
    const title=text(d.title,150,'标题'), content=text(d.body,10000,'正文');
    if(!topics.has(d.topic) || !['问题','讨论'].includes(d.kind)) fail(422,'方向或帖子类型无效');
    if(d.paperId && (!papers.has(d.paperId) || papers.get(d.paperId).topic !== d.topic)) fail(422,'关联论文与方向不匹配');
    db.prepare('INSERT INTO posts VALUES(?,?,?,?,?,?,?,?)').run(id,user.id,d.topic,d.paperId || null,d.kind,title,content,now());
    return post(id,user);
  }
  const match=p.match(/^\/v1\/posts\/([a-zA-Z0-9-]+)(\/replies)?$/);
  if(match) {
    const user=authenticate(req,method !== 'GET'); const parent=post(match[1],user);
    if(method === 'GET' && !match[2]) return {post:parent,replies:db.prepare(`SELECT r.*,u.name author FROM replies r JOIN users u ON u.id=r.authorId WHERE r.postId=? AND NOT EXISTS(SELECT 1 FROM blocks b WHERE b.userId=? AND b.targetId=r.authorId) ORDER BY r.createdAt,r.id LIMIT 1000`).all(parent.id,user?.id || '')};
    if(method === 'DELETE' && !match[2]) {
      if(parent.authorId !== user.id) fail(403,'只能删除自己的帖子');
      db.prepare('DELETE FROM posts WHERE id=?').run(parent.id); return {ok:true};
    }
    if(method === 'POST' && match[2]) {
      limit(req,'publish',30); const d=await body(req), id=identifier(d.id), content=text(d.body,10000,'回复');
      const existing=db.prepare('SELECT * FROM replies WHERE id=?').get(id);
      if(existing) {if(existing.authorId !== user.id || existing.postId !== parent.id) fail(409,'操作标识冲突'); return {ok:true};}
      const target=d.parentId ? db.prepare('SELECT * FROM replies WHERE id=? AND postId=?').get(d.parentId,parent.id) : null;
      if(d.parentId && (!target || !visible(user,target.authorId))) fail(422,'被回复内容不存在');
      transaction(()=>{
        db.prepare('INSERT INTO replies VALUES(?,?,?,?,?,?)').run(id,parent.id,d.parentId || null,user.id,content,now());
        for(const recipient of new Set([parent.authorId,target?.authorId].filter(Boolean))) {
          if(recipient === user.id || db.prepare('SELECT 1 FROM blocks WHERE userId=? AND targetId=?').get(recipient,user.id)) continue;
          db.prepare('INSERT INTO notifications VALUES(?,?,?,?,?,?,?,0)').run(randomUUID(),recipient,user.id,parent.id,`${user.name} 回复了「${parent.title}」`,content.slice(0,160),now());
        }
      });
      return {ok:true};
    }
  }
  const replyMatch=p.match(/^\/v1\/replies\/([a-zA-Z0-9-]+)$/);
  if(replyMatch && method === 'DELETE') {
    const user=authenticate(req); const r=db.prepare('SELECT authorId FROM replies WHERE id=?').get(replyMatch[1]);
    if(!r) fail(404,'回复不存在'); if(r.authorId !== user.id) fail(403,'只能删除自己的回复');
    db.prepare('DELETE FROM replies WHERE id=?').run(replyMatch[1]); return {ok:true};
  }
  if(p === '/v1/notifications' && method === 'GET') {
    const user=authenticate(req);
    return db.prepare(`SELECT n.id,n.postId,n.title,n.body,n.createdAt,n.isRead FROM notifications n WHERE n.userId=? AND NOT EXISTS(SELECT 1 FROM blocks b WHERE b.userId=? AND b.targetId=n.actorId) ORDER BY n.createdAt DESC LIMIT 100`).all(user.id,user.id).map(({isRead,...n})=>({...n,read:!!isRead}));
  }
  if(p === '/v1/notifications/read' && method === 'POST') {
    const user=authenticate(req); const d=await body(req);
    if(typeof d.id !== 'string') fail(422,'通知标识无效');
    db.prepare('UPDATE notifications SET isRead=1 WHERE userId=? AND id=?').run(user.id,d.id); return {ok:true};
  }
  if(p === '/v1/blocks') {
    const user=authenticate(req);
    if(method === 'GET') return db.prepare('SELECT u.id,u.name FROM blocks b JOIN users u ON b.targetId=u.id WHERE b.userId=?').all(user.id);
    if(method === 'POST' || method === 'DELETE') {
      const d=await body(req);
      if(d.userId === user.id || !db.prepare('SELECT 1 FROM users WHERE id=?').get(d.userId || '')) fail(422,'屏蔽对象无效');
      if(method === 'POST') db.prepare('INSERT OR IGNORE INTO blocks VALUES(?,?)').run(user.id,d.userId);
      else db.prepare('DELETE FROM blocks WHERE userId=? AND targetId=?').run(user.id,d.userId);
      return {ok:true};
    }
  }
  if(p === '/v1/reports' && method === 'POST') {
    const user=authenticate(req); limit(req,'report',10); const d=await body(req);
    const tables={post:'posts',reply:'replies',paper:null};
    if(!Object.hasOwn(tables,d.targetType)) fail(422,'举报类型无效');
    if(d.targetType === 'paper' ? !papers.has(d.targetId) : !db.prepare(`SELECT 1 FROM ${tables[d.targetType]} WHERE id=?`).get(d.targetId || '')) fail(404,'内容不存在');
    db.prepare('INSERT INTO reports VALUES(?,?,?,?,?,?)').run(randomUUID(),user.id,d.targetType,d.targetId,text(d.reason,1000,'举报说明'),now()); return {ok:true};
  }
  fail(404,'接口不存在');
}
const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
  try {
    limit(req,'all',300);
    const result=await route(req,new URL(req.url,'http://localhost'));
    res.writeHead(200); res.end(JSON.stringify(result));
  } catch(e) {
    const status=e.status || 500;
    if(status === 500) console.error('PaperPop request failed:', e.message);
    res.writeHead(status); res.end(JSON.stringify({error: status === 500 ? '服务器暂时不可用，请重试' : e.message}));
  }
});
server.requestTimeout=20000; server.headersTimeout=10000;
const port=Number(process.env.PORT || 8787), host=process.env.HOST || '127.0.0.1';
server.listen(port,host,()=>console.log(`PaperPop API listening at http://${host}:${server.address().port}`));
for(const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
