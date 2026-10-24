import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const cfg=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const {U,TE}=vm.runInNewContext(cfg+'\n;({U,TE})');

test('AoE2 DE Scout, Knight and Skirmisher base statistics are source-pinned',()=>{
 const ref={
  scout:{hp:45,dmg:3,sp:1.55,cd:2,t:30,arm:0,age:1,cost:{f:80}},
  knight:{hp:100,dmg:10,sp:1.35,cd:1.8,t:30,arm:2,age:2,cost:{f:60,g:75}},
  skirm:{hp:30,dmg:2,sp:.96,cd:3,rng:4,minR:1,t:26,arm:0,age:1,cost:{f:25,w:35}}
 };
 for(const [k,expected] of Object.entries(ref)){
  for(const [field,value] of Object.entries(expected)){
   assert.deepEqual(JSON.parse(JSON.stringify(U[k][field])),value,k+' '+field);
  }
 }
 assert.equal(U.scout.bn.mon,6,'scout bonus vs Monks');
 assert.equal(U.knight.bn,undefined,'Knights must not have invented bonuses vs Archers, villagers and siege');
 assert.equal(U.skirm.bn.arc,3);assert.equal(U.skirm.bn.spear,3);
 assert.equal(U.skirm.bn.mamel,2);
});

test('AoE2 DE Light Cavalry, Cavalier and Elite Skirmisher technologies preserve each line',()=>{
 const upgrades={
  lcav:{cost:{f:150,g:50},t:45,hpb:{scout:15},atkb:{scout:2}},
  cavl:{cost:{f:300,g:300},t:80,hpb:{knight:20},atkb:{knight:2}},
  elsk:{cost:{w:230,g:130},t:50,hpb:{skirm:5},atkb:{skirm:1}}
 };
 for(const [k,expected] of Object.entries(upgrades)){
  for(const [field,value] of Object.entries(expected))
   assert.deepEqual(JSON.parse(JSON.stringify(TE[k][field])),value,k+' '+field);
 }
 assert.equal(U.scout.hp+TE.lcav.hpb.scout,60);
 assert.equal(U.knight.hp+TE.cavl.hpb.knight,120);
 assert.equal(U.skirm.hp+TE.elsk.hpb.skirm,35);
});

function fixture(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
  seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;startAge=3;startRes=3;start();
  S.us=[];S.bs=[];S.pj=[];S.g.fill(0);S.gt.fill(0);
  S.tech[0]={};S.tech[1]={};S.age[0]=0;S.age[1]=1;
  S.res[0]={f:10000,w:10000,g:10000,s:10000};
  globalThis.evalCode=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.evalCode(code);
}
test('Scout changes 3 attack in Dark Age to 5 in Feudal and 7 as Light Cavalry',()=>{
 const c=fixture();
 c("globalThis.scout=addU(0,'scout',15.5,20.5);globalThis.archer=addU(1,'arc',16.5,20.5);globalThis.monk=addU(1,'mon',17.5,20.5)");
 const dmg=target=>{c(target+'.hp=1000;dmgT(scout,'+target+')');return 1000-c(target+'.hp')};
 assert.equal(c('unitSpeed(scout)'),1.55);
 assert.equal(dmg('archer'),3,'no hidden scout bonus against Archers');
 assert.equal(dmg('monk'),9,'Dark scout deals 3+6 to Monk');
 c('S.age[0]=1');
 assert.equal(dmg('archer'),5,'age advancement grants +2 to scout attack');
 assert.equal(dmg('monk'),11);
 c('S.tech[0].lcav=1;S.tech[0].atkb={scout:2}');
 assert.equal(c('unitSpeed(scout)'),1.5,'Light Cavalry speed becomes 1.5');
 assert.equal(dmg('archer'),7);
 assert.equal(dmg('monk'),17,'Light Cavalry deals 7+10 against Monk');
 c('S.tech[0].husb=1');
 assert.ok(Math.abs(c('unitSpeed(scout)')-1.65)<1e-9,'Husbandry 10% still applies');
});

test('Knight loses invented bonuses, uses real 2/2 armor and Cavalier upgrade',()=>{
 const c=fixture();
 c("globalThis.knight=addU(0,'knight',15.5,20.5);globalThis.archer=addU(1,'arc',16.5,20.5);globalThis.villager=addU(1,'vil',17.5,20.5);globalThis.spear=addU(1,'spear',18.5,20.5);globalThis.enemyKnight=addU(1,'knight',19.5,20.5)");
 const dmg=(attacker,target)=>{c(target+'.hp=1000;dmgT('+attacker+','+target+')');return 1000-c(target+'.hp')};
 assert.equal(c('unitSpeed(knight)'),1.35);
 assert.equal(dmg('knight','archer'),10,'Knight does not gain extra damage vs. Archers');
 assert.equal(dmg('knight','villager'),10,'Knight does not gain extra damage vs. villagers');
 assert.equal(dmg('knight','spear'),10);
 assert.equal(dmg('knight','enemyKnight'),8,'Knight vs Knight subtracts two melee armor');
 assert.equal(dmg('archer','knight'),2,'4 pierce attack against 2 pierce armor');
 c('S.tech[0].cavl=1;S.tech[0].atkb={knight:2};S.tech[0].hpb={knight:20}');
 assert.equal(dmg('knight','villager'),12,'Cavalier gains two melee attack');
 assert.equal(c('mhp(knight)'),120);
});

test('Skirmishers counter foot Archers and Spearmen, not Knights; Elite upgrade improves armor, range and train speed',()=>{
 const c=fixture();
 c("globalThis.skirm=addU(0,'skirm',15.5,20.5);globalThis.arc=addU(1,'arc',16.5,20.5);globalThis.spear=addU(1,'spear',17.5,20.5);globalThis.knight=addU(1,'knight',18.5,20.5);globalThis.mgd=addU(1,'mgd',19.5,20.5);globalThis.rng=addB(0,'rng',9,9,true)");
 const dmg=(attacker,target)=>{c(target+'.hp=1000;dmgT('+attacker+','+target+')');return 1000-c(target+'.hp')};
 assert.equal(dmg('skirm','arc'),5);
 assert.equal(dmg('skirm','spear'),5);
 assert.equal(dmg('skirm','knight'),1,'no imaginary anti-cavalry attack');
 assert.equal(dmg('skirm','mgd'),2,'base Skirmishers do not get Cavalry Archer bonus');
 assert.equal(dmg('arc','skirm'),1,'base Skirmisher has three pierce armor');
 assert.equal(c('attackRange(skirm)'),4);
 assert.equal(c('unitTrainingTime(0,"skirm")'),26);
 c('S.tech[0].elsk=1;S.tech[0].atkb={skirm:1}');
 assert.equal(dmg('skirm','arc'),7);
 assert.equal(dmg('skirm','spear'),7);
 assert.equal(dmg('skirm','mgd'),5);
 assert.equal(c('attackRange(skirm)'),5);
 assert.equal(c('unitTrainingTime(0,"skirm")'),22);
 c('S.tech[1].elsk=1');
 assert.equal(dmg('arc','skirm'),1,'four pierce armor still enforces minimum one hit');
 assert.equal(c('U.skirm.minR'),1);
 c('train(rng,"skirm")');
 assert.equal(c('rng.q[0].t'),22,'production queue uses post-upgrade training time');
});
