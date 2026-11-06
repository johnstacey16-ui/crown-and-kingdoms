import assert from 'node:assert/strict';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const html = loadCoreGameSource({includeUI:true,includeAssets:true});

assert.match(html, /const sr=\[Math\.max\(7,attackRange\(u\)\),4,attackRange\(u\),0,0\]\[u\.st\|0\]/,
  'No Attack must disable autonomous hostile target acquisition');
assert.match(html, /const e=u\.st===4\?null:S\.us\.find\(e=>canConvert\(u,e\)/,
  'No Attack must also prevent automatic conversion attacks');
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

console.log('no-attack-stance: all 7 source regression assertions passed');

