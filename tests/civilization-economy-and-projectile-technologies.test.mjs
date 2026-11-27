import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
function game(civ=13){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.runTest=code=>eval(code);',sandbox);
 const run=sandbox.runTest;
 run("kingdoms=2;startAge=3;startRes=3;start();S.age=[3,3];S.civ=["+civ+",0];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.us=[];S.bs=[];S.pj=[];S.rel=[];globalThis.castle={k:'castle',t:0,x:20,y:20,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle)");
 return run;
}
test('three civilization unique techs have paid research, age gates and foreign-command exclusion',()=>{
 const run=game();
 for(const [id,key,age] of [[13,'ut13p',2],[15,'ut15p',3],[17,'ut17p',3]]){
  run('S.civ[0]='+id+';S.age[0]=1;S.tech[0]={};S.res[0]={f:10000,w:10000,g:10000,s:10000};castle.rs=null');
  const d=JSON.parse(run('JSON.stringify(TE['+JSON.stringify(key)+'])'));
  assert.equal(d.age,age);
  assert.equal(run('rsOf(castle).includes('+JSON.stringify(key)+')'),true);
  assert.equal(run("rsOf({k:'castle',t:1}).includes("+JSON.stringify(key)+")"),false);
  assert.equal(run('research(castle,'+JSON.stringify(key)+')'),false);
  run('S.age[0]='+age);
  assert.equal(run('research(castle,'+JSON.stringify(key)+')'),true);
  for(const [k,v] of Object.entries(d.cost))assert.equal(run('S.res[0]['+JSON.stringify(k)+']'),10000-v);
  run('upB(castle,'+(d.t+.1)+')');
  assert.equal(run('S.tech[0]['+JSON.stringify(key)+']'),1);
 }
});
test('Indian Grand Trunk Road actually boosts trade trip cargo while leaving enemies unchanged',()=>{
 const run=game(13);
 assert.equal(run('tradeTripGold({t:0},100)'),35);
 assert.equal(run('tradeTripGold({t:0},NaN)'),0);
 run('S.tech[0].ut13p=1');
 assert.equal(run('tradeTripGold({t:0},100)'),39);
 assert.equal(run('tradeTripGold({t:1},100)'),35);
 run('S.civ[0]=0');
 assert.equal(run('tradeTripGold({t:0},100)'),35);
});
test('Shatagni is paid Imperial research with an isolated +2 Hand Cannoneer range effect',()=>{
 const run=game(13),tech=JSON.parse(run('JSON.stringify(TE.ut13)'));
 assert.equal(tech.age,3);assert.deepEqual(tech.cost,{f:500,g:650});
 run('S.age[0]=2');assert.equal(run("research(castle,'ut13')"),false);
 const row=JSON.parse(run("JSON.stringify(technologyTreeModel(0).buildings.find(b=>b.id==='castle').research.find(r=>r.id==='ut13'))"));
 assert.equal(row.state,'locked');assert.equal(row.age,3);assert.deepEqual(row.cost,tech.cost);
 assert.equal(run('S.res[0].g'),10000);
 run('S.age[0]=3;S.res[0].g=649');assert.equal(run("research(castle,'ut13')"),false);
 run('S.res[0].g=10000');
 const kinds=['hcan','eled','jan','bomb','arc'],before=Object.fromEntries(kinds.map(k=>[k,run(`attackRange({k:'${k}',t:0})`)]));
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut13')"),false);
 assert.equal(run("research(castle,'ut13')"),true);
 assert.equal(run('S.res[0].f'),9500);assert.equal(run('S.res[0].g'),9350);
 assert.equal(run("attackRange({k:'hcan',t:0})"),before.hcan,'queued research cannot grant range');
 run('upB(castle,TE.ut13.t+.1)');
 for(const kind of kinds)assert.equal(run(`attackRange({k:'${kind}',t:0})`),before[kind]+(kind==='hcan'?2:0),kind);
 assert.equal(run("attackRange({k:'hcan',t:1})"),before.hcan);
 assert.equal(run('S.tech[0].atkb?.hcan||0'),0);assert.equal(run('S.tech[0].atkb?.eled||0'),0);
 assert.equal(run("research(castle,'ut13')"),false);
 run('S.civ[0]=1');assert.equal(run("attackRange({k:'hcan',t:0})"),before.hcan,'foreign civ cannot forge the range upgrade');
});
test('existing and future Hand Cannoneers can hold their ground and shoot at Shatagni range after reload',()=>{
 const run=game(13);
 run("S.g.fill(0);S.wt.fill(0);S.nd.fill(null);S.ex.fill(1);S.vs.fill(1);globalThis.gunner=addU(0,'hcan',24,24);globalThis.victim=addU(1,'mil',24+U.hcan.rng+1,24);gunner.st=2;gunner.o='a';gunner.tg=victim;globalThis.oldRange=attackRange(gunner)");
 run('for(let i=0;i<40;i++)upU(gunner,DT)');assert.equal(run('S.pj.length'),0);
 assert.equal(run('gunner.x'),24,'stand-ground units do not approach the old out-of-range target');
 assert.equal(run("research(castle,'ut13')"),true);run('upB(castle,TE.ut13.t+.1);gunner.o="a";gunner.tg=victim;S.pj=[]');
 run('for(let i=0;i<80&&S.pj.length===0;i++)upU(gunner,DT)');assert.equal(run('S.pj.length'),1);
 assert.equal(run('gunner.x'),24);assert.equal(run('attackRange(gunner)'),run('oldRange')+2);
 assert.equal(run("saveG(false,'shatagni-range')"),true);assert.equal(run("loadG(false,'shatagni-range')"),true);
 assert.equal(run("attackRange(S.us.find(u=>u.k==='hcan'))"),run('oldRange')+2);
 assert.equal(run("attackRange(addU(0,'hcan',25,25))"),run('oldRange')+2);
});
test('unique range modifiers read their supplied world and reject foreign or unresearched state',()=>{
 const run=game(13);
 run('globalThis.preview={civ:[13,0],tech:[{ut13:1},{}]};S.civ[0]=0;S.tech[0]={ut13:1}');
 assert.equal(run("uniqueTechnologyRangeBonus('hcan',0,preview)"),2);
 assert.equal(run("uniqueTechnologyRangeBonus('hcan',0)"),0);
 for(const kind of['eled','constructor','__proto__',null])assert.equal(run(`uniqueTechnologyRangeBonus(${JSON.stringify(kind)},0,preview)`),0);
 for(const id of['13','constructor','__proto__',-1,43]){
  run(`preview.civ[0]=${JSON.stringify(id)}`);assert.equal(run("uniqueTechnologyRangeBonus('hcan',0,preview)"),0);
 }
 run('preview.civ[0]=0');assert.equal(run("uniqueTechnologyRangeBonus('hcan',0,preview)"),0);
 run('preview.civ[0]=13;preview.tech[0]={}');assert.equal(run("uniqueTechnologyRangeBonus('hcan',0,preview)"),0);
});
test('Italian Pirotechnia pierces a second hostile target but not friendlies or nearby flanks',()=>{
 const run=game(15);
 run("globalThis.first={k:'mil',t:1,x:12,y:12,hp:150,p:[]};globalThis.second={k:'mil',t:1,x:13,y:12,hp:150,p:[]};globalThis.friendly={k:'mil',t:0,x:13,y:12.2,hp:150,p:[]};globalThis.side={k:'mil',t:1,x:13,y:14,hp:150,p:[]};S.us=[first,second,friendly,side]");
 const fire=()=>run("(()=>{S.pj=[];first.hp=150;second.hp=150;friendly.hp=150;side.hp=150;launchProjectile({k:'hcan',t:0,x:9,y:12},first);pjs(1);return 150-second.hp})()");
 assert.equal(fire(),0);
 run('S.tech[0].ut15p=1');
 assert.equal(fire(),3);
 assert.equal(run('friendly.hp'),150);
 assert.equal(run('side.hp'),150);
 run('S.civ[0]=0');
 assert.equal(fire(),0);
});
test('Hunnic Atheism halves enemy relic gold from live Monastery updates',()=>{
 const run=game(17);
 run("globalThis.own={k:'monastery',t:0,x:24,y:22,s:3,hp:500,mh:500,done:true,pr:30,q:[],rs:null};globalThis.foe={k:'monastery',t:1,x:30,y:22,s:3,hp:500,mh:500,done:true,pr:30,q:[],rs:null};S.bs.push(own,foe);S.rel=[{m:own},{m:foe}];S.res[0].g=0;S.res[1].g=0");
 run('upB(own,1);upB(foe,1)');
 assert.equal(run('S.res[0].g'),.5);
 assert.equal(run('S.res[1].g'),.5);
 run('S.tech[0].ut17p=1;upB(own,1);upB(foe,1)');
 assert.equal(run('S.res[0].g'),1);
 assert.equal(run('S.res[1].g'),.75);
 run('S.civ[0]=0;upB(foe,1)');
 assert.equal(run('S.res[1].g'),1.25);
});
test('Pirotechnia flags persist in same-build save files',()=>{
 const run=game(15);
 run('S.tech[0].ut15p=1;S.tech[0].pirotechnia=1');
 assert.equal(run("saveG(false,'ck_civ_economy_batch')"),true);
 run('S.civ[0]=0;S.tech[0]={}');
 assert.equal(run("loadG(false,'ck_civ_economy_batch')"),true);
 assert.equal(run('S.tech[0].ut15p'),1);
 assert.equal(run('S.civ[0]'),15);
});

