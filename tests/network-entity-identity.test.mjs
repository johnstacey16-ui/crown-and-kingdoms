import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { headlessGame } from './helpers/headless-game.mjs';

const {source, sandbox} = headlessGame();
const harness = `
globalThis.__NET_ID_TEST__ = {
  start() {
    seedOv=123456; msz=0; kingdoms=2; cmp=null; gameMode=0; start();
    return {ids:[...S.us,...S.bs].map(e=>e.netId),next:S.netNext};
  },
  compactAndSpawn() {
    const removed=S.us.shift().netId;
    const current=S.us[0];
    const newest=addU(current.t,current.k,current.x,current.y);
    return {removed,newest:newest.netId,ids:[...S.us,...S.bs].map(e=>e.netId),next:S.netNext};
  },
  saveAndReload() {
    const expected=[...S.us,...S.bs].map(e=>e.netId);
    const before=S.netNext;
    const saved=saveG(false), loaded=loadG(false);
    const actual=[...S.us,...S.bs].map(e=>e.netId);
    const newUnit=addU(0,'vil',S.us[0].x,S.us[0].y);
    return {saved,loaded,expected,actual,before,after:S.netNext,newId:newUnit.netId};
  },
  corrupt(mode) {
    const key=skey(slot), obj=JSON.parse(localStorage.getItem(key));
    if(mode==='duplicate')obj.us[1].netId=obj.us[0].netId;
    if(mode==='prefix')obj.us[0].netId='b999';
    if(mode==='highwater')obj.netNext=1;
    localStorage.setItem(key,JSON.stringify(obj));
    const old=S; return {accepted:loadG(false),preserved:S===old};
  },
  legacy() {
    const key=skey(slot), j=JSON.parse(localStorage.getItem(key));
    delete j.netNext;
    for(const e of [...j.us,...j.bs])delete e.netId;
    localStorage.setItem(key,JSON.stringify(j));
    const accepted=loadG(false);
    return {accepted,ids:[...S.us,...S.bs].map(e=>e.netId),next:S.netNext};
  }
};
`;
vm.runInNewContext(source+'\n'+harness, sandbox, {filename:'headless-network-entity-ids.js'});
const game = sandbox.__NET_ID_TEST__;

test('new seeded games allocate distinct immutable numeric IDs for units and buildings', () => {
  const s=game.start();
  assert.ok(s.ids.length>=4);
  assert.equal(new Set(s.ids).size,s.ids.length);
  assert.ok(s.ids.every(x=>/^[ub][1-9][0-9]*$/.test(x)));
  assert.ok(s.next>s.ids.length);
});

test('compacting entities never reuses a dead unit ID', () => {
  const s=game.compactAndSpawn();
  assert.ok(!s.ids.includes(s.removed));
  assert.ok(s.ids.includes(s.newest));
  assert.notEqual(s.removed,s.newest);
  assert.equal(new Set(s.ids).size,s.ids.length);
});

test('current save round trip preserves network IDs and high-water counter', () => {
  const s=game.saveAndReload();
  assert.equal(s.saved,true);
  assert.equal(s.loaded,true);
  assert.deepEqual(Array.from(s.actual), Array.from(s.expected));
  assert.ok(s.after>s.before);
  assert.equal(s.newId.slice(1),String(s.before));
});

test('corrupt duplicate IDs, forged prefixes and reused high-water counters fail closed', () => {
  for(const mode of ['duplicate','prefix','highwater']){
    game.saveAndReload(); // Fresh valid save snapshot on each iteration.
    const c=game.corrupt(mode);
    assert.equal(c.accepted,false,mode);
    assert.equal(c.preserved,true,mode);
  }
});

test('legacy current-version checkpoints without IDs get unique IDs when restored', () => {
  game.saveAndReload();
  const s=game.legacy();
  assert.equal(s.accepted,true);
  assert.equal(new Set(s.ids).size,s.ids.length);
  assert.ok(s.ids.every(x=>/^[ub][1-9][0-9]*$/.test(x)));
  assert.ok(s.next>s.ids.length);
});
