import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const context={};
vm.runInNewContext(readFileSync(new URL('../js/network-unit-map.js',import.meta.url),'utf8'),context);
const api=context.CK_UNIT_MAP;
const world=()=>({teamN:2,us:[
  {netId:'u1',t:0,k:'vil',hp:25,x:5,y:6},
  {netId:'u2',t:1,k:'vil',hp:25,x:20,y:22,o:'i'},
  {netId:'u3',t:1,k:'vil',hp:0,x:21,y:22},
  {netId:'u4',t:1,k:'vil',hp:25,x:21,y:22,ld:{}}
],bs:[{netId:'b1',t:0,k:'tc',hp:100,x:3,y:3,s:3},{netId:'b2',t:1,k:'tc',hp:100,x:18,y:18,s:3}],
  res:[{f:100},{f:200}],vs:new Uint8Array(32*32),nodes:[{x:19,y:19,k:'g'}]});
function fixture(options={}) {
  const handlers=new Map(),orders=[],boxes=[];
  const navigation={};
  for(const key of ['previousButton','nextButton','townButton'])navigation[key]={disabled:false,addEventListener(name,fn){this[name]=fn;}};
  const stopHandlers=new Map(),stopButton={disabled:false,addEventListener:(name,fn)=>stopHandlers.set(name,fn)};
  let left=false;
  const canvas={style:{},getContext:()=>new Proxy({},{get:(_,key)=>key==='strokeRect'? (...args)=>boxes.push(args):()=>{}}),setAttribute(){},
    addEventListener:(name,fn)=>handlers.set(name,fn),focus(){},
    getBoundingClientRect:()=>({left:100,top:50,width:340,height:340})};
  const description={textContent:''};
  const map=api.create({canvas,description,stopButton,...navigation,...options,submit:order=>{orders.push(order);return {ok:true};},leave:()=>{left=true;}});
  return {map,handlers,orders,boxes,description,canvas,stopButton,...navigation,stopClick:()=>stopHandlers.get('click')(),left:()=>left};
}

function tap(map,held={}) {
  map.control({0:true},{...held,0:true});
  map.control({},held);
}

function drag(map,axes,held={},frames=2) {
  map.control({0:true},{...held,0:true});
  for(let i=0;i<frames;i++)map.control({},{...held,0:true},axes,.1);
}

function group(map,slot,{assign=false}={}){
 const angle=slot*Math.PI/4-Math.PI/2,axes=[Math.cos(angle),Math.sin(angle)];
 map.control({4:true},{4:true},axes);
 if(assign)map.control({2:true},{4:true,2:true},axes);
 map.control({},{});
}

function focusAt(map,point){map.control({5:true});map.choose(point);map.control({3:true},{3:true});map.control({},{});}

test('LB+Y focuses an owned group camera locally and pointer orders invert the viewport',()=>{
 const f=fixture(),source=world();f.map.refresh(source,1,32,32,true);f.map.choose({x:20,y:22});group(f.map,0,{assign:true});
 const before=JSON.stringify(source);
 f.map.control({4:true},{4:true},[0,-1]);f.map.control({3:true},{4:true,3:true},[0,-1]);f.map.control({},{});
 const v=f.map.viewport();assert.equal(v.zoom,2);assert.equal(v.width,16);assert.equal(v.x,12);assert.equal(v.y,14);
 assert.deepEqual(Array.from(f.map.selection()),['u2']);assert.equal(f.orders.length,0);assert.equal(JSON.stringify(source),before);
 f.handlers.get('click')({clientX:100+(24-v.x)*340/v.width,clientY:50+(24-v.y)*340/v.height});
 assert.deepEqual(JSON.parse(JSON.stringify(f.orders[0])),{type:'move',entities:['u2'],point:{x:24,y:24}});
 assert.equal(JSON.stringify(source),before);
});

test('expanded minimap consumes A and D-pad, focuses only with Y and never submits gameplay',()=>{
 const f=fixture(),source=world();f.map.refresh(source,1,32,32,true);f.map.choose({x:20,y:22});const before=JSON.stringify(source);
 f.map.control({5:true});assert.equal(f.map.viewport().overview,true);assert.equal(f.stopButton.disabled,true);
 for(const button of [0,12,13,14,15])f.map.control({[button]:true});
 assert.deepEqual(Array.from(f.map.selection()),['u2']);assert.equal(f.orders.length,0);
 f.map.choose({x:3,y:4});assert.equal(f.map.viewport().overview,true);
 f.map.control({3:true},{3:true});f.map.control({},{});
 assert.equal(f.map.viewport().overview,false);assert.equal(f.map.viewport().zoom,2);assert.equal(f.map.viewport().x,0);assert.equal(f.map.viewport().y,0);
 assert.equal(f.orders.length,0);assert.equal(JSON.stringify(source),before);
});

