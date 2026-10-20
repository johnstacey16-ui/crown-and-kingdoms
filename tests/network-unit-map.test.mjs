import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const context={};
vm.runInNewContext(readFileSync(new URL('../js/network-unit-map.js',import.meta.url),'utf8'),context);
const api=context.CK_UNIT_MAP;
const world=()=>({teamN:2,us:[
  {netId:'u1',t:0,k:'vil',hp:25,x:5,y:6},
  {netId:'u2',t:1,k:'vil',hp:25,x:20,y:22},
  {netId:'u3',t:1,k:'vil',hp:0,x:21,y:22},
  {netId:'u4',t:1,k:'vil',hp:25,x:21,y:22,ld:{}}
],bs:[{netId:'b1',t:0,k:'tc',hp:100,x:3,y:3,s:3},{netId:'b2',t:1,k:'tc',hp:100,x:18,y:18,s:3}],
  res:[{f:100},{f:200}],vs:new Uint8Array(32*32),nodes:[{x:19,y:19,k:'g'}]});
function fixture() {
  const handlers=new Map(),orders=[];
  const navigation={};
  for(const key of ['previousButton','nextButton','townButton'])navigation[key]={disabled:false,addEventListener(name,fn){this[name]=fn;}};
  const stopHandlers=new Map(),stopButton={disabled:false,addEventListener:(name,fn)=>stopHandlers.set(name,fn)};
  let left=false;
  const canvas={style:{},getContext:()=>new Proxy({},{get:()=>()=>{}}),setAttribute(){},
    addEventListener:(name,fn)=>handlers.set(name,fn),focus(){},
    getBoundingClientRect:()=>({left:100,top:50,width:340,height:340})};
  const description={textContent:''};
  const map=api.create({canvas,description,stopButton,...navigation,submit:order=>{orders.push(order);return {ok:true};},leave:()=>{left=true;}});
  return {map,handlers,orders,description,canvas,stopButton,...navigation,stopClick:()=>stopHandlers.get('click')(),left:()=>left};
}

