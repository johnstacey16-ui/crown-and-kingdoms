import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const input=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
const segment=input.slice(0,input.indexOf('function pick('));
assert.ok(segment.includes('function readPad()'), 'Test must execute production polling logic');

function fixture(initial=[]){
 const listeners=new Map();
 const controller={connected:true,index:0,id:'Xbox Wireless Controller',axes:[0,0,0,0],
  buttons:Array.from({length:16},(_,i)=>({pressed:initial.includes(i),value:initial.includes(i)?1:0}))};
 let cancelled=0;
 // Keep the production readPad, mapping, dead-zone and focus event listeners intact.
 const build=new Function('navigator','window','document','cancelGameplayGestures',
  "let pad=null,P=[],E=[],ER=[],RE=[],prev=[],gpErr='',BM={},dz=.18,dzr=.18;"+segment+
  "return {readPad,state:()=>({P:[...P],E:[...E],ER:[...ER],RE:[...RE]}),pending:()=>padNeedsNeutral};");
 const polling=build({getGamepads:()=>[controller]},
  {addEventListener:(event,fn)=>listeners.set(event,fn)},
  {addEventListener:(event,fn)=>listeners.set('document:'+event,fn)},()=>{cancelled++});
 const press=(indices=[])=>controller.buttons.forEach((b,i)=>{b.pressed=indices.includes(i);b.value=b.pressed?1:0});
 return {...polling,press,focus:()=>listeners.get('focus')(),
  blur:()=>listeners.get('blur')(),visibility:()=>listeners.get('document:visibilitychange')(),
  cancelled:()=>cancelled};
}

test('first connected controller does not treat a pre-held A/RT as a gameplay press',()=>{
 const pad=fixture([0,7]);pad.readPad();
 assert.equal(pad.state().E.some(Boolean),false);
 assert.equal(pad.state().P.some(Boolean),false);
 assert.equal(pad.pending(),true);
 pad.press([7]);pad.readPad();assert.equal(pad.state().RE.some(Boolean),false);
 assert.equal(pad.state().P.some(Boolean),false);
 pad.press([]);pad.readPad();assert.equal(pad.pending(),false);
 pad.press([0]);pad.readPad();assert.equal(pad.state().E[0],true);
 assert.equal(pad.state().P[0],true);
});

test('browser refocus consumes held A/X/RT and release edges until controller becomes neutral',()=>{
 const pad=fixture();pad.readPad();
 pad.press([0]);pad.readPad();assert.equal(pad.state().E[0],true);
 pad.focus();pad.readPad();
 assert.equal(pad.pending(),true);
 assert.equal(pad.state().E.some(Boolean),false);
 assert.equal(pad.state().P.some(Boolean),false);
 pad.press([0,2,7]);pad.readPad();
 assert.equal(pad.state().P.some(Boolean),false);
 assert.equal(pad.state().E.some(Boolean),false);
 pad.press([2,7]);pad.readPad();
 assert.equal(pad.state().RE.some(Boolean),false);
 pad.press([]);pad.readPad();assert.equal(pad.pending(),false);
 assert.equal(pad.state().RE.some(Boolean),false);
 pad.press([7]);pad.readPad();assert.equal(pad.state().E[7],true);
 assert.equal(pad.state().P[7],true);
 assert.ok(pad.cancelled()>=2,'connection/refocus should cancel pending gestures');
});

test('Xbox Edge blur drops pending button edges immediately and requires neutral before new commands',()=>{
 const pad=fixture();pad.readPad();
 pad.press([0,7]);pad.readPad();assert.equal(pad.state().E[0],true);
 pad.blur();
 assert.equal(pad.pending(),true);
 for(const key of ['P','E','ER','RE'])assert.equal(pad.state()[key].some(Boolean),false,key+' must be cleared before the next poll');
 pad.press([0,2,7]);pad.readPad();
 assert.equal(pad.state().E.some(Boolean),false);
 assert.equal(pad.state().P.some(Boolean),false);
 pad.press([2]);pad.readPad();assert.equal(pad.state().RE.some(Boolean),false);
 pad.press([]);pad.readPad();assert.equal(pad.pending(),false);
 pad.press([2]);pad.readPad();assert.equal(pad.state().E[2],true);
 assert.equal(pad.state().P[2],true);
 assert.ok(pad.cancelled()>=2);
});

test('visibility suspension/resumption quarantines held RT/Y without requiring a focus event',()=>{
 const pad=fixture();pad.readPad();
 pad.press([3,7]);pad.readPad();assert.equal(pad.state().E[3],true);
 pad.visibility();
 assert.equal(pad.state().E.some(Boolean),false);
 assert.equal(pad.state().P.some(Boolean),false);
 pad.press([3,7]);pad.readPad();assert.equal(pad.state().E.some(Boolean),false);
 pad.press([]);pad.readPad();assert.equal(pad.pending(),false);
 pad.press([7]);pad.readPad();assert.equal(pad.state().E[7],true);
 pad.visibility();assert.equal(pad.state().P.some(Boolean),false);
 pad.readPad();assert.equal(pad.state().E.some(Boolean),false);
 pad.press([]);pad.readPad();
 pad.press([3]);pad.readPad();assert.equal(pad.state().E[3],true);
});
