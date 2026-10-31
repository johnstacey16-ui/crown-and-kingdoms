import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
const kingdom=readFileSync(new URL('../js/kingdom.js',import.meta.url),'utf8');
const input=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const expected=[
 ['Food and Wood',[3,1,0,0]],['Basic',[4,3,2,1]],['Militia Rush',[6,3,1,0]],
 ['Balanced',[4,4,1,1]],['Economic',[13,4,2,1]],['Defensive',[3,6,3,8]],['Naval',[2,4,3,1]]
];
test('seven Xbox-oriented resource allocation presets match the documented ratios',()=>{
 const from=kingdom.indexOf('const WORKER_TARGETS='),to=kingdom.indexOf('function villagerAssignedCount(',from);
 const presets=vm.runInNewContext(kingdom.slice(from,to)+'\n;VILLAGER_PRIORITY_PRESETS');
 assert.deepEqual(JSON.parse(JSON.stringify(presets.map(p=>[p.name,[...p.weights]]))),expected);
});
test('R3 farm toggle is an eighth sector and changes only the existing save-compatible setting',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\n'+[
  'seedOv=123456;msz=0;kingdoms=2;cmp=null;start();snd=0;mode="play";',
  'pad={axes:[0,0,0,0],buttons:[]};',
  'globalThis.control=(keys=[],direction=[0,0])=>{E=keys;P=[];pad.axes=direction;ctl(1/30)};',
  'globalThis.farmSetting=()=>S.vp.autoFarms;globalThis.wheel=()=>vpWheel?.sel;'
 ].join('\n'),sandbox);
 assert.equal(sandbox.farmSetting(),false);
 const press=i=>Object.assign([],{[i]:true});
 sandbox.control(press(11));
 sandbox.control([],[-.70,-.71]);
 assert.equal(sandbox.wheel(),7);
 sandbox.control(press(0));
 assert.equal(sandbox.farmSetting(),true);
 sandbox.control(press(11));sandbox.control([],[-.70,-.71]);sandbox.control(press(0));
 assert.equal(sandbox.farmSetting(),false);
});
test('old saves without autoFarms remain disabled, explicit settings remain stable',()=>{
 const from=kingdom.indexOf('function createVillagerPriority('),to=kingdom.indexOf('const WORKER_TARGETS=',from);
 const normalize=vm.runInNewContext(kingdom.slice(from,to)+'\n;createVillagerPriority');
 assert.equal(normalize({f:5,w:1,enabled:true}).autoFarms,false);
 assert.equal(normalize({f:5,autoFarms:true}).autoFarms,true);
 assert.equal(normalize({autoFarms:'true'}).autoFarms,false);
});
