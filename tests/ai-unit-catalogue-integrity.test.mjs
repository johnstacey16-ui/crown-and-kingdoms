import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const catalogue=vm.runInNewContext(config+'\n;({U,TE})');

test('AI counter plans name actual units, never upgraded unit-tech identifiers',()=>{
 const plans=[...ai.matchAll(/(?:units|own):\[([^\]]*)\]/g)];
 assert.ok(plans.length>=5,'retain land and naval counter-composition plans');
 for(const [,raw] of plans)for(const key of raw.split(',').map(x=>x.trim().replace(/^'|'$/g,''))){
  if(key)assert.ok(catalogue.U[key],key+' must be a real runtime unit');
 }
 assert.ok(catalogue.U.spear&&catalogue.U.camel,'cavalry counters remain accessible');
});

test('spearman upgrades remain researchable without untrainable pike/halb AI units',()=>{
 assert.ok(catalogue.TE.pike&&catalogue.TE.halb);
 assert.equal(catalogue.U.pike,undefined);
 assert.equal(catalogue.U.halb,undefined);
 assert.match(ai,/if\(k==='pike'&&humanCav>=2\)score\+=90/);
 assert.match(ai,/if\(k==='halb'&&humanCav>=2\)score\+=85/);
 assert.match(ai,/units:\['spear','camel'\],own:\['spear','camel'\]/);
 assert.doesNotMatch(ai,/units:\[[^\]]*'pike'|units:\[[^\]]*'halb'/);
 assert.doesNotMatch(ai,/humanInf=humanArmy\.filter\(u=>\[[^\]]*'pike'/);
});
