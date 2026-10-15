import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

// Source-level guards for technology effects on current and future game objects.
assert.match(html, /function farmFood\(t\)\{const q=S\.tech\[t\]\|\|\{\};return 175\+\(q\.coll\?75:0\)\+\(q\.plow\?125:0\)\+\(q\.crop\?175:0\)\}/, 'farm capacity must reflect researched Horse Collar, Heavy Plow and Crop Rotation');
assert.match(html, /if\(\['coll','plow','crop'\]\.includes\(k\)\)\{const add=k==='coll'\?75:k==='plow'\?125:175;for\(const n of S\.nodes\)if\(n\.k==='f'&&n\.fm&&n\.t===b\.t&&S\.nd\[n\.y\*W\+n\.x\]===n\)n\.amt\+=add\}/, 'farm capacity research must also extend existing farms');
assert.match(html, /if\(e\.hpb\)\{T0\.hpb=T0\.hpb\|\|\{\};for\(const q in e\.hpb\)\{T0\.hpb\[q\]=\(T0\.hpb\[q\]\|\|0\)\+e\.hpb\[q\];for\(const x of S\.us\)if\(x\.t===b\.t&&x\.k===q\)x\.hp\+=e\.hpb\[q\]\}\}/, 'unit hit-point upgrades must update existing units as well as the tech ledger');
assert.match(html, /hp:U\[k\]\.hp\+\(S\.tech\[t\]\.hpb&&S\.tech\[t\]\.hpb\[k\]\|\|0\)/, 'newly created units must inherit researched hit-point upgrades');
assert.match(html, /if\(e\.atkb\)\{T0\.atkb=T0\.atkb\|\|\{\};for\(const q in e\.atkb\)T0\.atkb\[q\]=\(T0\.atkb\[q\]\|\|0\)\+e\.atkb\[q\]\}/, 'unit attack upgrades must update the shared tech ledger');
assert.match(html, /tk\.atkb&&tk\.atkb\[a\.k\]\|\|0/, 'combat damage must apply researched unit-specific attack bonuses');
assert.match(html, /if\(k==='mas'\)for\(const x of S\.bs\)if\(x\.t===b\.t\)\{x\.mh=Math\.round\(\(x\.mh\|\|B\[x\.k\]\.hp\)\*1\.4\);x\.hp=Math\.min\(x\.mh,Math\.round\(x\.hp\*1\.4\)\)\}/, 'Masonry must strengthen existing buildings');
assert.match(html, /if\(k==='fw'\)for\(const x of S\.bs\)if\(x\.t===b\.t&&\(x\.k==='wall'\|\|x\.k==='gate'\)\)/, 'Fortified Wall must strengthen existing walls and gates');
assert.match(html, /S\.tech\[t\]\.mas\?1\.4:1/, 'new buildings must inherit Masonry health');
assert.match(html, /S\.tech\[t\]\.fw&&\(k==='wall'\|\|k==='gate'\)\?1\.8:1/, 'new walls and gates must inherit Fortified Wall health');


