import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const config=vm.runInNewContext(readFileSync(new URL('../js/config.js',import.meta.url),'utf8')+'\n;({U,B,TE})');
const asJSON=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
  seedOv=765432;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;start();snd=0;
  S.us=[];S.bs=[];S.pj=[];S.nodes=[];S.g.fill(0);S.gt.fill(0);S.nd.fill(null);
  S.wt.fill(1);S.ex.fill(1);S.vs.fill(1);S.civ=[0,1];S.age=[3,3];S.tech=[{},{}];
  S.res=S.res.map(()=>({f:8000,w:8000,g:8000,s:8000}));
  globalThis.dock=addB(0,'dock',12,12,true);
  globalThis.otherDock=addB(0,'dock',18,12,true);
  globalThis.enemyDock=addB(1,'dock',24,12,true);
  globalThis.univ=addB(0,'univ',12,22,true);
  globalThis.evalCannon=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.evalCannon(code);
}

test('Cannon Galleon is a distinct Imperial artillery ship, locked until paid Chemistry',()=>{
 const {U,B,TE}=config;
 assert.deepEqual(asJSON(B.dock.tr),['fish','gal','fire','demo','cgal','trn','cog']);
 assert.equal(U.cgal.age,3);
 assert.equal(U.cgal.sh,1);
 assert.equal(U.cgal.minR,3);
 assert.equal(U.cgal.rng,10);
 assert.equal(U.cgal.sg,1);
 assert.ok(U.cgal.bb>=40,'specializes in shore fortifications');
 assert.ok(U.cgal.cost.w>0&&U.cgal.cost.g>0);
 assert.ok(B.dock.rs.includes('eliteCgal'));
 assert.equal(TE.eliteCgal.pre,'chem');
 assert.equal(TE.eliteCgal.age,3);
 assert.deepEqual(asJSON(TE.eliteCgal.cost),{w:400,g:500});
 const c=fixture();
 c('S.age[0]=2');
 assert.equal(c("trOf(dock).includes('cgal')"),false);
 assert.equal(c("train(dock,'cgal')"),false);
 c('S.age[0]=3');
 assert.equal(c("trOf(dock).includes('cgal')"),false);
 assert.equal(c("train(dock,'cgal')"),false,'Imperial Age alone cannot unlock cannons');
 assert.equal(c("research(dock,'eliteCgal')"),false,'Elite cannot bypass Chemistry');
 const food=c('S.res[0].f'),gold=c('S.res[0].g');
 assert.equal(c("research(univ,'chem')"),true);
 assert.equal(c('S.res[0].f'),food-300);
 assert.equal(c('S.res[0].g'),gold-200);
 assert.equal(c("train(dock,'cgal')"),false,'queued Chemistry is not yet available');
 c('upB(univ,100)');
 assert.equal(c('S.tech[0].chem'),1);
 assert.equal(c("trOf(dock).includes('cgal')"),true);
 assert.equal(c("trOf(enemyDock).includes('cgal')"),false,'other team remains locked');
 assert.equal(c("trOf(dock,S.civ,[{},{}]).includes('cgal')"),false,'peer-provided technology ledger cannot inherit host tech');
 const wood=c('S.res[0].w'),remainingGold=c('S.res[0].g');
 assert.equal(c("train(dock,'cgal')"),true);
 assert.equal(c('S.res[0].w'),wood-200);
 assert.equal(c('S.res[0].g'),remainingGold-150);
 assert.equal(c('dock.q[0].k'),'cgal');
 assert.equal(c("train(enemyDock,'cgal')"),false,'enemy cannot spoof Cannon Galleon command');
});

test('Cannon Galleons fire actual long-range cannonballs for heavy anti-building damage',()=>{
 const c=fixture();
 c("S.tech[0].chem=1;globalThis.gun=addU(0,'cgal',32.5,33.5);globalThis.target=addB(1,'tower',36,35,true);globalThis.ally=addU(0,'gal',37,36)");
 const targetHP=c('target.hp'),allyHP=c('ally.hp');
 assert.equal(c('attackRange(gun)'),10);
 assert.equal(c('projectileSpeed(gun)'),9);
 c('hit(gun,target)');
 assert.equal(c('S.pj.length'),1);
 assert.equal(c('S.pj[0].a.k'),'cgal');
 assert.equal(c('S.pj[0].tx'),37);
 assert.equal(c('S.pj[0].ty'),36);
 c('pjs(2)');
 assert.equal(c('S.pj.length'),0);
 assert.ok(c('target.hp')<targetHP-60,'artillery deals meaningful siege damage');
 assert.equal(c('ally.hp'),allyHP,'splash must not strike friendly vessels');
});

test('Minimum range blocks close fire while Stand Ground preserves the ship position',()=>{
 const c=fixture();
 c("S.tech[0].chem=1;globalThis.gun=addU(0,'cgal',31.5,31.5);globalThis.enemy=addU(1,'gal',32.5,31.5);gun.o='a';gun.tg=enemy;gun.st=2;gun.cd=0");
 c('for(let i=0;i<30;i++)upU(gun,1/30)');
 assert.equal(c('S.pj.length'),0);
 assert.equal(c('gun.x'),31.5);
 assert.equal(c('gun.y'),31.5);
 c('enemy.x=38;upU(gun,.2);upU(gun,.65)');
 assert.equal(c('S.pj.length'),1,'ship can fire after a legal target backs away');
 assert.equal(c('gun.tg===enemy'),true);
});

