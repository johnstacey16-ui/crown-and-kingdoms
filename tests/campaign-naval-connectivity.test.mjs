import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const source=readFileSync(new URL('../js/campaign.js',import.meta.url),'utf8');
const snippet=source.slice(source.indexOf('function campaignWaterRegions('),source.indexOf('\nfunction raid(n,'));
const D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
function map(){
 const W=40,H=40,S={wt:new Uint8Array(W*H),nd:Array(W*H).fill(null),bs:[],us:[]};
 const context={W,H,S,D8,U:{gal:{sh:1}}};vm.createContext(context);vm.runInContext(snippet,context);
 const water=(x0,y0,x1,y1,kind=1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)S.wt[y*W+x]=kind};
 return {W,H,S,context,water};
}
test('fleets use the same main water body even when a closer pond lies within the old 18-tile cutoff',()=>{
 const f=map();f.water(2,2,5,5);f.water(23,23,38,38);
 const before=JSON.stringify(f.S),a={x:1,y:1,s:3},b={x:35,y:2,s:3};
 const first=f.context.raidShipPositions(a,3,0),second=f.context.raidShipPositions(b,3,1);
 assert.equal(first.length,3);assert.equal(second.length,3);
 const regions=f.context.campaignWaterRegions();assert.equal(regions.sizes[regions.largest],225);
 for(const p of [...first,...second])assert.equal(regions.labels[(p[1]|0)*f.W+(p[0]|0)],regions.largest);
 assert.deepEqual(f.context.raidShipPositions(a,3,0),first,'selection is deterministic');
 assert.equal(JSON.stringify(f.S),before,'placement search never changes the world');
});
test('water regions match ship corner rules, shallow passages and changed resource occupancy',()=>{
 const f=map();f.water(2,2,3,3);f.water(3,3,4,4);
 let r=f.context.campaignWaterRegions();assert.notEqual(r.labels[2*f.W+2],r.labels[3*f.W+3]);
 f.water(3,2,4,3,2);r=f.context.campaignWaterRegions();
 assert.equal(r.labels[2*f.W+2],r.labels[3*f.W+3],'a real shallow passage joins the regions');
 f.S.nd[2*f.W+3]={fi:1};r=f.context.campaignWaterRegions();
 assert.notEqual(r.labels[2*f.W+2],r.labels[3*f.W+3],'resource obstacles close the passage immediately');
 f.S.nd[2*f.W+3]=null;r=f.context.campaignWaterRegions();
 assert.equal(r.labels[2*f.W+2],r.labels[3*f.W+3],'harvesting reopens it without a stale cache');
});
test('campaign docks must touch the main navigable region and naval slots respect living occupancy',()=>{
 const f=map();f.water(2,2,5,5);f.water(23,23,38,38);
 const regions=f.context.campaignWaterRegions();
 assert.equal(f.context.campaignDockAccess(5,2,2,regions),false);
 assert.equal(f.context.campaignDockAccess(21,25,2,regions),true);
 const anchor={x:20,y:25,s:2},first=f.context.raidShipPositions(anchor,1,0)[0];
 f.S.us.push({k:'gal',x:first[0],y:first[1],hp:100});
 const next=f.context.raidShipPositions(anchor,1,0)[0];assert.notDeepEqual(next,first);
 f.S.us[0].hp=0;assert.deepEqual(f.context.raidShipPositions(anchor,1,0)[0],first);
 f.S.wt.fill(0);assert.equal(f.context.raidShipPositions(anchor,4,0).length,0);
});
for(const mission of [12,13])test('production coastal mission '+(mission+1)+' opens with mutually reachable fleets and a usable enemy dock',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.run=code=>eval(code);',sandbox);
 const result=JSON.parse(sandbox.run(`startScenario(${mission});const regions=campaignWaterRegions(),ships=S.us.filter(u=>u.hp>0&&u.k==='gal');const player=ships.find(u=>u.t===0);JSON.stringify({count:ships.length,player:ships.filter(u=>u.t===0).length,enemy:ships.filter(u=>u.t===1).length,main:regions.sizes[regions.largest],allMain:ships.every(u=>regions.labels[(u.y|0)*W+(u.x|0)]===regions.largest),allReachable:ships.every(u=>!!path(player,gp(u.x,u.y,.1))),enemyDock:S.bs.some(b=>b.t===1&&b.k==='dock'&&campaignDockAccess(b.x,b.y,b.s,regions,4)&&!!spawnPos(b)),saved:saveG(),loaded:loadG(),postLoadMain:campaignWaterRegions().sizes[campaignWaterRegions().largest]})`));
 assert.equal(result.player,mission===12?2:3);assert.equal(result.enemy,3);
 assert.ok(result.main>1000);assert.equal(result.allMain,true);assert.equal(result.allReachable,true);assert.equal(result.enemyDock,true);assert.equal(result.saved,true);assert.equal(result.loaded,true);assert.equal(result.postLoadMain,result.main);
});

test('mixed campaign raids add distinct ships on the same sea with real attack routes',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.run=code=>eval(code);',sandbox);
 const result=JSON.parse(sandbox.run(`startScenario(12);const prior=new Set(S.us.map(u=>u.netId));raid(3,['gal','scout','gal'],'Naval regression');const added=S.us.filter(u=>!prior.has(u.netId)&&u.sh),regions=campaignWaterRegions(),player=S.us.find(u=>u.t===0&&u.k==='gal');JSON.stringify({count:added.length,distinct:new Set(added.map(u=>(u.y|0)*W+(u.x|0))).size,allMain:added.every(u=>regions.labels[(u.y|0)*W+(u.x|0)]===regions.largest),allOrdered:added.every(u=>u.o==='a'&&u.tg?.t===0),allReachable:added.every(u=>!!path(u,gp(player.x,player.y,.1)))})`));
 assert.equal(result.count,2);assert.equal(result.distinct,2);
 assert.equal(result.allMain,true);assert.equal(result.allOrdered,true);assert.equal(result.allReachable,true);
});
