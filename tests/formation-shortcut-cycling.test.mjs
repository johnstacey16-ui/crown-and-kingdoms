import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source,sandbox);
 vm.runInContext(`
 mode='play';pad={axes:[0,0,0,0],buttons:[]};clampCam=()=>{};
 cur={x:100,y:100};
 const a={t:0,k:'mil',hp:40,x:10,y:10},b={...a,x:12},enemy={...a,t:1};
 S={us:[a,b,enemy],bs:[],sel:[a,b]};
 globalThis.issued=[];orderSel=(target,x,y)=>{issued.push({units:S.sel.slice(),x,y});return true;};
 globalThis.run=(code)=>eval(code);
 globalThis.formation=()=>fm;
 globalThis.press=()=>{E=[];E[3]=true;P=[];P[3]=true;RE=[];playCtl(0)};
 globalThis.release=()=>{E=[];P=[];RE=[];RE[3]=true;playCtl(0)};
 `,sandbox);
 return sandbox;
}

test('fresh Y release toggles only Line/Split from every menu formation',()=>{
 const c=fixture();
 for(let initial=0;initial<6;initial++){
  c.run('fm='+initial);
  c.press();assert.equal(c.formation(),initial,'press waits for release');
  c.release();assert.equal(c.formation(),initial===1?5:1);
 }
 c.run('fm=1');c.press();c.release();c.press();c.release();assert.equal(c.formation(),1);
});

test('single, duplicate, foreign, stale, loaded and nonmilitary selections cannot change formation',()=>{
 for(const setup of [
  'S.sel=[a]', 'S.sel=[a,a]', 'S.sel=[a,enemy]',
  'S.sel=[a,{...b}]', 'b.ld={}', 'b.hp=0',
  "b.k='mon'", "b.k='cart'", "b.k='king'", "b.k='fish'", "b.k='trn'"
 ]){
  const c=fixture();c.run('fm=1;'+setup);c.press();c.release();assert.equal(c.formation(),1,setup);
 }
});

test('held-Y cycling and interrupted or orphan releases do not change military formation',()=>{
 const c=fixture();c.run('fm=1');c.release();assert.equal(c.formation(),1);
 c.press();c.run('E=[];E[14]=true;P=[];P[3]=true;RE=[];playCtl(0)');
 c.release();assert.equal(c.formation(),1);
 c.press();c.run('cancelGameplayGestures()');c.release();assert.equal(c.formation(),1);
 c.press();c.release();assert.equal(c.formation(),5);
});

test('Y immediately orders reformation and preserves selection; mixed movement classes use separate centres',()=>{
 const c=fixture();
 c.run("const shipA={...a,k:'gal',sh:1,y:25},shipB={...b,k:'gal',sh:1,y:27};S.us.push(shipA,shipB);S.sel=[a,b,shipA,shipB];globalThis.beforeSelection=S.sel;fm=1;");
 c.press();assert.equal(c.issued.length,0);
 c.release();assert.equal(c.issued.length,2);
 assert.deepEqual(Array.from(c.issued,entry=>[entry.x,entry.y,entry.units.length]),[[11,10,2],[11,26,2]]);
 assert.equal(c.run('S.sel===beforeSelection'),true);
});

function movementFixture(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+`
 mode='play';snd=0;setSize(40);
 S={us:[],bs:[],sel:[],tech:[{},{}],r:mk(17),teamN:2,
  nd:Array(W*H).fill(null),g:new Uint8Array(W*H),
  gt:new Uint8Array(W*H),wt:new Uint8Array(W*H)};
 for(let y=20;y<H;y++)for(let x=0;x<W;x++)S.wt[y*W+x]=1;
 const a=addU(0,'mil',10.5,10.5),b=addU(0,'mil',11.5,10.5);
 const navyA=addU(0,'gal',10.5,25.5),navyB=addU(0,'gal',11.5,25.5);
 S.sel=[a,b,navyA,navyB];fm=1;
 globalThis.run=(code)=>eval(code);
 globalThis.snapshot=()=>S.us.map(u=>({x:u.x,y:u.y,order:u.o,route:u.p.map(p=>p.slice()),ship:!!u.sh}));
 globalThis.reform=()=>yShort(false);
 globalThis.advance=()=>{for(let frame=0;frame<300;frame++)for(const u of S.us)if(u.o==='m'&&walk(u,1/30))u.o='i'};
 `,sandbox);
 return sandbox;
}

test('production routes move land and naval units into Split without teleporting or crossing terrain',()=>{
 const c=movementFixture(),before=c.snapshot();
 c.reform();const ordered=c.snapshot();
 assert.deepEqual(Array.from(ordered,u=>[u.x,u.y]),Array.from(before,u=>[u.x,u.y]));
 assert.ok(ordered.every(u=>u.order==='m'&&u.route.length>0));
 c.advance();const after=c.snapshot();
 assert.ok(after[0].y<10.5&&after[1].y>10.5,'land wings separate immediately');
 assert.ok(after[2].y<25.5&&after[3].y>25.5,'naval wings separate immediately');
 assert.ok(after.every((u,i)=>u.ship?u.y>=20:u.y<20));
 assert.ok(after.every(u=>u.route.length===0));
 c.reform();assert.equal(c.run('fm'),1);c.advance();
 assert.ok(c.snapshot().every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)));
});

test('blocked reformation cannot walk through obstacles and unavailable inputs do not issue routes',()=>{
 const c=movementFixture();
 c.run('S.sel=[a,b];S.g.fill(1);S.g[10*W+10]=0;S.g[10*W+11]=0;');
 c.reform();c.advance();
 const after=c.snapshot();
 assert.equal(c.run('S.g[(a.y|0)*W+(a.x|0)]'),0);
 assert.equal(c.run('S.g[(b.y|0)*W+(b.x|0)]'),0);
 assert.ok(after.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)));
 const d=movementFixture();
 d.run("mode='multiplayer'");d.reform();
 assert.equal(d.run('fm'),1);assert.ok(d.snapshot().every(u=>u.route.length===0));
 d.run("mode='play';a.x=NaN");d.reform();
 assert.equal(d.run('fm'),1);assert.ok(d.snapshot().every(u=>u.route.length===0));
});

test('order failures always restore the original player selection',()=>{
 const c=fixture();
 c.run('globalThis.beforeSelection=S.sel;orderSel=()=>{throw Error("route failure")};');
 c.press();assert.throws(()=>c.release(),/route failure/);
 assert.equal(c.run('S.sel===beforeSelection'),true);
});
