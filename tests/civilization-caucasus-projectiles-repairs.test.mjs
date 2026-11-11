
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(civ=41){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.runCode=code=>eval(code)',sandbox);
 const run=sandbox.runCode;
 run("seedOv=441126;msz=0;kingdoms=2;startAge=3;startRes=3;startArmy=0;civ="+civ+";start();S.civ=["+civ+",0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.rel=[];S.nodes=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.ship=addU(0,'gal',15,15);globalThis.enemy=addU(1,'mil',18,15);enemy.hp=500;globalThis.house=addB(0,'house',30,30,true);globalThis.worker=addU(0,'vil',29,31)");
 return run;
}
test('Armenian Galley fires two real projectiles but only one extra point of damage',()=>{
 const run=game();
 run("launchProjectile(ship,enemy)");
 assert.equal(run('S.pj.length'),2);
 assert.equal(run('S.pj.filter(p=>p.a.galleySecondary).length'),1);
 run('pjs(20)');
 assert.equal(run('enemy.hp'),491);
 assert.equal(run('S.pj.length'),0);
});
test('Bonus projectile requires an actual living Armenian Galley',()=>{
 const foreign=game(42);foreign('launchProjectile(ship,enemy)');
 assert.equal(foreign('S.pj.length'),1);
 const run=game();run('ship.hp=0;launchProjectile(ship,enemy)');
 assert.equal(run('S.pj.length'),1);
 run("S.pj=[];launchProjectile({k:'gal',t:0,x:15,y:15},enemy)");
 assert.equal(run('S.pj.length'),1);
});
test('Galley arrow is limited to one pierce point against armoured buildings',()=>{
 const run=game();
 run("globalThis.target=addB(1,'house',38,38,true);target.hp=500;launchProjectile(ship,target)");
 assert.equal(run('S.pj.length'),2);
 run('S.pj=[S.pj[1]];pjs(40)');
 assert.equal(run('target.hp'),499);
});
test('Secondary projectile identity survives save, reload, and live damage',()=>{
 const run=game();
 run("launchProjectile(ship,enemy)");
 assert.equal(run("saveG(false,'galley-shot')"),true);
 assert.equal(run("loadG(false,'galley-shot')"),true);
 assert.equal(run('S.pj.filter(p=>p.a.galleySecondary===true).length'),1);
 run('S.pj=S.pj.filter(p=>p.a.galleySecondary);globalThis.target=S.pj[0].t;target.hp=500;pjs(30)');
 assert.equal(run('target.hp'),499);
});
test('Reject malformed saved secondary projectile flags and attacker classes',()=>{
 const run=game();run("launchProjectile(ship,enemy);saveG(false,'galley-guard')");
 run("globalThis.j=JSON.parse(localStorage.getItem('galley-guard'));j.pj[1].a.galleySecondary='yes';localStorage.setItem('galley-guard',JSON.stringify(j))");
 assert.equal(run("loadG(false,'galley-guard')"),false);
 run("j.pj[1].a.galleySecondary=true;j.pj[1].a.k='arc';localStorage.setItem('galley-guard',JSON.stringify(j))");
 assert.equal(run("loadG(false,'galley-guard')"),false);
});
test('Georgian repair bonus cuts paid building repair cost but not repair speed',()=>{
 const a=game(42),b=game(0);
 for(const run of [a,b])run("house.hp=house.mh/2;globalThis.beforeW=S.res[0].w;globalThis.heal=repairBuildingWithResources(worker,house,1);globalThis.spent=beforeW-S.res[0].w");
 assert.ok(a('heal')>0);
 assert.equal(a('heal'),b('heal'));
 assert.ok(Math.abs(a('spent')/b('spent')-.75)<1e-8);
});
test('Georgian team bonus follows alliance changes without duplicating the discount',()=>{
 const run=game(0);
 run("S.civ[1]=42;S.dip[0][1]=S.dip[1][0]='ally';house.hp=house.mh/2;globalThis.beforeW=S.res[0].w;repairBuildingWithResources(worker,house,1);globalThis.allyCost=beforeW-S.res[0].w");
 run("S.dip[0][1]=S.dip[1][0]='neutral';house.hp=house.mh/2;globalThis.beforeW=S.res[0].w;repairBuildingWithResources(worker,house,1)");
 assert.ok(Math.abs(run('allyCost/(beforeW-S.res[0].w)')-.75)<1e-8);
});
test('Building repairs halt without enough resources and never overdraft',()=>{
 const run=game(42);
 run('house.hp=house.mh/2;S.res[0].w=0;globalThis.before=house.hp');
 assert.equal(run('repairBuildingWithResources(worker,house,10)'),0);
 assert.equal(run('house.hp'),run('before'));
 run('S.res[0].w=.01;globalThis.heal=repairBuildingWithResources(worker,house,10)');
 assert.ok(run('heal')>0);
 assert.equal(run('S.res[0].w'),0);
 assert.ok(run('house.hp')<run('house.mh'));
});
test('Town Centre repair spends wood but not stone',()=>{
 const run=game(42);
 run("globalThis.tc=addB(0,'tc',42,42,true);tc.hp=tc.mh/2;globalThis.stone=S.res[0].s;globalThis.wood=S.res[0].w;repairBuildingWithResources(worker,tc,1)");
 assert.ok(run('S.res[0].w')<run('wood'));
 assert.equal(run('S.res[0].s'),run('stone'));
});
test('Foreign enemies, destroyed buildings and foundations cannot receive repair',()=>{
 const run=game(42);
 run("house.hp=house.mh/2;globalThis.foreign=addU(1,'vil',29,31)");
 assert.equal(run("repairBuildingWithResources(foreign,house,1)"),0);
 run("house.done=false");
 assert.equal(run("repairBuildingWithResources(worker,house,1)"),0);
 run("house.done=true;house.hp=0");
 assert.equal(run("repairBuildingWithResources(worker,house,1)"),0);
});
