import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
test('existing legacy data survives versioned initialization and repeated migrations',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'paperpop-migration-'));
  try {
    const db=new DatabaseSync(path.join(dir,'paperpop.sqlite'));
    db.exec(readFileSync(new URL('../migrations/001-legacy.sql',import.meta.url),'utf8'));
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run('legacy-user','legacy','hash','salt','2026-01-01');db.close();
    for(let n=0;n<2;n++) {
      const result=spawnSync(process.execPath,['server/init.mjs'],{env:{...process.env,PAPERPOP_DATA_DIR:dir},encoding:'utf8'});
      assert.equal(result.status,0,result.stderr);
    }
    const verified=new DatabaseSync(path.join(dir,'paperpop.sqlite'));
    assert.equal(verified.prepare('SELECT count(*) n FROM users').get().n,1);
    assert.equal(verified.prepare("SELECT count(*) n FROM schema_migrations WHERE version='001-legacy.sql'").get().n,1);
    verified.close();
    assert.notEqual(spawnSync(process.execPath,['server/init.mjs'],{env:{...process.env,PORT:'bad',PAPERPOP_DATA_DIR:dir}}).status,0);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
