import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const directory=await mkdtemp(path.join(tmpdir(),'paperpop-store-'));
let server;
const run=(program,args,env={})=>new Promise((resolve,reject)=>{
  const child=spawn(program,args,{env:{...process.env,...env},stdio:'inherit'});
  child.once('error',reject);child.once('exit',code=>code === 0?resolve():reject(new Error(`${program} failed (${code})`)));
});
try {
  const app=path.join(directory,'PaperPopVerify.app');
  await mkdir(path.join(app,'Contents/MacOS'),{recursive:true});await mkdir(path.join(app,'Contents/Resources'),{recursive:true});
  await cp('ios/PaperPop/Resources/catalog.json',path.join(app,'Contents/Resources/catalog.json'));
  await writeFile(path.join(app,'Contents/Info.plist'),`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>app.paperpop.verification</string><key>CFBundleExecutable</key><string>Verify</string><key>CFBundlePackageType</key><string>APPL</string><key>NSAppTransportSecurity</key><dict><key>NSAllowsArbitraryLoads</key><true/></dict></dict></plist>`);
  await run('/bin/bash',['-c','swiftc -parse-as-library -target "$(uname -m)-apple-macosx14.0" ios/PaperPop/Core/*.swift ios/PaperPop/App/AppStore.swift ios/StoreVerification/Verify.swift -o "$1/Contents/MacOS/Verify"','verify',app]);
  await run('/usr/bin/codesign',['--force','--sign','-',app]);
  server=spawn(process.execPath,['server/server.mjs'],{env:{...process.env,PORT:'0',PAPERPOP_DATA_DIR:path.join(directory,'data')},stdio:['ignore','pipe','ignore']});
  const base=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Server startup timed out')),15000);
    server.stdout.on('data',data=>{const match=data.toString().match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
    server.once('exit',()=>{clearTimeout(timer);reject(new Error('API stopped'));});
  });
  await run(path.join(app,'Contents/MacOS/Verify'),[],{PAPERPOP_VERIFY_API:base});
} finally {
  if(server && server.exitCode === null) await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM');});
  await rm(directory,{recursive:true,force:true});
}