test('minimap cancellation restores the original cursor and camera through B, RB, blur or suspension',()=>{
 for(const context of ['B','RB','blur','suspend']){
  const f=fixture();f.map.refresh(world(),1,32,32,true);focusAt(f.map,{x:10,y:10});
  const v=JSON.stringify(f.map.viewport());f.map.control({5:true});f.map.choose({x:31,y:1});
  if(context==='B')f.map.control({1:true});
  if(context==='RB')f.map.control({5:true});
  if(context==='blur')f.handlers.get('blur')();
  if(context==='suspend')f.map.suspend();
  f.map.control({},{});assert.equal(JSON.stringify(f.map.viewport()),v,context);assert.equal(f.orders.length,0);
 }
});

test('focused cursor edge panning clamps the camera inside world bounds and ignores non-finite axes',()=>{
 const f=fixture();f.map.refresh(world(),1,32,32,true);focusAt(f.map,{x:.01,y:.01});
 assert.equal(f.map.viewport().x,0);assert.equal(f.map.viewport().y,0);
 const v=JSON.stringify(f.map.viewport());f.map.control({}, {},[NaN,Infinity],NaN);assert.equal(JSON.stringify(f.map.viewport()),v);
 for(let i=0;i<100;i++)f.map.control({}, {},[1,1],.1);
 assert.equal(f.map.viewport().x,16);assert.equal(f.map.viewport().y,16);assert.equal(f.orders.length,0);
});

test('focused double A selects only units visible in the current camera, while unavailable groups cannot focus',()=>{
 let time=1000;const f=fixture({now:()=>time}),source=world();source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:2,y:2});
 f.map.refresh(source,1,32,32,true);f.map.choose({x:20,y:22});group(f.map,0,{assign:true});focusAt(f.map,{x:20,y:22});
 tap(f.map);time+=100;tap(f.map);assert.deepEqual(Array.from(f.map.selection()),['u2']);
 source.us[1].t=0;f.map.refresh(source,1,32,32,true);const v=JSON.stringify(f.map.viewport());
 f.map.control({4:true},{4:true},[0,-1]);f.map.control({3:true},{4:true,3:true},[0,-1]);f.map.control({},{});
 assert.equal(JSON.stringify(f.map.viewport()),v);assert.equal(f.orders.length,0);
});

test('LB groups assign and recall owned selections locally in all eight independent slots',()=>{
 const f=fixture(),source=world();source.us.push({netId:'u5',t:1,k:'mil',hp:50,x:24,y:22});
 f.map.refresh(source,1,32,32,true);const before=JSON.stringify(source);
 for(let slot=0;slot<8;slot++){
  f.map.choose(slot%2?{x:24,y:22}:{x:20,y:22});group(f.map,slot,{assign:true});
  f.map.control({1:true});assert.deepEqual(Array.from(f.map.selection()),[]);
  group(f.map,slot);assert.deepEqual(Array.from(f.map.selection()),[slot%2?'u5':'u2']);
  assert.equal(f.orders.length,0);
 }
 assert.equal(JSON.stringify(source),before);
 const snapshot=f.map.controlGroups();snapshot[0].push('u1');snapshot[1]=[];
 assert.deepEqual(Array.from(f.map.controlGroups()[0]),['u2']);assert.deepEqual(Array.from(f.map.controlGroups()[1]),['u5']);
 f.map.control({1:true});group(f.map,0,{assign:true});
 assert.deepEqual(Array.from(f.map.controlGroups()[0]),[],'assigning an empty selection clears that slot');
 assert.deepEqual(Array.from(f.map.controlGroups()[1]),['u5']);
});

test('group availability filters current ownership, deaths and cargo without rewriting assignment',()=>{
 const f=fixture(),source=world();source.us.push({netId:'u5',t:1,k:'mil',hp:50,x:24,y:22});
 f.map.refresh(source,1,32,32,false);f.map.choose({x:20,y:22});f.map.choose({x:24,y:22},true);
 group(f.map,0,{assign:true});assert.deepEqual(Array.from(f.map.controlGroups()[0]),['u2','u5']);
 source.us.find(u=>u.netId==='u5').ld={};f.map.refresh(source,1,32,32,false);
 group(f.map,0);assert.deepEqual(Array.from(f.map.selection()),['u2']);
 source.us.find(u=>u.netId==='u5').ld=null;f.map.refresh(source,1,32,32,false);
 group(f.map,0);assert.deepEqual(Array.from(f.map.selection()),['u2','u5']);
 source.us.find(u=>u.netId==='u5').t=0;source.us.find(u=>u.netId==='u2').hp=0;f.map.refresh(source,1,32,32,false);
 f.map.control({13:true});const selection=Array.from(f.map.selection());
 group(f.map,0);assert.deepEqual(Array.from(f.map.selection()),selection);
 assert.deepEqual(Array.from(f.map.controlGroups()[0]),['u2','u5']);assert.equal(f.orders.length,0);
});

