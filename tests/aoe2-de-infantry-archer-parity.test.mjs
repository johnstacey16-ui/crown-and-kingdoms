import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const {U,TE}=vm.runInNewContext(config+'\n;({U,TE})');
const sourceLinks={
 mil:'https://ageofempires.fandom.com/wiki/Militia_(Age_of_Empires_II)',
 arc:'https://ageofempires.fandom.com/wiki/Archer_(Age_of_Empires_II)',
 spear:'https://ageofempires.fandom.com/wiki/Spearman_(Age_of_Empires_II)',
 upgrades:'https://ageofempires.fandom.com/wiki/Upgrade_(Age_of_Empires_II)'
};
test('source-pinned unupgraded DE infantry and archer statistics',()=>{
 assert.equal(Object.values(sourceLinks).length,4);
 for(const [kind,expected] of Object.entries({
  mil:{hp:40,sp:.9,dmg:4,rng:.9,cd:2,arm:0,t:21,cost:{f:50,g:20},age:0},
  arc:{hp:30,sp:.96,dmg:4,rng:4,cd:2,arm:0,t:35,cost:{w:25,g:45},age:1},
  spear:{hp:45,sp:1,dmg:3,rng:.9,cd:3,arm:0,t:22,cost:{f:35,w:25},age:1}
 })){
  for(const [field,value] of Object.entries(expected)){
   if(field==='cost')assert.equal(JSON.stringify(U[kind][field]),JSON.stringify(value),kind+' '+field);
   else assert.equal(U[kind][field],value,kind+' '+field);
  }
 }
 assert.equal(U.arc.bn.spear,3,'foot archer has bonus against spearman armor class');
 assert.equal(U.spear.bn.knight,15);
 assert.equal(U.spear.bn.camel,12);
});

test('militia and spear upgrade ladders keep base HP and attack at each DE tier',()=>{
 let milHp=U.mil.hp,milAttack=U.mil.dmg;
 for(const [tech,hp,attack] of [['man',45,6],['longs',60,9],['twohand',65,12],['champ',70,14]]){
  milHp+=TE[tech].hpb.mil;milAttack+=TE[tech].atkb.mil;
  assert.equal(milHp,hp,tech+' HP');assert.equal(milAttack,attack,tech+' attack');
 }
 let spearHp=U.spear.hp,spearAttack=U.spear.dmg;
 for(const [tech,hp,attack] of [['pike',55,4],['halb',60,6]]){
  spearHp+=TE[tech].hpb.spear;spearAttack+=TE[tech].atkb.spear;
  assert.equal(spearHp,hp,tech+' HP');assert.equal(spearAttack,attack,tech+' attack');
 }
 for(const [k,cost,time] of [
  ['man',{f:100,g:40},40],['longs',{f:150,g:65},40],
  ['twohand',{f:200,g:100},45],['champ',{f:650,g:350},70],
  ['pike',{f:160,g:90},35],['halb',{f:300,g:600},50]
 ]){
  assert.equal(JSON.stringify(TE[k].cost),JSON.stringify(cost),k+' research cost');
  assert.equal(TE[k].t,time,k+' research time');
 }
});

function game(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
 seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;start();
 S.us=[];S.bs=[];S.pj=[];S.g.fill(0);S.gt.fill(0);
 S.tech[0]={};S.tech[1]={};
 globalThis.runCombat=code=>eval(code);
 `,sandbox,{timeout:15000});
 return sandbox.runCombat;
}
test('production movement speed upgrades Militia into Man-at-Arms without changing Spearmen',()=>{
 const c=game();
 c("globalThis.mil=addU(0,'mil',12.5,13.5);globalThis.spear=addU(0,'spear',13.5,13.5)");
 assert.equal(c('unitSpeed(mil)'),.9);
 assert.equal(c('unitSpeed(spear)'),1);
 c('S.tech[0].man=1');
 assert.ok(Math.abs(c('unitSpeed(mil)')-.96)<1e-9);
 assert.equal(c('unitSpeed(spear)'),1);
 c('S.tech[0].squires=1');
 assert.ok(Math.abs(c('unitSpeed(mil)')-1.056)<1e-9);
 assert.ok(Math.abs(c('unitSpeed(spear)')-1.1)<1e-9);
});
test('actual damage separates Militia melee defense, pierce defense, and Long Swordsman armor',()=>{
 const c=game();
 c("globalThis.mil=addU(1,'mil',20.5,20.5);globalThis.spear=addU(1,'spear',21.5,20.5);globalThis.archer=addU(0,'arc',15.5,20.5);globalThis.ourMil=addU(0,'mil',16.5,20.5)");
 const delta=(target,attacker)=>{c(`${target}.hp=1000;dmgT(${attacker},${target})`);return 1000-c(`${target}.hp`);};
 assert.equal(delta('mil','ourMil'),4,'base Militia melee armor is zero');
 assert.equal(delta('mil','archer'),3,'Militia has one base pierce armor');
 assert.equal(delta('spear','archer'),7,'Archers deal +3 bonus against Spearmen');
 assert.equal(delta('spear','ourMil'),4,'base Spearman melee armor is zero');
 c('S.tech[1].longs=1');
 assert.equal(delta('mil','ourMil'),3,'Long Swordsman has +1 melee armor');
 assert.equal(delta('mil','archer'),3,'Long Swordsman retains its base pierce armor');
});
test('spear-line class bonuses advance as Pikeman and Halberdier are researched',()=>{
 const c=game();
 c("globalThis.spear=addU(0,'spear',13.5,20.5);globalThis.knight=addU(1,'knight',14.5,20.5);globalThis.camel=addU(1,'camel',15.5,20.5);globalThis.ele=addU(1,'ele',16.5,20.5)");
 for(const [tech,knight,camel,ele] of [
  [null,15,12,15],['pike',22,18,25],['halb',32,26,28]
 ]){
  if(tech)c(`S.tech[0].${tech}=1`);
  assert.equal(c('spearLineBonus(spear,knight)'),knight,tech+' vs Cavalry');
  assert.equal(c('spearLineBonus(spear,camel)'),camel,tech+' vs Camel');
  assert.equal(c('spearLineBonus(spear,ele)'),ele,tech+' vs Elephant');
 }
 assert.equal(c('spearLineBonus(spear,{k:"mil"})'),0,'other infantry do not gain fake anti-cavalry bonuses');
});
