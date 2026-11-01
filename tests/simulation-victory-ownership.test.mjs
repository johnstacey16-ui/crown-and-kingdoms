import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths,loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const victory=read('js/simulation-victory.js');
const simulation=read('js/simulation.js');
const html=read('index.html');
const sw=read('sw.js');

test('victory and score rules have one dedicated owner',()=>{
 for(const name of ['tcEnds','endGame','elim','kingdomAlive','kingdomScore','kingHillControl','vict']){
  assert.match(victory,new RegExp('function '+name+'\\('));
  assert.doesNotMatch(simulation,new RegExp('function '+name+'\\('));
 }
 assert.match(simulation,/if\(vm\)vict\(dt\)/);
 assert.match(simulation,/kingdomScore\(t\)/);
 assert.doesNotThrow(()=>new vm.Script(victory,{filename:'js/simulation-victory.js'}));
 assert.doesNotThrow(()=>new vm.Script(simulation,{filename:'js/simulation.js'}));
});
test('victory loads before logistics and simulation in browser, headless and offline shell',()=>{
 for(const scripts of [browserScriptPaths(html),coreGameScriptPaths(html),
  coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
  const victoryAt=scripts.indexOf('./js/simulation-victory.js');
  assert.ok(victoryAt>=0);
  assert.equal(scripts[victoryAt+1],'./js/simulation-logistics.js');
  assert.equal(scripts[victoryAt+2],'./js/simulation-resource-routing.js');
  assert.equal(scripts[victoryAt+3],'./js/simulation-production-queues.js');
  assert.equal(scripts[victoryAt+4],'./js/simulation-research.js');
  assert.equal(scripts[victoryAt+5],'./js/simulation.js');
 }
 assert.match(sw,/['"]\.\/js\/simulation-victory\.js['"]/);
 assert.match(loadCoreGameSource(),/function kingHillControl\(dt\)/);
});
test('elimination, result precedence and score calculations remain executable',()=>{
 const ctx={S:{over:null,why:null},cmp:null,vm:0,mode:'play',
  sting:()=>{},rumble:()=>{},campMark:()=>{},isHostile:(a,b)=>a!==b};
 vm.createContext(ctx);
 vm.runInContext(victory,ctx,{filename:'js/simulation-victory.js'});
 ctx.endGame('win','victory');assert.equal(ctx.S.over,'win');
 ctx.endGame('lose','defeat');assert.equal(ctx.S.over,'lose');
 ctx.endGame('win','late');assert.equal(ctx.S.over,'lose');
 assert.equal(ctx.S.why,'defeat');
 ctx.S={over:null,why:null,teamN:2,bs:[{t:0,k:'tc',hp:100}],us:[]};
 ctx.vm=6;ctx.elim();assert.equal(ctx.S.over,'win');
 ctx.S={over:null,why:null,teamN:2,bs:[{t:1,k:'tc',hp:100}],us:[]};
 ctx.elim();assert.equal(ctx.S.over,'lose');
 ctx.S={over:null,res:[{f:100,w:200}],us:[{t:0,k:'mil',hp:30}],
  bs:[{t:0,k:'tc',hp:200,mh:200}],tech:[{wheel:1,hpb:{}}],
  age:[1],rel:[{m:{t:0}}]};
 ctx.U={mil:{hp:30,cost:{f:40}}};
 ctx.B={tc:{hp:200,cost:{w:80}}};
 assert.equal(ctx.kingdomScore(0),475);
});