test('group cancellation consumes held input without orders, recall or loss of selection',()=>{
 for(const context of ['B','blur','suspend','pointer','RT','RB']){
  const f=fixture(),source=world();source.bs[1].done=true;f.map.refresh(source,1,32,32,true);f.map.choose({x:20,y:22});group(f.map,0,{assign:true});
  f.map.control({13:true});const selected=Array.from(f.map.selection());
  f.map.control({4:true},{4:true},[0,-1]);
  if(context==='B')f.map.control({1:true},{4:true,1:true});
  if(context==='blur')f.handlers.get('blur')();
  if(context==='suspend')f.map.suspend();
  if(context==='pointer')f.map.choose({x:26,y:26});
  if(context==='RT')f.map.control({7:true},{4:true,7:true});
  if(context==='RB')f.map.control({5:true},{4:true,5:true});
  f.map.control({},{});assert.deepEqual(Array.from(f.map.selection()),selected,context);assert.equal(f.orders.length,0,context);
 }
});

test('group wheel consumes A/Y/D-pad and orphan LB holds without gameplay or shortcut leakage',()=>{
 const f=fixture(),source=world();f.map.refresh(source,1,32,32,true);f.map.choose({x:20,y:22});
 f.map.control({},{4:true},[0,-1]);f.map.control({2:true},{4:true,2:true});f.map.control({},{});
 assert.equal(f.map.controlGroups()[0].length,0,'held LB without a press cannot assign');
 f.map.control({4:true},{4:true},[0,-1]);
 for(const button of [0,3,12,13,14,15])f.map.control({[button]:true},{4:true,[button]:true},[0,-1]);
 f.map.control({},{});assert.equal(f.orders.length,0);assert.deepEqual(Array.from(f.map.selection()),['u2']);
});

test('building groups recall completed towns for balanced production and reset across teams',()=>{
 const source=world();source.bs[1].done=true;source.bs.push({netId:'b3',t:1,k:'tc',hp:100,done:true,x:24,y:18,s:3});
 let time=1000;const canvasFixture=fixture({now:()=>time});const map=canvasFixture.map;
 map.refresh(source,1,32,32,true);map.choose({x:19,y:19});tap(map);time+=100;tap(map);
 assert.deepEqual(Array.from(map.selection()),['b2','b3']);group(map,7,{assign:true});map.control({1:true});group(map,7);
 assert.deepEqual(Array.from(map.selection()),['b2','b3']);assert.equal(canvasFixture.orders.length,0);
 map.control({7:true},{7:true});map.control({0:true},{7:true,6:true,0:true});
 assert.equal(canvasFixture.orders[0].type,'train');assert.equal(canvasFixture.orders[0].count,5);
 assert.deepEqual(Array.from(canvasFixture.orders[0].entities),['b2','b3']);
 map.refresh(source,0,32,32,true);assert.equal(map.controlGroups().every(ids=>ids.length===0),true);
 assert.deepEqual(Array.from(map.selection()),[]);
});

test('team-one projection contains only its living ungarrisoned units and buildings, without world references',()=>{
  const source=world(),before=JSON.stringify(source);
  const view=api.project(source,1,32,32);
  assert.equal(JSON.stringify(view.units),JSON.stringify([{id:'u2',kind:'vil',x:20,y:22,idle:true}]));
  assert.equal(view.buildings.length,1);assert.equal(view.buildings[0].id,'b2');
  assert.equal(Object.hasOwn(view,'nodes'),false);assert.equal(Object.hasOwn(view,'res'),false);
  view.units[0].x=0;view.buildings[0].size=100;
  assert.equal(JSON.stringify(source),before);
  assert.throws(()=>api.project(source,2,32,32),/Invalid/);
});

test('selection and scaled pointer coordinates emit a typed move for the selected own unit only',()=>{
  const f=fixture(),source=world(),before=JSON.stringify(source);
  f.map.refresh(source,1,32,32,true);
  const click=(x,y)=>f.handlers.get('click')({clientX:100+x*340/32,clientY:50+y*340/32});
  click(5,6); // Enemy location is never selectable.
  assert.equal(f.map.selected(),null);assert.equal(f.orders.length,0);
  click(20,22);assert.equal(f.map.selected(),'u2');
  click(24,25);
  assert.equal(JSON.stringify(f.orders),JSON.stringify([{type:'move',entities:['u2'],point:{x:24,y:25}}]));
  click(26,27);assert.equal(f.orders.length,1,'wait for command readiness');
  assert.equal(JSON.stringify(source),before,'UI must not move simulation objects');
});

test('left stick moves the map cursor; B deselects before returning focus',()=>{
  const f=fixture();f.map.refresh(world(),1,32,32,true);
  f.map.control({12:true});assert.equal(f.map.selected(),'u2');
  f.map.control({}, {}, [1,0], .1);tap(f.map);
  assert.ok(Math.abs(f.orders[0].point.x-21.92)<.001);assert.equal(f.orders[0].point.y,22);
  f.map.control({2:true});assert.equal(f.map.selected(),'u2','X must not become deselect');
  f.map.control({1:true});assert.equal(f.map.selected(),null);assert.equal(f.left(),false);
  f.map.control({1:true});assert.equal(f.left(),true);
});

