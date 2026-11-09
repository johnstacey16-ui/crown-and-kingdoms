import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import { headlessGame } from './helpers/headless-game.mjs';

const selectionEngine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const selectionInput=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
const selectionPolicy=readFileSync(new URL('../js/input-selection.js',import.meta.url),'utf8');

test('Xbox controller module owns haptics and camera zoom without engine duplication',()=>{
 for(const fn of ['rumble','setZoom']){
  assert.ok(selectionInput.includes('function '+fn+'('),fn+' belongs to input');
  assert.ok(!selectionEngine.includes('function '+fn+'('),fn+' does not belong to game frame engine');
 }
 assert.match(selectionInput,/const rumbleOK=/);
 assert.match(selectionInput,/let lastRb=0/);
 assert.match(selectionInput,/const c=S\?s2w\(CW\/2,CH\/2\):null/);
 assert.match(selectionInput,/if\(n-lastRb<150\)return/);
});

test('Xbox interaction state and selection helpers have one controller owner',()=>{
 for(const name of ['cancelSelectionGesture','cancelShortcutGesture','cancelGameplayGestures','nearV','selectedBuilders']){
  assert.ok(selectionPolicy.includes('function '+name+'('),name+' belongs to selection policy');
  assert.ok(!selectionInput.includes('function '+name+'('),name+' has one owner');
  assert.ok(!selectionEngine.includes('function '+name+'('),name+' is not duplicated in engine');
 }
 for(const variable of ['aDown','boxR','vpWheel','ysc','mmF','mmM','omr','tsc','tcI']){
  assert.ok(selectionPolicy.includes(variable),variable+' remains in the selection policy module');
 }
 assert.match(selectionPolicy,/const SIEGE=/);
 assert.match(selectionPolicy,/const bLock=/);
 assert.doesNotMatch(selectionEngine,/const SIEGE=/);
});

test('clearing gameplay gestures resets selection, shortcut and wheel state',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\n;globalThis.evaluate=code=>eval(code);',sandbox);
 const evaluate=sandbox.evaluate;
 evaluate('aDown={x:1};boxR={x0:0};lastTap=123;lastTapK="vil";yDown=true;yc=2;vpWheel={sel:3};cancelGameplayGestures()');
 assert.equal(evaluate('aDown'),null);
 assert.equal(evaluate('boxR'),null);
 assert.equal(evaluate('lastTap'),0);
 assert.equal(evaluate('lastTapK'),null);
 assert.equal(evaluate('yDown'),false);
 assert.equal(evaluate('yc'),0);
 assert.equal(evaluate('vpWheel'),null);
});

