import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const code=engine.slice(engine.indexOf('function refreshSlots(){'),engine.indexOf('function slotsCtl(){'));
function fixture(){
 const data=new Map();
 const ctx=vm.createContext({localStorage:{getItem:k=>data.get(k)??null},skey:n=>n?'ck_save'+(n+1):'ck_save',SI:[],hs:false,CAMP:[],cl:(v,a,b)=>Math.max(a,Math.min(b,v)),slot:0,mode:'title',window:{CK_STORAGE:{restoreMissing:()=>Promise.resolve(false)}}});
 vm.runInContext(code,ctx);
 return {ctx,data,run:c=>vm.runInContext(c,ctx)};
}
test('restored manual and unreadable saves enable Continue; autosave works independently',()=>{
 const f=fixture();
 f.run('refreshSlots()');assert.equal(f.ctx.hs,false);
 f.data.set('ck_save2',JSON.stringify({v:1,us:[],civ:[0,1],diff:5,aiDifficultyVersion:2}));
 f.run('refreshSlots()');assert.equal(f.ctx.hs,true);assert.equal(f.ctx.SI[1].d,5);
 f.data.set('ck_save2','broken');f.run('refreshSlots()');assert.equal(f.ctx.hs,true);assert.equal(f.ctx.SI[1],'bad');
 f.data.clear();f.data.set('ck_autosave','saved');f.run('refreshSlots()');assert.equal(f.ctx.hs,true);
 f.data.clear();f.run('refreshSlots()');assert.equal(f.ctx.hs,false);
 assert.ok(engine.includes('restoreMissing().then(()=>refreshSlots())'),'startup refreshes discovery after IndexedDB recovery');
});
test('all six difficulty levels have readable save-menu labels',()=>{
 const f=fixture();
 Object.assign(f.ctx,{sm:'load',CIV:[{n:'One'},{n:'Two'}]});
 vm.runInContext(config+'\n'+ui,f.ctx);
 for(const [d,label] of ['Easiest','Easy','Moderate','Hard','Hardest','Extreme'].entries()){
  f.ctx.SI=[{civ:[0,1],t:0,w:72,d}];
  assert.ok(f.run('slotItems()[0].d()').includes(label));
 }
});