function andeanGame(){
 const run=game(21);
 run("S.el.fill(0);S.g.fill(0);S.wt.fill(0);S.nd.fill(null);S.ex.fill(1);S.vs.fill(1);globalThis.skirm=addU(0,'skirm',30,30);globalThis.victim=addU(1,'mil',30.5,30);victim.hp=1000;skirm.o='a';skirm.tg=victim;skirm.st=2;S.tech[0].thumb=1;globalThis.kamayuk=addU(0,'kamayuk',25,25)");
 return run;
}
function closeShot(run){
 return run('(()=>{S.pj=[];skirm.cd=0;skirm.wind=0;skirm.o="a";skirm.tg=victim;for(let i=0;i<80&&S.pj.length===0;i++)upU(skirm,DT);return S.pj.length})()');
}
test('paid completed Andean Sling removes the Skirmisher dead zone without buffing Kamayuks',()=>{
 const run=andeanGame(),hp=run('mhp(kamayuk)');
 assert.equal(closeShot(run),0,'stand-ground Skirmishers cannot shoot a target inside their base dead zone');
 run('S.age[0]=1');assert.equal(run("research(castle,'ut21')"),false);
 run('S.age[0]=2;S.res[0].g=0');assert.equal(run("research(castle,'ut21')"),false);
 run('S.res[0].g=10000');assert.equal(run("research(castle,'ut21')"),true);
 assert.equal(run('S.res[0].f'),9750);assert.equal(run('S.res[0].g'),9800);
 assert.equal(closeShot(run),0,'queued technology has no premature effect');
 run('upB(castle,TE.ut21.t+.1)');assert.equal(closeShot(run),1);
 assert.equal(run('skirm.x'),30);assert.equal(run('skirm.y'),30);
 const before=run('victim.hp');run('pjs(.2)');assert.ok(run('victim.hp')<before,'the real close shot damages its target');
 assert.equal(run('mhp(kamayuk)'),hp);assert.equal(run('kamayuk.hp'),hp);
 assert.equal(run('S.tech[0].hpb?.kamayuk||0'),0);assert.equal(run('S.tech[0].atkb?.kamayuk||0'),0);
 assert.equal(run("research(castle,'ut21')"),false);
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut21')"),false);
 assert.equal(run('U.skirm.minR'),1,'the canonical unit and opponent dead zone remain intact');
});
test('Andean Sling is owner-bound and preserves other siege minimum ranges and maximum reach',()=>{
 const run=andeanGame();const range=run('attackRange(skirm)');
 run('S.tech[0].ut21=1');assert.equal(run('attackMinimumRange(skirm)'),0);assert.equal(run('attackRange(skirm)'),range);
 assert.equal(run("attackMinimumRange({k:'skirm',t:1})"),1);
 run('S.civ[0]=0');assert.equal(run('attackMinimumRange(skirm)'),1);assert.equal(closeShot(run),0);
 run('S.civ[0]=21;S.tech[0].ut21=0');assert.equal(closeShot(run),0);
 run('S.tech[0].ut21=1');
 for(const kind of ['treb','cgal','houfnice'])assert.equal(run(`attackMinimumRange({k:'${kind}',t:0})`),run(`U.${kind}.minR`));
 run('S.tech[0].onager=1');assert.equal(run("attackMinimumRange({k:'mang',t:0})"),3);
 assert.equal(run("attackMinimumRange({k:'scor',t:0})"),2);
 run('S.civ[0]=40');assert.equal(run("attackMinimumRange({k:'scor',t:0})"),1,'Roman Scorpion minimum-range rule is retained');
 assert.equal(run("uniqueTechnologyUnitBonus('minimumRangeReduction','skirm',0,{civ:[21],tech:[{ut21:1}]})"),1);
 assert.equal(run("uniqueTechnologyUnitBonus('minimumRangeReduction','skirm',0,{civ:[0],tech:[{ut21:1}]})"),0);
});
test('existing and future Incan Skirmishers retain close-range firing after current-build reload',()=>{
 const run=andeanGame();run('S.tech[0].ut21=1');
 assert.equal(run("saveG(false,'andean-close-shot')"),true);assert.equal(run("loadG(false,'andean-close-shot')"),true);
 run("skirm=S.us.find(u=>u.k==='skirm');victim=S.us.find(u=>u.t===1&&u.k==='mil')");
 assert.equal(closeShot(run),1);run('pjs(.2)');
 run("skirm=addU(0,'skirm',30,30);skirm.st=0");assert.equal(closeShot(run),1);
 assert.equal(run('skirm.x'),30,'a mobile-stance Skirmisher does not retreat from the removed dead zone');
 assert.equal(run('skirm.y'),30);
 const hp=run('victim.hp');run('victim.t=0;pjs(.2)');assert.equal(run('victim.hp'),hp,'a target that becomes friendly cannot be hit');
});