test('refresh drops dead/loaded selections, validates bounds and preserves simulation and fog state',()=>{
  const f=fixture(),source=world();
  f.map.refresh(source,1,32,32,true);f.map.choose({x:20,y:22});
  for(const point of [{x:-1,y:1},{x:32,y:22},{x:NaN,y:1}])f.map.choose(point);
  assert.equal(f.orders.length,0);
  source.us[1].ld={};f.map.refresh(source,1,32,32,true);
  assert.equal(f.map.selected(),null);
  f.map.choose({x:25,y:25});assert.equal(f.orders.length,0);
  assert.equal(source.vs.some(Boolean),false);
});

test('completed own town centre submits rally without optimistic mutation and drops invalid selection',()=>{
  const f=fixture(),source=world(),town=source.bs[1];
  f.map.refresh(source,1,32,32,true);f.map.choose({x:18,y:18});
  assert.equal(f.map.selected(),null,'unfinished town is not selectable');
  town.done=true;town.rally={x:27,y:28};
  f.map.refresh(source,1,32,32,true);
  const projection=api.project(source,1,32,32);
  projection.buildings[0].rally.x=0;
  assert.equal(town.rally.x,27,'rally projection is copied');
  f.map.choose({x:18,y:18});assert.equal(f.map.selected(),'b2');
  f.map.choose({x:25,y:26});
  assert.equal(JSON.stringify(f.orders),JSON.stringify([{type:'rally',entities:['b2'],point:{x:25,y:26}}]));
  assert.equal(town.rally.x,27,'no optimistic rally change');
  f.map.choose({x:24,y:24});assert.equal(f.orders.length,1);
  town.hp=0;f.map.refresh(source,1,32,32,true);
  assert.equal(f.map.selected(),null);
});

test('controller cursor can select town centre and submit a rally point',()=>{
  const f=fixture(),source=world();source.us=[];source.bs[1].done=true;
  f.map.refresh(source,1,32,32,true);
  f.map.control({13:true});
  assert.equal(f.map.selected(),'b2');
  f.map.control({}, {}, [1,0], .1);
  tap(f.map);
  assert.equal(f.orders[0].type,'rally');assert.ok(Math.abs(f.orders[0].point.x-21.42)<.001);
});

test('button and RT menu submit stop only for a ready selected unit without changing the world',()=>{
  for(const input of ['button','controller']){
    const f=fixture(),source=world(),before=JSON.stringify(source);
    f.map.refresh(source,1,32,32,true);
    assert.equal(f.stopButton.disabled,true);f.stopClick();assert.equal(f.orders.length,0);
    f.map.choose({x:20,y:22});assert.equal(f.stopButton.disabled,false);
    if(input==='button')f.stopClick();else {f.map.control({7:true});f.map.control({0:true},{7:true});}
    assert.equal(JSON.stringify(f.orders),JSON.stringify([{type:'stop',entities:['u2']}]));
    assert.equal(f.stopButton.disabled,true);f.stopClick();assert.equal(f.orders.length,1);
    assert.equal(JSON.stringify(source),before);
    source.bs[1].done=true;f.map.refresh(source,1,32,32,true);
    f.map.control({}); // Release RT before selecting on the map again.
    f.map.choose({x:18,y:18});assert.equal(f.stopButton.disabled,true);
    f.map.control({3:true});assert.equal(f.orders.length,1,'stop is not a town-centre order');
  }
});

test('quick selection wraps through only owned living units and centers the command cursor',()=>{
  const f=fixture(),source=world();source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:27,y:28});
  const before=JSON.stringify(source);f.map.refresh(source,1,32,32,true);
  f.nextButton.click();assert.equal(f.map.selected(),'u2');
  f.nextButton.click();assert.equal(f.map.selected(),'u5');
  f.nextButton.click();assert.equal(f.map.selected(),'u2');
  f.previousButton.click();assert.equal(f.map.selected(),'u5');
  assert.equal(f.orders.length,0);assert.equal(JSON.stringify(source),before);
  f.map.control({}, {}, [1,0], .1);tap(f.map);
  assert.equal(JSON.stringify(f.orders[0]),JSON.stringify({type:'move',entities:['u5'],point:{x:28.92,y:28}}));
  f.nextButton.click();assert.equal(f.map.selected(),'u2');
  f.map.control({7:true});f.map.control({0:true},{7:true});assert.equal(f.orders.length,1,'selection cannot bypass pending order');
});

