import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
 const setup=[
  "seedOv=123456;msz=0;kingdoms=2;cmp=null;start();snd=0;mode='play';",
  "pad={axes:[0,0,0,0],buttons:[]};cur={x:CW/2,y:CH/2};",
  "globalThis.press=(edges=[],held=[],axes=[0,0,0,0])=>{E=edges;P=held;RE=[];pad.axes=axes;ctl(1/30)};",
  "globalThis.wheel=()=>vpWheel&&({manual:vpWheel.manual,sel:vpWheel.sel});",
  "globalThis.priority=()=>({enabled:S.vp.enabled,f:S.vp.f,w:S.vp.w,g:S.vp.g,s:S.vp.s});",
  "globalThis.snapshot=()=>JSON.stringify({selected:S.sel.map(u=>u.netId),",
  " units:S.us.map(u=>[u.k,u.t,u.hp]),bs:S.bs.map(b=>[b.k,b.hp]),res:S.res});"
 ].join('\n');
 vm.runInContext(source+'\n'+ui+'\n'+setup,sandbox,{timeout:15000});
 return sandbox;
}
const button=n=>Object.assign([],{[n]:true});
test('R3 opens priorities wheel; B cancels without affecting units or resources',()=>{
 const c=game(),before=c.snapshot();
 c.press(button(11));
 assert.deepEqual(JSON.parse(JSON.stringify(c.wheel())),{manual:false,sel:0});
 assert.equal(c.snapshot(),before);
 c.press(button(1));assert.equal(c.wheel(),null);
 assert.equal(c.snapshot(),before);
});
test('seven preset choices update existing persisted worker priorities',()=>{
 const c=game();c.press(button(11));c.press(button(0));
 assert.equal(c.wheel(),null);
 assert.deepEqual(JSON.parse(JSON.stringify(c.priority())),{enabled:true,f:3,w:3,g:2,s:1});
 assert.equal(vm.runInContext("villagerPriorityMenuItems()[1].v().includes('3 target')",c),true);
});
test('Y enters manual resource menu; A adds and B subtracts',()=>{
 const c=game();c.press(button(11));c.press(button(3));
 assert.equal(c.wheel().manual,true);
 const prior=c.priority();c.press(button(0));assert.equal(c.priority().f,prior.f+1);
 c.press(button(1));assert.equal(c.priority().f,prior.f);
 assert.equal(c.priority().w,prior.w);
 c.press(button(3));assert.equal(c.wheel().manual,false);
 c.press(button(11));assert.equal(c.wheel(),null);
});
test('X toggles automation in wheel without touching control groups',()=>{
 const c=game();c.press(button(11));const enabled=c.priority().enabled;
 c.press(button(2));assert.equal(c.priority().enabled,!enabled);
 assert.equal(c.wheel().manual,false);
 c.press(button(11));assert.equal(c.wheel(),null);
});
test('R3 wheel intercepts world input and closes on Menu',()=>{
 const c=game();c.press(button(11));const before=c.snapshot();
 c.press([],[],[1,0,0,-1]);assert.equal(c.snapshot(),before);
 c.press(button(9));assert.equal(vm.runInContext('mode',c),'pause');
 assert.equal(c.wheel(),null);
});
test('seven nonnegative presets are distinct',()=>{
 const c=game();
 const ids=Array.from(vm.runInContext('VILLAGER_PRIORITY_PRESETS.map(p=>p.weights.join(":"))',c));
 assert.equal(ids.length,7);assert.equal(new Set(ids).size,7);
 for(const values of ids)assert.ok(values.split(':').every(v=>Number.isInteger(+v)&&+v>=0));
});