test('Silk Road replaces Pavise with paid Castle-age trade discounts and no Genoese stat bonuses',()=>{
 const run=game(15);run("CIV[15].fx(0);globalThis.genoese=addU(0,'genoa',25,25)");
 assert.equal(run('TE.ut15.n'),'Silk Road');assert.equal(run('TE.ut15.age'),2);
 assert.equal(run("technologyTreeModel(0).buildings.find(b=>b.id==='castle').research.find(r=>r.id==='ut15').name"),'Silk Road');
 run('S.age[0]=1');assert.equal(run("research(castle,'ut15')"),false);
 run('S.age[0]=2;S.res[0].g=249');assert.equal(run("research(castle,'ut15')"),false);
 run('S.res[0].g=10000');assert.equal(run("research(castle,'ut15')"),true);
 assert.equal(run('S.res[0].f'),9750);assert.equal(run('S.res[0].g'),9750);
 assert.equal(run("unitTrainingCost(0,'cart').w"),100,'queued research gives no discount');
 run('upB(castle,TE.ut15.t+.1)');
 assert.deepEqual(JSON.parse(run("JSON.stringify(unitTrainingCost(0,'cart'))")),{w:50});
 assert.deepEqual(JSON.parse(run("JSON.stringify(unitTrainingCost(0,'cog'))")),{w:50,g:25});
 assert.equal(run('mhp(genoese)'),run('U.genoa.hp'));assert.equal(run('genoese.hp'),run('U.genoa.hp'));
 assert.equal(run('S.tech[0].atkb?.genoa||0'),0);assert.equal(run('S.tech[0].hpb?.genoa||0'),0);
 assert.equal(run("research(castle,'ut15')"),false);assert.equal(run("rsOf({k:'castle',t:1}).includes('ut15')"),false);
 for(const kind of ['fish','trn','gal','orgun','genoa','vil'])assert.equal(run(`unitTrainingCost(0,'${kind}').w||0`),run(`U.${kind}.cost.w||0`));
 run('S.civ[0]=0');assert.equal(run("unitTrainingCost(0,'cart').w"),100,'foreign flags give no discount');
 assert.equal(run("unitTrainingCost(0,'cart',[15],[{ut15:1}]).w"),50,'supplied-world cost consumers use the same rule');
});

