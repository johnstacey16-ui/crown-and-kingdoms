import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const start=ai.indexOf('function aiOpeningWaveNeed(base,age,wave){');
const end=ai.indexOf('const waveReady=arm.filter(',start);
assert.ok(start>=0&&end>start,'opening-wave logic must remain executable');
const openingNeed=vm.runInNewContext(ai.slice(start,end)+'\n;aiOpeningWaveNeed;');
test('a first Feudal push may launch with a smaller but viable army',()=>{
 assert.equal(openingNeed(14,1,0),10,'normal 14-soldier wave becomes a ten-soldier first push');
 assert.equal(openingNeed(12,1,0),9,'lower difficulty retains its relative sizing');
 assert.equal(openingNeed(18,1,0),13,'higher difficulty still needs a larger group');
 assert.equal(openingNeed(4,1,0),6,'never launch a tiny trickle');
});
test('later Feudal waves and other ages retain existing wave thresholds',()=>{
 assert.equal(openingNeed(14,1,1),14);
 assert.equal(openingNeed(18,2,0),18);
 assert.equal(openingNeed(22,3,0),22);
 assert.equal(openingNeed(14,0,0),14);
 assert.match(ai,/waveReady\.length>=aiOpeningWaveNeed\(need,S\.age\[t\],A\.wave\)/);
 assert.match(ai,/A\.wave\+\+/,'only actual wave launches increment the wave number');
});