test('Elite Cannon Galleon research costs resources and upgrades fielded/new ships only for its owner',()=>{
 const c=fixture();
 c("S.tech[0].chem=1;globalThis.gun=addU(0,'cgal',31.5,31.5);globalThis.foe=addU(1,'cgal',33.5,31.5)");
 assert.equal(c("unitName('cgal',0)"),'Cannon Galleon');
 assert.equal(c('mhp(gun)'),120);
 assert.equal(c('attackRange(gun)'),10);
 const w=c('S.res[0].w'),g=c('S.res[0].g');
 assert.equal(c("research(dock,'eliteCgal')"),true);
 assert.equal(c('S.res[0].w'),w-400);
 assert.equal(c('S.res[0].g'),g-500);
 assert.equal(c('dock.rs.t'),65);
 assert.equal(c("research(otherDock,'eliteCgal')"),false,'no parallel duplicate research');
 c('upB(dock,65)');
 assert.equal(c('S.tech[0].eliteCgal'),1);
 assert.equal(c("unitName('cgal',0)"),'Elite Cannon Galleon');
 assert.equal(c("unitName('cgal',1)"),'Cannon Galleon');
 assert.equal(c('mhp(gun)'),150);
 assert.equal(c('gun.hp'),150,'existing ships benefit without changing IDs');
 assert.equal(c('mhp(foe)'),120,'enemy tech remains independent');
 assert.equal(c('attackRange(gun)'),11);
 assert.equal(c('attackRange(foe)'),10);
 assert.equal(c('S.tech[0].atkb.cgal'),15);
 c("globalThis.newGun=addU(0,'cgal',38.5,31.5)");
 assert.equal(c('newGun.hp'),150);
 assert.equal(c('newGun.k'),'cgal','stable unit kind for saves, replay and network IDs');
 assert.equal(c("research(dock,'eliteCgal')"),false,'cannot research same technology twice');
});

test('Elite research increases cannon blast radius without damaging allies',()=>{
 const c=fixture();
 c("S.tech[0].chem=1;globalThis.gun=addU(0,'cgal',36.5,36.5);globalThis.enemy=addU(1,'gal',41.5,36.5);globalThis.near=addU(1,'gal',42.7,36.5);globalThis.ally=addU(0,'gal',42.7,36.5)");
 const blast=()=>{
  c('enemy.hp=500;near.hp=500;S.pj=[];hit(gun,enemy);pjs(2)');
  return 500-c('near.hp');
 };
 const baseline=blast();
 assert.equal(baseline,0,'base radius cannot reach the outer target');
 c("research(dock,'eliteCgal');upB(dock,65)");
 assert.ok(blast()>0,'Elite Cannon Galleon reaches an additional enemy at the outer splash edge');
 assert.equal(c('ally.hp'),90);
});

test('Coastal artillery AI acquires enemy Docks, but cannot target allied or destroyed fortifications',()=>{
 const c=fixture();
 c("S.tech[0].chem=1;globalThis.gun=addU(0,'cgal',20.5,18.5);globalThis.enemyGun=addU(1,'cgal',21.5,18.5)");
 assert.equal(c('aiTeamRoster(0).galleys.some(u=>u.k===\'cgal\')'),true);
 assert.equal(c('aiClassifyHostileForces(0).humanShips.some(u=>u.k===\'cgal\')'),true);
 assert.equal(c('aiCoastalSiegeTargets(0).includes(enemyDock)'),true);
 assert.equal(c('aiCoastalSiegeTargets(0).includes(dock)'),false);
 c('aiAssignCannonTargets(0,[gun])');
 assert.equal(c('gun.tg===enemyDock'),true,'the cannon selects a reachable coastal target');
 assert.equal(c('gun.o'),'a');
 c('enemyDock.hp=0;gun.o="i";gun.tg=null');
 assert.equal(c('aiCoastalSiegeTargets(0).includes(enemyDock)'),false);
 c('aiAssignCannonTargets(0,[gun])');
 assert.equal(c('gun.tg'),null,'ruined Docks cannot be targeted');
});

test('Cannon Galleons share verified temporary ship poses and use dedicated cannonball effects',()=>{
 const assets=readFileSync(new URL('../js/assets.js',import.meta.url),'utf8');
 const effects=readFileSync(new URL('../js/render-effects.js',import.meta.url),'utf8');
 assert.match(assets,/SHIP_ART_FALLBACK=Object.freeze\(\{fire:'gal',demo:'gal',cgal:'gal'\}\)/);
 assert.match(effects,/cgal:'cannon'/);
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+'\n'+assets+'\n'+'globalThis.evalArt=code=>eval(code);',sandbox,{timeout:15000});
 const run=code=>sandbox.evalArt(code);
 const pack=JSON.parse(readFileSync(new URL('../assets/atlas-manifest.json',import.meta.url),'utf8'));
 for(const a of pack.atlases)run(`regAtlas(${JSON.stringify(a.id)},{},${JSON.stringify(a.meta)})`);
 for(let team=0;team<4;team++)for(let state=0;state<4;state++){
  assert.equal(run(`hasReadyAssetPose('cgal',${team},${state})`),true);
  assert.ok(run(`assetFrame('cgal',${team},${state},0,.1)`));
 }
});
