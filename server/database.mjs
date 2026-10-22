import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { config,root } from './config.mjs';
mkdirSync(config.dataDir,{recursive:true,mode:0o700});
export const db=new DatabaseSync(path.join(config.dataDir,'paperpop.sqlite'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
export function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}
}
export function migrate() {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY,appliedAt TEXT NOT NULL)');
  for(const name of readdirSync(path.join(root,'migrations')).filter(n=>/^\d+.*\.sql$/.test(n)).sort()) {
    if(db.prepare('SELECT 1 FROM schema_migrations WHERE version=?').get(name))continue;
    transaction(()=>{
      db.exec(readFileSync(path.join(root,'migrations',name),'utf8'));
      db.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(name,new Date().toISOString());
    });
  }
}
migrate();
