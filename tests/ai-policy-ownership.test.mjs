import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const policy=read('js/ai-policy.js'),ai=read('js/ai.js');

test('AI decision helpers have exactly one dedicated owner',()=>{
 for(const fn of ['aiBaseDefenceThreat','aiCanResearchWhileSaving','aiQueuedUnits',
  'aiSiegeTarget','aiAvailableBuilder','aiBuilderCandidates','aiReachableBuilder',
  'aiSavingAgeFood','aiTownTechReady','aiDockWaterReach','aiRebal',
  'aiOpeningWaveNeed']){
  assert.match(policy,new RegExp('function '+fn+'\\('));
  assert.doesNotMatch(ai,new RegExp('function '+fn+'\\('));
 }
 assert.match(ai,/function aiBuild\(/);
 assert.match(ai,/aiCanResearchWhileSaving\(/);
 assert.match(ai,/aiQueuedUnits\(/);
 assert.match(ai,/aiDockWaterReach\(/);
 assert.match(ai,/aiRebal\(/);
 assert.match(ai,/aiOpeningWaveNeed\(/);
 assert.doesNotThrow(()=>new vm.Script(policy));
 assert.doesNotThrow(()=>new vm.Script(ai));
});
test('AI policy precedes AI loop after simulation across production and offline bundles',()=>{
 const html=read('index.html'),sw=read('sw.js');
 for(const scripts of [browserScriptPaths(html),coreGameScriptPaths(html),
  coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
  const i=scripts.indexOf('./js/simulation.js');
  assert.deepEqual(scripts.slice(i,i+3),['./js/simulation.js','./js/ai-policy.js','./js/ai.js']);
 }
 assert.ok(sw.includes("'./js/ai-policy.js'"));
 const browser=browserScriptPaths(html),core=coreGameScriptPaths(html);
 assert.deepEqual(core,browser.slice(browser.indexOf('./js/config.js'),browser.indexOf('./engine.js')+1),
  'AI must participate in the same ordered browser/core script span');
});
test('AI queue and age-saving helpers execute without game state',()=>{
 const ctx={};vm.createContext(ctx);
 vm.runInContext(policy+'\n;globalThis.units=aiQueuedUnits;globalThis.canSave=aiCanResearchWhileSaving;',ctx);
 assert.equal(ctx.units([{hp:100,q:[{k:'gal'},{k:'fish'},{k:'gal'}]},{hp:0,q:[{k:'gal'}]}],'gal'),2);
 assert.equal(ctx.canSave({f:850,g:250},{f:30,g:20},{f:800,g:200}),true);
 assert.equal(ctx.canSave({f:810,g:250},{f:30,g:20},{f:800,g:200}),false);
});
