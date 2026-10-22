import { db } from './database.mjs';
const [command, type, id]=process.argv.slice(2);
if(command === 'reports') console.table(db.prepare('SELECT * FROM reports ORDER BY createdAt DESC LIMIT 100').all());
else if(command === 'remove' && ['post','reply'].includes(type) && id) {
  console.log(db.prepare(`DELETE FROM ${type === 'post' ? 'posts' : 'replies'} WHERE id=?`).run(id));
} else console.log('查看举报：node server/moderate.mjs reports\n删除违规内容：node server/moderate.mjs remove post|reply ID');
db.close();