test('Silk Road queues charge and refund their actual price before and after research, including reload',()=>{
 const run=game(15);
 run("addB(0,'house',12,12,true);globalThis.market=addB(0,'market',28,28,true);globalThis.dock=addB(0,'dock',38,38,true)");
 assert.equal(run("train(market,'cart')"),true);assert.equal(run("train(dock,'cog')"),true);
 run('globalThis.oldBudget=JSON.stringify(S.res[0])');
 assert.equal(run("research(castle,'ut15')"),true);run('upB(castle,TE.ut15.t+.1)');
 assert.equal(run('market.q[0].paidCost.w'),100);assert.equal(run('dock.q[0].paidCost.g'),50);
 assert.equal(run('cancelQ(market)'),true);assert.equal(run('cancelQ(dock)'),true);
 assert.equal(run('S.res[0].w'),10000);assert.equal(run('S.res[0].g'),9750);
 run('globalThis.budget=JSON.stringify(S.res[0])');
 assert.equal(run("train(market,'cart')"),true);assert.equal(run("train(dock,'cog')"),true);
 assert.equal(run('S.res[0].w'),9900);assert.equal(run('S.res[0].g'),9725);
 assert.equal(run("saveG(false,'silk-road-prices')"),true);assert.equal(run("loadG(false,'silk-road-prices')"),true);
 run("market=S.bs.find(b=>b.k==='market');dock=S.bs.find(b=>b.k==='dock')");
 assert.equal(run('market.q[0].paidCost.w'),50);assert.equal(run('dock.q[0].paidCost.g'),25);
 run('cancelQ(market);cancelQ(dock)');assert.equal(run('JSON.stringify(S.res[0])'),run('budget'));
 assert.equal(run("unitTrainingCost(0,'cog').g"),25);assert.equal(run('cancelQ(dock)'),false);
 run('S.res[0].w=49');assert.equal(run("train(market,'cart')"),false);assert.equal(run('S.res[0].w'),49);
});

