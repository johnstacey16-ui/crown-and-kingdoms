import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const production=readFileSync(new URL('../js/simulation-building-production.js',import.meta.url),'utf8');
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const buildingUpdates=readFileSync(new URL('../js/simulation-building-updates.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');

test('building spawn and training rate policy have a single production owner',()=>{
 for(const name of ['spawnPos','trainRate']){
  assert.ok(production.includes('function '+name+'('));
  assert.ok(!simulation.includes('function '+name+'('));
 }
 assert.ok(production.includes('const MILITARY_PRODUCTION_BUILDINGS='));
 assert.ok(!simulation.includes('const MILITARY_PRODUCTION_BUILDINGS='));
 assert.ok(buildingUpdates.includes('spawnPos(b)')&&buildingUpdates.includes('trainRate(b,q.k)'));
 assert.doesNotThrow(()=>new vm.Script(production,{filename:'js/simulation-building-production.js'}));
 const S={tech:[{cons:true}]};
 const {trainRate}=vm.runInNewContext(production+'\n;({trainRate})',{S});
 assert.equal(trainRate({t:0,k:'bar'},'mil'),4/3);
 assert.equal(trainRate({t:0,k:'dock'},'gal'),4/3);
 for(const unit of ['vil','cart','fish','trn','cog'])
  assert.equal(trainRate({t:0,k:'dock'},unit),1,'civilian/naval support unit '+unit);
 assert.equal(trainRate({t:0,k:'tc'},'vil'),1);
 S.tech[0].cons=false;
 assert.equal(trainRate({t:0,k:'bar'},'mil'),1);
});

test('building spawn policy loads once before core simulation in browser, headless and offline',()=>{
 for(const paths of [browserScriptPaths(html),coreGameScriptPaths(html),
  coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
  const i=paths.indexOf('./js/simulation-building-production.js');
  assert.ok(i>0);
  assert.equal(paths[i-1],'./js/simulation-research.js');
  assert.equal(paths[i+1],'./js/simulation.js');
  assert.equal(paths.filter(path=>path==='./js/simulation-building-production.js').length,1);
 }
 assert.ok(sw.includes("'./js/simulation-building-production.js'"));
});