test('team-one projection contains only its living ungarrisoned units and buildings, without world references',()=>{
  const source=world(),before=JSON.stringify(source);
  const view=api.project(source,1,32,32);
  assert.equal(JSON.stringify(view.units),JSON.stringify([{id:'u2',kind:'vil',x:20,y:22}]));
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

test('D-pad/A moves the map cursor; X clears selection and B returns focus',()=>{
  const f=fixture();f.map.refresh(world(),1,32,32,true);
  const press=index=>{const buttons=[];buttons[index]=true;f.map.control(buttons);};
  press(0);assert.equal(f.map.selected(),'u2');
  press(15);press(15);press(15);press(0);
  assert.equal(f.orders[0].point.x,23);assert.equal(f.orders[0].point.y,22);
  press(2);assert.equal(f.map.selected(),null);
  press(1);assert.equal(f.left(),true);
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
  f.map.control({6:true});
  assert.equal(f.map.selected(),'b2');
  for(let i=0;i<5;i++)f.map.control({15:true});
  f.map.control({0:true});
  assert.equal(f.orders[0].type,'rally');assert.equal(f.orders[0].point.x,24.5);
});

test('button and Y submit stop only for a ready selected unit without changing the world',()=>{
  for(const input of ['button','controller']){
    const f=fixture(),source=world(),before=JSON.stringify(source);
    f.map.refresh(source,1,32,32,true);
    assert.equal(f.stopButton.disabled,true);f.stopClick();assert.equal(f.orders.length,0);
    f.map.choose({x:20,y:22});assert.equal(f.stopButton.disabled,false);
    if(input==='button')f.stopClick();else f.map.control({3:true});
    assert.equal(JSON.stringify(f.orders),JSON.stringify([{type:'stop',entities:['u2']}]));
    assert.equal(f.stopButton.disabled,true);f.stopClick();assert.equal(f.orders.length,1);
    assert.equal(JSON.stringify(source),before);
    source.bs[1].done=true;f.map.refresh(source,1,32,32,true);
    f.map.choose({x:18,y:18});assert.equal(f.stopButton.disabled,true);
    f.map.control({3:true});assert.equal(f.orders.length,1,'stop is not a town-centre order');
  }
});

test('quick selection wraps through only owned living units and centers the command cursor',()=>{
  const f=fixture(),source=world();source.us.push({netId:'u5',t:1,k:'vil',hp:25,x:27,y:28});
  const before=JSON.stringify(source);f.map.refresh(source,1,32,32,true);
  f.nextButton.click();assert.equal(f.map.selected(),'u2');
  f.map.control({5:true});assert.equal(f.map.selected(),'u5');
  f.map.control({5:true});assert.equal(f.map.selected(),'u2');
  f.previousButton.click();assert.equal(f.map.selected(),'u5');
  assert.equal(f.orders.length,0);assert.equal(JSON.stringify(source),before);
  f.map.control({15:true});f.map.control({15:true});f.map.control({0:true});
  assert.equal(JSON.stringify(f.orders[0]),JSON.stringify({type:'move',entities:['u5'],point:{x:29,y:28}}));
  f.nextButton.click();assert.equal(f.map.selected(),'u2');
  f.map.control({3:true});assert.equal(f.orders.length,1,'selection cannot bypass pending order');
});

test('RT trains at the selected completed town only, awaiting execution without changing the world',()=>{
  const f=fixture(),source=world();
  source.bs[1].done=true;
  source.bs.push({netId:'b3',t:1,k:'tc',hp:100,x:26,y:26,s:3,done:true});
  const before=JSON.stringify(source);
  f.map.refresh(source,1,32,32,true);
  f.map.control({7:true});assert.equal(f.orders.length,0,'no selection');
  f.map.control({5:true});f.map.control({7:true});assert.equal(f.orders.length,0,'units cannot train');
  f.map.control({6:true});f.map.control({6:true});
  assert.equal(f.map.selected(),'b3');
  f.map.control({7:true});
  assert.equal(JSON.stringify(f.orders),JSON.stringify([{type:'train',entities:['b3'],value:'vil'}]));
  assert.match(f.description.textContent,/host execution/);
  f.map.control({6:true});f.map.control({7:true});assert.equal(f.orders.length,1,'selection cannot bypass a pending order');
  assert.equal(JSON.stringify(source),before);
  f.map.refresh(source,1,32,32,false);f.map.control({7:true});assert.equal(f.orders.length,1);
  source.bs[1].done=false;source.bs[2].hp=0;
  f.map.refresh(source,1,32,32,true);f.map.control({6:true});f.map.control({7:true});
  assert.equal(f.orders.length,1,'unfinished or destroyed towns cannot train');
});

test('RT keeps training available for retry when submission is rejected',()=>{
  let attempts=0;
  const canvas={style:{},getContext:()=>new Proxy({},{get:()=>()=>{}}),setAttribute(){},addEventListener(){},focus(){}};
  const description={textContent:''};
  const map=api.create({canvas,description,leave(){},submit:()=>{attempts++;return {ok:false};}});
  const source=world();source.bs[1].done=true;
  map.refresh(source,1,32,32,true);map.control({6:true});
  map.control({7:true});map.control({7:true});
  assert.equal(attempts,2);assert.match(description.textContent,/not submitted/);
});

test('controller D-pad and town button select without orders and recover from removed units',()=>{
  const f=fixture(),source=world();source.bs[1].done=true;
  f.map.refresh(source,1,32,32,true);
  f.map.control({5:true});assert.equal(f.map.selected(),'u2');
  f.townButton.click();assert.equal(f.map.selected(),'b2');
  f.map.control({4:true});assert.equal(f.map.selected(),'u2');
  f.townButton.click();assert.equal(f.map.selected(),'b2');
  f.map.control({6:true});assert.equal(f.map.selected(),'b2');
  source.us[1].hp=0;f.map.refresh(source,1,32,32,true);
  assert.equal(f.nextButton.disabled,true);assert.equal(f.previousButton.disabled,true);
  f.townButton.click();assert.equal(f.map.selected(),'b2');
  source.bs[1].done=false;f.map.refresh(source,1,32,32,true);
  assert.equal(f.map.selected(),null);assert.equal(f.townButton.disabled,true);
  f.map.control({6:true});assert.equal(f.orders.length,0);
});
