import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const cfg=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const {U}=vm.runInNewContext(cfg+'\n;({U})');
const multiplayerSource=readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');

function fixture(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
  seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;start();
  S.us=[];S.bs=[];S.pj=[];S.g.fill(0);S.gt.fill(0);
  S.tech[0]={thumb:1};S.tech[1]={};S.age[0]=2;S.age[1]=2;
  globalThis.evalCombat=code=>eval(code);
 `,sandbox,{timeout:15000});
 vm.runInNewContext(multiplayerSource,sandbox,{timeout:15000});
 return code=>sandbox.evalCombat(code);
}

test('DE Archer/Crossbow/Arbalester use .35s windup and 7 tiles/sec projectile speed',()=>{
 for(const k of ['arc','xbow']){
  assert.equal(U[k].delay,.35);
  assert.equal(U[k].ps,7);
 }
 const c=fixture();
 assert.equal(c('projectileSpeed({k:"arc"})'),7);
 assert.equal(c('projectileSpeed({k:"xbow"})'),7);
 assert.equal(c('projectileSpeed({k:"mang"})'),14,'unverified siege weapons retain legacy travel speed');
 assert.equal(c('U.xbow.ps'),7,'Arbalester shares existing Crossbow line entity');
});

test('Archer commits a real attack windup before emitting an arrow; reload retains 2 second cadence',()=>{
 const c=fixture();
 c("globalThis.a=addU(0,'arc',20.5,20.5);globalThis.t=addU(1,'mil',23.5,20.5);a.o='a';a.tg=t;a.cd=0");
 c('upU(a,DT)');
 assert.equal(c('S.pj.length'),0,'a first click does not immediately fire');
 assert.equal(c('a.wind'),.35);
 assert.equal(c('a.windTarget'),c('t.netId'));
 for(let i=0;i<10;i++)c('upU(a,DT)');
 assert.equal(c('S.pj.length'),0,'no fire during .35s windup');
 c('upU(a,DT)');
 assert.equal(c('S.pj.length'),1,'shot emitted only after .35s');
 assert.ok(Math.abs(c('a.cd')-1.35)<1e-9,'reload starts after the animation and accounts for elapsed windup');
 for(let i=0;i<48;i++)c('upU(a,DT)');
 assert.equal(c('S.pj.length'),1,'Archer cannot fire again early');
 for(let i=0;i<18;i++)c('upU(a,DT)');
 assert.ok(c('S.pj.length')>=2,'Archer resumes its next cycle without a permanent stall');
});

test('pending arrow is cancelled on retargeting, moving, or loss of range',()=>{
 const c=fixture();
 c("globalThis.a=addU(0,'arc',20.5,20.5);globalThis.t=addU(1,'mil',23.5,20.5);globalThis.other=addU(1,'mil',22.5,22.5);a.o='a';a.tg=t;a.cd=0");
 c('upU(a,DT)');
 for(let i=0;i<5;i++)c('upU(a,DT)');
 assert.ok(c('a.wind')>0&&c('a.wind')<.35);
 c('a.tg=other;upU(a,DT)');
 assert.equal(c('a.wind'),.35,'switching target restarts full windup');
 assert.equal(c('a.windTarget'),c('other.netId'));
 c("a.o='i';upU(a,DT)");
 assert.equal(c('a.wind'),0,'changing orders cancels the attack');
 assert.equal(c('a.windTarget'),null);
 c("a.o='a';a.tg=other;a.cd=0;upU(a,DT);other.x=40.5;upU(a,DT)");
 assert.equal(c('a.wind'),0,'leaving firing range cancels the pending attack');
 assert.equal(c('S.pj.length'),0,'no invisible shots from cancelled attacks');
});

test('speed-seven Archer projectiles stay in flight for their actual distance',()=>{
 const c=fixture();
 c("globalThis.a=addU(0,'arc',20.5,20.5);globalThis.t=addU(1,'mil',24.5,20.5);launchProjectile(a,t)");
 assert.equal(c('S.pj.length'),1);
 c('pjs(.5)');
 assert.equal(c('S.pj.length'),1,'four tiles cannot be traveled in half a second at speed seven');
 assert.ok(Math.abs(c('S.pj[0].x')-24)<1e-8);
 assert.equal(c('t.hp'),40);
 c('pjs(.1)');
 assert.equal(c('S.pj.length'),0);
 assert.equal(c('t.hp'),37,'actual impact applies pierce armor');
});

test('Ballistics predicts a longer lead for slower Archer projectiles',()=>{
 const c=fixture();
 c("globalThis.a=addU(0,'arc',20.5,20.5);globalThis.t=addU(1,'scout',26.5,20.5);t.o='m';t.p=[[26.5,35.5]];S.tech[0].ballistics=1");
 const y=c('projectileAim(a,t).ty');
 assert.ok(y>21.6&&y<23,'intercept accounts for actual flight time at speed seven');
 c('S.tech[0].ballistics=0');
 assert.equal(c('projectileAim(a,t).ty'),20.5,'Thumb Ring does not grant Ballistics');
});

test('save/load and multiplayer checkpoint include an Archer mid-windup without creating a free shot',()=>{
 const c=fixture();
 c("globalThis.a=addU(0,'arc',20.5,20.5);globalThis.t=addU(1,'mil',23.5,20.5);a.o='a';a.tg=t;a.cd=0;upU(a,DT)");
 const remaining=c('a.wind'),target=c('a.windTarget');
 const hash=c('window.CK_SIM_SYNC.worldCheckpoint(S,100).hash');
 c('a.wind=.2');
 assert.notEqual(c('window.CK_SIM_SYNC.worldCheckpoint(S,100).hash'),hash,'checkpoint covers pending attack countdown');
 c('a.wind=.35;a.windTarget=null');
 assert.notEqual(c('window.CK_SIM_SYNC.worldCheckpoint(S,100).hash'),hash,'checkpoint covers pending attack target identity');
 c('a.wind=.35;a.windTarget=t.netId');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c("globalThis.a=S.us.find(u=>u.k==='arc'&&u.t===0);globalThis.t=S.us.find(u=>u.k==='mil'&&u.t===1)");
 assert.equal(c('a.wind'),remaining);
 assert.equal(c('a.windTarget'),target);
 assert.equal(c('a.tg===t'),true);
 assert.equal(c('S.pj.length'),0);
 for(let i=0;i<11;i++)c('upU(a,DT)');
 assert.equal(c('S.pj.length'),1,'restored pending arrow launches once and only once');
});
