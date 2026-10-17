import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../js/campaign.js',import.meta.url),'utf8');
const definition=source.slice(source.indexOf('const campDone='),source.indexOf('function startScenario('));
function progress(raw){
 const data=new Map(raw===undefined?[]:[['ck_camp',raw]]);
 const context={localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
 vm.runInNewContext('const CAMP=Array.from({length:19});'+definition+';globalThis.read=campDone;globalThis.mark=campMark',context);
 return {read:()=>Array.from(context.read()),mark:context.mark,data};
}
test('campaign progress has exactly nineteen normalized entries',()=>{
 const p=progress(JSON.stringify([true,1,'1',false,{},null]));
 assert.deepEqual(p.read().slice(0,7),[1,1,0,0,0,0,0]);
 assert.equal(p.read().length,19);
});
test('corrupt progress and invalid completion indices are safe',()=>{
 const p=progress('{broken');
 assert.deepEqual(p.read(),[]);
 for(const i of [-1,19,1.5,'2',NaN])p.mark(i);
 assert.equal(p.data.get('ck_camp'),'{broken');
 p.mark(2);
 assert.equal(JSON.parse(p.data.get('ck_camp'))[2],1);
});
test('naval spawn selection rejects invalid requests without reading map',()=>{
 const start=source.indexOf('function raidShipPositions('),end=source.indexOf('\nfunction raid(',start);
 const ctx={S:null,W:0,H:0,Number,Math,Set};
 vm.runInNewContext(source.slice(start,end),ctx);
 assert.deepEqual(Array.from(ctx.raidShipPositions(null,5)),[]);
 assert.deepEqual(Array.from(ctx.raidShipPositions({x:1,y:1},-1)),[]);
});
test('campaign briefing guards locked missions at confirmation',()=>{
 assert.match(source,/function briefCtl\(\)\{if\(E\[0\]\)\{const arc=CAMP_ARCS\.find/);
 assert.match(source,/done\[arc\.ids\[pos-1\]\]/);
});
