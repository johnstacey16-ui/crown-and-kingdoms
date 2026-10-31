import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/entities.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

assert.match(html, /function createVillagerPriority\(source=null\)\{/,
  'Villager priorities need defaults and backward-compatible save normalization');
assert.match(html, /f:2,w:2,g:1,s:0/,
  'New games need a sensible starting villager distribution');
assert.match(html, /function assignAutoVillager\(u,force=false\)\{/,
  'Auto assignment must use one central worker-assignment function');
assert.match(html, /const targets=villagerPriorityTargets\(u\.t,p\)/,
  'Auto assignments must scale resource weights to the living workforce');
assert.match(html, /const needs=keys\.filter\(k=>counts\[k\]<targets\[k\]\)/,
  'Priority targets must fill unmet resource targets before balancing extra workers');
assert.match(html, /let found=findReachableAutoNode\(u,k,18\);[\s\S]{0,90}if\(!found\)found=findReachableAutoNode\(u,k,30\);[\s\S]{0,100}u\.o='g';u\.tg=found\.n;u\.ct=k;u\.p=found\.route/,
  'Assigned villagers must first try nearby resources, then farther reachable nodes, and keep the verified movement route');
assert.match(html, /function addU\(t,k,x,y\)\{[\s\S]{0,500}if\(k==='vil'&&t===0&&S\.vp&&S\.vp\.enabled\)assignAutoVillager\(u\)/,
  'Newly trained/created player villagers must follow the current priorities when automation is enabled');
assert.match(html, /function villagerPriorityMenuItems\(\)\{[\s\S]{0,650}WORKER_TARGETS\.map/,
  'The existing controller pause menu must expose the automation toggle and resource targets');
assert.match(html, /\.\.\.diplomacyMenuItems\(\),\.\.\.tributeMenuItems\(\),\.\.\.villagerPriorityMenuItems\(\)/,
  'Villager priority controls must be wired into the pause-menu item list');
assert.match(html, /vc:S\.vc,px:S\.px,civ:S\.civ,dip:S\.dip,vp:S\.vp,diff/,
  'Save data must persist villager priority settings');
assert.match(html, /vp:createVillagerPriority\(j\.vp\)/,
  'Load data must restore settings and supply defaults for legacy saves');
assert.match(html, /for\(const u of us\)\{const unitIndex=u\.sh\?navalIndex\+\+:landIndex\+\+;u\.p=\[\];u\.pt=null;u\.as=0;u\.autoWorker=0;/,
  'Direct player commands must override automated worker assignment while preserving mixed land/naval indexing');
assert.match(html, /function stopSel\(\)\{for\(const u of S\.sel\)if\(!u\.q\)\{u\.o='i';u\.p=\[\];u\.tg=null;u\.pt=null;u\.autoWorker=0;u\.guardTarget=null;/,
  'A manual Stop order must leave villagers idle, remove automation and clear stale Guard/Follow state');
assert.match(html, /function changeVillagerTarget\(k,dir\)\{[\s\S]{0,350}rebalanceVillagerPriorities\(0\)/,
  'Changing a target must rebalance automated workers where possible');
assert.match(html, /function applyVillagerPriorities\(t=0\)\{[\s\S]{0,300}assignAutoVillager\(u,true\)/,
  'The controller must be able to apply the current priority settings to currently idle villagers');

console.log('villager-priority: all 13 source regression assertions passed');