test('RT opens a menu and A trains at the selected completed town only, awaiting execution without changing the world',()=>{
  const f=fixture(),source=world();
  source.bs[1].done=true;
  source.bs.push({netId:'b3',t:1,k:'tc',hp:100,x:26,y:26,s:3,done:true});
  const before=JSON.stringify(source);
  f.map.refresh(source,1,32,32,true);
  f.map.control({7:true});assert.equal(f.orders.length,0,'no selection');
  f.nextButton.click();f.map.control({7:true});assert.equal(f.orders.length,0,'opening the unit menu sends no order');f.map.control({1:true});
  f.map.control({13:true});f.map.control({13:true});
  assert.equal(f.map.selected(),'b3');
  f.map.control({7:true});assert.equal(f.orders.length,0,'RT alone must not train');
  f.map.control({0:true},{7:true});
  assert.equal(JSON.stringify(f.orders),JSON.stringify([{type:'train',entities:['b3'],value:'vil'}]));
  assert.match(f.description.textContent,/host execution/);
  f.map.control({});f.map.control({13:true});f.map.control({7:true});f.map.control({0:true},{7:true});assert.equal(f.orders.length,1,'selection cannot bypass a pending order');
  assert.equal(JSON.stringify(source),before);
  f.map.refresh(source,1,32,32,false);f.map.control({7:true});f.map.control({0:true},{7:true});assert.equal(f.orders.length,1);
  source.bs[1].done=false;source.bs[2].hp=0;
  f.map.refresh(source,1,32,32,true);f.map.control({13:true});f.map.control({7:true});f.map.control({0:true},{7:true});
  assert.equal(f.orders.length,1,'unfinished or destroyed towns cannot train');
});

test('RT keeps training available for retry when submission is rejected',()=>{
  let attempts=0;
  const canvas={style:{},getContext:()=>new Proxy({},{get:()=>()=>{}}),setAttribute(){},addEventListener(){},focus(){}};
  const description={textContent:''};
  const map=api.create({canvas,description,leave(){},submit:()=>{attempts++;return {ok:false};}});
  const source=world();source.bs[1].done=true;
  map.refresh(source,1,32,32,true);map.control({13:true});
  map.control({7:true});map.control({0:true},{7:true});map.control({0:true},{7:true});
  assert.equal(attempts,2);assert.match(description.textContent,/not submitted/);
});

test('controller D-pad and town button select without orders and recover from removed units',()=>{
  const f=fixture(),source=world();source.bs[1].done=true;
  f.map.refresh(source,1,32,32,true);
  f.nextButton.click();assert.equal(f.map.selected(),'u2');
  f.townButton.click();assert.equal(f.map.selected(),'b2');
  f.previousButton.click();assert.equal(f.map.selected(),'u2');
  f.townButton.click();assert.equal(f.map.selected(),'b2');
  f.map.control({13:true});assert.equal(f.map.selected(),'b2');
  source.us[1].hp=0;f.map.refresh(source,1,32,32,true);
  assert.equal(f.nextButton.disabled,true);assert.equal(f.previousButton.disabled,true);
  f.townButton.click();assert.equal(f.map.selected(),'b2');
  source.bs[1].done=false;f.map.refresh(source,1,32,32,true);
  assert.equal(f.map.selected(),null);assert.equal(f.townButton.disabled,true);
  f.map.control({13:true});assert.equal(f.orders.length,0);
});

test('D-pad categories use owned eligible entities and legacy shortcuts send no commands',()=>{
  const f=fixture(),source=world();source.bs[1].done=true;
  source.us.push({netId:'monk',t:1,k:'mon',hp:25,x:25,y:25},
    {netId:'soldier',t:1,k:'mil',hp:30,x:28,y:28});
  f.map.refresh(source,1,32,32,true);
  for(const [button,id] of [[12,'u2'],[15,'monk'],[13,'b2'],[14,'soldier']]){
    f.map.control({[button]:true});assert.equal(f.map.selected(),id);
  }
  for(const button of [4,5,6,3,2]){f.map.control({[button]:true});assert.equal(f.map.selected(),'soldier');}
  assert.equal(f.orders.length,0);
  f.map.control({7:true});f.map.control({});tap(f.map);
  assert.equal(f.orders.length,0,'releasing RT closes the wheel before A can execute it');
  f.map.control({13:true});f.map.control({7:true});
  f.map.control({0:true},{6:true,7:true});
  f.map.choose({x:30,y:30});
  assert.equal(JSON.stringify(f.orders),JSON.stringify([{type:'train',entities:['b2'],value:'vil',count:5}]),'LT changes training quantity; a map click behind the wheel sends nothing');
});

test('LT+A confirms one five-unit training request only while RT is held and pending commands block repeats',()=>{
  const f=fixture(),source=world();source.bs[1].done=true;
  const before=JSON.stringify(source);f.map.refresh(source,1,32,32,true);f.map.control({13:true});
  tap(f.map,{6:true});assert.equal(f.orders.length,0,'LT+A on the map does not train');
  f.map.control({7:true},{7:true,6:true});assert.equal(f.orders.length,0,'opening the menu does not train');
  f.map.control({0:true},{0:true,6:true,7:true});
  assert.equal(JSON.stringify(f.orders),JSON.stringify([{type:'train',entities:['b2'],value:'vil',count:5}]));
  assert.match(f.description.textContent,/Five-villager/);assert.match(f.description.textContent,/host execution/);
  f.map.control({},{0:true,6:true,7:true});f.map.control({0:true},{0:true,6:true,7:true});
  assert.equal(f.orders.length,1);assert.equal(JSON.stringify(source),before);
  f.map.control({},{});f.map.refresh(source,1,32,32,true);f.map.choose({x:20,y:22});
  f.map.control({7:true});f.map.control({0:true},{6:true,7:true});
  assert.equal(f.orders.length,1,'LT+A must not turn into a unit Stop command');
});

