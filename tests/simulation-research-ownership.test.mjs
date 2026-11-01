import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const research=readFileSync(new URL('../js/simulation-research.js',import.meta.url),'utf8');
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const buildingUpdates=readFileSync(new URL('../js/simulation-building-updates.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const functions=['ageRequirements','researchCost','research'];

test('age gates, civilization-specific costs and research orders have one owner',()=>{
 for(const fn of functions){
  assert.ok(research.includes('function '+fn+'('),'research module owns '+fn);
  assert.ok(!simulation.includes('function '+fn+'('),'simulation does not duplicate '+fn);
 }
 assert.ok(buildingUpdates.includes('function upB('),'building completion/tech application keeps the extracted tick');
 assert.ok(!simulation.includes('function upB('),'main simulation must not duplicate building tick');
 assert.doesNotThrow(()=>new vm.Script(research,{filename:'js/simulation-research.js'}));
 const ctx={TE:{forging:{cost:{f:150,g:40}}},CIV:[{n:'Spanish'},{n:'Britons'}],S:{civ:[0,1]}};
 const f=vm.runInNewContext(research+'\n;({researchCost,research})',ctx);
 assert.equal(f.researchCost({k:'smith',t:0},'forging').g,0,'Spanish Blacksmith gold exemption retained');
 assert.equal(f.researchCost({k:'smith',t:1},'forging').g,40,'other civilization keeps original gold cost');
 assert.equal(f.research(null,'forging'),false,'invalid research orders are rejected');
});

test('research script loads exactly once before building completion in all production graphs',()=>{
 for(const paths of [browserScriptPaths(html),coreGameScriptPaths(html),
  coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
  const i=paths.indexOf('./js/simulation-research.js');
  assert.ok(i>0,'research script exists');
  assert.equal(paths[i-1],'./js/simulation-production-queues.js');
  assert.equal(paths[i+1],'./js/simulation-building-production.js');
  assert.equal(paths[i+2],'./js/simulation-building-updates.js');
  assert.equal(paths[i+3],'./js/simulation.js');
  assert.equal(paths.filter(p=>p==='./js/simulation-research.js').length,1);
 }
 assert.ok(sw.includes("'./js/simulation-research.js'"));
});
