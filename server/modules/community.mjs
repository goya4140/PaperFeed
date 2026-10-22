import { db } from '../database.mjs';
import { topics, papers } from './papers.mjs';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { hash, now, fail, text, identifier, authenticate, session, transaction, visible, post, library, body, limit } from './shared.mjs';

export async function route(req,url) {
  const p=url.pathname, method=req.method;
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
}