test('LT+A adds distinct owned units and move/Stop use the complete selection without optimistic mutation',()=>{
  const f=fixture(),source=world();source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:22,y:22});
  const before=JSON.stringify(source);f.map.refresh(source,1,32,32,true);
  tap(f.map); // Cursor starts at u2.
  f.map.control({}, {6:true}, [1,0], .1);
  tap(f.map,{6:true});
  assert.deepEqual(Array.from(f.map.selection()),['u2','u5']);
  tap(f.map,{6:true});assert.equal(f.map.selection().length,2,'no duplicates');
  const copy=f.map.selection();copy.pop();assert.equal(f.map.selection().length,2,'selection API is copied');
  f.map.choose({x:29,y:29});
  assert.equal(JSON.stringify(f.orders[0]),JSON.stringify({type:'move',entities:['u2','u5'],point:{x:29,y:29}}));
  f.map.choose({x:20,y:22});f.map.choose({x:22,y:22},true);
  assert.deepEqual(Array.from(f.map.selection()),['u2','u5'],'selection edits remain local while an order is pending');
  assert.deepEqual(Array.from(f.orders[0].entities),['u2','u5'],'submitted membership is a snapshot');
  f.map.control({7:true});f.map.control({0:true},{7:true});assert.equal(f.orders.length,1,'pending move blocks Stop');
  f.map.refresh(source,1,32,32,true);f.map.control({});f.stopClick();
  assert.equal(JSON.stringify(f.orders[1]),JSON.stringify({type:'stop',entities:['u2','u5']}));
  assert.equal(JSON.stringify(source),before);
});

test('LT selection sends no empty-space order, keeps selection homogeneous and drops removed/loaded members',()=>{
  const f=fixture(),source=world();source.bs[1].done=true;
  source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:27,y:28});
  f.map.refresh(source,1,32,32,true);f.map.choose({x:20,y:22});f.map.choose({x:27,y:28},true);
  f.map.choose({x:30,y:30},true);f.map.choose({x:18,y:18},true);
  assert.deepEqual(Array.from(f.map.selection()),['u2','u5']);assert.equal(f.orders.length,0);
  source.us[1].ld={};f.map.refresh(source,1,32,32,true);
  assert.deepEqual(Array.from(f.map.selection()),['u5']);assert.equal(f.map.selected(),'u5');
  source.us.at(-1).t=0;f.map.refresh(source,1,32,32,true);
  assert.deepEqual(Array.from(f.map.selection()),[]);assert.equal(f.stopButton.disabled,true);
  source.us[1].ld=null;f.map.refresh(source,1,32,32,true);
  f.map.choose({x:18,y:18});f.map.choose({x:20,y:22},true);
  assert.deepEqual(Array.from(f.map.selection()),['b2']);assert.equal(f.orders.length,0);
});

test('double A selects all visible owned eligible units of the same type and submits their group',()=>{
  let time=1000;const f=fixture({now:()=>time}),source=world();
  source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:27,y:28},
    {netId:'monk',t:1,k:'mon',hp:25,x:28,y:28},
    {netId:'outside',t:1,k:'vil',hp:25,x:33,y:22});
  const before=JSON.stringify(source);f.map.refresh(source,1,32,32,true);
  tap(f.map);assert.deepEqual(Array.from(f.map.selection()),['u2']);
  f.map.control({},{});time+=200;tap(f.map);
  assert.deepEqual(Array.from(f.map.selection()),['u2','u5']);assert.equal(f.orders.length,0);
  f.map.choose({x:30,y:30});
  assert.deepEqual(Array.from(f.orders[0].entities),['u2','u5']);
  tap(f.map);time+=100;tap(f.map);
  assert.equal(f.orders.length,1,'pending move remains guarded');
  assert.equal(JSON.stringify(source),before);
});

test('double A expires and is cancelled by menus, quick selection, pointer selection and removed targets',()=>{
  for(const interrupt of ['timeout','suspend','blur','B','RT','dpad','pointer','removed','team']){
    let time=1000;const f=fixture({now:()=>time}),source=world();
    source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:27,y:28});
    f.map.refresh(source,1,32,32,true);tap(f.map);time+=100;
    if(interrupt==='timeout')time+=400;
    if(interrupt==='suspend')f.map.suspend();
    if(interrupt==='blur')f.handlers.get('blur')();
    if(interrupt==='B')f.map.control({1:true});
    if(interrupt==='RT'){f.map.control({7:true});f.map.control({});}
    if(interrupt==='dpad')f.map.control({12:true});
    if(interrupt==='pointer')f.map.choose({x:20,y:22});
    if(interrupt==='removed'){
      source.us[1].ld={};f.map.refresh(source,1,32,32,true);
      source.us[1].ld=null;f.map.refresh(source,1,32,32,true);
    }
    if(interrupt==='team'){f.map.refresh(source,0,32,32,true);f.map.refresh(source,1,32,32,true);}
    tap(f.map);
    assert.deepEqual(Array.from(f.map.selection()),['u2'],interrupt);
    assert.equal(f.orders.length,0,interrupt);
  }
});

