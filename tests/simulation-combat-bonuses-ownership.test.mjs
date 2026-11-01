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

test('unchanged monk conversion helpers have one classic-script owner',()=>{
 const functions=['resetConversion','conversionRange','unitSight','canConvert',
  'beginConversion','conversionWindow','completeConversion','tickConversion'];
 for(const name of functions){
  const pattern=new RegExp('function '+name+'\\(');
  assert.match(bonuses,pattern,'combat owner must define '+name);
  assert.doesNotMatch(simulation,pattern,'main simulation must not duplicate '+name);
 }
 assert.match(bonuses,/const CONVERSION_SIEGE=new Set\(/);
 assert.doesNotMatch(simulation,/const CONVERSION_SIEGE=new Set\(/);
 // The unit tick retains its existing conversion path without coupling to a
 // specific source file; full executable monk tests cover faith, resistance
 // and authenticated command behaviour.
 for(const name of ['resetConversion','canConvert','beginConversion','tickConversion'])
  assert.match(simulation,new RegExp(name+'\\('));
 const ctx={S:{tech:[{},{}],us:[],bs:[]},U:{mon:{},mil:{}},
  isHostile:(a,b)=>a!==b,arrowSightBonus:()=>0};
 vm.createContext(ctx);
 vm.runInContext(bonuses+'\n;globalThis.monkHelpers={conversionRange,unitSight,canConvert,resetConversion};',ctx);
 const monk={k:'mon',t:0,hp:25,st:0},enemy={k:'mil',t:1,hp:40,x:2,y:2};
 ctx.S.us.push(monk,enemy);
 assert.equal(ctx.monkHelpers.canConvert(monk,enemy),true);
 monk.cv=8;monk.cvNext=9;monk.cvTargetId='old';monk.cvTeam=1;
 ctx.monkHelpers.resetConversion(monk);
 assert.deepEqual([monk.cv,monk.cvNext,monk.cvTargetId,monk.cvTeam],[0,0,null,null]);
 assert.equal(ctx.monkHelpers.conversionRange(monk,enemy),9);
 ctx.S.tech[0].blockPrinting=1;
 assert.equal(ctx.monkHelpers.conversionRange(monk,enemy),12);
 assert.equal(ctx.monkHelpers.unitSight(monk),14);
});

test('all browser/offline/headless scripts load bonus rules once before damage',()=>{
 for(const paths of [browserScriptPaths(html),coreGameScriptPaths(html),
  coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
  const i=paths.indexOf('./js/simulation-combat-bonuses.js');
  assert.ok(i>=0,'combat bonus script must be included');
  assert.deepEqual(paths.slice(i,i+9),[
   './js/simulation-combat-bonuses.js','./js/simulation-victory.js',
   './js/simulation-logistics.js','./js/simulation-resource-routing.js','./js/simulation-production-queues.js','./js/simulation-research.js',
   './js/simulation-building-production.js','./js/simulation-building-updates.js','./js/simulation.js']);
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
