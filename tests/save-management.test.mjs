import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const persistence = fs.readFileSync(new URL('../persistence.js', import.meta.url), 'utf8');
const save = fs.readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const engine = fs.readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('deleting a manual save preserves the autosave and other slots', async () => {
 const data = new Map([['ck_save','old'],['ck_save2','keep'],['ck_autosave','recovery']]);
 const deleted = [];
 const localStorage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const context = {localStorage,window:{CK_STORAGE:{deleteSave:k=>{deleted.push(k);return Promise.resolve(true)}}},skey:n=>n?'ck_save'+(n+1):'ck_save',hs:1,note:()=>{}};
 const start = save.indexOf('function deleteSavedGame(');
 const end = save.indexOf('function validSavedProduction(',start);
 const del = vm.runInNewContext(save.slice(start,end)+';deleteSavedGame',context);
 assert.equal(del(0),true);
 assert.equal(data.has('ck_save'),false);
 assert.equal(data.get('ck_save2'),'keep');
 assert.equal(data.get('ck_autosave'),'recovery');
 assert.deepEqual(deleted,['ck_save']);
 assert.equal(del('auto'),true);
 assert.equal(data.has('ck_autosave'),false);
 assert.equal(data.get('ck_save2'),'keep');
 assert.deepEqual(deleted,['ck_save','ck_autosave']);
 assert.equal(del(9),false);
});

test('deletion markers survive unavailable IndexedDB and clear on new saves', async () => {
 const data = new Map();
 const localStorage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const window = {localStorage,indexedDB:null};
 vm.runInNewContext(persistence,{window,Promise,Set});
 assert.equal(await window.CK_STORAGE.deleteSave('ck_save'),false);
 assert.equal(data.get('ck_deleted_ck_save'),'1');
 window.CK_STORAGE.clearDeletionMarker('ck_save');
 assert.equal(data.has('ck_deleted_ck_save'),false);
 assert.equal(await window.CK_STORAGE.deleteSave('unexpected-key'),false);
});

test('autosave always uses its own rolling key, not the selected manual slot', () => {
 assert.match(save,/const key=auto\?'ck_autosave':skey\(slot\)/);
 assert.match(engine,/saveG\(true\)/);
 assert.match(engine,/lastAutoSaveAt=-60000;newGame\(\)/);
 assert.match(engine,/overwriteSlotTarget!==null/);
});

function saveFixture({failPrimary=false, readBackMismatch=false}={}){
 const data=new Map([['ck_autosave','previous verified checkpoint']]);
 const events=[];
 const context={
  S:{nodes:[],bs:[],us:[],rel:[],wt:[],ex:[],res:[],age:[],tech:[],ai:[],
     t:123,pal:0,kh:[],vc:[],px:[],civ:[0,1],dip:[],vp:[]},
  W:72,vm:0,scoreLimit:1200,aip:0,cmp:null,diff:0,cam:{x:0,y:0},
  slot:0,skey:()=> 'ck_save',hs:0,note:()=>{},
  localStorage:{
   setItem:(key,value)=>{events.push('primary-write');if(failPrimary)throw Error('quota exceeded');if(!readBackMismatch)data.set(key,value);},
   getItem:key=>{events.push('primary-readback');return data.get(key)??null;}
  },
  window:{CK_STORAGE:{
   mirrorSave:(key,value)=>{events.push('backup-write');assert.equal(data.get(key),value,
    'backup must never be newer than the verified primary checkpoint');return Promise.resolve(true);},
   clearDeletionMarker:()=>events.push('clear-deletion-marker')
  }}
 };
 vm.runInNewContext(save,context,{filename:'js/save.js'});
 return {data,events,context};
}

test('a failed primary save cannot write a misleading newer IndexedDB backup',()=>{
 for(const settings of [{failPrimary:true},{readBackMismatch:true}]){
  const f=saveFixture(settings);
  assert.equal(f.context.saveG(true),false,'primary failure must report unsuccessful save');
  assert.equal(f.data.get('ck_autosave'),'previous verified checkpoint',
   'failed saves do not overwrite the last known-good local checkpoint');
  assert.equal(f.events.includes('backup-write'),false,
   'a failed primary write or readback verification must not be mirrored');
  assert.equal(f.events.includes('clear-deletion-marker'),false,
   'a failed save must not resurrect a previously deleted slot');
 }
});

