import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const bonuses=read('js/simulation-combat-bonuses.js');
const simulation=read('js/simulation.js');
const html=read('index.html'),sw=read('sw.js');
const helpers=['spearLineBonus','camelLineBonus','scoutLineBonus','skirmisherBonus','meleeResearchAttackBonus'];

test('one damage-bonus module owns every armoured-unit bonus helper',()=>{
 for(const name of helpers){
  const pattern=new RegExp('function '+name+'\\(');
  assert.match(bonuses,pattern,name+' should live in the dedicated module');
  assert.doesNotMatch(simulation,pattern,name+' must not be redeclared');
 }
 for(const name of ['SPEAR_CAVALRY','SPEAR_CAMELS','SPEAR_ELEPHANTS','SKIRM_ARCHER_KINDS',
  'SKIRM_CAV_ARCHER_KINDS','CAMEL_CAVALRY','CAMEL_CLASS']){
  assert.match(bonuses,new RegExp('const '+name+'='));
  assert.doesNotMatch(simulation,new RegExp('const '+name+'='));
 }
 assert.match(simulation,/function dmgT\(a,t\)/);
 assert.match(simulation,/spearLineBonus\(a,t\)/);
 assert.match(simulation,/camelLineBonus\(a,t\)/);
 assert.doesNotThrow(()=>new vm.Script(bonuses));
 assert.doesNotThrow(()=>new vm.Script(simulation));
});

test('all browser/offline/headless scripts load bonus rules once before damage',()=>{
 for(const paths of [browserScriptPaths(html),coreGameScriptPaths(html),
  coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
  const i=paths.indexOf('./js/simulation-combat-bonuses.js');
  assert.ok(i>=0,'combat bonus script must be included');
  assert.deepEqual(paths.slice(i,i+7),[
   './js/simulation-combat-bonuses.js','./js/simulation-victory.js',
   './js/simulation-logistics.js','./js/simulation-resource-routing.js','./js/simulation-production-queues.js','./js/simulation-research.js','./js/simulation.js']);
  assert.equal(paths.filter(p=>p==='./js/simulation-combat-bonuses.js').length,1);
 }
 assert.ok(sw.includes("'./js/simulation-combat-bonuses.js'"));
});

test('independent combat helper execution keeps source-pinned class counters',()=>{
 const ctx={U:{spear:{bn:{}},camel:{bn:{}}},S:{tech:[{}]}};
 vm.createContext(ctx);
 vm.runInContext(bonuses+'\n;globalThis.bonuses={spearLineBonus,camelLineBonus,meleeResearchAttackBonus};',ctx);
 const spear={k:'spear',t:0},camel={k:'camel',t:0},knight={k:'knight',t:0};
 assert.equal(ctx.bonuses.spearLineBonus(spear,knight),15);
 assert.equal(ctx.bonuses.spearLineBonus(spear,camel),12);
 assert.equal(ctx.bonuses.camelLineBonus(camel,knight),9);
 assert.equal(ctx.bonuses.meleeResearchAttackBonus({forging:1,ironCasting:1,blastFurnace:1}),4);
 ctx.S.tech[0].hcamel=1;
 assert.equal(ctx.bonuses.camelLineBonus(camel,knight),18);
 ctx.S.tech[0].halb=1;
 assert.equal(ctx.bonuses.spearLineBonus(spear,camel),26);
});
