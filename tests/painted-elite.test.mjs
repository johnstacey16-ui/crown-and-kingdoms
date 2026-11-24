import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const elite=JSON.parse(read('assets/elite-manifest.json'));
const pack=JSON.parse(read('assets/atlas-manifest.json'));
function fixture(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\n'+read('js/assets.js')+'\n'+read('js/network-commands.js')+'\n'+read('js/network-unit-projection.js')+'\n;globalThis.run=code=>eval(code)',sandbox);
 const run=sandbox.run;run('start();mode="title"');
 for(const a of [...elite.atlases,...pack.atlases.filter(a=>a.id.startsWith('painted-motion-'))])run('regAtlas('+JSON.stringify(a.id)+',{},'+JSON.stringify(a.meta)+')');
 return run;
}
test('twenty-two dedicated Elite sheets retain sixteen complete poses and independent base assets',()=>{
 assert.deepEqual(elite.atlases.map(a=>a.meta.elite),['huskarl','lbow','mgd','axe','woad','bers','saml','tk','jaguar','kamayuk','shotel','gbeto','obuch','jan','chuko','genoa','plumed','rattan','composite','urumi','chakram','serjeant']);
 for(const a of elite.atlases){
  const k=a.meta.elite,base=pack.atlases.find(b=>b.id==='painted-motion-'+k);
  assert.notEqual(a.src,base.src);
  for(let t=0;t<4;t++){
   const idle=a.meta.anims[k+'_elite/idle/'+t],walk=a.meta.anims[k+'_elite/walk/'+t],attack=a.meta.anims[k+'_elite/attack/'+t];
   assert.equal(idle.frames.length,1);assert.equal(walk.frames.length,8);assert.equal(attack.frames.length,8);
   assert.equal(new Set([...walk.frames,...attack.frames].map(f=>[f.x,f.y].join('/'))).size,16);
   assert.equal(walk.scale,attack.scale);assert.equal(idle.referenceHeight,walk.referenceHeight);
  }
 }
});
test('solo rendering selects only the owning researched Elite tier and falls back after atlas loss',()=>{
 const run=fixture();
 for(const [k,id]of [['huskarl',18],['lbow',1],['mgd',2],['axe',0],['woad',6],['bers',7],['saml',11],['tk',5],['jaguar',19],['kamayuk',21],['shotel',22],['gbeto',23],['obuch',35],['jan',9],['chuko',10],['genoa',15],['plumed',20],['rattan',28],['composite',41],['urumi',37],['chakram',39],['serjeant',34]]){
  run('S.civ=['+id+','+id+'];S.tech=[{},{}]');
  const draw=t=>'unitAssetFrame('+JSON.stringify(k)+','+t+',{state:1,time:.2},!!eliteUniqueUnitUpgrade('+JSON.stringify(k)+','+t+'))';
  assert.equal(run('!!'+draw(0)+'.elite'),false);
  run('S.tech[0][CIV[S.civ[0]].elite.k]=1');
  assert.equal(run('!!'+draw(0)+'.elite'),true);
  assert.equal(run('!!'+draw(1)+'.elite'),false);
  run('S.civ[0]=('+id+'+1)%CIV.length');assert.equal(run('!!'+draw(0)+'.elite'),false,'stale research cannot upgrade another civilization');run('S.civ[0]='+id);
  const before=run('JSON.stringify([S.tech,S.us,S.bs,S.res,S.t])');
  run(draw(0));assert.equal(run('JSON.stringify([S.tech,S.us,S.bs,S.res,S.t])'),before);
  run('ASSET.atl["painted-elite-'+k+'"].ok=false');
  assert.equal(run('!!'+draw(0)+'.elite'),false,'base pose remains usable');
  run('ASSET.atl["painted-elite-'+k+'"].ok=true');
 }
});
test('network projection uses its supplied world research, including visible opponents',()=>{
 const run=fixture();
 for(const [k,id]of [['huskarl',18],['lbow',1],['mgd',2],['axe',0],['woad',6],['bers',7],['saml',11],['tk',5],['jaguar',19],['kamayuk',21],['shotel',22],['gbeto',23],['obuch',35],['jan',9],['chuko',10],['genoa',15],['plumed',20],['rattan',28],['composite',41],['urumi',37],['chakram',39],['serjeant',34]]){
  run(`S.civ=[${id},${id}];S.tech=[{},{}];S.us=[];globalThis.a=addU(0,'${k}',20,20);globalThis.b=addU(1,'${k}',21,20);globalThis.w={...S,civ:[${id},${id}],tech:[{[CIV[${id}].elite.k]:1},{}]}`);
  const before=run('JSON.stringify([S.tech,w.tech,S.us,S.bs])');
  assert.equal(run(`eliteUniqueUnitUpgrade('${k}',0)`),null);
  assert.equal(run(`!!eliteUniqueUnitUpgrade('${k}',0,w)`),true);
  assert.equal(run('!!CK_UNIT_PROJECTION.project(w,0,W,H).units.find(e=>e.id===a.netId).pose.elite'),true);
  assert.equal(run('!!CK_UNIT_PROJECTION.project(w,0,W,H).battlefield.enemies.find(e=>e.id===b.netId).pose.elite'),false);
  assert.equal(run('JSON.stringify([S.tech,w.tech,S.us,S.bs])'),before);
 }
});
test('roster warm-up prepares the selected Elite frames inside the unchanged creation budget',()=>{
 const run=fixture();run('S.civ=[18,18];S.tech=[{eliteHuskarl:1},{}];S.us=[];addU(0,"huskarl",20,20);queueRosterTintWarmup(S)');
 assert.ok(run('TINT_WARMUP.jobs.length')>0);
 assert.equal(run('TINT_WARMUP.jobs.every(q=>q.kind==="huskarl_elite")'),true);
 let guard=0;while(run('TINT_WARMUP.status==="pending"')&&guard++<100){assert.ok(run('advanceRosterTintWarmup().created')<=4)}
 assert.equal(run('rosterTintWarmupReadiness(S).ready'),true);
});
