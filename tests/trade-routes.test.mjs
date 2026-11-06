import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const logistics=readFileSync(new URL('../js/simulation-logistics.js',import.meta.url),'utf8');
const buildingUpdates=readFileSync(new URL('../js/simulation-building-updates.js',import.meta.url),'utf8');
const {U,B}=vm.runInNewContext(config+'\n;({U,B})');
const start=logistics.indexOf('function tickTrader(u,dt){');
const end=logistics.length;
assert.ok(start>=0&&end>start,'Trade carts and cogs must retain their route simulator');
const traderSource=logistics.slice(start,end);

function setup(kind='cart'){
 const origin={t:0,k:kind==='cart'?'market':'dock',x:0,y:0,s:2,hp:100,done:true};
 const destination={t:1,k:origin.k,x:16,y:0,s:2,hp:100,done:true};
 const S={bs:[origin,destination],us:[],res:[{g:100},{g:100}],teamN:2};
 const messages=[];
 const context={
  S,U,isHostile:()=>false,
  d2:(x,y,b)=>Math.hypot(Math.max(b.x-x,0,x-(b.x+b.s)),Math.max(b.y-y,0,y-(b.y+b.s))),
  note:message=>messages.push(message),
  path:()=>{throw Error('An arrived trade route must not recalculate the path')},
  goalNear:()=>{throw Error('An arrived trade route must not recalculate the path')},
 };
 const tickTrader=vm.runInNewContext(traderSource+'\n;tickTrader;',context);
 const key=b=>[b.t,b.k,b.x,b.y].join(':');
 const trader={k:kind,t:0,x:1,y:1,o:'m',p:[],rp:0,tradeFromKey:key(origin),tradeDestKey:key(destination),
  tradeReturning:false,tradeCargo:0};
 return {S,origin,destination,trader,tickTrader,messages};
}

test('trade markets/docks and their traders remain present in the unit catalogue',()=>{
 assert.ok(B.market.tr.includes('cart'),'markets produce carts');
 assert.ok(B.dock.tr.includes('cog'),'docks produce trade cogs');
 assert.ok(U.cart&&U.cog,'trade units have definitions');
 assert.match(buildingUpdates, /if\(q\.k==='cart'\|\|q\.k==='cog'\)nu\.tradeFromKey=/,
  'trained merchants remember their producing depot');
});

test('carts earn route-distance-based gold only after the return delivery',()=>{
 const {S,trader,tickTrader,messages}=setup();
 trader.x=17;trader.y=1;
 tickTrader(trader,1/30);
 assert.equal(S.res[0].g,100,'outgoing leg must not immediately pay gold');
 assert.equal(trader.tradeCargo,6,'sixteen-tile route rounds to six gold');
 assert.equal(trader.tradeReturning,true);
 trader.x=1;trader.y=1;
 tickTrader(trader,1/30);
 assert.equal(S.res[0].g,106,'the trade owner receives the earned gold');
 assert.equal(trader.tradeCargo,0,'delivered cargo is cleared');
 assert.equal(trader.tradeReturning,false,'route repeats');
 assert.ok(messages.some(message=>message.includes('6 gold')),'gold delivery is reported');
});

test('trade cogs use dock endpoints and complete valid voyages',()=>{
 const {S,trader,tickTrader}=setup('cog');
 trader.x=17;trader.y=1;tickTrader(trader,1/30);
 assert.equal(trader.tradeCargo,6);
 trader.x=1;trader.y=1;tickTrader(trader,1/30);
 assert.equal(S.res[0].g,106);
});

test('trade deliveries refuse invalid cargo or unsafe integer overflow',()=>{
 const {S,trader,tickTrader}=setup();
 S.res[0].g=Number.MAX_SAFE_INTEGER-2;
 trader.tradeReturning=true;
 trader.tradeCargo=8;
 tickTrader(trader,1/30);
 assert.equal(S.res[0].g,Number.MAX_SAFE_INTEGER-2,'overflow must not create unsafe resource totals');
 assert.equal(trader.tradeCargo,0,'invalid payout is discarded rather than duplicated');
 trader.tradeCargo=-5;
 trader.tradeReturning=true;
 tickTrader(trader,1/30);
 assert.equal(S.res[0].g,Number.MAX_SAFE_INTEGER-2,'negative cargo cannot subtract or grant gold');
});

test('player trade routes pause rather than silently replace a destroyed destination',()=>{
 const {S,destination,trader,tickTrader}=setup();
 destination.hp=0;
 tickTrader(trader,1/30);
 assert.equal(S.res[0].g,100);
 assert.equal(trader.tradePaused,true);
 assert.equal(trader.tradeDestKey,null);
 assert.equal(trader.o,'i');
});
test('trade deliveries preserve fractional gold already earned from gathering or relics',()=>{
 for(const kind of ['cart','cog']){
  const {S,trader,tickTrader}=setup(kind);S.res[0].g=100.125;
  trader.x=17;tickTrader(trader,1/30);trader.x=1;tickTrader(trader,1/30);
  assert.equal(S.res[0].g,106.125);assert.equal(trader.tradeCargo,0);
 }
});


