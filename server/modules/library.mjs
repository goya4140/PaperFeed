import { db } from '../database.mjs';
import { topics, papers } from './papers.mjs';
import { now, fail, text, identifier, authenticate, transaction, library, body, limit } from './shared.mjs';

export async function route(req,url) {
  const p=url.pathname, method=req.method;
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
}
