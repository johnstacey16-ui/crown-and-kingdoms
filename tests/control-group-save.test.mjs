import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);vm.runInContext(source,sandbox);
 vm.runInContext(`
  seedOv=123456;kingdoms=2;msz=0;mt=3;cmp=null;startVillagers=1;startArmy=0;start();
  const town=S.bs.find(b=>b.t===0&&b.k==='tc');
  const own=S.us.filter(u=>u.t===0&&u.k==='vil'),free=own[0],loaded=own[1];
  loaded.ld=town;town.cg=[loaded];
  S.cg=[];S.cg[0]=[free,town];S.cg[7]=[loaded];
  globalThis.groupState=()=>JSON.stringify(S.cg.map(group=>({
    ids:group.map(e=>e.netId),available:controlGroupMembers(group).map(e=>e.netId),
    linked:group.every(e=>S.us.includes(e)||S.bs.includes(e))
  })));
  globalThis.snapshot=auto=>{
    const before=groupState(),saved=saveG(auto),key=auto?'ck_autosave':skey(slot);
    return {before,saved,key,raw:localStorage.getItem(key)};
  };
  globalThis.restore=auto=>{
    const old=S;S.cg=[];cgo={sel:2,done:0};aDown={x:1,y:2};boxR={};yc=1;lastTap=99;lastTapK='vil';
    const loaded=loadG(auto);
    return {loaded,newWorld:S!==old,groups:groupState(),transient:cgo===null&&aDown===null&&boxR===null&&yc===0&&lastTap===0&&lastTapK===null};
  };
 `,sandbox);
 return {context:sandbox,run:code=>vm.runInContext(code,sandbox)};
}

for(const auto of [false,true])test((auto?'autosave':'manual save')+' restores group slots, real entity references and garrison availability',()=>{
 const f=fixture(),saved=f.context.snapshot(auto),raw=JSON.parse(saved.raw);
 assert.equal(saved.saved,true);assert.equal(raw.controlGroups.length,8);
 assert.deepEqual(raw.controlGroups.slice(1,7),Array.from({length:6},()=>[]));
 const result=f.context.restore(auto);assert.equal(result.loaded,true);assert.equal(result.newWorld,true);
 assert.equal(result.transient,true,'old radial/selection gesture cannot act on the restored world');
 const groups=JSON.parse(result.groups);
 assert.deepEqual(groups[0].ids,JSON.parse(saved.before)[0].ids);
 assert.deepEqual(groups[7].ids,JSON.parse(saved.before)[7].ids);
 assert.equal(groups.every(g=>g.linked),true);assert.deepEqual(groups[7].available,[]);
 f.run('loaded.ld=null;town.cg=[];'); // Old objects cannot change the restored world.
 assert.deepEqual(JSON.parse(f.context.groupState())[7].available,[]);
 f.run('const restored=S.cg[7][0];restored.ld.cg=[];restored.ld=null;');
 assert.deepEqual(JSON.parse(f.context.groupState())[7].available,groups[7].ids);
});

test('serialization removes duplicates and unavailable world/ownership references without mutating assigned groups',()=>{
 const f=fixture();f.run(`
  const enemy=S.us.find(u=>u.t===1),dead=own[2],stale={...free};
  dead.hp=0;S.cg[0]=[free,free,town,enemy,dead,stale];
 `);
 const saved=f.context.snapshot(false);assert.equal(saved.saved,true);
 assert.equal(f.run('S.cg[0].length'),6,'saving must not rewrite assigned groups');
 const raw=JSON.parse(saved.raw);assert.equal(raw.controlGroups[0].length,2);
 assert.equal(f.context.restore(false).loaded,true);
 assert.equal(JSON.parse(f.context.groupState())[0].ids.length,2);
});

test('group references survive entity compaction and old current-version saves start with empty slots',()=>{
 const f=fixture();f.run('S.us=S.us.filter(u=>u!==own[2]);');
 const saved=f.context.snapshot(false);assert.equal(f.context.restore(false).loaded,true);
 assert.deepEqual(JSON.parse(f.context.groupState())[0].ids,JSON.parse(saved.before)[0].ids);
 f.context.rawWithoutGroups=JSON.stringify((({controlGroups,...rest})=>rest)(JSON.parse(saved.raw)));
 f.run('localStorage.setItem(skey(slot),rawWithoutGroups);');
 assert.equal(f.context.restore(false).loaded,true);
 assert.deepEqual(JSON.parse(f.context.groupState()).map(g=>g.ids),Array.from({length:8},()=>[]));
});

test('malformed or forged control groups fail before replacing the current world',()=>{
 const f=fixture(),saved=f.context.snapshot(false),base=JSON.parse(saved.raw);
 const enemyIndex=base.us.findIndex(u=>u.t===1),ownRef=base.controlGroups[0][0];
 for(const groups of [null,{},Array.from({length:9},()=>[]),[null],['u0'],[[null]],
   [[ownRef,ownRef]],[['n0']],[['r0']],[['u999999']],[['u-1']],[['u01']],[["u"+enemyIndex]]]){
  f.context.badSave=JSON.stringify({...base,controlGroups:groups});
  const result=f.run(`(()=>{const before=S,groups=S.cg;localStorage.setItem(skey(slot),badSave);return {accepted:loadG(false),same:S===before&&S.cg===groups};})()`);
  assert.equal(result.accepted,false,JSON.stringify(groups));assert.equal(result.same,true);
 }
});