test('successful autosaves verify local storage before mirroring and clearing delete markers',()=>{
 const f=saveFixture();
 assert.equal(f.context.saveG(true),true);
 assert.deepEqual(f.events,['primary-write','primary-readback','backup-write','clear-deletion-marker']);
 assert.equal(f.context.hs,1);
 assert.equal(JSON.parse(f.data.get('ck_autosave')).t,123);
});

test('transient IndexedDB opening failure is retryable without restarting the game',async()=>{
 let opens=0;
 const writes=[];
 const fakeDatabase={
  transaction:(store,mode)=>{
   assert.equal(store,'game-saves');
   assert.equal(mode,'readwrite');
   const tx={objectStore:()=>({put:(value,key)=>{
    writes.push({key,value});
    queueMicrotask(()=>tx.oncomplete?.());
   }})};
   return tx;
  }
 };
 const window={
  indexedDB:{open:()=>{
   opens++;
   if(opens===1)throw Error('temporary storage denial');
   const request={result:fakeDatabase};
   queueMicrotask(()=>request.onsuccess?.());
   return request;
  }},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}}
 };
 vm.runInNewContext(persistence,{window,Promise,Set},{filename:'persistence.js'});
 assert.equal(await window.CK_STORAGE.mirrorSave('ck_save','first'),false,
  'first attempt should fail cleanly while storage is temporarily denied');
 assert.equal(await window.CK_STORAGE.mirrorSave('ck_save','restored'),true,
  'a subsequent checkpoint must retry opening IndexedDB');
 assert.equal(opens,2,'a failed open must not remain cached for the entire game session');
 assert.deepEqual(writes,[{key:'ck_save',value:'restored'}]);
});

test('IndexedDB version changes close obsolete connections and allow new backups',async()=>{
 let opens=0,closed=0,activeDatabase;
 const backedUp=[];
 const window={
  indexedDB:{open:()=>{
   opens++;
   const db={
    close:()=>{closed++},
    transaction:(store,mode)=>{
     assert.equal(store,'game-saves');
     assert.equal(mode,'readwrite');
     const tx={
      objectStore:()=>({put:(value,key)=>{
       backedUp.push({key,value,connection:opens});
       queueMicrotask(()=>tx.oncomplete?.());
      }})
     };
     return tx;
    }
   };
   activeDatabase=db;
   const req={result:db};
   queueMicrotask(()=>req.onsuccess?.());
   return req;
  }},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}}
 };
 vm.runInNewContext(persistence,{window,Promise,Set},{filename:'persistence.js'});
 assert.equal(await window.CK_STORAGE.mirrorSave('ck_save','before-upgrade'),true);
 assert.equal(opens,1);
 assert.equal(typeof activeDatabase.onversionchange,'function',
  'the open connection must subscribe to IndexedDB schema-change events');
 activeDatabase.onversionchange();
 assert.equal(closed,1,'old connection must be closed so another tab can upgrade');
 assert.equal(await window.CK_STORAGE.mirrorSave('ck_save','after-upgrade'),true);
 assert.equal(opens,2,'the next backup must acquire a new connection');
 assert.deepEqual(backedUp,[
  {key:'ck_save',value:'before-upgrade',connection:1},
  {key:'ck_save',value:'after-upgrade',connection:2}
 ]);
});

