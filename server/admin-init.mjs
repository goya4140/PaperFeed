import { randomBytes,scryptSync,randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { db,transaction } from './database.mjs';
import { config } from './config.mjs';
try{
 const name=process.env.PAPERPOP_ADMIN_NAME||'admin';
 if(db.prepare('SELECT 1 FROM admins WHERE name=?').get(name))throw new Error('Administrator already exists; credentials were not changed.');
 const password=process.env.PAPERPOP_ADMIN_PASSWORD||randomBytes(24).toString('base64url');
 if(password.length<12||password.length>128)throw new Error('Admin password requires 12–128 characters');
 const salt=randomBytes(16).toString('hex');
 transaction(()=>{
  db.prepare('INSERT INTO admins VALUES(?,?,?,?,?)').run(randomUUID(),name,scryptSync(password,salt,64).toString('hex'),salt,new Date().toISOString());
  if(!process.env.PAPERPOP_ADMIN_PASSWORD){
   const target=path.join(config.dataDir,'admin-login.json');
   writeFileSync(target,JSON.stringify({name,password},null,2)+'\n',{mode:0o600,flag:'wx'});
   console.log('Administrator initialized. Local credentials saved to:',target);
  }else console.log('Administrator initialized from environment.');
 });
}catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}