assert.match(html, /function gm\(u,tg\)\{const t=S\.tech\[u\.t\];let m=t\.gath\?1\.25:1/,
  'Gather Rate research must affect existing villagers on future collection ticks');
assert.match(html, /if\(k==='w'\)\{m\*=1\+\.2\*!!t\.axe\+\.2\*!!t\.saw/,
  'Double-bit Axe and Bow Saw must affect wood gathering');
assert.match(html, /if\(k==='g'\)m\*=1\+\.15\*!!t\.gmine[\s\S]{0,100}if\(k==='s'\)m\*=1\+\.15\*!!t\.smine/,
  'Gold Mining and Stone Mining must affect the matching resource gathering rates');
assert.match(html, /S\.tech\[u\.t\]\.carry\?15:CAP/,
  'Carry Capacity research must affect already-working villagers when they next reach the carrying threshold');
assert.match(html, /INFARM\.has\(t\.k\)&&ta\.armI\?1:0\)\+\(ARCHARM\.has\(t\.k\)&&ta\.armR\?1:0\)\+\(CAVARM\.has\(t\.k\)&&ta\.armC\?1:0\)/,
  'Infantry, ranged and cavalry armour upgrades must affect only their explicit target classes');
assert.match(html, /const CAVARM=new Set\(\['scout','knight','camel','mamel','cata','ele','mgd','eled'\]\)/,
  'Cavalry armour must be restricted to mounted units in the current roster');
assert.match(html, /smith:\{n:'Blacksmith',s:3,hp:400,cost:\{w:150\},bt:25,rs:\['atkM','atkR','armI','armR','armC','atkM2','atkR2'\]/,
  'Cavalry armour must be researched at the Blacksmith');
assert.match(html, /armC:\{n:'Cavalry Armour \+1',cost:\{f:150,g:100\},t:30,age:1\}/,
  'Cavalry Armour must have explicit cost, research time and age');
assert.match(html, /if\(k==='armC'&&humanCav>=3\)score\+=28/,
  'AI research priority must respond to a substantial enemy cavalry force');
assert.match(html, /cav=!!\(T\.armC&&CAVARM\.has\(k\)\)/,
  'Researched cavalry armour must be visible on matching battlefield units');
assert.match(html, /const buildRate=S\.tech\[u\.t\]\.crane\?1\.2:1/,
  'Treadmill Crane must affect ongoing and future construction work rates');
assert.match(html, /\(tk\.slit\?2:0\)\+\(tk\.gtow\?3:0\)\+\(tk\.keep\?3:0\)\+\(tk\.gf\?4:0\):0\),cls=ak\.sg/,
  'Arrowslits must feed the defensive building damage calculation');
assert.match(html, /tk\.gtow\?3:0/,
  'Guard Tower must feed the defensive building damage calculation');
assert.match(html, /tk\.keep\?3:0/,
  'Keep must feed the defensive building damage calculation');

assert.match(html, /function unitName\(k,t\)\{\s*const tech=S&&S\.tech&&S\.tech\[t\]\|\|\{\};/,
  'Unit rank display must read the actual researching kingdom technology ledger');
assert.match(html, /if\(k==='mil'\)return tech\.longs\?'Long Swordsman':tech\.man\?'Man-at-Arms':U\[k\]\.n/,
  'Existing and newly trained Militia must display the highest researched infantry rank');
assert.match(html, /if\(k==='spear'&&tech\.pike\)return 'Pikeman'/,
  'Spearmen must display as Pikemen after that upgrade');
assert.match(html, /if\(k==='xbow'&&tech\.arb\)return 'Arbalester'/,
  'Crossbowmen must display as Arbalesters after that upgrade');
assert.match(html, /if\(k==='skirm'&&tech\.elsk\)return 'Elite Skirmisher'/,
  'Skirmishers must display their researched elite rank');
assert.match(html, /if\(k==='scout'&&tech\.lcav\)return 'Light Cavalry'/,
  'Scouts must display as Light Cavalry after that upgrade');
assert.match(html, /if\(k==='knight'&&tech\.cavl\)return 'Cavalier'/,
  'Knights must display as Cavaliers after that upgrade');
assert.match(html, /return\{l:unitName\(k,s\.t\),c:U\[k\]\.cost/,
  'Production menu labels must use the selected kingdom upgrade state');
assert.match(html, /note\(unitName\(q\.k,b\.t\)\+' trained'\)/,
  'Training feedback must use the researched unit name');
assert.match(html, /\$\{unitName\(a\.k,a\.t\)\}/,
  'The selected-unit HUD must use the researched unit name');
assert.match(html, /Training \$\{a\.q\.map\(q=>unitName\(q\.k,a\.t\)\[0\]\)\.join\(''\)\}/,
  'Production queue initials must remain consistent with researched unit ranks');

// Every technology must connect to either a shared effect payload (unit HP/attack
// bonus or a callback), or one of the explicitly handled scalar technology flags.
const techStart = html.indexOf('const TE={');
const techEnd = html.indexOf('};', techStart);
assert.ok(techStart >= 0 && techEnd > techStart, 'Technology table must remain identifiable');
const techText = html.slice(techStart, techEnd + 1);
const techMatches = [...techText.matchAll(/(?:const TE=\{|,)\s*([A-Za-z][A-Za-z0-9]*):\{n:/g)];
const handledFlags = new Set(['gath','carry','atkM','atkR','armI','armR','armC','fw','gtow','keep','crane','mas','slit','axe','saw','gmine','smine','coll','plow','crop','atkM2','atkR2']);
const techRows = techMatches.map((match,index)=>{
 const end=index+1<techMatches.length?techMatches[index+1].index:techText.length;
 const block=techText.slice(match.index,end);
 return {key:match[1],hasEffectPayload:/\b(?:hpb|atkb):\{/.test(block)||/\bfx:/.test(block),hasRuntimeHandler:handledFlags.has(match[1])};
});
assert.deepEqual(techRows.filter(r=>!r.hasEffectPayload&&!r.hasRuntimeHandler).map(r=>r.key), [],
  'Every defined technology must have a generic effect payload or an explicitly handled gameplay flag');

console.log('technology-effects: static assertions passed');
