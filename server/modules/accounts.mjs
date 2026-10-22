import { db } from '../database.mjs';
import { topics, papers } from './papers.mjs';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { hash, now, fail, text, identifier, authenticate, session, transaction, visible, post, library, body, limit } from './shared.mjs';

export async function route(req,url) {
  const p=url.pathname, method=req.method;
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
}
