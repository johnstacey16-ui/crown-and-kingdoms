import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(civ){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.caucasusEval=code=>eval(code);',sandbox);
 const run=sandbox.caucasusEval;
 run("seedOv=411126;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();S.civ=["+civ+",0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.bar=addB(0,'bar',12,12,true);globalThis.castle=addB(0,'castle',23,12,true);globalThis.monastery=addB(0,'fchurch',35,12,true);globalThis.dock=addB(0,'dock',46,12,true)");
 return run;
}
test('Caucasus factions append stable IDs and faction-lock units and unique research',()=>{
 const a=game(41),g=game(42);
 assert.equal(a('CIV.length'),43);
 assert.equal(a('CIV[40].n'),'Romans');
 assert.equal(a('CIV[41].uu'),'composite');
 assert.equal(g('CIV[42].uu'),'monaspa');
 assert.equal(a("trOf(castle).includes('composite')"),true);
 assert.equal(a("trOf(monastery).includes('warpriest')"),true);
 assert.equal(a("trOf({k:'monastery',t:1}).includes('warpriest')"),false);
 assert.equal(g("trOf(castle).includes('monaspa')"),true);
 for(const [run,n] of [[a,41],[g,42]])for(const k of ['ut'+n,'ut'+n+'p',n===41?'eliteComposite':'eliteMonaspa']){
  assert.equal(run("rsOf(castle).includes('"+k+"')"),true);
  assert.equal(run("rsOf({k:'castle',t:1}).includes('"+k+"')"),false);
 }
});
test('Armenian infantry researches an age earlier, except Man-at-Arms',()=>{
 const run=game(41);
 assert.equal(run("researchEffectiveAge(bar,'longs')"),1);
 assert.equal(run("researchEffectiveAge(bar,'pike')"),1);
 assert.equal(run("researchEffectiveAge(bar,'champ')"),2);
 assert.equal(run("researchEffectiveAge(bar,'man')"),1);
 assert.equal(run("researchEffectiveAge({k:'bar',t:1},'longs')"),2);
});
test('Composite Bowman ignores enemy armour but foreign Composite Bowmen do not',()=>{
 const run=game(41);
 run("globalThis.enemy=addU(1,'knight',28,30);enemy.hp=500;S.tech[1].armC=1;S.tech[1].armC2=1;S.tech[1].armC3=1;globalThis.bow=addU(0,'composite',23,30)");
 const hit=()=>run("(()=>{enemy.hp=500;dmgT(bow,enemy);return 500-enemy.hp})()");
 const bypass=hit();
 run("S.civ[0]=0");
 assert.ok(bypass>hit());
});
test('Warrior Priests heal allies and Fereters strengthens healing on real ticks',()=>{
 const run=game(41);
 run("globalThis.priest=addU(0,'warpriest',21,28);globalThis.wounded=addU(0,'mil',22,28);wounded.hp=10;priest.hc=0");
 run("upU(priest,1)");
 assert.equal(run("wounded.hp"),14);
 run("S.tech[0].ut41p=1;priest.hc=0;upU(priest,1)");
 assert.equal(run("wounded.hp"),22);
 run("S.civ[0]=0;priest.hc=0;upU(priest,1)");
 assert.equal(run("wounded.hp"),22);
});
test('Fereters increases living infantry health but not spears or foreign troops',()=>{
 const run=game(41);
 run("globalThis.own=addU(0,'mil',21,28);globalThis.spear=addU(0,'spear',22,28);globalThis.foreign=addU(1,'mil',23,28)");
 const before=run('own.hp'),spear=run('spear.hp'),foreign=run('foreign.hp');
 assert.equal(run("research(castle,'ut41p')"),true);
 run("upB(castle,TE.ut41p.t+1)");
 assert.equal(run('own.hp'),before+30);
 assert.equal(run('spear.hp'),spear);
 assert.equal(run('foreign.hp'),foreign);
});
test('Cilician Fleet grants Armenian Galley range only to its researching team',()=>{
 const run=game(41);
 const before=run("attackRange({k:'gal',t:0})");
 run("S.tech[0].ut41=1");
 assert.equal(run("attackRange({k:'gal',t:0})"),before+1);
 assert.equal(run("attackRange({k:'gal',t:1})"),before);
});
test('Monaspa proximity attack bonus requires a living nearby friendly Knight',()=>{
 const run=game(42);
 run("globalThis.monaspa=addU(0,'monaspa',23,29);globalThis.enemy=addU(1,'mil',25,29);enemy.hp=500;globalThis.knight=addU(0,'knight',24,29)");
 const hit=()=>run("(()=>{enemy.hp=500;dmgT(monaspa,enemy);return 500-enemy.hp})()");
 const group=hit();
 run("knight.hp=0");
 assert.equal(group-hit(),1);
 run("S.civ[0]=0;knight.hp=100");
 assert.equal(hit(),group-1);
});
test('Georgian mounted regeneration by Imperial Age does not affect infantry',()=>{
 const run=game(42);
 run("globalThis.rider=addU(0,'monaspa',21,28);globalThis.foot=addU(0,'mil',22,28);rider.hp=50;foot.hp=10;S.age[0]=3");
 run("upU(rider,1)");
 assert.ok(Math.abs(run("rider.hp")-(50+14/60))<1e-8);
 run("upU(foot,1)");
 assert.equal(run("foot.hp"),10);
});
test('Aznauri discounts living and queued Georgian cavalry population by twenty percent',()=>{
 const run=game(42);
 run("globalThis.a=addU(0,'monaspa',21,28);globalThis.b=addU(0,'mil',22,28);castle.q=[{k:'monaspa',t:20,paidCost:{f:65,g:45}}]");
 assert.equal(run('livePopulation(0)'),2);
 assert.equal(run('popOf(0)'),3);
 run("S.tech[0].ut42p=1");
 assert.ok(Math.abs(run('livePopulation(0)')-1.8)<1e-9);
 assert.ok(Math.abs(run('popOf(0)')-2.6)<1e-9);
});
test('Svan Towers adds defensive attack without leaking to another team',()=>{
 const run=game(42);
 run("globalThis.defender=addU(1,'mil',21,28);defender.hp=500");
 const hit=()=>run("(()=>{defender.hp=500;dmgT({k:'cs',t:0},defender);return 500-defender.hp})()");
 const before=hit();
 run("S.tech[0].ut42=1");
 assert.equal(hit(),before+2);
});

