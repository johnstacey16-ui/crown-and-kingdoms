import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');

assert.match(engine, /let lastAutoSaveAt=-60000;/,
  'The autosave clock must start ready for the first active-play save');
assert.match(engine, /now-lastAutoSaveAt>=60000/,
  'Autosave must be triggered on a 60-second interval');
assert.match(engine, /saveG\(true\)/,
  'The periodic path must use the autosave save mode');
assert.match(engine, /!\(window\.CK_NET&&window\.CK_NET\.isRunning\(\)\)/,
  'Do not autosave a live multiplayer match as if it were a locally authoritative game');
assert.match(save, /const key=auto\?'ck_autosave':skey\(slot\)/,
  'Autosaves must use one stable rolling key, separate from manual slots');
assert.match(save, /localStorage\.setItem\(key,payload\)/,
  'A subsequent autosave must replace the previous payload under that same key');
assert.match(save, /loadG\(auto=false\)[\s\S]*?localStorage\.getItem\(auto\?'ck_autosave':skey\(slot\)\)/,
  'The loader must restore the rolling autosave when requested');

const pauseSource=engine.match(/function autoPause\(\)\{[^\n]+/)?.[0];
assert.ok(pauseSource,'Pause handler must exist');
for(const online of [false,true]){
  let saved=0,cancelled=0;
  const context={mode:'play',pm:7,window:{CK_NET:{isRunning:()=>online}},
    saveG:auto=>{assert.equal(auto,true);saved++;},
    cancelGameplayGestures:()=>cancelled++};
  const pause=vm.runInNewContext('('+pauseSource+')',context);
  pause();
  assert.equal(saved,online?0:1,'Only local games can autosave on blur/pause');
  assert.equal(cancelled,1,'Pausing must cancel pending controller gestures');
  assert.equal(context.mode,'pause');assert.equal(context.pm,0);
  pause();assert.equal(saved,online?0:1,'An already paused game must not save again');
}


console.log('Autosave policy checks passed.');
