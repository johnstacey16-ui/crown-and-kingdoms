import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation-unit-behaviour.js', import.meta.url), 'utf8');
const civilizations = readFileSync(new URL('../js/civilizations.js', import.meta.url), 'utf8');
const roadmap = readFileSync(new URL('../AOE2_PARITY_ROADMAP.md', import.meta.url), 'utf8');

test('critical balance regressions from the parity audit stay corrected', () => {
  assert.match(config, /farm:\{n:'Farm',s:1,hp:480,cost:\{w:60\},bt:15\}/);
  assert.match(config, /needs:\['rng','stable','smith','market'\]/);
  assert.match(config, /treb:\{[^}]*minR:3/);
  assert.match(simulation, /const dist=d2\(u\.x,u\.y,tg\),minR=d\.minR\|\|0/);
  assert.match(simulation, /if\(minR&&dist<minR\)/);
  assert.ok(civilizations.includes("n:'Supremacy',cost:{f:300,g:250},t:50,age:2,fx:t=>{atkbF(t,'vil',6);hpbF(t,'vil',40)}"));
});

test('roadmap records source corrections without claiming live gameplay verification', () => {
  assert.match(roadmap, /Audit findings and implementation status/);
  assert.match(roadmap, /Xbox Series S \/ Edge performance/);
  assert.match(roadmap, /do not prove full mission playthroughs/);
});


const {default:vm}=await import('node:vm');
const {headlessGame}=await import('./helpers/headless-game.mjs');
function closeCombat(kind,gap){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+`;globalThis.run=code=>eval(code);kingdoms=2;start();S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);
 globalThis.attacker=addU(0,'${kind}',20.5,20.5);globalThis.target=addU(1,'mil',20.5+${gap},20.5);attacker.o='a';attacker.tg=target;`,sandbox);
 return sandbox.run;
}
for(const [kind,gap]of [['treb',1],['skirm',.5]])test(kind+' retreats from a target inside minimum range and resumes firing',()=>{
 const run=closeCombat(kind,gap);const before=run('d2(attacker.x,attacker.y,target)');
 run('for(let i=0;i<300;i++)upU(attacker,1/30)');
 assert.ok(run('d2(attacker.x,attacker.y,target)')>before+.3,'the unit must leave its too-close starting tile');
 assert.ok(run('d2(attacker.x,attacker.y,target)>=U[attacker.k].minR'),'retreat reaches a legal firing distance');
 assert.equal(run("attacker.o==='a'&&attacker.tg===target"),true,'the attack target remains assigned');
 assert.ok(run('S.pj.length')>0,'the unit resumes real projectile attacks');
});

test('Stand ground holds position inside minimum range and fires once the target backs away',()=>{
 const run=closeCombat('treb',1);run('attacker.st=2;for(let i=0;i<300;i++)upU(attacker,1/30)');
 assert.equal(run('attacker.x'),20.5);assert.equal(run('attacker.y'),20.5);assert.equal(run('S.pj.length'),0);
 run('target.x=25.5;for(let i=0;i<300;i++)upU(attacker,1/30)');
 assert.equal(run('attacker.x'),20.5);assert.equal(run('attacker.y'),20.5);assert.ok(run('S.pj.length')>0);
});
test('minimum range uses the building footprint and respects an impassable enclosure',()=>{
 const run=closeCombat('treb',1);
 run("S.us=[attacker];target=addB(1,'house',21,20,true);attacker.tg=target;for(let i=0;i<300;i++)upU(attacker,1/30)");
 assert.ok(run('d2(attacker.x,attacker.y,target)>=U.treb.minR'));assert.ok(run('S.pj.length')>0);
 const blocked=closeCombat('treb',1);blocked('S.g.fill(1);S.g[20*W+20]=0;for(let i=0;i<60;i++)upU(attacker,1/30)');
 assert.equal(blocked('attacker.x'),20.5);assert.equal(blocked('attacker.y'),20.5);assert.equal(blocked('S.pj.length'),0);
});
test('units without a minimum range keep their ordinary close-range attack',()=>{
 const run=closeCombat('arc',.5);run('for(let i=0;i<300;i++)upU(attacker,1/30)');
 assert.equal(run('attacker.x'),20.5);assert.equal(run('attacker.y'),20.5);assert.ok(run('S.pj.length')>0);
});
