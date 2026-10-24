import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const {U,TE,B}=vm.runInNewContext(config+'\n;({U,TE,B})');
const normal=x=>JSON.parse(JSON.stringify(x));

function game(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
  seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;start();
  snd=0;S.us=[];S.bs=[];S.pj=[];S.g.fill(0);S.gt.fill(0);
  S.civ=[2,1];S.tech[0]={};S.tech[1]={};S.age[0]=2;S.age[1]=2;
  for(const r of S.res)r.f=r.w=r.g=r.s=10000;
  globalThis.evalGame=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.evalGame(code);
}

test('Thumb Ring is paid Castle-Age Archery Range research with authentic cost and timing',()=>{
 assert.deepEqual(normal(TE.thumb.cost),{f:300,w:250});
 assert.equal(TE.thumb.age,2);
 assert.equal(TE.thumb.t,45);
 assert.ok(B.rng.rs.includes('thumb'));
 const c=game();
 c("globalThis.rng=addB(0,'rng',12,12,true);globalThis.other=addB(1,'rng',22,22,true)");
 c('S.age[0]=1');
 assert.equal(c("research(rng,'thumb')"),false);
 c('S.age[0]=2');
 const f=c('S.res[0].f'),w=c('S.res[0].w');
 assert.equal(c("research(rng,'thumb')"),true);
 assert.equal(c('rng.rs.t'),45);
 assert.equal(c('S.res[0].f'),f-300);
 assert.equal(c('S.res[0].w'),w-250);
 c('upB(rng,45)');
 assert.equal(c('S.tech[0].thumb'),1);
 assert.equal(c('S.tech[1].thumb||0'),0);
 assert.equal(c("research(rng,'thumb')"),false,'can only research once');
});

test('Archer, Crossbow, Arbalester and Skirmisher have the correct base accuracies',()=>{
 assert.equal(U.arc.acc,.8);
 assert.equal(U.xbow.acc,.85);
 assert.equal(U.skirm.acc,.9);
 const c=game();
 assert.equal(c('rangedAccuracy({k:"arc",t:0})'),.8);
 assert.equal(c('rangedAccuracy({k:"xbow",t:0})'),.85);
 assert.equal(c('rangedAccuracy({k:"skirm",t:0})'),.9);
 c('S.tech[0].arb=1');
 assert.equal(c('rangedAccuracy({k:"xbow",t:0})'),.9);
 c('S.tech[0].thumb=1');
 for(const k of ['arc','xbow','skirm'])assert.equal(c('rangedAccuracy({k:"'+k+'",t:0})'),1);
 assert.equal(c('rangedAccuracy({k:"arc",t:1})'),.8,'one player cannot grant the other Thumb Ring');
 assert.equal(c('rangedAccuracy({k:"jan",t:0})'),1,'gunpowder not accidentally covered by Archer tech');
});

test('unresearched arrows can miss stationary targets on a fixed trajectory; Thumb Ring removes accuracy miss',()=>{
 const c=game();
 c("globalThis.archer=addU(0,'arc',20.5,20.5);globalThis.enemy=addU(1,'mil',25.5,20.5)");
 c('S.r=()=>.99;launchProjectile(archer,enemy)');
 assert.equal(c('S.pj.length'),1);
 assert.ok(Math.abs(c('S.pj[0].ty-enemy.y'))>.7,'inaccurate arrow has a genuinely displaced impact coordinate');
 c('pjs(1)');
 assert.equal(c('enemy.hp'),40,'miss does no damage');
 c('S.r=()=>.01;launchProjectile(archer,enemy);pjs(1)');
 assert.equal(c('enemy.hp'),37,'accurate Archer shot deals four pierce against one pierce armor');
 c('S.tech[0].thumb=1;S.r=()=>.99;launchProjectile(archer,enemy)');
 assert.equal(c('S.pj[0].ty'),c('enemy.y'),'Thumb Ring aims accurately even on an unfavorable chance roll');
 c('pjs(1)');
 assert.equal(c('enemy.hp'),34,'100% accuracy still uses actual projectile collision and armor');
});

test('Thumb Ring speeds up foot and mounted archers but not Skirmishers or gunpowder',()=>{
 const c=game();
 for(const [k,base] of [['arc',2],['xbow',2],['skirm',3],['chuko',.9],['mgd',1.5],['jan',3.2]]){
  assert.equal(c('attackReload({k:"'+k+'",t:0})'),base,k+' unreasearched reload');
 }
 c('S.tech[0].thumb=1');
 assert.ok(Math.abs(c('attackReload({k:"arc",t:0})')-1.7)<1e-9);
 assert.ok(Math.abs(c('attackReload({k:"xbow",t:0})')-1.7)<1e-9);
 assert.equal(c('attackReload({k:"skirm",t:0})'),3,'Skirmishers do not reload faster');
 assert.ok(Math.abs(c('attackReload({k:"chuko",t:0})')-.72)<1e-9);
 assert.ok(Math.abs(c('attackReload({k:"mgd",t:0})')-1.35)<1e-9);
 assert.equal(c('attackReload({k:"jan",t:0})'),3.2);
 assert.equal(c('attackReload({k:"arc",t:1})'),2,'opposing team has no attack-speed research');
 c("globalThis.archer=addU(0,'arc',20.5,20.5);globalThis.enemy=addU(1,'mil',22.5,20.5);archer.o='a';archer.tg=enemy;archer.cd=0");
 c('upU(archer,DT)');
 assert.equal(c('S.pj.length'),0,'Archer has to wind up before its arrow is released');
 assert.equal(c('archer.wind'),.35);
 for(let i=0;i<11;i++)c('upU(archer,DT)');
 assert.equal(c('S.pj.length'),1,'arrow launches only after the animation windup');
 assert.ok(Math.abs(c('archer.cd')-1.35)<1e-9,'reload excludes the elapsed 0.35-second firing animation');
});

test('accuracy rolls and aimed projectiles persist over save/load without resampling',()=>{
 const c=game();
 c("globalThis.archer=addU(0,'arc',20.5,20.5);globalThis.enemy=addU(1,'mil',25.5,20.5);S.r=mk(97531);launchProjectile(archer,enemy)");
 const expectedAim=c('JSON.stringify([S.pj[0].tx,S.pj[0].ty])');
 const state=c('S.r.state()');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('JSON.stringify([S.pj[0].tx,S.pj[0].ty])'),expectedAim);
 assert.equal(c('S.r.state()'),state,'saved RNG sequence resumes from after the shot');
 c("globalThis.archer=S.us.find(u=>u.t===0&&u.k==='arc');globalThis.enemy=S.us.find(u=>u.t===1&&u.k==='mil')");
 c('launchProjectile(archer,enemy)');
 const nextAim=c('JSON.stringify([S.pj[1].tx,S.pj[1].ty])');
 const after=c('S.r.state()');
 const d=game();
 d("globalThis.archer=addU(0,'arc',20.5,20.5);globalThis.enemy=addU(1,'mil',25.5,20.5);S.r=mk(97531);launchProjectile(archer,enemy);launchProjectile(archer,enemy)");
 assert.equal(d('JSON.stringify([S.pj[1].tx,S.pj[1].ty])'),nextAim);
 assert.equal(d('S.r.state()'),after);
});
