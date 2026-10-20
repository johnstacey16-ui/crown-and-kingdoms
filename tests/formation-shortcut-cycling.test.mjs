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
