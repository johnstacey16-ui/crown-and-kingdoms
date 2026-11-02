import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
function artwork(){
 const source=readFileSync(new URL('../js/render-effects.js',import.meta.url),'utf8'),c={};vm.createContext(c);
 vm.runInContext(source.slice(source.indexOf('const PROJECTILE_STYLES='),source.indexOf('/* Particle emission, lifetime, rendering and queued procedural warm-up. */'))+';globalThis.api={style:projectileVisualStyle,heading:projectileVisualHeading,draw:drawProjectileArtwork}',c);return c.api;
}
test('weapon families are distinct and fixed aim never reads a moving or hidden target',()=>{
 const a=artwork();for(const [kind,style] of [['arc','arrow'],['genoa','bolt'],['scor','heavy-bolt'],['skirm','javelin'],['hcan','bullet'],['bomb','cannon'],['treb','stone'],['axe','axe'],['gbeto','blade']])assert.equal(a.style(kind),style);
 const shot={x:10,y:10,tx:20,ty:10,get t(){throw Error('target must not be read')}};
 assert.equal(a.style('__proto__'),'arrow');assert.equal(a.style('constructor'),'arrow');assert.equal(a.style(null),'arrow');
 assert.equal(a.heading(shot),0);assert.equal(a.heading({x:10,y:10,tx:20,ty:10,t:undefined}),0);
 assert.equal(a.heading({x:1,y:1,tx:NaN,ty:1}),null);assert.equal(a.heading({x:1,y:1}),null);
});
test('projectile drawings restore transforms and reject invalid positions without allocating textures',()=>{
 const a=artwork(),calls=[],g=new Proxy({},{get:(_,k)=>(...args)=>calls.push([k,...args])});
 for(const style of ['arrow','bolt','heavy-bolt','javelin','bullet','cannon','stone','axe','blade']){calls.length=0;assert.equal(a.draw(g,10,20,.5,style,1,2),true);assert.equal(calls[0][0],'save');assert.equal(calls.at(-1)[0],'restore')}
 calls.length=0;assert.equal(a.draw(g,NaN,20,0,'arrow',0),false);assert.deepEqual(calls,[]);
 const failure=new Proxy({save(){},restore(){calls.push(['restored'])},translate(){throw Error('draw failed')}},{get:(o,k)=>o[k]||(()=>{})});assert.throws(()=>a.draw(failure,0,0,0,'arrow',0));assert.equal(calls.at(-1)[0],'restored');
});
test('team-relative projectile projection copies only visible shot art and fixed heading',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 const read=p=>readFileSync(new URL('../js/'+p+'.js',import.meta.url),'utf8');
 vm.runInContext(source+'\n'+read('assets')+'\n'+read('network-sync')+'\n'+read('network-commands')+'\n'+read('network-unit-map')+`
 seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;start();snd=mus=0;S.us=[];S.bs=[];
 const observer=addU(0,'vil',20,20);addU(1,'vil',60,60);
 const visible={x:21,y:20,tx:24,ty:20,a:{k:'bomb',t:1},get t(){throw Error('hidden target accessed')}};
 S.pj=[visible,{x:60,y:60,tx:62,ty:60,a:{k:'arc',t:1}},{x:21,y:20,tx:24,ty:20,a:{k:'bomb',t:1},dead:1,t:null}];
 globalThis.projected=CK_UNIT_MAP.project(S,0,W,H).battlefield.projectiles;
 `,sandbox);
 assert.equal(sandbox.projected.length,1);const p=sandbox.projected[0];assert.equal(p.style,'cannon');assert.equal(p.heading,0);
 assert.deepEqual(Object.keys(p).sort(),['heading','style','x','y']);
});

test('projectile art uses only the offline effects owner; depth-sorted world draws keep dispatching',()=>{
 const effects=readFileSync(new URL('../js/render-effects.js',import.meta.url),'utf8');
 const render=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const name of ['projectileVisualStyle','projectileVisualHeading','drawProjectileArtwork']){
  assert.ok(effects.includes('function '+name+'('),name+' exists in effects owner');
  assert.ok(!render.includes('function '+name+'('),name+' is not duplicated in the dispatcher');
 }
 assert.ok(html.indexOf('./js/render-troops.js')<html.indexOf('./js/render-effects.js'));
 assert.ok(html.indexOf('./js/render-effects.js')<html.indexOf('./js/ui.js'));
 assert.ok(sw.includes("'./js/render-effects.js'"));
 assert.ok(render.includes('drawProjectileArtwork('),'world renderer keeps rendering projectile variants');
});
