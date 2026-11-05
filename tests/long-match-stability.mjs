// Bounded synthetic destruction/cache soak, not a natural AI match or FPS test.
// AI is disabled only in this fixture so all seeds reach the full 30 minutes.
// Production damage, fixed-step cleanup, particles, sprite LRU and saves execute.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

for (const [seed,map] of [[117,0],[90210,3],[7331,5]]) {
 const {source,sandbox}=headlessGame();
 const context=vm.createContext(sandbox);
 vm.runInContext(source,context,{timeout:15000});
 sandbox.fixtureOptions={seed,map};
 vm.runInContext(`
 restoreCampaignPrefs();cmp=null;seedOv=fixtureOptions.seed;mt=fixtureOptions.map;
 kingdoms=2;msz=0;mapLayout=0;gameMode=0;startAge=0;startArmy=0;vm=0;
 start();seedOv=null;
 ai=()=>{};
 // Retain valid settlements and one idle attacker; destruction targets below
 // are explicit test fixtures, never mission objectives or victory evidence.
 S.us=[];
 let attacker=addU(0,'ram',10,10);
 const site=(()=>{for(let y=2;y<H-3;y++)for(let x=2;x<W-3;x++)
   if(!S.g[y*W+x]&&!S.g[y*W+x+1]&&!S.g[(y+1)*W+x]&&!S.g[(y+1)*W+x+1]
     &&S.wt[y*W+x]===0)return {x,y};throw Error('No fixture site')})();
 globalThis.soakCounts={buildings:0,units:0,sprites:0,reloads:0};
 globalThis.destroyBatch=()=>{
   const building=addB(1,'house',site.x,site.y,true);
   while(building.hp>0)dmgT(attacker,building);
   soakCounts.buildings++;
   for(let i=0;i<4;i++){
     const unit=addU(1,'mil',site.x,site.y);unit.hp=1;
     dmgT(attacker,unit);soakCounts.units++;
   }
   // Distinct frames force real LRU turnover instead of a constant cache hit.
   for(let i=0;i<4;i++)spr('soak-'+soakCounts.sprites++,32,32,g=>g.fillRect(0,0,8,8));
 };
 globalThis.advanceSoak=seconds=>{
   for(let i=0;i<seconds*30;i++){
     gt+=1/30;step(1/30);updP(1/30);
   }
   return {seconds:S.t,over:S.over,units:S.us.length,buildings:S.bs.length,
     fx:fx.length,particles:PT.length,particleLimit:PMAX[gq],corpses:corp.length,
     rubble:rub.length,rubbleLimit:RUBBLE_LIMIT,
     oldestRubble:rub.length?Math.max(...rub.map(q=>gt-q.t)):0,
     spritePixels:SPC_PIXELS,spriteLimit:SPC_PIXEL_LIMIT,spriteEntries:SPC.size,
     actualPixels:[...SPC.values()].reduce((sum,c)=>sum+c.width*c.height,0),
     invalid:S.us.concat(S.bs).filter(e=>![e.x,e.y,e.hp].every(Number.isFinite)).length,
     counts:{...soakCounts}};
 };
 globalThis.roundTrip=()=>{
   if(!saveG())throw Error('Soak save failed');
   const before=localStorage.getItem(skey(slot));
   if(!loadG()||!saveG())throw Error('Soak reload failed');
   const after=localStorage.getItem(skey(slot));soakCounts.reloads++;
   // loadG reconstructs entities; reacquire the attacker instead of retaining
   // an obsolete object across subsequent destruction cycles.
   attacker=S.us.find(u=>u.netId===attacker.netId);
   if(!attacker)throw Error('Reload lost fixture attacker');
   return {before:JSON.parse(before),after:JSON.parse(after)};
 };
 `,context);
 let state=sandbox.advanceSoak(0),baselineBuildings=state.buildings;
 for(let cycle=0;cycle<360;cycle++) {
  sandbox.destroyBatch();
  state=sandbox.advanceSoak(5);
  assert.equal(state.over,null,'fixture must remain active for the full duration');
  assert.equal(state.invalid,0,'finite entity state');
  assert.equal(state.units,1,'dead unit records are removed each cycle');
  assert.equal(state.buildings,baselineBuildings,'dead buildings do not accumulate');
  assert.equal(state.fx,0,'hit effects expire between destruction batches');
  assert.equal(state.particles,0,'particles expire via the production presentation clock');
  assert.ok(state.corpses<=60,'corpse records stay capped');
  assert.ok(state.rubble<=state.rubbleLimit&&state.oldestRubble<=41,'rubble expires on the one-second cadence');
  assert.ok(state.spritePixels<=state.spriteLimit,'sprite cache stays within its pixel budget');
  assert.equal(state.spritePixels,state.actualPixels,'LRU accounting matches retained canvases');
  if(cycle===179||cycle===359) {
   const {before,after}=sandbox.roundTrip();
   for(const field of ['t','rngState','res','age','tech','us','bs','nodes','rel','wt','dip','pj'])
    assert.deepEqual(after[field],before[field],'extended-play reload preserves '+field);
  }
 }
 state=sandbox.advanceSoak(45);
 assert.equal(state.rubble,0,'quiet tail drains all rubble');
 assert.equal(state.fx+state.particles,0,'quiet tail drains transient effects');
 assert.equal(state.counts.buildings,360);
 assert.equal(state.counts.units,1440);
 assert.equal(state.counts.reloads,2);
 assert.ok(state.spriteEntries<state.counts.sprites,'cache churn actually evicts frames');
 assert.ok(Math.abs(state.seconds-1845)<1e-6,'all 55,350 fixed steps execute');
 console.log('stability-result: '+JSON.stringify({seed,map,...state,
   scope:'synthetic production-lifecycle soak; no AI victory, browser heap or Xbox FPS claim'}));
}
