import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const catalogue=vm.runInNewContext(readFileSync(new URL('../js/config.js',import.meta.url),'utf8')+'\n;({U,B,TE})');
const json=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
  seedOv=220462;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;start();snd=0;
  S.us=[];S.bs=[];S.pj=[];S.nodes=[];S.g.fill(0);S.gt.fill(0);S.nd.fill(null);
  S.wt.fill(1);S.ex.fill(1);S.vs.fill(1);S.civ=[0,1];S.age=[2,2];S.tech=[{},{}];
  S.res=S.res.map(()=>({f:8000,w:8000,g:8000,s:8000}));
  globalThis.dock=addB(0,'dock',12,12,true);
  globalThis.enemyDock=addB(1,'dock',24,12,true);
  globalThis.runShip=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.runShip(code);
}

test('Fire and Demolition Ships are separately trainable in Castle Age using ordinary paid queues',()=>{
 const {U,B,TE}=catalogue;
 assert.deepEqual(json(B.dock.tr),['fish','gal','fire','demo','trn','cog']);
 for(const kind of ['fire','demo']){
  assert.ok(U[kind].sh);
  assert.equal(U[kind].age,2);
  assert.ok(U[kind].cost.w>0&&U[kind].cost.g>0);
 }
 assert.equal(TE.navalHull.hpb.fire,35);
 assert.equal(TE.navalHull.hpb.demo,20);
 assert.equal(TE.navalAtk.atkb.fire,3);
 const c=fixture();
 c('S.age[0]=1');
 assert.equal(c("train(dock,'fire')"),false,'cannot train before Castle Age');
 c('S.age[0]=2');
 const wood=c('S.res[0].w'),gold=c('S.res[0].g');
 assert.equal(c("train(dock,'fire')"),true);
 assert.equal(c("train(dock,'demo')"),true);
 assert.equal(c('S.res[0].w'),wood-U.fire.cost.w-U.demo.cost.w);
 assert.equal(c('S.res[0].g'),gold-U.fire.cost.g-U.demo.cost.g);
 assert.equal(c("JSON.stringify(dock.q.map(q=>q.k))"),'["fire","demo"]');
 assert.equal(c("train(enemyDock,'demo')"),true,'each kingdom pays from its own resources');
});

test('Fire Ship fights at close range, counters Galleys, and respects ownership',()=>{
 const c=fixture();
 c("globalThis.fire=addU(0,'fire',40.5,40.5);globalThis.galley=addU(1,'gal',41.6,40.5);globalThis.friendly=addU(0,'gal',40.8,40.5)");
 assert.equal(c('attackRange(fire)'),1.75);
 assert.ok(c('attackReload(fire)')<c('attackReload(galley)'));
 const hit=()=>{c('galley.hp=1000;dmgT(fire,galley)');return 1000-c('galley.hp')};
 assert.equal(hit(),9,'Fire Ship counters Galleys after their 1 melee armour');
 c("fire.o='a';fire.tg=galley;fire.cd=0;upU(fire,.1)");
 assert.equal(c('S.pj.length'),0,'fire attack does not create artillery projectiles');
 assert.ok(c('galley.hp')<1000,'attack orders deal damage immediately');
 assert.equal(c('friendly.hp'),90,'friends are not hit');
 c("S.tech[0].atkb={fire:3}");
 assert.equal(hit(),12,'naval weapons research improves fire damage');
});

test('Demolition Ship explodes once against hostile ships without friendly fire',()=>{
 const c=fixture();
 c("globalThis.bomber=addU(0,'demo',40.5,40.5);globalThis.victim=addU(1,'gal',41.5,40.5);globalThis.extra=addU(1,'gal',42,41);globalThis.ally=addU(0,'gal',41,41);globalThis.distant=addU(1,'gal',47,40)");
 c("bomber.o='a';bomber.tg=victim;bomber.cd=0");
 const friendly=c('ally.hp'),distant=c('distant.hp'),victim=c('victim.hp');
 assert.equal(c('detonateShip(bomber)'),true);
 assert.equal(c('bomber.hp'),0);
 assert.equal(c('bomber.dead'),1);
 assert.equal(c('bomber.tg'),null);
 assert.ok(c('victim.hp')<victim);
 assert.ok(c('extra.hp')<90);
 assert.equal(c('ally.hp'),friendly);
 assert.equal(c('distant.hp'),distant);
 assert.equal(c('detonateShip(bomber)'),false,'dead demolition ship cannot explode twice');
 assert.equal(c('S.pj.length'),0,'blast uses immediate deterministic damage');
});

test('Demolition attack order is target-gated, and allies cannot trigger explosions',()=>{
 const c=fixture();
 c("globalThis.bomber=addU(0,'demo',40.5,40.5);globalThis.enemy=addU(1,'gal',45.5,40.5);globalThis.ally=addU(0,'gal',41,40.5)");
 c("bomber.o='a';bomber.tg=enemy;bomber.cd=0");
 assert.equal(c('detonateShip(bomber)'),false,'out-of-range attack cannot explode');
 assert.equal(c('bomber.hp'),70);
 c('bomber.tg=ally');
 assert.equal(c('detonateShip(bomber)'),false,'allied target cannot trigger explosion');
 c('bomber.tg=enemy;enemy.x=41.5;enemy.ld={};');
 assert.equal(c('detonateShip(bomber)'),false,'loaded target cannot trigger explosion');
 c('enemy.ld=null;');
 assert.equal(c('detonateShip(bomber)'),true);
});

test('AI classifies new combat ships and uses capped Fire/Demolition naval counters',()=>{
 const c=fixture();
 c("globalThis.fire=addU(1,'fire',40.5,40.5);globalThis.demo=addU(1,'demo',41.5,40.5);globalThis.galley=addU(0,'gal',42.5,40.5)");
 assert.equal(c('aiTeamRoster(1).galleys.length'),2);
 assert.equal(c('aiClassifyHostileForces(1).humanShips.length'),1);
 assert.equal(c('aiClassifyHostileForces(1).hostileFleet.length'),1);
 const src=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
 assert.match(src,/fireCounter=isDock&&enemyShips>0/);
 assert.match(src,/demoCounter=isDock&&enemyShips>=4/);
 assert.match(src,/queuedUnits\('demo'\)<3/);
});

test('both new ships resolve all four team-state painted poses through explicit Galley aliases',()=>{
 const assets=readFileSync(new URL('../js/assets.js',import.meta.url),'utf8');
 assert.match(assets,/SHIP_ART_FALLBACK=Object.freeze\(\{fire:'gal',demo:'gal'\}\)/);
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+'\n'+assets+'\n'+'globalThis.testAlias=code=>eval(code);',sandbox,{timeout:15000});
 const run=code=>sandbox.testAlias(code);
 const pack=JSON.parse(readFileSync(new URL('../assets/atlas-manifest.json',import.meta.url),'utf8'));
 for(const a of pack.atlases)run(`regAtlas(${JSON.stringify(a.id)},{},${JSON.stringify(a.meta)})`);
 for(const kind of ['fire','demo'])for(let team=0;team<4;team++)for(let state=0;state<4;state++){
  assert.equal(run(`hasReadyAssetPose('${kind}',${team},${state})`),true);
  assert.ok(run(`assetFrame('${kind}',${team},${state},0,.1)`));
 }
});
