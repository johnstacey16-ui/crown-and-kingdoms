
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

function game(civ=42){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evalWorld=code=>eval(code)',sandbox);
 const run=sandbox.evalWorld;
 run("seedOv=591126;msz=0;kingdoms=2;startAge=3;startRes=3;startArmy=0;civ="+civ+";start();S.civ=["+civ+",0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.rel=[];S.nodes=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.defender=addU(0,'mil',35,35);globalThis.attacker=addU(1,'knight',30,30);globalThis.house=addB(0,'house',45,45,true)");
 return run;
}
test('Map creates visible deterministic land plateaus without changing map RNG or traversability',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evalWorld=code=>eval(code)',sandbox);const run=sandbox.evalWorld;
 run("seedOv=591126;msz=0;kingdoms=2;startAge=0;startRes=0;civ=42;start();globalThis.oldElev=Array.from(S.el).join('');globalThis.oldRng=S.r.state();globalThis.highTiles=S.el.reduce((n,v)=>n+v,0)");
 assert.ok(run('highTiles')>20);
 assert.equal(run("S.el.every((v,i)=>!v||S.wt[i]===0)"),true);
 run('start()');
 assert.equal(run("Array.from(S.el).join('')===oldElev"),true);
 assert.equal(run('S.r.state()'),run('oldRng'));
});
test('Georgian foot soldier receives 15% less real damage only when above an attacker',()=>{
 const run=game();
 run("S.el.fill(0);defender.hp=500;dmgT(attacker,defender);globalThis.flat=500-defender.hp;defender.hp=500;S.el[35*W+35]=1;dmgT(attacker,defender);globalThis.hill=500-defender.hp");
 assert.ok(run('flat')>0);
 assert.ok(Math.abs(run('hill/flat')-.85)<1e-8);
 run("S.el[30*W+30]=1;defender.hp=500;dmgT(attacker,defender)");
 assert.equal(run('500-defender.hp'),run('flat'),'equal elevation receives no Georgian mitigation');
});
test('Georgian buildings gain high-ground protection but foreign buildings do not',()=>{
 const run=game();
 run("S.el.fill(0);globalThis.enemy=addU(1,'knight',43,42);house.hp=500;dmgT(enemy,house);globalThis.flat=500-house.hp;house.hp=500;S.el[46*W+46]=1;dmgT(enemy,house);globalThis.hill=500-house.hp");
 assert.ok(Math.abs(run('hill/flat')-.85)<1e-8);
 run("S.civ[0]=41;house.hp=500;dmgT(enemy,house)");
 assert.equal(run('500-house.hp'),run('flat'));
});
test('Ranged Georgian high-ground mitigation uses the launch tile, not where a ship later moves',()=>{
 const run=game();
 run("S.el.fill(0);globalThis.ship=addU(1,'gal',15,15);globalThis.target=addU(0,'mil',18,15);target.hp=500;S.el[15*W+18]=1;launchProjectile(ship,target)");
 assert.equal(run("S.pj.length"),1);
 assert.equal(run("S.pj[0].a.x"),15);
 run("ship.x=18;ship.y=15;globalThis.before=target.hp;pjs(20)");
 const shot=run("before-target.hp");
 const flat=run("(()=>{const h=target.hp;S.el[15*W+18]=0;dmgT({k:'gal',t:1,x:15,y:15},target);return h-target.hp})()");
 assert.ok(Math.abs(shot/flat-.85)<1e-8);
});
test('Current-build save round trip retains elevation and projectile origin',()=>{
 const run=game();
 run("S.el.fill(0);S.el[35*W+35]=1;globalThis.gal=addU(1,'gal',15,15);launchProjectile(gal,defender);globalThis.oldId=defender.netId");
 assert.equal(run("saveG(false,'elevation-proof')"),true);
 assert.equal(run("loadG(false,'elevation-proof')"),true);
 assert.equal(run("S.el[35*W+35]"),1);
 assert.equal(run("S.pj.length"),1);
 assert.equal(run("S.pj[0].a.x"),15);
 assert.equal(run("S.pj[0].t.netId"),run('oldId'));
});
test('Reject invalid saved elevation tiles and projectile attacker positions',()=>{
 const run=game();
 run("globalThis.gal=addU(1,'gal',15,15);launchProjectile(gal,defender);saveG(false,'hill-tamper');globalThis.j=JSON.parse(localStorage.getItem('hill-tamper'));j.el='x'+j.el.slice(1);localStorage.setItem('hill-tamper',JSON.stringify(j))");
 assert.equal(run("loadG(false,'hill-tamper')"),false);
 run("j.el='0'.repeat(W*W);j.pj[0].a.x=Infinity;j.pj[0].a.y=1;localStorage.setItem('hill-tamper',JSON.stringify(j))");
 // JSON serialisation turns Infinity into null; the loader must still reject it.
 assert.equal(run("loadG(false,'hill-tamper')"),false);
});
test('Multiplayer world checkpoints include elevation instead of treating it as cosmetic',()=>{
 const run=game();
 const src=readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\n'+src+'\nglobalThis.inspect=code=>eval(code)',sandbox);
 const inspect=sandbox.inspect;
 inspect("seedOv=591126;msz=0;kingdoms=2;start()");
 const before=inspect("CK_SIM_SYNC.worldCheckpoint(S,0).hash");
 inspect("S.el[17*W+17]=1-S.el[17*W+17]");
 assert.notEqual(inspect("CK_SIM_SYNC.worldCheckpoint(S,0).hash"),before);
});