test('two quick A presses on different units remain individual selections',()=>{
  let time=1000;const f=fixture({now:()=>time}),source=world();
  source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:21.92,y:22});
  f.map.refresh(source,1,32,32,true);tap(f.map);
  f.map.control({}, {}, [1,0],.1);time+=100;tap(f.map);
  assert.deepEqual(Array.from(f.map.selection()),['u5']);assert.equal(f.orders.length,0);
});

test('double A stays local while pending, excludes converted members, and LT retains individual selection',()=>{
  let time=1000;const f=fixture({now:()=>time}),source=world();source.bs[1].done=true;
  source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:27,y:28},
    {netId:'monk',t:1,k:'mon',hp:25,x:28,y:28});
  f.map.refresh(source,1,32,32,false);tap(f.map);time+=100;
  source.us.find(u=>u.netId==='u5').t=0;
  f.map.refresh(source,1,32,32,false);tap(f.map);
  assert.deepEqual(Array.from(f.map.selection()),['u2']);assert.equal(f.orders.length,0);
  source.us.find(u=>u.netId==='u5').t=1;
  f.map.refresh(source,1,32,32,false);tap(f.map);time+=100;tap(f.map);
  assert.deepEqual(Array.from(f.map.selection()),['u2','u5']);assert.equal(f.orders.length,0);
  f.map.choose({x:28,y:28});f.map.choose({x:20,y:22},true);
  tap(f.map,{6:true});time+=100;tap(f.map,{6:true});
  assert.deepEqual(Array.from(f.map.selection()),['monk','u2'],'LT keeps verified individual additive selection');
  f.map.choose({x:18,y:18});tap(f.map,{6:true});time+=100;tap(f.map,{6:true});
  assert.deepEqual(Array.from(f.map.selection()),['b2'],'no substitute multi-building orders');
});

test('hold A draws a box and selects only eligible enclosed units on release without submitting an order',()=>{
  const f=fixture(),source=world();
  source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:22,y:24},
    {netId:'monk',t:1,k:'mon',hp:25,x:21,y:23},
    {netId:'enemy',t:0,k:'vil',hp:25,x:21,y:23});
  const before=JSON.stringify(source);f.map.refresh(source,1,32,32,true);
  f.map.choose({x:19,y:21});
  drag(f.map,[1,1]);
  assert.deepEqual(Array.from(f.map.selection()),[],'selection waits for release');
  assert.ok(f.boxes.some(box=>box[2]>14&&box[3]>14),'visible drag outline');
  assert.equal(f.orders.length,0,'A press and drag never move');
  f.map.control({},{});
  assert.deepEqual(Array.from(f.map.selection()),['u2','u5','monk']);
  assert.equal(f.orders.length,0);assert.equal(JSON.stringify(source),before);
  f.map.choose({x:30,y:30});
  assert.deepEqual(Array.from(f.orders[0].entities),['u2','u5','monk']);
});

test('LT adds multiple boxes without duplicates while pending and cannot mix a town with units',()=>{
  const f=fixture(),source=world();source.bs[1].done=true;
  source.us.push({netId:'monk',t:1,k:'mon',hp:25,x:28,y:28});
  f.map.refresh(source,1,32,32,false);f.map.choose({x:28,y:28});
  for(let i=0;i<2;i++){
    f.map.choose({x:19,y:21},true);drag(f.map,[1,1],{6:true});f.map.control({},{6:true});
    assert.deepEqual(Array.from(f.map.selection()),['monk','u2']);
  }
  assert.equal(f.orders.length,0,'selection cannot bypass pending guard');
  f.map.choose({x:18,y:18});f.map.choose({x:19,y:21},true);
  drag(f.map,[1,1],{6:true});f.map.control({},{6:true});
  assert.deepEqual(Array.from(f.map.selection()),['b2']);assert.equal(f.orders.length,0);
});

test('reverse and empty boxes replace selection and release uses current ownership and garrison eligibility',()=>{
  const f=fixture(),source=world();source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:22,y:24});
  f.map.refresh(source,1,32,32,true);f.map.choose({x:25,y:25});
  drag(f.map,[-1,-1],{},3);
  source.us[1].ld={};f.map.refresh(source,1,32,32,true);
  f.map.control({},{});assert.deepEqual(Array.from(f.map.selection()),['u5']);
  // Repositioning with LT on empty space is selection-only, so no move leaks.
  f.map.choose({x:29,y:29},true);drag(f.map,[1,1]);f.map.control({},{});
  assert.deepEqual(Array.from(f.map.selection()),[]);assert.equal(f.orders.length,0);
});

