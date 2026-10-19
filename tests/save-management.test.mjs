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