function restoreFixture(records,storage){
 const backedUp=Object.entries(records);
 let transactions=0;
 const fakeDb={
  close(){},
  transaction(_store,mode){
   assert.equal(mode,'readonly','restore must only read its backup database');
   transactions++;
   let index=0,request;
   const tx={
    objectStore:()=>({openCursor(){
     request={};
     queueMicrotask(next);
     return request;
    }})
   };
   function next(){
    const entry=backedUp[index++];
    request.result=entry?{
     key:entry[0],value:entry[1],
     continue:()=>queueMicrotask(next)
    }:null;
    request.onsuccess?.();
    if(!entry)queueMicrotask(()=>tx.oncomplete?.());
   }
   return tx;
  }
 };
 const window={
  localStorage:storage,
  indexedDB:{open(){
   const request={result:fakeDb};
   queueMicrotask(()=>request.onsuccess?.());
   return request;
  }}
 };
 vm.runInNewContext(persistence,{window,Promise,Set},{filename:'persistence.js'});
 return {storage,window,get transactions(){return transactions}};
}
test('IndexedDB recovery respects deleted slots and never overwrites existing saves',async()=>{
 const data=new Map([
  ['ck_save2','newer local checkpoint'],
  ['ck_deleted_ck_save3','1']
 ]);
 const storage={
  getItem:key=>data.get(key)??null,
  setItem:(key,value)=>data.set(key,value),
  removeItem:key=>data.delete(key)
 };
 const f=restoreFixture({
  ck_save:'recover first slot',
  ck_save2:'obsolete second slot',
  ck_save3:'deleted third slot',
  ck_autosave:'recover rolling autosave',
  random_key:'never recover unrecognised data'
 },storage);
 assert.equal(await f.window.CK_STORAGE.restoreMissing(),true);
 assert.equal(data.get('ck_save'),'recover first slot');
 assert.equal(data.get('ck_save2'),'newer local checkpoint');
 assert.equal(data.get('ck_save3'),undefined,'deleted saves must not be resurrected');
 assert.equal(data.get('ck_autosave'),'recover rolling autosave');
 assert.equal(data.get('random_key'),undefined);
 assert.equal(f.transactions,1);
});
test('save recovery refuses inaccessible deletion markers without aborting cursor processing',async()=>{
 const data=new Map();
 const storage={
  getItem:key=>{
   if(key.startsWith('ck_deleted_'))throw Error('browser storage access denied');
   return data.get(key)??null;
  },
  setItem:(key,value)=>data.set(key,value),
  removeItem:key=>data.delete(key)
 };
 const f=restoreFixture({ck_save:'untrusted backup',ck_autosave:'old autosave'},storage);
 assert.equal(await f.window.CK_STORAGE.restoreMissing(),false,
   'no backup may be restored if its deletion state cannot be checked');
 assert.equal(data.size,0);
 assert.equal(f.transactions,1,'the cursor should finish even after denied marker access');
});

test('save during ranged combat preserves arrows, siege splash and building-fired shots', async()=>{
 const {headlessGame}=await import('./helpers/headless-game.mjs');
 const {source,sandbox}=headlessGame();const context=vm.createContext(sandbox);
 vm.runInContext(source,context);
 const result=vm.runInContext(`(()=>{
  seedOv=123456;kingdoms=2;msz=0;mt=3;cmp=null;start();
  const archer=addU(0,'arc',30.5,30.5),siege=addU(0,'mang',31.5,30.5);
  const target=addU(1,'knight',35.5,30.5),nearby=addU(1,'spear',36,30.5);
  hit(archer,target);hit(siege,target);S.pj.push({x:31,y:30.5,t:target,a:{k:'tw',t:0}});
  siege.hp=0;S.us.splice(S.us.indexOf(siege),1); // Shot remains live after its shooter is removed.
  const fort=S.bs.find(b=>b.t===1&&b.k==='tc');
  S.pj.push({x:fort.x-1,y:fort.y+1,t:fort,a:{k:'arc',t:0}});
  const count=S.pj.length;saveG();const raw=localStorage.getItem(skey(slot));
  for(let i=0;i<90;i++)pjs(1/30);
  const expected=[target.hp,nearby.hp,fort.hp];
  const loaded=loadG(),restored=S.pj.length;
  const sourceLinked=S.pj.some(p=>p.a.k==='arc'&&p.a.t===0&&!S.us.includes(p.a));
  const targetsLinked=S.pj.every(p=>S.us.includes(p.t)||S.bs.includes(p.t));
  for(let i=0;i<90;i++)pjs(1/30);
  const actual=[S.us.find(u=>u.k==='knight'&&u.t===1).hp,S.us.find(u=>u.k==='spear'&&u.t===1).hp,S.bs.find(b=>b.t===1&&b.k==='tc').hp];
  return {count,loaded,restored,sourceLinked,targetsLinked,expected,actual,raw};
 })()`,context);
 assert.equal(result.count,4);assert.equal(result.loaded,true);assert.equal(result.restored,4);
 assert.equal(result.sourceLinked,true,'launched shots preserve their owner/type snapshot');assert.equal(result.targetsLinked,true);
 assert.deepEqual(Array.from(result.actual),Array.from(result.expected));
 const valid=JSON.parse(result.raw);
 for(const bad of [null,{},[{x:NaN}], [{...valid.pj[0],t:'n0'}], [{...valid.pj[0],x:-1}], [{...valid.pj[0],a:{k:'unknown',t:0}}], [{...valid.pj[0],a:{k:'arc',t:9}}], [{...valid.pj[0],aRef:'u999999'}]]){
  sandbox.badSave=JSON.stringify({...valid,pj:bad});
  assert.equal(vm.runInContext("(()=>{const before=S;localStorage.setItem(skey(slot),badSave);return loadG()===false&&S===before})()",context),true,'Malformed projectiles must be rejected before replacing the world');
 }
});

