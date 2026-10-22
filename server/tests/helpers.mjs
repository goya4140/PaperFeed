import { spawn } from 'node:child_process';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function fixture(t,extra={}) {
  const dir=await mkdtemp(path.join(tmpdir(),'paperpop-business-'));
  const env={...process.env,PAPERPOP_DATA_DIR:dir,PORT:'0',...extra};let server;
  async function start(){
    server=spawn(process.execPath,['server/server.mjs'],{env,stdio:['ignore','pipe','pipe']});
    let errors='';server.stderr.on('data',d=>errors+=d);
    return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(new Error('Server timed out: '+errors)),10000);
      server.stdout.on('data',d=>{const m=d.toString().match(/http:\/\/127.0.0.1:\d+/);if(m){clearTimeout(timeout);resolve(m[0]);}});
      server.once('exit',c=>{clearTimeout(timeout);reject(new Error('Server exited '+c+': '+errors));});
    });
  }
  const stop=async()=>{if(server?.exitCode===null)await new Promise(r=>{server.once('exit',r);server.kill();});};
  let base=await start();
  t.after(async()=>{await stop();await rm(dir,{recursive:true,force:true});});
  return {dir,env,get base(){return base;},async restart(){await stop();base=await start();},
    async call(route,{method='GET',data,token,status=200}={}){
      const res=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:data===undefined?undefined:JSON.stringify(data)});
      const out=await res.json();assert.equal(res.status,status,JSON.stringify(out));return out;
    }
  };
}
