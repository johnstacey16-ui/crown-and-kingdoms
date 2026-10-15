import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

assert.match(html, /const sr=\[7,4,d\.rng,0,0\]\[u\.st\|0\]/,
  'No Attack must disable autonomous hostile target acquisition');
assert.match(html, /const e=u\.st===4\?null:foe\(u,9\)/,
  'No Attack must also prevent automatic conversion attacks');
assert.match(html, /function setStance\(v\)\{[\s\S]{0,300}if\(v===4&&\(u\.o==='a'\|\|u\.o==='v'\)\)\{u\.o='i';u\.tg=null;u\.p=\[\]\}/,
  'Switching into No Attack must cancel attacks and conversions already in progress');
assert.match(html, /if\(u\.o==='p'\)\{const e=u\.st===4\?null:foe\(u,6\)/,
  'No Attack units must patrol without automatically engaging enemies');
assert.match(html, /if\(u\.st===4\)\{u\.o='i';u\.tg=null;u\.p=\[\];noAttackBlocked\+\+;continue\}/,
  'Direct attack commands must not override No Attack stance');
assert.match(html, /\{l:'Stance: No Attack',c:\{\},lk:'',fn:\(\)=>setStance\(4\)\}/,
  'No Attack must be available from the existing controller command menu');
assert.match(html, /\['Aggressive','Defensive','Stand ground','Passive','No Attack'\]\[v\]/,
  'The user must receive the correct No Attack stance feedback');
assert.match(html, /if\(noAttackBlocked\)note\('No Attack stance blocked '/,
  'Rejected attack orders must produce visible controller feedback');

console.log('no-attack-stance: all 8 source regression assertions passed');
