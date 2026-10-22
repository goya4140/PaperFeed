import { randomBytes, createHash } from 'node:crypto';
import { db } from '../database.mjs';
export const rate = new Map();
export const hash = value => createHash('sha256').update(value).digest('hex');
export const now = () => new Date().toISOString();
export function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
export function text(value, max, label, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(422, `${label}长度须在 ${min}–${max} 字之间`);
  return value.trim();
}
export function identifier(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(value)) fail(422, '操作标识无效');
  return value;
}
export function authenticate(req, required = true) {
  const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  const user = token && db.prepare('SELECT u.id,u.name FROM users u JOIN sessions s ON u.id=s.userId WHERE s.hash=? AND s.expires>?').get(hash(token), Date.now());
  if(user&&required&&db.prepare('SELECT 1 FROM user_restrictions WHERE userId=? AND restricted=1').get(user.id))fail(403,'账号已被限制，请联系管理员');
  if (!user && required) fail(401, '请登录后操作');
  return user || null;
}
export function session(user) {
  const token = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token), user.id, Date.now() + 30 * 86400000);
  return { token, user: { id: user.id, name: user.name } };
}
export function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const value = fn(); db.exec('COMMIT'); return value; } catch (e) { db.exec('ROLLBACK'); throw e; }
}
export function visible(user, authorId) { return !user || !db.prepare('SELECT 1 FROM blocks WHERE userId=? AND targetId=?').get(user.id, authorId); }
export function post(id, user) {
  const row = db.prepare(`SELECT p.*,u.name author,(SELECT COUNT(*) FROM replies r WHERE r.postId=p.id AND NOT EXISTS(SELECT 1 FROM content_moderation m WHERE m.targetType='reply' AND m.targetId=r.id AND m.hidden=1) AND NOT EXISTS(SELECT 1 FROM blocks b WHERE b.userId=? AND b.targetId=r.authorId)) replies FROM posts p JOIN users u ON u.id=p.authorId WHERE p.id=? AND NOT EXISTS(SELECT 1 FROM content_moderation m WHERE m.targetType='post' AND m.targetId=p.id AND m.hidden=1)`).get(user?.id || '', id);
  if (!row || !visible(user, row.authorId)) fail(404, '讨论不存在或已被屏蔽');
  return row;
}
export function library(userId) {
  const result = { saved:[], read:[], interests:[], joined:[], hidden:[], notes:{}, folders:{}, positions:{} };
  for (const row of db.prepare('SELECT field,key,value FROM preferences WHERE userId=?').all(userId)) {
    if (Array.isArray(result[row.field])) { if (row.value === 'true') result[row.field].push(row.key); }
    else result[row.field][row.key] = row.value;
  }
  return result;
}
export async function body(req) {
  let size = 0; const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256000) fail(413, '请求内容过大');
    chunks.push(chunk);
  }
  try { const parsed = JSON.parse(Buffer.concat(chunks).toString()); if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') fail(400, '请求格式无效'); return parsed; }
  catch(e) { if (e.status) throw e; fail(400, 'JSON 格式无效'); }
}
export function limit(req, bucket, maximum) {
  const key = `${req.socket.remoteAddress}:${bucket}`;
  const time = Date.now();
  let entry = rate.get(key);
  if (!entry || entry.reset < time) { entry = { count:0, reset:time + 60000 }; rate.set(key,entry); }
  if (++entry.count > maximum) fail(429, '操作频繁，请一分钟后重试');
  if (rate.size > 10000) for (const [k,v] of rate) if(v.reset < time) rate.delete(k);
}
