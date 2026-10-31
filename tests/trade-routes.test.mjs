import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const logistics=readFileSync(new URL('../js/simulation-logistics.js',import.meta.url),'utf8');
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
 assert.match(simulation, /if\(q\.k==='cart'\|\|q\.k==='cog'\)nu\.tradeFromKey=/,
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