function rallyWorld(kind='cart',group=false){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const run=code=>vm.runInContext(code,sandbox);
 run(`kingdoms=2;startAge=3;start();S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(${kind==='cog'?1:0});S.ex.fill(1);S.vs.fill(1);setDiplomacy(0,1,'neutral');
  globalThis.homes=[addB(0,'${kind==='cog'?'dock':'market'}',20,20,true)];${group?"homes.push(addB(0,'"+(kind==='cog'?'dock':'market')+"',20,34,true));":''}
  globalThis.partner=addB(1,'${kind==='cog'?'dock':'market'}',44,26,true);if('${kind}'==='cog')for(const b of S.bs)for(let y=b.y;y<b.y+b.s;y++)for(let x=b.x;x<b.x+b.s;x++)S.wt[y*W+x]=0;S.res[0]={f:1000,w:1000,g:1000,s:1000};S.sel=homes.slice();
  globalThis.produce=()=>{for(const b of homes){if(!train(b,'${kind}'))throw Error('Training rejected');upB(b,U['${kind}'].t+1)}};
  globalThis.advance=n=>{for(let i=0;i<n;i++)for(const u of S.us)upU(u,1/30)};
 `);
 return {run};
}
for(const kind of ['cart','cog']){
 test(kind+' follows a production ground rally and remains idle at its destination',()=>{
  const f=rallyWorld(kind);f.run('orderSel(null,32.5,32.5);produce();advance(2400)');
  assert.equal(f.run("S.us[0].o==='i'&&Math.hypot(S.us[0].x-32.5,S.us[0].y-32.5)<2.2"),true);
  assert.equal(f.run('S.us[0].tradePaused'),true);assert.equal(f.run('S.us[0].tradeDestKey||null'),null);
 });
 test(kind+' group production rally starts paid trade from each producing depot and restores saved targets',()=>{
  const f=rallyWorld(kind,true);f.run('orderSel(partner,partner.x+1,partner.y+1)');
  assert.equal(f.run('homes.every(b=>b.rally.t===partner)'),true);
  f.run('produce()');assert.equal(f.run('S.us.length'),2);
  assert.equal(f.run("S.us.every((u,i)=>u.tradeFromKey===[0,homes[i].k,homes[i].x,homes[i].y].join(':')&&u.tradeDestKey===[1,partner.k,partner.x,partner.y].join(':'))"),true);
  const paidGold=f.run('S.res[0].g'),partnerGold=f.run('S.res[1].g');assert.equal(paidGold,f.run(`1000-2*(U['${kind}'].cost.g||0)`));
  assert.equal(f.run('S.res[0].w'),f.run(`1000-2*(U['${kind}'].cost.w||0)`));
  f.run('for(let i=0;i<3600&&!S.us.some(u=>u.tradeReturning);i++)advance(1)');
  assert.equal(f.run('S.res[0].g'),paidGold,'outgoing cargo is not paid until delivered home');
  assert.equal(f.run('saveG()&&loadG()'),true);
  assert.equal(f.run("S.bs.filter(b=>b.t===0).every(b=>b.rally.t===S.bs.find(q=>q.t===1))"),true);
  f.run('advance(6000)');assert.ok(f.run('S.res[0].g')>paidGold);assert.equal(f.run('S.res[1].g'),partnerGold,'partner resources are not charged');
 });
}

test('trade rally dispatch rechecks ownership, life, completion, world membership and reachability',()=>{
 for(const kind of ['cart','cog'])for(const change of ["partner.hp=0","partner.done=false","partner.t=0","setDiplomacy(0,1,'enemy')","S.bs=S.bs.filter(b=>b!==partner)","for(let y=0;y<H;y++)for(let x=34;x<38;x++)S.wt[y*W+x]="+(kind==='cog'?'0':'1')]){
  const f=rallyWorld(kind);f.run('orderSel(partner,45,27);'+change+';produce();advance(1200)');
  assert.equal(f.run('S.us[0].tradeDestKey||null'),null,kind+' '+change);
  assert.equal(f.run('S.us[0].tradeCargo||0'),0);assert.equal(f.run('S.res[0].g'),f.run(`1000-(U['${kind}'].cost.g||0)`));
 }
});


test('trade-rally saves reject unit, unrelated building and out-of-range references before world replacement',()=>{
 const f=rallyWorld();f.run("addB(0,'house',10,10,true);orderSel(partner,45,27);produce();saveG()");
 const results=f.run(`(()=>{const original=JSON.parse(localStorage.getItem(skey(slot))),before=JSON.stringify([S.us,S.bs.map(b=>[b.netId,b.hp,b.rally&&b.rally.t?.netId])]);return ['u0','b2','b999','n999','r0'].map(ref=>{const payload=JSON.parse(JSON.stringify(original));payload.bs[0].rally.t=ref;localStorage.setItem(skey(slot),JSON.stringify(payload));return !loadG()&&JSON.stringify([S.us,S.bs.map(b=>[b.netId,b.hp,b.rally&&b.rally.t?.netId])])===before})})()`);
 assert.ok(Array.from(results).every(Boolean));
});

test('direct merchant commands retain explicit routing to reachable neutral and allied depots',()=>{
 for(const kind of ['cart','cog'])for(const relation of ['neutral','ally']){
  const f=rallyWorld(kind);f.run(`setDiplomacy(0,1,'${relation}');produce();S.sel=S.us.slice();orderSel(partner,45,27)`);
  assert.equal(f.run("S.us[0].tradeDestKey===[1,partner.k,partner.x,partner.y].join(':')&&!S.us[0].manualTradeMove&&!S.us[0].tradePaused"),true);
  const paid=f.run('S.res[0].g');f.run('advance(6000)');assert.ok(f.run('S.res[0].g')>paid);
 }
});
