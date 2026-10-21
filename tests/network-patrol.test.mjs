import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(team=0,naval=false){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 const modules=['network-sync','network-commands','network-unit-map'].map(n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 vm.runInContext(source+'\n'+modules+`\n
 seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;
 startAge=1;startArmy=0;startRes=3;start();snd=0;S.humanTeams=[0,1];S.us=[];
 S.nodes=S.nodes.filter(n=>!(n.x>=18&&n.x<42&&n.y>=18&&n.y<42));
 for(let y=18;y<42;y++)for(let x=18;x<42;x++){const i=y*W+x;S.g[i]=S.gt[i]=0;S.wt[i]=${naval?1:0};S.nd[i]=null;}
 globalThis.ranks=[addU(${team},'${naval?'gal':'mil'}',23.5,24.5),addU(${team},'${naval?'gal':'mil'}',25.5,24.5)];ranks.forEach(u=>u.st=4);
 globalThis.run=code=>eval(code);
 globalThis.act=order=>CK_GAME_COMMANDS.execute(order,${team},1);
 globalThis.ids=ranks.map(u=>u.netId);
 globalThis.hash=()=>CK_SIM_SYNC.worldCheckpoint(S,1).hash;
 `,sandbox);
 return sandbox;
}
for(const team of [0,1])for(const naval of [false,true])for(const type of ['patrol','attack-move'])test(`${type} executes for team ${team} ${naval?'warships':'soldiers'} and follows its arrival policy`,()=>{
 const c=fixture(team,naval),ids=Array.from(c.ids),origin=c.run('JSON.stringify(ranks.map(u=>[u.x,u.y]))');
 assert.equal(c.act({type,entities:ids,point:{x:30.5,y:25.5}}),true);
 assert.equal(c.run('JSON.stringify(ranks.map(u=>[u.x,u.y]))'),origin,'order never teleports');
 assert.equal(c.run('ranks.every(u=>u.o===\'p\'&&u.p.length>0&&u.pt.once==='+String(type==='attack-move')+')'),true);
 // Exercise production tickU/walk at arrival without waiting for travel time.
 c.run('ranks[0].x=30.5;ranks[0].y=25.5;ranks[0].p=[];upU(ranks[0],DT)');
 assert.equal(c.run('ranks[0].pt===null'),type==='attack-move');
 if(type==='patrol'){
  assert.equal(c.run('ranks[0].pt.to'),0);
  c.run('ranks[0].x=23.5;ranks[0].y=24.5;ranks[0].p=[];upU(ranks[0],DT)');
  assert.equal(c.run('ranks[0].pt.to'),1,'patrol repeats its outbound leg');
 }
});

test('patrol validates strict points, ownership, military eligibility and atomic routes',()=>{
 const c=fixture(),ids=Array.from(c.ids),point={x:30.5,y:25.5};
 for(const order of [
  {type:'patrol',entities:ids},
  {type:'patrol',entities:ids,point:{x:NaN,y:25}},
  {type:'patrol',entities:ids,point:{x:-1,y:25}},
  {type:'patrol',entities:ids,point:{x:30,y:25},target:ids[0]},
  {type:'patrol',entities:[ids[0],ids[0]],point}
 ]){const before=c.hash();assert.equal(c.act(order),false);assert.equal(c.hash(),before);}
 for(const setup of ["ranks[1].t=1","ranks[1].hp=0","ranks[1].ld=S.bs[0]","ranks[1].k='vil'","ranks[1].k='king'","ranks[1].x=NaN"]){
  const d=fixture();d.run(setup);const before=d.hash();assert.equal(d.act({type:'patrol',entities:Array.from(d.ids),point}),false);assert.equal(d.hash(),before);
 }
 c.run('globalThis.originalPath=path;path=(u,g)=>u===ranks[1]?null:originalPath(u,g)');
 const before=c.hash();assert.equal(c.act({type:'patrol',entities:ids,point}),false);assert.equal(c.hash(),before,'no partial mutation');
});

test('RT military ground targeting submits only after confirmation, with cancellation and pending guards',()=>{
 const c=fixture(),orders=[],description={textContent:''},canvas={style:{},setAttribute(){},addEventListener(){},focus(){},getContext:()=>new Proxy({},{get:()=>()=>{}})};
 const map=c.CK_UNIT_MAP.create({canvas,description,submit:o=>{orders.push(o);return{ok:true}},leave(){}});
 c.map=map;c.run('map.refresh(S,0,W,H,true)');map.choose({x:23.5,y:24.5});
 const before=c.hash();
 // Stop, Garrison, Patrol, Attack Move: stick selects each sector.
 const arm=index=>{map.control({7:true},{7:true});const a=index*Math.PI/2;map.control({}, {7:true},[Math.cos(a-Math.PI/2),Math.sin(a-Math.PI/2)]);map.control({0:true},{7:true,0:true});map.control({},{});};
 arm(2);assert.match(description.textContent,/ground destination/);assert.equal(orders.length,0);
 map.choose({x:30.5,y:25.5});assert.equal(orders[0].type,'patrol');assert.equal(orders[0].target,undefined);assert.equal(c.hash(),before);
 c.run('map.refresh(S,0,W,H,true)');arm(3);map.control({1:true},{1:true});map.control({},{});map.choose({x:23.5,y:24.5});
 assert.equal(orders.length,1,'B cancels without sending a move');
 map.choose({x:23.5,y:24.5});arm(3);c.run('map.refresh(S,0,W,H,false)');map.choose({x:31,y:25});assert.equal(orders.length,1);
 c.run('map.refresh(S,0,W,H,true)');map.choose({x:23.5,y:24.5});arm(3);map.choose({x:31,y:25});assert.equal(orders.at(-1).type,'attack-move');
 assert.equal(c.hash(),before,'menu and targeting never mutate simulation');
});

test('patrol engages a hostile unit and resumes the route after that target dies',()=>{
 const c=fixture();
 c.run("ranks[0].st=0;globalThis.enemy=addU(1,'mil',25.5,25.5)");
 assert.equal(c.act({type:'patrol',entities:[c.ids[0]],point:{x:32.5,y:26.5}}),true);
 c.run('upU(ranks[0],DT)');assert.equal(c.run('ranks[0].o'),'a');assert.equal(c.run('ranks[0].tg===enemy'),true);
 c.run('enemy.hp=0;upU(ranks[0],DT)');assert.equal(c.run('ranks[0].o'),'p');assert.equal(c.run('ranks[0].pt.once'),false);
});

test('current saves restore both patrol endpoints and the repeating leg',()=>{
 const c=fixture(1);
 assert.equal(c.act({type:'patrol',entities:Array.from(c.ids),point:{x:30.5,y:25.5}}),true);
 const prior=c.run('JSON.stringify(ranks.map(u=>u.pt))');
 assert.equal(c.run('saveG()'),true);assert.equal(c.run('loadG()'),true);
 assert.equal(c.run(`JSON.stringify(S.us.filter(u=>${JSON.stringify(Array.from(c.ids))}.includes(u.netId)).map(u=>u.pt))`),prior);
});