test('Fereters covers every infantry kind except spearmen with existing and future HP',()=>{
 const run=game(41);
 const kinds=JSON.parse(run('JSON.stringify([...INFARM])'));
 run("globalThis.samples={};for(const k of INFARM){const u=addU(0,k,21,28);u.hp-=7;samples[k]={u,hp:u.hp};}globalThis.enemy=addU(1,'axe',25,28);globalThis.dead=addU(0,'chakram',26,28);dead.hp=0");
 const enemy=run('enemy.hp');
 assert.equal(run("research(castle,'ut41p')"),true);
 run('upB(castle,TE.ut41p.t+1)');
 for(const k of kinds){
  const bonus=k==='spear'?0:30;
  assert.equal(run(`samples['${k}'].u.hp-samples['${k}'].hp`),bonus,k+' living wounded');
  assert.equal(run(`addU(0,'${k}',22,29).hp-U['${k}'].hp`),bonus,k+' future');
 }
 assert.equal(run('enemy.hp'),enemy);assert.equal(run('dead.hp'),0);
});


test('Armenian AI values Fereters for infantry rather than Composite Bowmen',()=>{
 const run=game(41);
 run("globalThis.ctx={arm:[],vil:[],bl:[],my:[],humanCav:0,humanRanged:0,humanSiege:0,humanInf:0,humanShips:[]}");
 const empty=run("aiTechnologyPriority('ut41p',ctx)");
 for(const k of ['mil','warpriest','axe','chakram']){
  run(`ctx.my=Array.from({length:3},()=>({k:'${k}',hp:50}))`);
  assert.ok(run("aiTechnologyPriority('ut41p',ctx)")>empty,k+' benefits');
 }
 for(const k of ['composite','spear']){
  run(`ctx.my=Array.from({length:3},()=>({k:'${k}',hp:50}))`);
  assert.equal(run("aiTechnologyPriority('ut41p',ctx)"),empty,k+' does not benefit');
 }
 run("ctx.my=[{k:'mil',hp:0},{k:'mil',hp:50,ld:1}]");
 assert.equal(run("aiTechnologyPriority('ut41p',ctx)"),empty,'inactive troops do not drive research');
});
