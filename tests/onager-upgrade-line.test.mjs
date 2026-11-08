import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const cfg=vm.runInNewContext(readFileSync(new URL('../js/config.js',import.meta.url),'utf8')+'\n;({U,B,TE})');
const plain=value=>JSON.parse(JSON.stringify(value));
function fixture(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
  seedOv=456789;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;start();
  snd=0;S.us=[];S.bs=[];S.pj=[];S.nodes=[];S.g.fill(0);S.gt.fill(0);S.nd.fill(null);
  S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);
  S.civ=[0,1];S.tech=[{},{}];S.age=[3,3];
  S.res=S.res.map(()=>({f:6000,w:6000,g:6000,s:6000}));
  globalThis.workshop=addB(0,'siege',10,10,true);
  globalThis.otherWorkshop=addB(0,'siege',15,10,true);
  globalThis.enemyWorkshop=addB(1,'siege',20,10,true);
  globalThis.mangonel=addU(0,'mang',28.5,28.5);
  globalThis.enemyMangonel=addU(1,'mang',30.5,28.5);
  globalThis.runUpgrade=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.runUpgrade(code);
}

test('Imperial Siege Workshop exposes a paid two-stage Onager line',()=>{
 assert.deepEqual(plain(cfg.B.siege.rs.slice(-2)),['onager','siegeOnager']);
 assert.deepEqual(plain(cfg.TE.onager.cost),{f:800,g:500});
 assert.deepEqual(plain(cfg.TE.siegeOnager.cost),{f:1450,g:1000});
 assert.equal(cfg.TE.onager.t,75);assert.equal(cfg.TE.siegeOnager.t,150);
 assert.equal(cfg.TE.onager.age,3);assert.equal(cfg.TE.siegeOnager.pre,'onager');
 const c=fixture();
 assert.equal(c("unitName('mang',0)"),'Mangonel');
 assert.equal(c('mhp(mangonel)'),70);
 assert.equal(c('attackRange(mangonel)'),7);
 c('S.age[0]=2');
 assert.equal(c("research(workshop,'onager')"),false,'Imperial Age required');
 c('S.age[0]=3');
 assert.equal(c("research(workshop,'siegeOnager')"),false,'cannot skip Onager');
 assert.equal(c("research(enemyWorkshop,'onager')"),true,'opponent may research independently');
 c('upB(enemyWorkshop,75)');
 const beforeF=c('S.res[0].f'),beforeG=c('S.res[0].g');
 assert.equal(c("research(workshop,'onager')"),true);
 assert.equal(c('S.res[0].f'),beforeF-800);
 assert.equal(c('S.res[0].g'),beforeG-500);
 assert.equal(c("research(otherWorkshop,'onager')"),false,'no duplicate parallel research');
 assert.equal(c('workshop.rs.t'),75);
 c('upB(workshop,75)');
 assert.equal(c('S.tech[0].onager'),1);
 assert.equal(c("unitName('mang',0)"),'Onager');
 assert.equal(c('mhp(mangonel)'),80);
 assert.equal(c('mangonel.hp'),80,'existing siege health increases');
 assert.equal(c('attackRange(mangonel)'),8);
 assert.equal(c('attackRange(enemyMangonel)'),8,'other kingdom researched separately');
 assert.equal(c("research(workshop,'onager')"),false,'research is one-time');
 assert.equal(c("research(workshop,'siegeOnager')"),true);
 assert.equal(c('workshop.rs.t'),150);
 c('upB(workshop,150)');
 assert.equal(c("unitName('mang',0)"),'Siege Onager');
 assert.equal(c('mangonel.hp'),90);assert.equal(c('mhp(mangonel)'),90);
 assert.equal(c('attackRange(mangonel)'),8);
 assert.equal(c("unitName('mang',1)"),'Onager','other kingdom does not receive Siege Onager');
 c("globalThis.newMangonel=addU(0,'mang',32.5,28.5)");
 assert.equal(c('newMangonel.hp'),90,'newly trained siege inherits both upgrades');
 assert.equal(c('newMangonel.k'),'mang','existing unit identity and art stay compatible');
});

test('Onager research increases real combat damage, radius and minimum firing distance',()=>{
 const c=fixture();
 c("globalThis.target=addU(1,'vil',34.5,28.5);target.hp=1000");
 const damage=()=>{c('target.hp=1000;dmgT(mangonel,target)');return 1000-c('target.hp')};
 const baseDamage=damage();
 assert.equal(baseDamage,14,'unresearched Mangonel remains unchanged');
 c("globalThis.probe=addU(1,'mil',34.5,30.2);probe.hp=1000");
 const splash=()=>{
  c("probe.hp=1000;target.hp=1000;S.pj=[];S.pj.push({x:34.5,y:28.5,t:target,a:{k:'mang',t:0},tx:34.5,ty:28.5});pjs(.1)");
  return 1000-c('probe.hp');
 };
 assert.equal(splash(),0,'baseline radius does not reach the offset unit');
 assert.equal(c('U.mang.spl'),1.6);
 c("research(workshop,'onager');upB(workshop,75)");
 assert.equal(damage(),baseDamage+10);
 assert.ok(splash()>0,'Onager blast radius reaches additional nearby enemies');
 assert.equal(c("unitName('mang',0)"),'Onager');
 c("research(workshop,'siegeOnager');upB(workshop,150)");
 assert.equal(damage(),baseDamage+35);
 assert.equal(c('attackRange(mangonel)'),8);
 assert.equal(c('mangonel.k'),'mang');
 assert.equal(c('S.tech[0].atkb.mang'),35);
 assert.equal(c('S.tech[1].atkb?.mang??0'),0,'opponent keeps its original attack');
});

test('AI prioritizes expensive Onager research only with a fielded siege force',()=>{
 const c=fixture();
 c("globalThis.context={arm:[mangonel],vil:[],bl:[workshop],my:[mangonel],humanCav:0,humanRanged:0,humanSiege:0,humanInf:0,humanShips:[]}");
 const withOne=c("aiTechnologyPriority('onager',context)");
 c("context.my=[]");
 const without=c("aiTechnologyPriority('onager',context)");
 assert.ok(withOne>without);
 c("context.my=[mangonel,mangonel,mangonel]");
 assert.ok(c("aiTechnologyPriority('siegeOnager',context)")>withOne-5);
});