test('B, menus, modifiers, focus changes and pointer selection cancel unfinished boxes without release orders',()=>{
  for(const interrupt of ['B','suspend','blur','RT','LB','RB','Y','dpad','team','pointer']){
    const f=fixture(),source=world();f.map.refresh(source,1,32,32,true);
    f.map.choose({x:20,y:22});drag(f.map,[1,1]);
    if(interrupt==='B')f.map.control({1:true},{0:true});
    if(interrupt==='suspend')f.map.suspend();
    if(interrupt==='blur')f.handlers.get('blur')();
    const modifier={RT:7,LB:4,RB:5,Y:3}[interrupt];
    if(modifier!==undefined)f.map.control({[modifier]:true},{0:true,[modifier]:true});
    if(interrupt==='dpad')f.map.control({12:true},{0:true});
    if(interrupt==='team'){f.map.refresh(source,0,32,32,true);f.map.refresh(source,1,32,32,true);}
    if(interrupt==='pointer')f.map.choose({x:20,y:22});
    f.map.control({},{0:true});f.map.control({},{});
    assert.equal(f.orders.length,0,interrupt);assert.equal(f.left(),false,interrupt);
  }
});

test('A taps act only on release and small stick movement does not turn a tap into a box',()=>{
  const f=fixture();f.map.refresh(world(),1,32,32,true);
  f.map.control({0:true},{0:true});assert.equal(f.map.selected(),null);
  f.map.control({},{0:true},[.1,0],.1);f.map.control({},{});
  assert.equal(f.map.selected(),'u2');assert.equal(f.boxes.length,0);
  f.map.control({}, {},[1,0],.1);
  f.map.control({0:true},{0:true});assert.equal(f.orders.length,0);
  f.map.control({},{});assert.equal(f.orders.length,1);
});

test('double A selects visible completed owned town centres and submits the full training group as a snapshot',()=>{
  let time=1000;const f=fixture({now:()=>time}),source=world();source.bs[1].done=true;
  source.bs.push({netId:'b3',t:1,k:'tc',hp:100,x:26,y:26,s:3,done:true},
    {netId:'b4',t:1,k:'tc',hp:100,x:8,y:8,s:3,done:false},
    {netId:'b5',t:1,k:'tc',hp:0,x:10,y:10,s:3,done:true},
    {netId:'b6',t:0,k:'tc',hp:100,x:12,y:12,s:3,done:true},
    {netId:'b7',t:1,k:'mill',hp:100,x:14,y:14,s:2,done:true},
    {netId:'b8',t:1,k:'tc',hp:100,x:33,y:14,s:3,done:true});
  const before=JSON.stringify(source);f.map.refresh(source,1,32,32,true);f.map.control({13:true});
  tap(f.map);assert.deepEqual(Array.from(f.map.selection()),['b2']);
  // Normal live refreshes must not erase a building's first tap.
  f.map.refresh(source,1,32,32,true);time+=100;tap(f.map);
  assert.deepEqual(Array.from(f.map.selection()),['b2','b3']);
  assert.match(f.description.textContent,/2 town centres/);assert.equal(f.stopButton.disabled,true);
  f.map.choose({x:30,y:30});assert.equal(f.orders.length,0,'unverified group rally stays unavailable');
  assert.match(f.description.textContent,/Group rally orders/);
  f.map.control({7:true});f.map.control({0:true},{6:true,7:true});
  assert.equal(JSON.stringify(f.orders),JSON.stringify([{type:'train',entities:['b2','b3'],value:'vil',count:5}]));
  f.map.control({0:true},{6:true,7:true});assert.equal(f.orders.length,1,'pending request blocks repeats');
  assert.equal(JSON.stringify(source),before,'UI selection and training never mutate the world');
  source.bs[1].hp=0;f.map.refresh(source,1,32,32,false);
  assert.deepEqual(Array.from(f.map.selection()),['b3']);assert.match(f.description.textContent,/town centre/);
  assert.deepEqual(Array.from(f.orders[0].entities),['b2','b3']);
});

test('building double-tap cancellation and expiry preserve ordinary single-building selection',()=>{
  for(const interruption of ['timeout','suspend','removed','pointer']){
    let time=1000;const f=fixture({now:()=>time}),source=world();source.bs[1].done=true;
    source.bs.push({netId:'b3',t:1,k:'tc',hp:100,x:26,y:26,s:3,done:true});
    f.map.refresh(source,1,32,32,true);f.map.control({13:true});tap(f.map);time+=100;
    if(interruption==='timeout')time+=400;
    if(interruption==='suspend')f.map.suspend();
    if(interruption==='pointer')f.map.choose({x:18,y:18});
    if(interruption==='removed'){
      source.bs[1].done=false;f.map.refresh(source,1,32,32,true);
      source.bs[1].done=true;f.map.refresh(source,1,32,32,true);
    }
    tap(f.map);assert.deepEqual(Array.from(f.map.selection()),['b2'],interruption);
    assert.equal(f.orders.length,0,interruption);
  }
});

