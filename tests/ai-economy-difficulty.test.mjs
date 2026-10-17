import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ai=fs.readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');

test('AI production filters unaffordable units before selecting counters',()=>{
 assert.match(ai,/trOf\(b\)\.filter\(k=>U\[k\]&&can\(t,U\[k\]\.cost\)/);
});
test('AI saves for age advancement after prerequisites are available',()=>{
 assert.match(ai,/const savingForAge=/);
 assert.match(ai,/agePrereqs>=2/);
 assert.match(ai,/Object\.keys\(cost\)\.every\(res=>\(R\[res\]\|\|0\)-\(e\.cost\[res\]\|\|0\)>=cost\[res\]\*\.75\)/);
});
test('six AI tiers have monotonic decision cadence and attack grace',()=>{
 const cd=[4.5,3.2,2.4,1.8,1.35,1.05];
 const grace=[720,540,360,260,190,150];
 const waves=[12,14,18,22,26,30];
 for(let i=1;i<6;i++){assert.ok(cd[i]<cd[i-1]);assert.ok(grace[i]<grace[i-1]);assert.ok(waves[i]>waves[i-1]);}
 for(const table of [cd,grace,waves])assert.ok(ai.includes('['+table.join(',')+'][diff]'));
});
