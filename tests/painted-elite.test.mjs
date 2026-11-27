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
test('forty-five dedicated Elite sheets retain sixteen complete poses and independent base assets',()=>{
 assert.deepEqual(elite.atlases.map(a=>a.meta.elite),['huskarl','lbow','mgd','axe','woad','bers','saml','tk','jaguar','kamayuk','shotel','gbeto','obuch','jan','chuko','genoa','plumed','rattan','composite','urumi','chakram','serjeant','cata','boyar','leitis','tarkan','keshik','monaspa','conq','huszar','coust','mamel','kipchak','centurion','arambai','konnik','ele','eled','wagon','orgun','husswagon','ratha','rathaM','footkonnik','ballistaEle']);
 for(const a of elite.atlases){
  const k=a.meta.elite,base=pack.atlases.find(b=>b.id==='painted-motion-'+k);
  assert.notEqual(a.src,base.src);
  for(let t=0;t<4;t++){
   const idle=a.meta.anims[k+'_elite/idle/'+t],walk=a.meta.anims[k+'_elite/walk/'+t],attack=a.meta.anims[k+'_elite/attack/'+t];
   assert.equal(idle.frames.length,1);assert.equal(walk.frames.length,8);assert.equal(attack.frames.length,8);
   assert.equal(new Set([...walk.frames,...attack.frames].map(f=>[f.x,f.y].join('/'))).size,16);
   assert.equal(walk.scale,attack.scale);assert.equal(idle.referenceHeight,walk.referenceHeight);
   const baseWalk=base.meta.anims[k+'/walk/'+t];
   const height=walk.scale*walk.referenceHeight,baseHeight=baseWalk.scale*baseWalk.referenceHeight;
   assert.equal(walk.dur,baseWalk.dur,'Elite retains base walking cadence: '+k);
   if(['ele','eled','wagon','orgun','husswagon','ratha','rathaM','ballistaEle'].includes(k)){
    const width=Math.max(...walk.frames.map(f=>f.w))*walk.scale,baseWidth=Math.max(...baseWalk.frames.map(f=>f.w))*baseWalk.scale;
    assert.ok(height<=baseHeight+1e-8&&width<=baseWidth+1e-8,'Elite fits both base vehicle dimensions: '+k);
    assert.ok(Math.abs(height-baseHeight)<1e-8||Math.abs(width-baseWidth)<1e-8,'vehicle fills a limiting dimension without arbitrary shrinking: '+k);
   }else assert.ok(Math.abs(height-baseHeight)<1e-8,'Elite retains its base body scale: '+k);
   assert.equal(a.meta.sourceActionFrame??12,k==='ele'?11:12,'source contact/release phase: '+k);
  }
 }
});
test('every current main Elite kind and alternate form has a dedicated original sheet',()=>{
 const run=fixture(),main=JSON.parse(run('JSON.stringify([...new Set(CIV.filter(c=>c.elite).map(c=>c.uu))])'));
 assert.equal(main.length,43);
 const painted=new Set(elite.atlases.map(a=>a.meta.elite));
 assert.deepEqual(main.filter(k=>!painted.has(k)),[],'no main researched unique-unit appearance is missing');
 assert.ok(painted.has('ratha')&&painted.has('rathaM'),'both stances have their own original artwork');
 assert.ok(painted.has('footkonnik'),'dismounted form has its own original artwork');
});
test('solo rendering selects only the owning researched Elite tier and falls back after atlas loss',()=>{
 const run=fixture();
 for(const [k,id]of [['huskarl',18],['lbow',1],['mgd',2],['axe',0],['woad',6],['bers',7],['saml',11],['tk',5],['jaguar',19],['kamayuk',21],['shotel',22],['gbeto',23],['obuch',35],['jan',9],['chuko',10],['genoa',15],['plumed',20],['rattan',28],['composite',41],['urumi',37],['chakram',39],['serjeant',34],['cata',3],['boyar',16],['leitis',32],['tarkan',17],['keshik',30],['monaspa',42],['conq',14],['huszar',25],['coust',33],['mamel',8],['kipchak',31],['centurion',40],['arambai',27],['konnik',29],['ele',4],['eled',13],['wagon',24],['orgun',26],['husswagon',36],['ratha',38],['rathaM',38],['footkonnik',29],['ballistaEle',12]]){
  run('S.civ=['+id+','+id+'];S.tech=[{},{}]');
  const draw=t=>'unitAssetFrame('+JSON.stringify(k)+','+t+',{state:1,time:.2},!!eliteUniqueUnitAppearance('+JSON.stringify(k)+','+t+'))';
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
 for(const [k,id]of [['huskarl',18],['lbow',1],['mgd',2],['axe',0],['woad',6],['bers',7],['saml',11],['tk',5],['jaguar',19],['kamayuk',21],['shotel',22],['gbeto',23],['obuch',35],['jan',9],['chuko',10],['genoa',15],['plumed',20],['rattan',28],['composite',41],['urumi',37],['chakram',39],['serjeant',34],['cata',3],['boyar',16],['leitis',32],['tarkan',17],['keshik',30],['monaspa',42],['conq',14],['huszar',25],['coust',33],['mamel',8],['kipchak',31],['centurion',40],['arambai',27],['konnik',29],['ele',4],['eled',13],['wagon',24],['orgun',26],['husswagon',36],['ratha',38],['rathaM',38],['footkonnik',29],['ballistaEle',12]]){
  run(`S.civ=[${id},${id}];S.tech=[{},{}];S.us=[];globalThis.a=addU(0,'${k}',20,20);globalThis.b=addU(1,'${k}',21,20);globalThis.w={...S,civ:[${id},${id}],tech:[{[CIV[${id}].elite.k]:1},{}]}`);
  const before=run('JSON.stringify([S.tech,w.tech,S.us,S.bs])');
  assert.equal(run(`eliteUniqueUnitAppearance('${k}',0)`),false);
  assert.equal(run(`!!eliteUniqueUnitAppearance('${k}',0,w)`),true);
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

test('a real researched Konnik dismount keeps Elite art and label without extending combat upgrade eligibility',()=>{
 const run=fixture();
 run("S.civ=[29,1];S.tech=[{eliteKonnik:1},{}];S.us=[];globalThis.mounted=addU(0,'konnik',22,28);globalThis.enemy=addU(1,'knight',22.5,28);mounted.hp=1;dmgT(enemy,mounted);globalThis.foot=S.us[S.us.length-1]");
 assert.equal(run('mounted.dead'),1);assert.equal(run('foot.k'),'footkonnik');
 assert.equal(run('foot.hp'),45);assert.equal(run('mhp(foot)'),45);
 assert.equal(run("eliteUniqueUnitUpgrade('footkonnik',0)"),null,'appearance alias does not apply mounted combat modifiers');
 assert.equal(run("unitName('footkonnik',0)"),'Elite Dismounted Konnik');
 const before=run('JSON.stringify([S.tech,S.us,S.bs,S.res,S.t])');
 assert.equal(run("!!unitAssetFrame(foot.k,0,unitVisualPose(foot,S.t),eliteUniqueUnitAppearance(foot.k,0)).elite"),true);
 assert.equal(run('JSON.stringify([S.tech,S.us,S.bs,S.res,S.t])'),before);
 run('queueRosterTintWarmup(S)');
 assert.equal(run('TINT_WARMUP.jobs.some(q=>q.kind==="footkonnik_elite")'),true);
 run('S.tech[0].eliteKonnik=0');
 assert.equal(run("eliteUniqueUnitAppearance('footkonnik',0)"),false);
 assert.equal(run("unitName('footkonnik',0)"),'Dismounted Konnik');
});

test('Khmer Elite research applies to Ballista Elephant only without borrowing Persian Elite artwork',()=>{
 const run=fixture();
 run("S.civ=[12,4];S.tech=[{eliteBallistaElephant:1},{eliteWarElephant:1}]");
 assert.equal(run("!!eliteUniqueUnitAppearance('ballistaEle',0)"),true);
 assert.equal(run("!!eliteUniqueUnitAppearance('ele',0)"),false);
 assert.equal(run("!!eliteUniqueUnitAppearance('ballistaEle',1)"),false);
 assert.equal(run("!!eliteUniqueUnitAppearance('ele',1)"),true);
 assert.equal(run("!!unitAssetFrame('ballistaEle',0,{state:1,time:.2},true)?.elite"),true,'the distinct Khmer Elite sheet is rendered');
});
