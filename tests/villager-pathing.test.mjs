import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/pathfinding.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

assert.match(html, /function autoNodeKey\(n\)\{return n\.k\+':'\+n\.x\+':'\+n\.y\}/,
  'Unreachable nodes must be remembered with a serializable location key, not object references');
assert.match(html, /function skipAutoNode\(u,n\)\{[\s\S]{0,260}u\.autoSkipNodes\.push\(key\)/,
  'Failed automatic routes must be remembered so retry does not select the same node repeatedly');
assert.match(html, /function findReachableAutoNode\(u,k,r=36\)\{[\s\S]{0,700}const route=path\(u,goalNear\(n,1\)\)/,
  'Automatic resource selection must verify a path exists before assigning the target');
assert.match(html, /if\(route&&route\.length\)return \{n,route\}/,
  'Reachable automatic targets must return the path to avoid an immediate second failed lookup');
assert.match(html, /if\(\+\+failed>=2\)break/,
  'At most two failed routes may be checked per retry to limit pathfinding cost');
assert.match(html, /function assignAutoVillager\(u,force=false\)\{[\s\S]{0,1500}findReachableAutoNode\(u,k,36\)/,
  'New/reassigned automated villagers must use route-aware resource selection');
assert.match(html, /u\.p=found\.route;u\.pt=null;u\.ret=0;u\.rp=1;u\.autoWorker=1;return true/,
  'An automatically assigned villager must retain the already verified route');
assert.match(html, /const a=u\.autoWorker&&u\.t===0\?findReachableAutoNode\(u,u\.ct,36\):null,n=a\?a\.n:\(!u\.autoWorker\?findNode\(u,u\.ct\):null\)/,
  'Automatically controlled villagers must use route-aware reassignment when a node depletes');
assert.match(html, /if\(!p\)\{if\(u\.t===0&&u\.autoWorker\)skipAutoNode\(u,tg\);u\.o='i'/,
  'A route that becomes invalid after assignment must be skipped by the next automatic attempt');
assert.match(html, /for\(const u of us\)\{u\.p=\[\];u\.pt=null;u\.as=0;u\.autoWorker=0;/,
  'Manual unit orders must still disable worker automation override');
assert.match(html, /function stopSel\(\)\{for\(const u of S\.sel\)if\(!u\.q\)\{u\.o='i';u\.p=\[\];u\.tg=null;u\.pt=null;u\.autoWorker=0;/,
  'Manual Stop must still leave an automated villager under player control');
console.log('villager-pathing: all 11 source regression assertions passed');
