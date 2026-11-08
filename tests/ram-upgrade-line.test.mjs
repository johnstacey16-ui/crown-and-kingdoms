import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const {U,B,TE}=vm.runInNewContext(readFileSync(new URL('../js/config.js',import.meta.url),'utf8')+'\n;({U,B,TE})');
const plain=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
  seedOv=765432;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;start();snd=0;
  S.us=[];S.bs=[];S.pj=[];S.nodes=[];S.g.fill(0);S.gt.fill(0);S.nd.fill(null);
  S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);
  S.civ=[0,1];S.tech=[{},{}];S.age=[3,3];
  S.res=S.res.map(()=>({f:6000,w:6000,g:6000,s:6000}));
  globalThis.workshop=addB(0,'siege',12,12,true);
  globalThis.second=addB(0,'siege',20,12,true);
  globalThis.foeWorkshop=addB(1,'siege',30,12,true);
  globalThis.ram=addU(0,'ram',35.5,32.5);
  globalThis.enemyRam=addU(1,'ram',37.5,32.5);
  globalThis.building=addB(1,'house',40,30,true);building.hp=10000;building.mh=10000;
  globalThis.evalRam=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.evalRam(code);
}

test('Imperial siege research offers paid Capped Ram and Siege Ram with strict prerequisites',()=>{
 for(const key of ['cappedRam','siegeRam'])assert.ok(B.siege.rs.includes(key),'missing Siege Workshop research '+key);
 assert.deepEqual(plain(TE.cappedRam.cost),{f:300});
 assert.deepEqual(plain(TE.siegeRam.cost),{f:1000});
 assert.equal(TE.cappedRam.age,3);
 assert.equal(TE.cappedRam.t,50);
 assert.equal(TE.siegeRam.t,75);
 assert.equal(TE.siegeRam.pre,'cappedRam');
 const c=fixture();
 assert.equal(c("unitName('ram',0)"),'Battering Ram');
 assert.equal(c('mhp(ram)'),150);
 c('S.age[0]=2');
 assert.equal(c("research(workshop,'cappedRam')"),false);
 c('S.age[0]=3');
 assert.equal(c("research(workshop,'siegeRam')"),false,'cannot skip Capped Ram');
 const startFood=c('S.res[0].f');
 assert.equal(c("research(workshop,'cappedRam')"),true);
 assert.equal(c('S.res[0].f'),startFood-300);
 assert.equal(c('workshop.rs.t'),50);
 assert.equal(c("research(second,'cappedRam')"),false,'no parallel duplicate research');
 c('upB(workshop,50)');
 assert.equal(c("unitName('ram',0)"),'Capped Ram');
 assert.equal(c('mhp(ram)'),175);
 assert.equal(c('ram.hp'),175,'existing Ram receives health upgrade');
 assert.equal(c("unitName('ram',1)"),'Battering Ram','enemy team is unaffected');
 assert.equal(c("research(workshop,'cappedRam')"),false,'one-time research');
 assert.equal(c("research(workshop,'siegeRam')"),true);
 assert.equal(c('S.res[0].f'),startFood-1300);
 assert.equal(c('workshop.rs.t'),75);
 c('upB(workshop,75)');
 assert.equal(c("unitName('ram',0)"),'Siege Ram');
 assert.equal(c('mhp(ram)'),245);
 assert.equal(c('ram.hp'),245);
 c("globalThis.recruit=addU(0,'ram',45.5,32.5)");
 assert.equal(c('recruit.hp'),245,'new Rams inherit both researched health upgrades');
 assert.equal(c('recruit.k'),'ram','unit identity remains stable for save and multiplayer');
 assert.equal(c('enemyRam.hp'),150);
});

test('Ram tiers improve real building damage without granting free bonuses to other armies',()=>{
 const c=fixture();
 const hit=()=>{c('building.hp=10000;dmgT(ram,building)');return 10000-c('building.hp')};
 const base=hit();
 assert.equal(base,Math.max(1,U.ram.dmg+U.ram.bb-2),'base Battering Ram remains unchanged');
 c("research(workshop,'cappedRam');upB(workshop,50)");
 assert.equal(hit(),base+26,'Capped Ram adds +25 vs structures and +1 base attack');
 c("research(workshop,'siegeRam');upB(workshop,75)");
 assert.equal(hit(),base+67,'Siege Ram adds 40 more building damage and +1 more attack');
 assert.equal(c('S.tech[0].atkb.ram'),2);
 assert.equal(c('S.tech[1].atkb?.ram??0'),0);
 c('building.hp=10000;dmgT(enemyRam,ram)');
 assert.equal(c('mhp(ram)'),245,'enemy Ram attack does not remove researched health budget');
});

test('AI research priority rises when Rams are active and hostiles field siege',()=>{
 const c=fixture();
 c("globalThis.context={arm:[ram],vil:[],bl:[workshop],my:[],humanCav:0,humanRanged:0,humanSiege:0,humanInf:0,humanShips:[]}");
 const noRams=c("aiTechnologyPriority('cappedRam',context)");
 c('context.my=[ram]');
 const withRam=c("aiTechnologyPriority('cappedRam',context)");
 assert.ok(withRam>noRams);
 c('context.my=[ram,ram,ram];context.humanSiege=3');
 assert.ok(c("aiTechnologyPriority('siegeRam',context)")>withRam);
});
