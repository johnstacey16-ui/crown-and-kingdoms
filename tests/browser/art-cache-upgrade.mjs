import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createApplication} from '../../server/app.mjs';
import {coreAssets} from '../../scripts/build-art-revisions.mjs';
const root=new URL('../../',import.meta.url),read=p=>readFileSync(new URL(p,root)),sha=b=>createHash('sha256').update(b).digest('hex');
function revised(files){const sorted=Object.fromEntries(Object.entries(files).sort(([a],[b])=>a<b?-1:a>b?1:0));return {version:1,revision:sha(JSON.stringify({version:1,files:sorted})),files:sorted}}
async function activate(page,update=false){
 await page.evaluate(async update=>{
  const before=navigator.serviceWorker.controller,changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  if(update){const r=await navigator.serviceWorker.getRegistration();await r.update()}else await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});
  await navigator.serviceWorker.ready;
  if(navigator.serviceWorker.controller===before){let timer;try{await Promise.race([changed,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Worker activation timed out')),30000)})])}finally{clearTimeout(timer)}}
  const active=(await navigator.serviceWorker.getRegistration()).active;
  if(active.state!=='activated')await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Worker activation did not complete')),30000);active.addEventListener('statechange',()=>{if(active.state==='activated'){clearTimeout(timer);resolve()}})});
 },update);
}
async function verifyCache(page,catalog,generation=39){
 return page.evaluate(async ({catalog,generation})=>{
  const name='ck-shell-v'+generation+'-verified-art-'+catalog.revision,cache=await caches.open(name);
  const results=await Promise.all(Object.entries(catalog.files).map(async([path,expected])=>{
   const r=await cache.match(new URL(path,location.href));if(!r)return false;
   const bytes=await crypto.subtle.digest('SHA-256',await r.arrayBuffer()),actual=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');return actual===expected;
  }));
  return {name,allValid:results.every(Boolean),images:results.length,code:await (await cache.match(new URL('/engine.js',location.href))).text(),keys:await caches.keys()};
 },{catalog,generation});
}
export async function checkArtCacheUpgrade(browser,output){
 const source=read('sw.js').toString().replace(/ck-shell-v[0-9]+-[a-z-]+(?=' \+ ART_REVISION)/,'ck-shell-v39-verified-art-'),core=coreAssets(source),base=JSON.parse(read('assets/art-revisions.json'));
 const application=createApplication(),overrides=new Map(),fail=new Set(),records=[];
 let catalog=base,marker='baseline',worker='';
 const imagePaths=new Set(Object.keys(base.files).map(p=>new URL(p,'https://fixture.invalid/').pathname));
 const server=createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname,send=(type,body,status=200)=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-cache'});res.end(body)};
  if(path==='/sw.js')return send('application/javascript',worker);
  if(path==='/assets/art-revisions.json')return send('application/json',JSON.stringify(catalog));
  if(path==='/'||path==='/index.html')return send('text/html','<!doctype html><title>Cache fixture</title><p>'+marker+'</p>');
  if(path==='/engine.js')return send('application/javascript',read('engine.js').toString()+'\n// '+marker+'\n');
  if(imagePaths.has(path)){
   const body=overrides.get(path)||read('.'+path),status=fail.has(path)?503:200;
   records.push({path,status,bytes:status===200?body.length:0});return send('image/webp',status===200?body:'temporary fixture failure',status);
  }
  application.emit('request',req,res);
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port;
 const legacy=id=>`const CACHE_NAME='ck-shell-baseline-${id}';const CORE_ASSETS=${JSON.stringify(core)};
 self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())));
 self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ck-shell-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
 `+source.slice(source.indexOf("self.addEventListener('fetch'"));
 const verified=()=>source.replace(/(const ART_REVISION = ')[a-f0-9]{64}(';)/,(_,a,b)=>a+catalog.revision+b);
 let page;
 try{
  // Reproduce the former cache.addAll installer with a genuine active-worker update.
  worker=legacy(1);page=await browser.newPage();await page.goto(origin);await activate(page);
  records.length=0;worker=legacy(2);await activate(page,true);
  const baseline={artRequests:records.length,artBytes:records.reduce((n,r)=>n+r.bytes,0)};assert.equal(baseline.artRequests,imagePaths.size);await page.close();page=null;
  // A fresh context has old image data but no active worker: valid old data must be reusable.
  page=await browser.newPage();await page.goto(origin);
  await page.evaluate(async paths=>{
   const old=await caches.open('ck-shell-returning-player');await old.addAll(paths);
   await old.put(new URL('/engine.js',location.href),new Response('old cached code'));
   await old.put(new URL('/assets/painted-motion-mil.webp',location.href),new Response('damaged cache image',{headers:{'Content-Type':'image/webp'}}));
  },Object.keys(base.files));
  overrides.set('/assets/painted-resources.webp',read('assets/painted-scarce-resources.webp'));
  catalog=revised({...base.files,'./assets/painted-resources.webp':sha(overrides.get('/assets/painted-resources.webp'))});
  marker='fresh verified code';worker=verified();records.length=0;await activate(page);
  const warmRecords=records.slice(),cached=await verifyCache(page,catalog);
  assert.equal(warmRecords.length,2);assert.deepEqual(new Set(warmRecords.map(r=>r.path)),new Set(['/assets/painted-resources.webp','/assets/painted-motion-mil.webp']));
  assert.ok(cached.allValid&&cached.code.includes(marker));assert.deepEqual(cached.keys,[cached.name]);
  const warm={artRequests:warmRecords.length,artBytes:warmRecords.reduce((n,r)=>n+r.bytes,0),imagesVerified:cached.images,allValid:cached.allValid,oldCacheRemoved:!cached.keys.includes('ck-shell-returning-player'),mutableCodeFresh:cached.code.includes(marker)};
  const previous=cached.name;
  // A failed changed-image request must not activate or destroy the working cache.
  overrides.set('/assets/painted-terrain.webp',read('assets/painted-motion-bomb.webp'));
  catalog=revised({...catalog.files,'./assets/painted-terrain.webp':sha(overrides.get('/assets/painted-terrain.webp'))});
  marker='failed candidate code';fail.add('/assets/painted-terrain.webp');worker=verified();records.length=0;
  const failed=await page.evaluate(async({previous,revision})=>{
   const controller=navigator.serviceWorker.controller,r=await navigator.serviceWorker.getRegistration();
   const terminal=new Promise(resolve=>r.addEventListener('updatefound',()=>{const w=r.installing;const check=()=>{if(['activated','redundant'].includes(w.state))resolve(w.state)};w.addEventListener('statechange',check);check()},{once:true}));
   await r.update();let timer,state;
   try{state=await Promise.race([terminal,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Failed worker did not finish')),30000)})])}finally{clearTimeout(timer)}
   return {state,activeUnchanged:navigator.serviceWorker.controller===controller,workingCachePresent:await caches.has(previous),failedCacheAbsent:!await caches.has('ck-shell-v39-verified-art-'+revision)};
  },{previous,revision:catalog.revision});
  assert.deepEqual(failed,{state:'redundant',activeUnchanged:true,workingCachePresent:true,failedCacheAbsent:true});
  // Retry the same worker bytes once the changed image can be fetched correctly.
  fail.clear();marker='recovered verified code';records.length=0;await activate(page,true);
  const recoveredRecords=records.slice(),recoveredCache=await verifyCache(page,catalog);
  assert.equal(recoveredRecords.length,1);assert.equal(recoveredRecords[0].path,'/assets/painted-terrain.webp');assert.ok(recoveredCache.allValid&&recoveredCache.code.includes(marker));assert.deepEqual(recoveredCache.keys,[recoveredCache.name]);
  // A code-only shell generation must reuse every verified image.
  marker='code-only verified update';worker=verified().replace('ck-shell-v39-verified-art-','ck-shell-v40-verified-art-');records.length=0;await activate(page,true);
  const codeCache=await verifyCache(page,catalog,40);assert.equal(records.length,0);assert.ok(codeCache.allValid&&codeCache.code.includes(marker));assert.deepEqual(codeCache.keys,[codeCache.name]);
  const codeOnly={artRequests:records.length,allValid:codeCache.allValid,mutableCodeFresh:codeCache.code.includes(marker)};
  await page.context().setOffline(true);await page.goto(origin+'/index.html');
  const offline=await page.evaluate(async()=>{
   const code=await (await fetch('/engine.js')).text(),art=await fetch('/assets/painted-terrain.webp');
   const denied=await Promise.allSettled([fetch('/api/multiplayer/probe'),fetch('/engine.js',{headers:{Authorization:'Bearer fixture'}}),fetch('/engine.js',{cache:'no-store'})]);
   return {shell:document.body.textContent.includes('code-only verified update'),mutable:code.includes('code-only verified update'),art:art.ok,privateBypassed:denied.every(r=>r.status==='rejected')};
  });assert.ok(Object.values(offline).every(Boolean));
  const result={baseline,warm,failed,codeOnly,recovered:{artRequests:recoveredRecords.length,allValid:recoveredCache.allValid,oldCacheRemoved:!recoveredCache.keys.includes(previous)},offline};
  await writeFile(output+'/art-cache-upgrade.json',JSON.stringify(result,null,2));return result;
 }finally{if(page)await page.close();await new Promise(resolve=>server.close(resolve))}
}