test('Italian foot-archer armour is passive, stacks with research and affects real hits without HP/farm placeholders',()=>{
 const run=game(15);run('CIV[15].fx(0)');
 assert.equal(run('S.tech[0].hpb?.arc||0'),0);assert.equal(run('S.tech[0].hpb?.xbow||0'),0);assert.equal(run('S.tech[0].fa||0'),0);
 for(const kind of ['arc','xbow','genoa','lbow','chuko','plumed','rattan','composite','skirm','hcan','jan','cavarch','eled','mgd','knight','mil']){
  const bonus=['arc','xbow','genoa','lbow','chuko','plumed','rattan','composite'].includes(kind)?1:0;
  for(const cls of ['m','p']){
   const own=run(`combatArmor({k:'${kind}',t:0},'${cls}')`),foreign=run(`combatArmor({k:'${kind}',t:1},'${cls}')`);
   assert.equal(own,foreign+bonus,kind+' / '+cls);
  }
 }
 run("S.tech[0].armR=1;globalThis.defender=addU(0,'genoa',30,30);globalThis.attacker=addU(1,'knight',31,30)");
 assert.equal(run("combatArmor(defender,'m')"),run('MA.genoa||0')+2);
 const hit=()=>run('(()=>{defender.hp=1000;dmgT(attacker,defender);return 1000-defender.hp})()');
 const protectedHit=hit();run('S.civ[0]=0');assert.equal(hit(),protectedHit+1);
 run('S.civ[0]=15;S.tech[0].ut15=1');assert.equal(hit(),protectedHit,'Silk Road cannot add or stack the passive armour');
 assert.equal(run("saveG(false,'italian-armour')"),true);assert.equal(run("loadG(false,'italian-armour')"),true);
 assert.equal(run("combatArmor(addU(0,'arc',25,25),'p')"),run('PRA.arc||0')+2);
});