test('in-match Xbox controller dispatch is owned by input rather than the frame engine',()=>{
 assert.match(selectionInput,/function playCtl\(dt\)\{/);
 assert.match(selectionInput,/playCtl\(dt\);return;/);
 assert.doesNotMatch(selectionEngine,/function playCtl\(dt\)\{/);
 assert.match(selectionPolicy,/let aDown=null/);
 assert.doesNotMatch(selectionInput,/let aDown=null/);
 assert.doesNotMatch(selectionEngine,/let aDown=null/);
});

test('Xbox Y shortcut, contextual radial menu and R3 priorities wheel are input-owned',()=>{
 for(const fn of ["yShort","siteMenu","openRadial","openVillagerPriorityWheel","operateVillagerPriorityWheel"]){
  assert.ok(selectionPolicy.includes('function '+fn+'('),fn+' belongs to selection policy');
  assert.ok(!selectionInput.includes('function '+fn+'('),fn+' must not remain in polling/dispatch');
  assert.ok(!selectionEngine.includes('function '+fn+'('),fn+' must not remain in engine');
 }
 for(const fn of ['yShort','openRadial','operateVillagerPriorityWheel']){
  assert.ok(selectionInput.includes(fn+'('),fn+' remains connected to Xbox input orchestration');
 }
});

test('Xbox A, LT+A, box and quick-category handlers have one input owner',()=>{
 for(const fn of ['quickSelectionChoices','qsel','boxSel','tapA']){
  assert.ok(selectionPolicy.includes('function '+fn+'('),fn+' belongs to selection policy');
  assert.ok(!selectionInput.includes('function '+fn+'('),fn+' has one owner');
  assert.ok(!selectionEngine.includes('function '+fn+'('),fn+' is not duplicated in engine');
 }
 assert.match(selectionInput,/if\(E\[0\]\)\{if\(minimapContains\(mm,cur\.x,cur\.y\)\)/);
 assert.match(selectionInput,/boxSel\(boxR,lt\)/);
 assert.match(selectionInput,/tapA\(aw\[0\],aw\[1\],lt\)/);
 assert.match(selectionInput,/qsel\('idle'\)/);
 assert.ok(selectionPolicy.includes('controlGroupMembers(S.sel)'), 'selection preserves live ownership checks');
});

function fixture() {
  const {source,sandbox,listeners}=headlessGame();
  sandbox.fireEvent=(name,event)=>listeners.get(name)?.(event);
  vm.createContext(sandbox);vm.runInContext(source+'\n'+(readFileSync(new URL('../js/ui.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ui-commands.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ui-screens.js',import.meta.url),'utf8')),sandbox);
  vm.runInContext(`
    mode='play';S={us:[],bs:[],sel:[],vp:createVillagerPriority()};
    pad={axes:[0,0,0,0],buttons:[]};
    clampCam=()=>{};
    cur={x:100,y:100};
    globalThis.orders=0;orderSel=()=>{globalThis.orders++;return true;};
    globalThis.run=(edges=[],held=[],released=[])=>{E=edges;P=held;RE=released;playCtl(0);};
    globalThis.state=()=>({selection:S.sel.map(e=>e.netId),automation:S.vp.enabled,zoom:zm,
      groups:(S.cg||[]).map(g=>g.map(e=>e.netId)),radial:cgo?.sel??null,camera:{...cam},formation:fm,
      overview:ov,filter:mmF,mapMode:mmM,flare:S.flare,gesture:!!aDown,box:!!boxR,shortcutHeld:yDown,shortcut:ysc.vb});
  `,sandbox);
  return sandbox;
}
const button=i=>Object.assign([],{[i]:true});

test('small minimap A hits only its visible diamond, leaving surrounding clicks as normal selection',()=>{
 const c=fixture();
 vm.runInContext(`
  globalThis.worldTaps=[];
  tapA=(x,y,lt)=>{worldTaps.push([x,y,lt]);};
  cur={x:mm.x+mm.w/2,y:mm.y+mm.h/2};
 `,c);
 const cameraBefore=c.state().camera;
 c.run(button(0),button(0));c.run([],[],button(0));
 const focusedCamera=c.state().camera;
 assert.notDeepEqual(focusedCamera,cameraBefore,'centre of the diamond must navigate');
 assert.equal(c.worldTaps.length,0,'minimap must not dispatch a world A order');
 assert.equal(c.state().gesture,false);

 // Both the diamond's transparent rectangle corner and a point past its
 // right boundary previously jumped the camera due to one-sided bounds.
 for(const expression of [
  'cur={x:mm.x+10,y:mm.y+5}',
  'cur={x:mm.x+mm.w+5,y:mm.y+mm.h/2}'
 ]){
  vm.runInContext(expression,c);
  c.run(button(0),button(0));
  assert.equal(c.state().gesture,true,'outside click should start normal A selection');
  c.run([],[],button(0));
 }
 assert.deepEqual(c.state().camera,focusedCamera,'outside points must not move the camera');
 assert.equal(c.worldTaps.length,2,'outside points follow the usual A tap flow');
 assert.equal(c.state().gesture,false,'release clears the selection gesture');

 assert.equal(vm.runInContext('minimapContains(mm,NaN,mm.y)',c),false);
 assert.equal(vm.runInContext('minimapContains(mm,mm.x,mm.y)',c),false);
});


function cameraFixture(){
  const {source,sandbox}=headlessGame();vm.createContext(sandbox);
  vm.runInContext(source+'\n'+(readFileSync(new URL('../js/ui.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ui-commands.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ui-screens.js',import.meta.url),'utf8'))+'\n'+readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8'),sandbox);
  vm.runInContext(`
    seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;start();snd=0;mode='play';
    pad={axes:[0,0,0,0],buttons:[]};ctr(30,30);cur={x:CW/2,y:CH/2};
    let cameraHeld=[];
    globalThis.cameraStep=(axes=[0,0,0,0],held=[],dt=1/30)=>{
      pad.axes=axes;P=held;E=Array.from({length:16},(_,i)=>!!held[i]&&!cameraHeld[i]);
      RE=Array.from({length:16},(_,i)=>!held[i]&&!!cameraHeld[i]);cameraHeld=held.slice();ctl(dt);
    };
    globalThis.cameraState=()=>({zoom:zm,centre:s2w(CW/2,CH/2),cursor:{...cur},cam:{...cam},
      screenCentre:{x:CW/2,y:CH/2},hash:CK_SIM_SYNC.worldCheckpoint(S,1).hash,selected:S.sel.map(u=>u.netId)});
  `,sandbox);
  return sandbox;
}

test('Xbox right-stick zoom is direct, dead-zone filtered and separate from camera pan',()=>{
  const c=cameraFixture(),before=c.cameraState();
  c.cameraStep([0,0,1,0]);assert.equal(c.cameraState().zoom,before.zoom);assert.deepEqual(c.cameraState().cam,before.cam);
  c.cameraStep([0,0,0,.1]);assert.equal(c.cameraState().zoom,before.zoom);
  c.cameraStep([0,0,0,-1]);const closer=c.cameraState();assert.ok(closer.zoom>before.zoom);
  for(let i=0;i<2;i++)assert.ok(Math.abs(closer.centre[i]-before.centre[i])<1e-8);
  c.cameraStep([0,0,0,1]);assert.ok(Math.abs(c.cameraState().zoom-before.zoom)<1e-8);
  c.cameraStep([1,0,0,0]);assert.notDeepEqual(c.cameraState().cam,before.cam);
  assert.deepEqual(c.cameraState().cursor,c.cameraState().screenCentre);
  assert.ok(Math.abs(c.cameraState().zoom-before.zoom)<1e-8);assert.equal(c.cameraState().hash,before.hash);
});

test('LT, command/group wheels, expanded minimap and pause do not leak right-stick zoom',()=>{
  for(const context of ['lt','command','group','overview','pause']){
    const c=cameraFixture();
    if(context==='command')vm.runInContext("menu={rad:1,items:[{fn(){}}],i:0}",c);
    if(context==='group')vm.runInContext('cgo={sel:-1,done:0}',c);
    if(context==='overview')vm.runInContext('ov=1',c);
    if(context==='pause')vm.runInContext("mode='pause'",c);
    const before=c.cameraState();c.cameraStep([0,0,0,-1],context==='lt'?button(6):[]);
    assert.equal(c.cameraState().zoom,before.zoom,context);assert.equal(c.cameraState().hash,before.hash,context);
  }
});

test('analog zoom is frame-rate independent, bounded and retains map position',()=>{
  const a=cameraFixture(),b=cameraFixture();
  for(let i=0;i<30;i++)a.cameraStep([0,0,0,-1],[],1/30);
  for(let i=0;i<60;i++)b.cameraStep([0,0,0,-1],[],1/60);
  assert.ok(Math.abs(a.cameraState().zoom-b.cameraState().zoom)<1e-8);
  assert.equal(a.cameraState().zoom,3);
  for(let i=0;i<60;i++)a.cameraStep([0,0,0,1],[],1/30);
  assert.equal(a.cameraState().zoom,.8);
});

test('hold-A box selection stays on its world anchor while left-stick camera panning continues',()=>{
  const c=cameraFixture();
  vm.runInContext(`
    const point=s2w(CW/2+35,CH/2+35);S.us=[];
    globalThis.boxUnit=addU(0,'mil',point[0],point[1]);S.sel=[];
  `,c);
  const before=c.cameraState();c.cameraStep([0,0,0,0],button(0));
  c.cameraStep([1,1,0,0],button(0),.1);c.cameraStep();
  assert.deepEqual(Array.from(c.cameraState().selected),[c.boxUnit.netId]);
  assert.equal(c.cameraState().hash,before.hash);
});

test('the documented Menu > Zoom path adjusts only the local camera and B resumes',()=>{
  const {source,sandbox}=headlessGame();vm.createContext(sandbox);
  vm.runInContext(source+'\n'+(readFileSync(new URL('../js/ui.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ui-commands.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ui-screens.js',import.meta.url),'utf8')),sandbox);
  vm.runInContext(`
    seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;start();snd=0;
    pad={axes:[0,0,0,0],buttons:[]};mode='play';
    globalThis.zoomPress=i=>{E=[];P=[];RE=[];E[i]=P[i]=true;ctl(DT);E=[];P=[];RE=[];RE[i]=true;ctl(DT)};
    globalThis.zoomRead=()=>({mode,zoom:zm,centre:s2w(CW/2,CH/2),world:JSON.stringify([S.res,S.us,S.bs])});
  `,sandbox);
  const before=sandbox.zoomRead();sandbox.zoomPress(9);
  assert.equal(sandbox.zoomRead().mode,'pause');
  const index=vm.runInContext("pmItems().findIndex(it=>it.n==='Zoom')",sandbox);assert.ok(index>=0);
  for(let i=0;i<index;i++)sandbox.zoomPress(13);
  sandbox.zoomPress(14);assert.equal(sandbox.zoomRead().zoom,+(before.zoom-.2).toFixed(1));
  sandbox.zoomPress(15);assert.equal(sandbox.zoomRead().zoom,before.zoom);
  for(let i=0;i<20;i++)sandbox.zoomPress(15);assert.equal(sandbox.zoomRead().zoom,3);
  for(let i=0;i<20;i++)sandbox.zoomPress(14);assert.equal(sandbox.zoomRead().zoom,.8);
  const after=sandbox.zoomRead();
  for(let i=0;i<2;i++)assert.ok(Math.abs(after.centre[i]-before.centre[i])<1e-8,'zoom retains the viewed world position');
  assert.equal(after.world,before.world,'menu zoom does not change game entities or resources');
  sandbox.zoomPress(1);assert.equal(sandbox.zoomRead().mode,'play');
});

test('LT+A adds a clicked unit without toggling automation or replacing selection',()=>{
  const c=fixture();
  vm.runInContext(`
    const first={netId:'first',t:0,k:'vil',hp:25,x:3,y:3};
    const second={netId:'second',t:0,k:'vil',hp:25,x:10,y:10};
    S.us=[first,second];S.sel=[first];pick=()=>second;
  `,c);
  const before=c.state().automation;
  c.run(button(0),Object.assign(button(0),{6:true}));
  c.run([],button(6),button(0));
  assert.deepEqual(Array.from(c.state().selection),['first','second']);
  assert.equal(c.state().automation,before);assert.equal(c.orders,0);
});

test('removed solo shortcuts cannot issue a generic X order, cycle R3 subgroups or change LT targets',()=>{
  const c=fixture();
  vm.runInContext(`globalThis.subgroups=0;subg=()=>{globalThis.subgroups++;};`,c);
  const zoom=c.state().zoom;
  for(const key of [2,11])c.run(button(key),button(key));
  for(const key of [12,13,14,15,2,1])c.run(button(key),Object.assign(button(key),{6:true}));
  assert.equal(c.orders,0);assert.equal(c.subgroups,0);assert.equal(c.state().zoom,zoom);
});

test('solo D-pad categories select idle villagers, support, town centres and military',()=>{
  const c=fixture();
  vm.runInContext(`
    S.us=[{netId:'worker',t:0,k:'vil',hp:25,o:'i',x:3,y:3},
      {netId:'support',t:0,k:'mon',hp:25,x:4,y:4},
      {netId:'army',t:0,k:'mil',hp:40,x:5,y:5},
      {netId:'enemy',t:1,k:'vil',hp:25,o:'i',x:6,y:6}];
    S.bs=[{netId:'town',t:0,k:'tc',hp:100,done:true,x:7,y:7,s:3,q:[]}];
  `,c);
  for(const [key,id] of [[12,'worker'],[15,'support'],[13,'town'],[14,'army']]){
    c.run(button(key),button(key));assert.deepEqual(Array.from(c.state().selection),[id]);
  }
});

function openGroup(c){
  c.run(button(4),button(4));
  vm.runInContext('pad.axes=[0,-1,0,0];',c);
  c.run([],button(4));assert.equal(c.state().radial,0);
  vm.runInContext('pad.axes=[0,0,0,0];',c);
}

test('LB/X assigns only distinct living owned world entities, including buildings',()=>{
  const c=fixture();
  vm.runInContext(`
    const own={netId:'own',t:0,k:'mil',hp:40,x:8,y:8};
    const town={netId:'town',t:0,k:'tc',hp:100,x:10,y:10,s:3,q:[]};
    const enemy={...own,netId:'enemy',t:1},dead={...own,netId:'dead',hp:0};
    const loaded={...own,netId:'loaded',ld:town},stale={...own,netId:'stale'};
    S.us=[own,enemy,dead,loaded];S.bs=[town];S.sel=[own,own,town,enemy,dead,loaded,stale];
  `,c);
  const selection=Array.from(c.state().selection);
  openGroup(c);c.run(button(2),button(4));c.run([],[],button(4));
  assert.deepEqual(Array.from(c.state().groups[0]),['own','town']);
  assert.deepEqual(Array.from(c.state().selection),selection,'assigning is not recalling');
  assert.equal(c.orders,0);assert.equal(c.state().radial,null);
});

test('LB release checks current ownership and world membership; unloaded units become available again',()=>{
  const c=fixture();
  vm.runInContext(`
    const own={netId:'own',t:0,k:'mil',hp:40,x:8,y:8};
    const converted={...own,netId:'converted'},removed={...own,netId:'removed'};
    const dead={...own,netId:'dead'},loaded={...own,netId:'loaded'};
    S.us=[own,converted,removed,dead,loaded];S.sel=S.us.slice();
  `,c);
  openGroup(c);c.run(button(2),button(4));c.run([],[],button(4));
  vm.runInContext(`converted.t=1;S.us=S.us.filter(u=>u!==removed);dead.hp=0;loaded.ld={};S.sel=[];`,c);
  const camera=c.state().camera;
  openGroup(c);c.run([],[],button(4));
  assert.deepEqual(Array.from(c.state().selection),['own']);
  assert.deepEqual(Array.from(c.state().groups[0]),['own','converted','removed','dead','loaded'],'recalling does not rewrite the assigned group');
  assert.deepEqual(c.state().camera,camera,'recall alone does not use the Y focus action');
  vm.runInContext(`converted.t=0;loaded.ld=null;`,c);
  openGroup(c);c.run([],[],button(4));
  assert.deepEqual(Array.from(c.state().selection),['own','converted','loaded'],'availability is checked against current ownership and garrison state');
  assert.equal(c.orders,0);
});

test('LB/Y focuses a valid group and releasing Y cannot trigger a gameplay shortcut',()=>{
  const c=fixture();
  vm.runInContext(`
    const town={netId:'town',t:0,k:'tc',hp:100,x:20,y:20,s:3,q:[]};
    S.bs=[town];S.cg=[[town]];S.sel=[];
    globalThis.shortcutCalls=0;yShort=()=>{globalThis.shortcutCalls++;};
  `,c);
  const camera=c.state().camera;
  openGroup(c);c.run(button(3),Object.assign(button(4),{3:true}));
  assert.deepEqual(Array.from(c.state().selection),['town']);
  assert.notDeepEqual(c.state().camera,camera);
  c.run([],button(3),button(4));c.run([],[],button(3));
  assert.equal(c.shortcutCalls,0);assert.equal(c.orders,0);
});

test('B cancels the group wheel and an empty group never replaces a valid selection',()=>{
  const c=fixture();
  vm.runInContext(`const own={netId:'own',t:0,k:'mil',hp:40,x:8,y:8};S.us=[own];S.sel=[own];S.cg=[[]];`,c);
  openGroup(c);c.run(button(1),button(4));c.run([],[],button(4));
  assert.deepEqual(Array.from(c.state().selection),['own']);assert.equal(c.state().radial,null);
  openGroup(c);c.run(button(3),Object.assign(button(4),{3:true}));
  c.run([],[],button(4));c.run([],[],button(3));
  assert.deepEqual(Array.from(c.state().selection),['own']);assert.equal(c.orders,0);
});

test('D-pad quick selection skips dead, garrisoned, foreign and unfinished entities in every category',()=>{
  const c=fixture();
  vm.runInContext(`
    const unit=(id,k,extra={})=>({netId:id,t:0,k,hp:25,o:'i',x:3,y:3,...extra});
    S.us=[];
    for(const [prefix,kind] of [['worker','vil'],['support','mon'],['army','mil']]){
      S.us.push(unit(prefix+'-dead',kind,{hp:0}),unit(prefix+'-loaded',kind,{ld:{}}),
        unit(prefix+'-foreign',kind,{t:1}),unit(prefix,kind));
    }
    S.us.push(unit('busy-worker','vil',{o:'g'}),unit('trade-cart','cart'),unit('trade-ship','cog'),
      unit('transport','trn'),unit('king','king'),unit('fish','fish',{o:'g'}));
    const town=(id,extra={})=>({netId:id,t:0,k:'tc',hp:100,done:true,x:7,y:7,s:3,q:[],...extra});
    S.bs=[town('dead-town',{hp:0}),town('unfinished-town',{done:false}),town('foreign-town',{t:1}),town('town')];
  `,c);
  for(const [key,ids] of [[12,['worker']],[15,['support']],[13,['town']],[14,['army']]]){
    c.run(button(key),button(key));assert.deepEqual(Array.from(c.state().selection),ids);
  }
  vm.runInContext(`
    globalThis.hudText=[];X.fillText=s=>hudText.push(String(s));quickBar();
  `,c);
  assert.deepEqual(Array.from(c.hudText),['Idle','1','Support','1','Town C.','1','Military','1'],'HUD counts match selectable entities');
  vm.runInContext(`hudText.length=0;topbar({f:0,w:0,g:0,s:0});`,c);
  assert.ok(c.hudText.includes('Idle 1'),'top-bar idle count excludes dead or loaded workers');
  assert.equal(c.orders,0);
});

test('quick selection checks fresh availability and leaves selection and camera alone when a category is empty',()=>{
  const c=fixture();
  vm.runInContext(`
    const a={netId:'a',t:0,k:'vil',hp:25,o:'i',x:3,y:3};
    const b={...a,netId:'b',x:8,y:8};S.us=[a,b];S.sel=[];
  `,c);
  c.run(button(12),button(12));assert.deepEqual(Array.from(c.state().selection),['a']);
  vm.runInContext('a.hp=0;',c);
  c.run(button(12),button(12));assert.deepEqual(Array.from(c.state().selection),['b']);
  vm.runInContext('b.ld={};',c);
  const camera=c.state().camera;
  for(const key of [12,13,14,15]){
    c.run(button(key),button(key));assert.deepEqual(Array.from(c.state().selection),['b']);
    assert.deepEqual(c.state().camera,camera);
  }
  vm.runInContext('b.ld=null;',c);c.run(button(12),button(12));
  assert.deepEqual(Array.from(c.state().selection),['b']);assert.equal(c.orders,0);
});

test('expanded minimap focuses with Y, ignores A and consumes Y release before gameplay shortcuts',()=>{
  const c=fixture();
  vm.runInContext(`
    S.sel=[{netId:'selected',t:0,k:'vil',hp:25,x:3,y:3}];
    globalThis.shortcutCalls=0;yShort=()=>{globalThis.shortcutCalls++;};
  `,c);
  c.run(button(5),button(5));assert.equal(c.state().overview,1);
  const before=c.state().camera;
  c.run(button(0),button(0));c.run([],[],button(0));
  assert.equal(c.state().overview,1);assert.deepEqual(c.state().camera,before);assert.equal(c.orders,0);
  c.run(button(3),button(3));assert.equal(c.state().overview,0);
  assert.notDeepEqual(c.state().camera,before);
  c.run([],[],button(3));assert.equal(c.shortcutCalls,0);
  assert.deepEqual(Array.from(c.state().selection),['selected']);assert.equal(c.orders,0);
});

test('expanded minimap D-pad actions do not leak into unit selection and cancellation does not focus',()=>{
  const c=fixture();
  vm.runInContext(`S.t=10;S.sel=[{netId:'selected',t:0,k:'mil',hp:25,x:3,y:3}];`,c);
  c.run(button(5),button(5));const camera=c.state().camera;
  c.run(button(12),button(12));assert.equal(c.state().flare.t,10);
  for(const expected of [1,2,0]){
    c.run(button(15),button(15));assert.equal(c.state().filter,expected);
    c.run(button(14),button(14));assert.equal(c.state().mapMode,expected);
  }
  assert.deepEqual(Array.from(c.state().selection),['selected']);assert.deepEqual(c.state().camera,camera);
  c.run(button(1),button(1));assert.equal(c.state().overview,0);
  assert.deepEqual(c.state().camera,camera);assert.equal(c.orders,0);
});

test('minimap overlay and controller help advertise Y for camera focus',()=>{
  const c=fixture();
  vm.runInContext(`
    globalThis.helpText=[];X.fillText=s=>helpText.push(String(s));
    minimapDraw=()=>{};S.teamN=2;drawOv();drawInfo2();
  `,c);
  assert.ok(c.helpText.some(s=>s.includes('Y: focus')),'overview labels the actual Y focus action');
  assert.ok(c.helpText.some(s=>s.includes('Y focuses')),'controller help explains minimap Y focus');
  assert.equal(c.helpText.some(s=>s.includes('A: jump camera')||s.includes('A or Y jumps there')),false);
});

function buildFixture(){
  const c=fixture();
  vm.runInContext(`
    setSize(32);S.age=[3,3];S.tech=[{},{}];S.res=[{f:1000,w:1000,g:1000,s:1000},{f:1000,w:1000,g:1000,s:1000}];
    S.g=new Uint8Array(W*H);S.wt=new Uint8Array(W*H);S.ex=new Uint8Array(W*H).fill(1);S.nd=[];S.nodes=[];
    globalThis.worker={netId:'worker',k:'vil',t:0,hp:25,x:10,y:10,o:'i'};S.us=[worker];S.sel=[worker];
    ysc.vb='farm';const p=w2s(12,12);cur={x:p[0],y:p[1]};pick=()=>null;
    globalThis.addMill=(extra={})=>{const b={netId:'mill',k:'mill',t:0,hp:100,done:true,q:[],x:4,y:4,s:2,...extra};S.bs.push(b);return b;};
    globalThis.chooseFarm=()=>{menu.i=menu.items.findIndex(it=>it.l===B.farm.n);return menu.items[menu.i].lk;};
    globalThis.buildState=()=>JSON.stringify({place:place&&{...place},wood:S.res[0].w,food:S.res[0].f,queued:S.bs.reduce((n,b)=>n+(b.q?.length||0),0),
      farms:S.nodes.filter(n=>n.fm).map(n=>({owner:n.t,food:n.amt})),buildings:S.bs.length,
      workers:S.us.map(u=>({id:u.netId,order:u.o,target:u.tg?.k||null})),notes:notes.map(n=>n.s)});
  `,c);
  return {c,run:code=>vm.runInContext(code,c),state:()=>JSON.parse(c.buildState())};
}
function farmShortcut(c){c.run(button(3),button(3));c.run([],[],button(3));}

test('farm shortcut and RT menu require a currently living completed owned Mill without spending resources',()=>{
  for(const route of ['shortcut','wheel'])for(const condition of ['missing','foreign','unfinished','dead']){
    const f=buildFixture();
    if(condition!=='missing')f.run(`addMill(${JSON.stringify({foreign:{t:1},unfinished:{done:false},dead:{hp:0}}[condition])});`);
    if(route==='shortcut')farmShortcut(f.c);
    else{
      f.c.run(button(7),button(7));assert.equal(f.c.chooseFarm(),'Needs Mill');
      f.c.run(button(0),button(7));
    }
    assert.equal(f.state().place,null,route+' '+condition);
    assert.equal(f.state().wood,1000);assert.equal(f.state().farms.length,0);
    assert.ok(f.state().notes.includes('Needs Mill'));
  }
});

test('build menu rechecks Mill completion and ownership when A confirms its farm entry',()=>{
  for(const change of ['mill.hp=0','mill.t=1','S.bs=[]','worker.ld={}']){
    const f=buildFixture();f.run('globalThis.mill=addMill();');
    f.c.run(button(7),button(7));assert.equal(f.c.chooseFarm(),'');
    f.run(change);
    if(change!=='worker.ld={}')assert.equal(f.c.chooseFarm(),'Needs Mill','menu lock follows the current prerequisite');
    f.c.run(button(0),button(7));
    assert.equal(f.state().place,null,change);assert.equal(f.state().wood,1000,change);
  }
  const f=buildFixture();f.c.run(button(7),button(7));assert.equal(f.c.chooseFarm(),'Needs Mill');
  f.run('addMill();');assert.equal(f.c.chooseFarm(),'');f.c.run(button(0),button(7));
  assert.equal(f.state().place.k,'farm','a newly completed Mill unlocks the existing menu entry');
});

test('farm preview rechecks prerequisites at placement and valid placement charges once with researched farm capacity',()=>{
  const f=buildFixture();f.run('globalThis.mill=addMill();S.tech[0].coll=1;');farmShortcut(f.c);
  assert.equal(f.state().place.k,'farm');assert.equal(f.state().wood,1000);
  f.run('mill.hp=0;');f.c.run(button(0),button(0));
  assert.equal(f.state().place.ok,false);assert.equal(f.state().wood,1000);assert.equal(f.state().farms.length,0);
  f.run('mill.hp=100;');f.c.run(button(0),button(0));
  assert.equal(f.state().place,null);assert.equal(f.state().wood,940);
  assert.deepEqual(f.state().farms,[{owner:0,food:250}]);
  assert.deepEqual(f.state().workers,[{id:'worker',order:'g',target:'f'}]);
});

test('invalid selected villagers cannot start shortcuts or receive building orders, and no available builder means no charge',()=>{
  for(const change of ['worker.hp=0','worker.ld={}','worker.t=1','S.us=[]']){
    const f=buildFixture();f.run('addMill();');f.run(change);farmShortcut(f.c);
    assert.equal(f.state().place,null,change);assert.equal(f.state().wood,1000);
    // A previously opened placement must also reject loss of its builders.
    f.run("place={k:'farm'};");f.c.run(button(0),button(0));
    assert.equal(f.state().wood,1000,change);assert.equal(f.state().farms.length,0,change);
  }
});

test('house shortcut remains available without a Mill and placement excludes invalid workers from the build order',()=>{
  const f=buildFixture();
  f.run(`
    ysc.vb='house';
    const dead={...worker,netId:'dead',hp:0},loaded={...worker,netId:'loaded',ld:{}},foreign={...worker,netId:'foreign',t:1};
    S.us.push(dead,loaded,foreign);S.sel=[worker,worker,dead,loaded,foreign];
  `);
  farmShortcut(f.c);assert.equal(f.state().place.k,'house');f.c.run(button(0),button(0));
  assert.equal(f.state().wood,975);assert.equal(f.state().buildings,1);
  assert.deepEqual(f.state().workers.map(u=>u.order),['b','i','i','i']);
});

function selectTap(c){c.run(button(0),button(0));c.run([],[],button(0));}

test('solo double A selects only living owned ungarrisoned units of the same type on screen',()=>{
  const c=fixture();let time=1000;c.performance.now=()=>time;
  vm.runInContext(`
    const a={netId:'a',t:0,k:'vil',hp:25,x:3,y:3};
    const b={...a,netId:'b',x:4,y:4};
    S.us=[a,b,{...a,netId:'dead',hp:0},{...a,netId:'foreign',t:1},
      {...a,netId:'loaded',ld:{}},{...a,netId:'offscreen',x:1000,y:1000},{...a,netId:'monk',k:'mon'}];
    pick=()=>a;
  `,c);
  selectTap(c);time+=100;selectTap(c);
  assert.deepEqual(Array.from(c.state().selection),['a','b']);assert.equal(c.orders,0);
});

test('solo building double A excludes dead, foreign and offscreen buildings',()=>{
  const c=fixture();let time=1000;c.performance.now=()=>time;
  vm.runInContext(`
    const town={netId:'town',t:0,k:'tc',hp:100,mh:100,done:true,q:[],x:3,y:3,s:3};
    S.bs=[town,{...town,netId:'building',hp:1,done:false,x:5,y:5},
      {...town,netId:'dead',hp:0},{...town,netId:'foreign',t:1},
      {...town,netId:'offscreen',x:1000,y:1000}];pick=()=>town;
  `,c);
  selectTap(c);time+=100;selectTap(c);
  assert.deepEqual(Array.from(c.state().selection),['town','building']);assert.equal(c.orders,0);
});

test('solo LT boxes filter stale members, deduplicate and retain eligible selections outside a reverse box',()=>{
  const c=fixture();
  vm.runInContext(`
    const a={netId:'a',t:0,k:'vil',hp:25,x:3,y:3},b={...a,netId:'b',x:4,y:4};
    const monk={...a,netId:'monk',k:'mon',x:20,y:10};
    const dead={...a,netId:'dead',hp:0},foreign={...a,netId:'foreign',t:1},loaded={...a,netId:'loaded',ld:{}};
    S.us=[a,b,monk,dead,foreign,loaded];
    S.sel=[monk,monk,dead,foreign,loaded,{...a,netId:'stale'}];
    boxSel({x0:100,y0:200,x1:-100,y1:0},true);
  `,c);
  assert.deepEqual(Array.from(c.state().selection),['monk','a','b']);assert.equal(c.orders,0);
});

test('picking skips dead units and buildings before world compaction',()=>{
  const c=fixture();
  vm.runInContext(`
    setSize(32);S.ex=new Uint8Array(W*H).fill(1);S.vs=S.ex;S.nd=[];S.rel=[];
    const a={netId:'live',t:0,k:'vil',hp:25,x:10,y:10};
    S.us=[{...a,netId:'dead',hp:0},{...a,netId:'loaded',ld:{}},a];
    S.bs=[{netId:'dead-town',t:0,k:'tc',hp:0,x:2,y:2,s:3,q:[]},
      {netId:'live-town',t:0,k:'tc',hp:100,x:5,y:5,s:3,q:[]}];
    globalThis.picked=[pick(10,10)?.netId,pick(3,3)?.netId||null,pick(6,6)?.netId];
  `,c);
  assert.deepEqual(Array.from(c.picked),['live',null,'live-town']);
});

test('unfinished A boxes are cancelled by menu changes, quick selection, B, blur and disconnection',()=>{
  for(const interruption of ['B','RB','LB','RT','Dpad','View','Menu','blur','disconnect','poll-loss']){
    const c=fixture();
    vm.runInContext(`
      S.us=[{netId:'worker',t:0,k:'vil',hp:25,o:'i',x:3,y:3}];S.sel=S.us.slice();pad.index=0;
      saveG=()=>true;pick=()=>null;
    `,c);
    c.run(button(0),button(0));vm.runInContext('cur.x+=50;',c);c.run([],button(0));
    assert.equal(c.state().box,true,interruption);
    const key={B:1,RB:5,LB:4,RT:7,Dpad:12,View:8}[interruption];
    if(key!==undefined)c.run(button(key),button(0));
    if(interruption==='Menu')vm.runInContext('E=[];E[9]=true;P=[];P[0]=true;RE=[];ctl(0);',c);
    if(interruption==='blur')c.fireEvent('blur');
    if(interruption==='disconnect')c.fireEvent('gamepaddisconnected',{gamepad:{index:0}});
    if(interruption==='poll-loss')vm.runInContext('pad=null;E=[];P=[];RE=[];ctl(0);',c);
    assert.equal(c.state().gesture,false,interruption);assert.equal(c.state().box,false,interruption);
    vm.runInContext("menu=cgo=null;ov=0;mode='play';",c);
    c.run([],[],button(0));assert.equal(c.orders,0,interruption);
  }
});

test('controller replacement cancels a pending A tap and its first release cannot issue an order',()=>{
  const c=fixture();
  vm.runInContext(`
    S.us=[{netId:'worker',t:0,k:'vil',hp:25,o:'i',x:3,y:3}];S.sel=S.us.slice();
    pad.id='old';pad.index=0;pad.connected=true;
  `,c);
  c.run(button(0),button(0));assert.equal(c.state().gesture,true);
  vm.runInContext(`
    globalThis.replacement={id:'new',index:1,connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===0,value:i===0?1:0}))};
    navigator.getGamepads=()=>[replacement];readPad();playCtl(0);
    replacement.buttons[0]={pressed:false,value:0};readPad();playCtl(0);
  `,c);
  assert.equal(c.state().gesture,false);assert.equal(c.orders,0);
});

test('B on the same frame as A release cancels selection before any order or tap can execute',()=>{
  const c=fixture();
  vm.runInContext(`const a={netId:'a',t:0,k:'vil',hp:25,x:3,y:3};S.us=[a];S.sel=[a];pick=()=>a;`,c);
  c.run(button(0),button(0));c.run(button(1),[],button(0));
  assert.deepEqual(Array.from(c.state().selection),[]);assert.equal(c.orders,0);assert.equal(c.state().gesture,false);
  selectTap(c);assert.deepEqual(Array.from(c.state().selection),['a'],'fresh taps still work after cancellation');
});

test('opening and closing the minimap cancels a partly completed double-A sequence',()=>{
  const c=fixture();let time=1000;c.performance.now=()=>time;
  vm.runInContext(`const a={netId:'a',t:0,k:'vil',hp:25,x:3,y:3};S.us=[a,{...a,netId:'b',x:4,y:4}];pick=()=>a;`,c);
  selectTap(c);c.run(button(5),button(5));c.run(button(1),button(1));
  time+=100;selectTap(c);
  assert.deepEqual(Array.from(c.state().selection),['a']);assert.equal(c.orders,0);
});

test('Y opening a build preview on the same frame as A release cannot execute the unfinished A order',()=>{
  const f=buildFixture();f.run("ysc.vb='house';");
  f.c.run(button(0),button(0));
  f.c.run(button(3),Object.assign(button(0),{3:true}));
  f.c.run([],[],Object.assign(button(0),{3:true}));
  assert.equal(f.state().place.k,'house');assert.equal(f.c.state().gesture,false);
  assert.equal(f.c.orders,0);assert.equal(f.state().wood,1000);
});

test('Y shortcut requires a gameplay press; orphan releases and held-Y cycling cannot build',()=>{
  const f=buildFixture();f.run("ysc.vb='house';");
  f.c.run([],[],button(3));assert.equal(f.state().place,null);
  f.c.run(button(14),button(3));
  assert.equal(f.c.state().shortcut,'house','held Y without a gameplay press cannot change the shortcut');
  farmShortcut(f.c);assert.equal(f.state().place.k,'house');assert.equal(f.state().wood,1000);
});

test('menus, quick selection, B, focus and controller loss consume a held Y shortcut until a fresh press',()=>{
  for(const interruption of ['RT','LB','RB','Dpad','View','B','Menu','non-play','blur','disconnect','poll-loss']){
    const f=buildFixture();f.run("ysc.vb='house';pad.index=0;saveG=()=>true;");
    f.c.run(button(3),button(3));assert.equal(f.c.state().shortcutHeld,true);
    const key={RT:7,LB:4,RB:5,Dpad:12,View:8,B:1}[interruption];
    if(key!==undefined){
      if(interruption==='Dpad')f.run("qsel('idle');"); // Also covers context changes initiated outside the held-Y handler.
      else f.c.run(button(key),Object.assign(button(3),{[key]:true}));
    }
    if(interruption==='Menu')f.run('E=[];E[9]=true;P=[];P[3]=true;RE=[];ctl(0);');
    if(interruption==='non-play')f.run("mode='obj';E=[];P=[];P[3]=true;RE=[];ctl(0);");
    if(interruption==='blur')f.c.fireEvent('blur');
    if(interruption==='disconnect')f.c.fireEvent('gamepaddisconnected',{gamepad:{index:0}});
    if(interruption==='poll-loss')f.run('pad=null;E=[];P=[];RE=[];ctl(0);');
    assert.equal(f.c.state().shortcutHeld,false,interruption);
    f.run("menu=cgo=null;ov=0;mode='play';");
    f.c.run(button(14),button(3));assert.equal(f.c.state().shortcut,'house',interruption);
    f.c.run([],[],button(3));assert.equal(f.state().place,null,interruption);
    assert.equal(f.state().wood,1000,interruption);assert.equal(f.state().queued,0,interruption);
    f.run('S.sel=[worker];');farmShortcut(f.c);assert.equal(f.state().place?.k,'house',interruption+' allows a fresh shortcut press');
  }
});

test('Y pressed inside an RT wheel cannot become a build shortcut after the wheel closes',()=>{
  const f=buildFixture();f.run("ysc.vb='house';");
  f.c.run(button(7),button(7));
  f.c.run(button(3),Object.assign(button(7),{3:true}));
  f.c.run([],button(3),button(7));
  f.c.run([],[],button(3));
  assert.equal(f.state().place,null);assert.equal(f.state().wood,1000);
});

test('controller replacement while Y is held cannot train on release; a fresh LT+Y still trains five',()=>{
  const f=buildFixture();
  f.run(`
    const town={netId:'town',k:'tc',t:0,hp:100,done:true,q:[],x:4,y:4,s:3};S.bs=[town];S.sel=[town];
    pad.id='old';pad.index=0;pad.connected=true;
  `);
  f.c.run(button(3),button(3));
  f.run(`
    globalThis.replacement={id:'new',index:1,connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===3,value:i===3?1:0}))};
    navigator.getGamepads=()=>[replacement];readPad();playCtl(0);
    replacement.buttons[3]={pressed:false,value:0};readPad();playCtl(0);
  `);
  assert.equal(f.state().queued,0);assert.equal(f.state().food,1000);
  f.c.run(button(3),Object.assign(button(3),{6:true}));f.c.run([],button(6),button(3));
  assert.equal(f.state().queued,5);assert.equal(f.state().food,750);
});

test('hold Y plus D-pad Left changes a shortcut without executing it on release',()=>{
  const f=buildFixture();f.run("ysc.vb='house';");
  f.c.run(button(3),button(3));f.c.run(button(14),button(3));
  assert.equal(f.c.state().shortcut,'palisade');
  f.c.run([],[],button(3));assert.equal(f.state().place,null);assert.equal(f.state().wood,1000);
});

test('villager Y cycles only implemented Xbox shortcut buildings and wraps without placing or spending',()=>{
  const f=buildFixture();f.run("ysc.vb='house';");
  for(const expected of ['palisade','wall','farm','house','palisade','wall','farm','house']){
    f.c.run(button(3),button(3));f.c.run(button(14),button(3));
    assert.equal(f.c.state().shortcut,expected);
    f.c.run([],[],button(3));
    assert.equal(f.state().place,null);assert.equal(f.state().wood,1000);
  }
});

test('an obsolete villager shortcut cannot expose another building through Y',()=>{
  for(const obsolete of ['lumber','mine','mill','market','dock','gate','outpost','bar','rng','stable','siege','smith','univ','castle','tower','monastery','unknown']){
    const f=buildFixture();f.run('ysc.vb='+JSON.stringify(obsolete)+';');
    farmShortcut(f.c);
    assert.equal(f.c.state().shortcut,'house',obsolete);
    assert.equal(f.state().place?.k,'house',obsolete);
    assert.equal(f.state().wood,1000,obsolete);
  }
});


test('on-screen controller help matches centre-reticle, minimap and close controls',()=>{
  const uiSource=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
  const seen=[];
  const context={
    CW:1280,CH:720,S:{teamN:2},inf:'c',
    X:{fillRect(){},fillStyle:''},minimapDraw(){},
    tx:(label)=>seen.push(String(label))
  };
  const infoStart=uiSource.indexOf('function drawInfo2()');
  const infoEnd=uiSource.indexOf('/* Pause-menu model',infoStart);
  assert.ok(infoStart>=0&&infoEnd>infoStart,'controller help must be available to render');
  vm.runInNewContext(uiSource.slice(infoStart,infoEnd)+'\ndrawInfo2()',context);
  const help=seen.join('\n');
  assert.match(help,/Pan camera to aim the centre reticle/);
  assert.match(help,/Minimap cursor speed/);
  assert.match(help,/Camera speed changes normal panning/);
  assert.match(help,/B\/RB\/View closes/);
  assert.match(help,/View opens objectives; Menu pauses/);
  seen.length=0;
  const ovStart=uiSource.indexOf('const ovr=()=>');
  const ovEnd=uiSource.indexOf('/* Technology tree, objectives',ovStart);
  assert.ok(ovStart>=0&&ovEnd>ovStart,'minimap help must render');
  vm.runInNewContext(uiSource.slice(ovStart,ovEnd)+'\ndrawOv()',context);
  const overview=seen.join('\n');
  assert.match(overview,/LS: cursor/);
  assert.match(overview,/Y: focus/);
  assert.match(overview,/B \/ RB \/ View: close/);
  assert.match(uiSource,/\{n:'Minimap cursor speed'/,'options must distinguish the overview pointer from camera speed');
  assert.doesNotMatch(uiSource,/Nothing selected - left stick moves the cursor/);
});
