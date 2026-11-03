/* Deterministic simulation checkpoints across independent production VM instances.
 * Tests same-engine reproducibility, not cross-browser or physical Xbox timing.
 * Save/load equivalence is intentionally strict: no prerelease migration required. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const protocol=readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');

function seededWorld(seed=123456){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+'\n'+protocol+'\n'+`
  seedOv=${seed};msz=0;kingdoms=2;cmp=null;gameMode=0;
  startAge=0;startRes=0;startArmy=0;start();
  globalThis.CHECKPOINT_TEST={
   hash:frame=>window.CK_SIM_SYNC.worldCheckpoint(S,frame).hash,
   advance:count=>{for(let i=0;i<count;i++)step(DT);return S.t;},
   save:()=>saveG(),
   load:()=>loadG(),
   rng:()=>S.r.state(),
   units:()=>S.us.length,
   resource:team=>({ ...S.res[team] }),
   primeReferences:()=>{
    const fort=S.bs.find(b=>b.t===0&&b.k==='tc'&&b.hp>0);
    const scout=S.us.find(u=>u.t===1&&u.k==='vil'&&u.hp>0);
    const guards=S.us.filter(u=>u.t===1&&u.hp>0).slice(0,2);
    const node=S.nodes.find(n=>n.amt>0);
    if(!fort||!scout||guards.length<2||!node)throw Error('Reference test world incomplete');
    const ai=S.ai[1];
    ai.kn=new Set([fort]);ai.wu=[scout];ai.ws=1;ai.on=1;
    ai.stg={t:S.t,tg:fort,siegeT:fort};
    ai.rd={t:S.t,u:guards};
    fort.rally={x:node.x,y:node.y,t:node};
    const archer=addU(0,'arc',Math.max(1,scout.x-3),scout.y);
    S.pj.push({x:Math.max(1,scout.x-2),y:scout.y,
     tx:scout.x,ty:scout.y,t:scout,a:archer});
    // A launched projectile can also outlive its original attacking entity.
    S.pj.push({x:Math.max(1,scout.x-3),y:scout.y,
     tx:scout.x,ty:scout.y,t:scout,a:{k:'arc',t:0}});
   },
   references:()=>{
    const ids=new Map([
     ...S.nodes.map((e,i)=>[e,'n'+i]),
     ...S.bs.map((e,i)=>[e,'b'+i]),
     ...S.us.map((e,i)=>[e,'u'+i])
    ]);
    const ref=e=>e?(ids.get(e)||null):null;
    return {
     time:S.t,rng:S.r.state(),netNext:S.netNext,
     ai:S.ai.slice(1).map(a=>({
      cd:a.cd,wave:a.wave,nx:a.nx,rn:a.rn,
      // Runtime may leave untouched optional cooldowns undefined; the
      // loader normalizes them to the documented gameplay defaults.
      gu:a.gu??0,lastMarketTrade:a.lastMarketTrade??-99,
      lastTributeAt:a.lastTributeAt??-90,
      lastRaidDefense:a.lastRaidDefense??-99,lastAllyHelp:a.lastAllyHelp??-99,
      lastBuildingRepair:a.lastBuildingRepair??-99,
      nextWaveObjectiveAt:a.nextWaveObjectiveAt??0,
      targetRetryAt:a.targetRetryAt??0,on:a.on||0,ws:a.ws||0,
      kn:[...(a.kn||[])].map(ref).sort(),wu:(a.wu||[]).map(ref),
      stg:a.stg?{t:a.stg.t,tg:ref(a.stg.tg),siegeT:ref(a.stg.siegeT)}:null,
      rd:a.rd?{t:a.rd.t,u:(a.rd.u||[]).map(ref)}:null
     })),
     rally:S.bs.map((b,i)=>b.rally?{id:i,x:b.rally.x,y:b.rally.y,target:ref(b.rally.t)}:null)
      .filter(Boolean),
     projectiles:S.pj.map(p=>({x:p.x,y:p.y,tx:p.tx,ty:p.ty,
      target:ref(p.t),owner:ref(p.a),attacker:p.a?{k:p.a.k,t:p.a.t}:null}))
    };
   },
   setAiTimers:values=>Object.assign(S.ai[1],values),
   aiTimers:()=>Object.fromEntries(['gu','lastAllyHelp','lastBuildingRepair','nextWaveObjectiveAt','targetRetryAt']
    .map(key=>[key,S.ai[1][key]])),
   oldSaveWithoutTimers:()=>{
    const key=skey(slot),payload=JSON.parse(localStorage.getItem(key));
    for(const field of ['gu','lastAllyHelp','lastBuildingRepair','nextWaveObjectiveAt'])delete payload.ai[1][field];
    localStorage.setItem(key,JSON.stringify(payload))
   }
  };
 `,sandbox,{filename:'seeded-world-continuation.js',timeout:15000});
 return sandbox.CHECKPOINT_TEST;
}

test('separate production simulations reproduce matching seeded state through multiple fixed ticks',()=>{
 const a=seededWorld(),b=seededWorld();
 for(const ticks of [0,1,9,30,60]){
  a.advance(ticks);b.advance(ticks);
  assert.equal(a.hash(ticks),b.hash(ticks),'seeded world diverged after '+ticks+' additional ticks');
  assert.equal(a.rng(),b.rng(),'RNG state diverged');
 }
 assert.ok(a.units()>0);
});

test('different map seeds do not silently collapse to the same state checksum',()=>{
 const a=seededWorld(123456),b=seededWorld(987654);
 assert.notEqual(a.hash(0),b.hash(0));
});

test('mid-match current-version save/load preserves the authoritative world checkpoint',()=>{
 const live=seededWorld(),reloaded=seededWorld();
 live.advance(50);reloaded.advance(50);
 const before=live.hash(50);
 assert.equal(reloaded.hash(50),before);
 assert.equal(reloaded.save(),true,'current match must save successfully');
 assert.equal(reloaded.load(),true,'current-build save must restore successfully');
 assert.equal(reloaded.hash(50),before,'load must preserve active gameplay state, not just unit count');
 for(const ticks of [1,12,37]){
  live.advance(ticks);reloaded.advance(ticks);
  assert.equal(reloaded.hash(50+ticks),live.hash(50+ticks),
   'save/load diverged after '+ticks+' resumed simulation ticks');
 }
});

test('AI tactical cooldowns survive real current-version save/load instead of silently resetting',()=>{
 const f=seededWorld();
 f.advance(50);
 const initial={gu:17.5,lastAllyHelp:25.25,lastBuildingRepair:28.75,
  nextWaveObjectiveAt:35.5,targetRetryAt:41.25};
 f.setAiTimers(initial);
 assert.deepEqual(JSON.parse(JSON.stringify(f.aiTimers())),initial);
 assert.equal(f.save(),true);
 assert.equal(f.load(),true);
 assert.deepEqual(JSON.parse(JSON.stringify(f.aiTimers())),initial,
  'AI garrison, allied help, repairs, idle-wave retarget and target retry preserve timing');
 assert.equal(f.save(),true);
 f.oldSaveWithoutTimers();
 assert.equal(f.load(),true,'older current-build saves without these optional fields remain valid');
 const restored=f.aiTimers();
 assert.equal(restored.gu,0);
 assert.equal(restored.lastAllyHelp,-99);
 assert.equal(restored.lastBuildingRepair,-99);
 assert.equal(restored.nextWaveObjectiveAt,0);
 assert.equal(restored.targetRetryAt,initial.targetRetryAt,
  'existing cooldown fields remain preserved when optional fields are missing');
});

function firstReferenceMismatch(expected,actual,path='$'){
 if(Object.is(expected,actual))return null;
 if(expected&&actual&&typeof expected==='object'&&typeof actual==='object'){
  const keys=[...new Set([...Object.keys(expected),...Object.keys(actual)])].sort();
  for(const key of keys){
   const mismatch=firstReferenceMismatch(expected[key],actual[key],
    path+(Array.isArray(expected)?'['+key+']':'.'+key));
   if(mismatch)return mismatch;
  }
  return null;
 }
 return path+': expected '+JSON.stringify(expected)+'; received '+JSON.stringify(actual);
}

test('live save/load preserves AI knowledge, staged orders, rally and in-flight projectile references',()=>{
 const live=seededWorld(),reloaded=seededWorld();
 live.advance(55);reloaded.advance(55);
 live.primeReferences();reloaded.primeReferences();
 const snapshot=world=>JSON.parse(JSON.stringify(world.references()));
 const check=(label,frame)=>{
  const expected=snapshot(live),actual=snapshot(reloaded);
  const difference=firstReferenceMismatch(expected,actual);
  assert.equal(difference,null,label+': '+difference);
  assert.equal(reloaded.hash(frame),live.hash(frame),
   label+': matched authoritative state hash');
 };
 check('before checkpoint',55);
 assert.equal(reloaded.save(),true);
 assert.equal(reloaded.load(),true);
 check('immediately after loading',55);
 for(const additional of [1,9,30,60]){
  live.advance(additional);reloaded.advance(additional);
  check('after '+additional+' further ticks',55+additional);
 }
});
