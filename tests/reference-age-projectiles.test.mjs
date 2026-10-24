import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
function fixture(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 const network=['network-sync','network-commands'].map(n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 vm.runInContext(source+'\n'+network+`\nseedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;startAge=3;startRes=3;start();snd=0;S.humanTeams=[0,1];S.us=[];S.bs=[];S.pj=[];S.rel=[];S.nodes=[];S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.nd.fill(null);S.res.forEach(r=>{r.f=r.w=r.g=r.s=10000});globalThis.run=code=>eval(code);`,sandbox);return sandbox;
}
for(const team of [0,1])test('age prerequisites share any-two distinct eligibility for team '+team,()=>{
 const c=fixture();
 const lists=[['lumber','mill','mine','bar','dock'],['rng','stable','smith','market'],['siege','univ','monastery']];
 for(let age=0;age<3;age++)for(let i=0;i<lists[age].length;i++)for(let j=i+1;j<lists[age].length;j++){
  const [a,b]=[lists[age][i],lists[age][j]];
  assert.equal(c.run(`S.bs=[];S.res[${team}].f=S.res[${team}].g=10000;S.age[${team}]=${age};globalThis.tc=addB(${team},'tc',3,3,true);addB(${team},'${a}',15,15,true);addB(${team},'${b}',25,25,true);research(tc,'age')`),true,`${age}: ${a} + ${b}`);
  assert.equal(c.run('tc.rs.t'),[130,160,190][age]);
 }
});
test('duplicates, destroyed, foreign and unfinished structures never bypass the gate; a single Castle does',()=>{
 const c=fixture();
 for(const setup of ["addB(0,'smith',15,15,true);addB(0,'smith',25,25,true)","addB(0,'smith',15,15,true);addB(1,'market',25,25,true)","addB(0,'smith',15,15,true);addB(0,'market',25,25,false)","addB(0,'smith',15,15,true);addB(0,'market',25,25,true).hp=0", "addB(0,'bar',15,15,true);addB(0,'dock',25,25,true)"]){
  c.run(`S.bs=[];S.age[0]=1;globalThis.tc=addB(0,'tc',3,3,true);${setup}`);const food=c.run('S.res[0].f');
  assert.equal(c.run("research(tc,'age')"),false);assert.equal(c.run('S.res[0].f'),food);
 }
 c.run("S.bs=[];S.age[0]=2;globalThis.tc=addB(0,'tc',3,3,true);globalThis.castle=addB(0,'castle',20,20,false)");
 assert.equal(c.run("research(tc,'age')"),false);c.run('castle.done=true');assert.equal(c.run("research(tc,'age')"),true);
 assert.equal(c.run('B.bar.age===0&&B.dock.age===0&&U.mil.age===0&&U.fish.age===0'),true);
});

test('Fletching, Bodkin and Bracer research in sequence, charge once and affect arrow attack/range per owner',()=>{
 const c=fixture();c.run("S.civ[0]=2;globalThis.smith=addB(0,'smith',12,12,true);globalThis.archer=addU(0,'arc',22.5,22.5);globalThis.victim=addU(1,'mil',28.5,22.5);victim.hp=1000;victim.st=4");
 const base=c.run('attackRange(archer)');
 for(const [key,bonus] of [['atkR',1],['bodkin',2],['atkR2',3]]){
  assert.equal(c.run(`research(smith,'${key}')`),true);c.run(`upB(smith,TE.${key}.t)`);
  assert.equal(c.run('attackRange(archer)'),base+bonus);assert.equal(c.run('arrowBonus(archer)'),bonus);
  const gold=c.run('S.res[0].g');assert.equal(c.run(`research(smith,'${key}')`),false);assert.equal(c.run('S.res[0].g'),gold);
 }
 assert.equal(c.run("arrowBonus({k:'arc',t:1})"),0);
 for(const kind of ['jan','hcan','conq','bomb','mang','axe','gbeto','scor'])assert.equal(c.run(`arrowBonus({k:'${kind}',t:0})`),0,kind);
 for(const kind of ['arc','gal','tw','cs'])assert.equal(c.run(`attackRange({k:'${kind}',t:0})-U.${kind}.rng`),3,kind);
 assert.equal(c.run("attackRange({k:'tca',t:0})"),c.run('U.tca.rng'),'town centre gains attack/sight, not range');
 assert.equal(c.run("arrowSightBonus({k:'tc',t:0})"),3);
 c.run('archer.o=\'a\';archer.tg=victim;archer.cd=0;for(let i=0;i<12;i++)upU(archer,DT)');assert.equal(c.run('S.pj.length'),1,'combat uses upgraded range after Archer windup');
 const upgraded=c.run('victim.hp');c.run('dmgT(archer,victim)');const damage=c.run('victim.hp');
 c.run('S.tech[0].atkR=S.tech[0].bodkin=S.tech[0].atkR2=0;victim.hp=1000;dmgT(archer,victim)');assert.equal(upgraded-damage,1000-c.run('victim.hp')+3);
 c.run('S.tech[0]={};smith.rs=null');assert.equal(c.run("research(smith,'bodkin')"),false);assert.equal(c.run("research(smith,'atkR2')"),false);
 c.run('S.age[0]=0');assert.equal(c.run("research(smith,'atkR')"),false);
});
function flight(ballistics,turn=false){
 const c=fixture();c.run(`S.tech[0].ballistics=${ballistics?1:0};S.tech[0].thumb=1;globalThis.archer=addU(0,'arc',20.5,30.5);globalThis.target=addU(1,'scout',26.5,30.5);target.hp=100;target.o='m';target.p=[[26.5,60.5]];launchProjectile(archer,target);globalThis.shot=S.pj[0];`);
 const aim=c.run('JSON.stringify([shot.tx,shot.ty])');
 for(let i=0;i<30&&c.run('S.pj.length');i++)c.run(`target.y+=unitSpeed(target)*DT*${turn?-1:1};pjs(DT)`);
 assert.equal(c.run('JSON.stringify([shot.tx,shot.ty])'),aim,'aim never follows later target motion');
 return c;
}
test('ordinary shots miss lateral movement; Ballistics leads constant movement; a turn dodges the predicted shot',()=>{
 assert.equal(flight(false).run('target.hp'),100);
 assert.ok(flight(true).run('target.hp')<100);
 assert.equal(flight(true,true).run('target.hp'),100);
});
test('Ballistics is paid University research and applies to scorpions but not gunpowder or stone siege',()=>{
 const c=fixture();c.run("globalThis.university=addB(1,'univ',5,5,true);globalThis.target=addU(0,'scout',26.5,30.5);target.p=[[26.5,60.5]];");
 assert.equal(c.run("research(university,'ballistics')"),true);c.run('upB(university,60)');assert.equal(c.run('S.tech[1].ballistics'),1);assert.equal(c.run('S.tech[0].ballistics||0'),0);
 for(const kind of ['arc','scor'])assert.ok(c.run(`projectileAim({k:'${kind}',t:1,x:20.5,y:30.5},target).ty`)>30.5);
 for(const kind of ['bomb','mang','treb','hcan'])assert.equal(c.run(`projectileAim({k:'${kind}',t:1,x:20.5,y:30.5},target).ty`),30.5);
});
test('stationary hits and impact-centred hostile-only siege splash survive the non-homing flight',()=>{
 const c=fixture();c.run("globalThis.attacker=addU(0,'mang',20.5,25.5);globalThis.target=addU(1,'mil',26.5,25.5);globalThis.nearby=addU(1,'mil',26.5,26.5);globalThis.friend=addU(0,'mil',26.5,26.5);globalThis.building=addB(1,'house',25,25,true);launchProjectile(attacker,target);target.x=35.5");
 const friend=c.run('friend.hp'),hp=c.run('nearby.hp'),building=c.run('building.hp');c.run('pjs(1)');assert.equal(c.run('friend.hp'),friend);assert.ok(c.run('nearby.hp')<hp);assert.ok(c.run('building.hp')<building);
 c.run("S.pj=[];target.x=26.5;target.hp=100;launchProjectile(attacker,target);pjs(1)");assert.ok(c.run('target.hp')<100);
});
test('save/load preserves fixed aim, validates corrupt aims and upgrades legacy shots only once',()=>{
 const c=fixture();c.run("globalThis.archer=addU(0,'arc',20.5,30.5);globalThis.target=addU(1,'scout',26.5,30.5);target.p=[[26.5,60.5]];S.tech[0].ballistics=1;launchProjectile(archer,target);pjs(DT)");
 const aim=c.run('JSON.stringify([S.pj[0].tx,S.pj[0].ty])'),hash=c.run('CK_SIM_SYNC.worldCheckpoint(S,1).hash');
 c.run('S.pj[0].ty+=.1');assert.notEqual(c.run('CK_SIM_SYNC.worldCheckpoint(S,1).hash'),hash);c.run('S.pj[0].ty-=.1');
 assert.equal(c.run('saveG()'),true);assert.equal(c.run('loadG()'),true);assert.equal(c.run('JSON.stringify([S.pj[0].tx,S.pj[0].ty])'),aim);
 assert.equal(c.run('saveG()'),true);c.run("globalThis.raw=JSON.parse(localStorage.getItem(skey(slot)));raw.pj[0].tx=-1;localStorage.setItem(skey(slot),JSON.stringify(raw))");assert.equal(c.run('loadG()'),false);
 c.run('delete S.pj[0].tx;delete S.pj[0].ty;pjs(DT)');const migrated=c.run('S.pj[0].ty');c.run('S.pj[0].t.y+=2;pjs(DT)');assert.equal(c.run('S.pj[0].ty'),migrated);
});
