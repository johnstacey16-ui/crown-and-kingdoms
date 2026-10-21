import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/entities.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

// Source-level guards for technology effects on current and future game objects.
assert.match(html, /function farmFood\(t\)\{const q=S\.tech\[t\]\|\|\{\};return 175\+\(q\.coll\?75:0\)\+\(q\.plow\?125:0\)\+\(q\.crop\?175:0\)\}/, 'farm capacity must reflect researched Horse Collar, Heavy Plow and Crop Rotation');
assert.match(html, /if\(\['coll','plow','crop'\]\.includes\(k\)\)\{const add=k==='coll'\?75:k==='plow'\?125:175;for\(const n of S\.nodes\)if\(n\.k==='f'&&n\.fm&&n\.t===b\.t&&S\.nd\[n\.y\*W\+n\.x\]===n\)n\.amt\+=add\}/, 'farm capacity research must also extend existing farms');
assert.match(html, /if\(e\.hpb\)\{T0\.hpb=T0\.hpb\|\|\{\};for\(const q in e\.hpb\)\{T0\.hpb\[q\]=\(T0\.hpb\[q\]\|\|0\)\+e\.hpb\[q\];for\(const x of S\.us\)if\(x\.t===b\.t&&x\.k===q&&x\.hp>0\)x\.hp\+=e\.hpb\[q\]\}\}/, 'unit hit-point upgrades must update existing units as well as the tech ledger');
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
assert.match(html, /function gatherCapacity\(u\)\{const tech=S\.tech\[u\.t\]\|\|\{\};return CAP\+\(tech\.carry\?5:0\)\+\(u\.k==='vil'&&tech\.wheel\?3:0\)\+\(u\.k==='vil'&&tech\.handcart\?7:0\)\}/,
  'Carrying capacity must use the actual researched upgrades for current workers');
assert.match(html, /u\.car>=gatherCapacity\(u\)/,
  'Gatherers must query current capacity when deciding to return with resources');
const sim=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const begin=sim.indexOf('function gatherCapacity(u){');
const finish=sim.indexOf('\nfunction unitSpeed(',begin);
assert.ok(begin>=0&&finish>begin,'carry calculation must remain available');
const context={CAP:10,S:{tech:[{}]}};
const gatherCapacity=vm.runInNewContext(sim.slice(begin,finish)+'\n;gatherCapacity;',context);
const workingVillager={t:0,k:'vil'};
assert.equal(gatherCapacity(workingVillager),10);
context.S.tech[0].carry=1;
assert.equal(gatherCapacity(workingVillager),15,'an existing villager gains the carrying upgrade immediately');
context.S.tech[0].wheel=1;context.S.tech[0].handcart=1;
assert.equal(gatherCapacity(workingVillager),25,'Wheelbarrow and Hand Cart upgrades stack for villagers');
assert.match(html, /INFARM\.has\(t\.k\)&&ta\.armI\?1:0\)\+\(ARCHARM\.has\(t\.k\)&&ta\.armR\?1:0\)\+\(CAVARM\.has\(t\.k\)&&ta\.armC\?1:0\)/,
  'Infantry, ranged and cavalry armour upgrades must affect only their explicit target classes');
assert.match(html, /const CAVARM=new Set\(\['scout','knight','camel','mamel','cata','ele','mgd','eled','conq','boyar','tarkan'\]\)/,
  'Cavalry armour must be restricted to mounted units in the current roster');
assert.match(html, /smith:\{n:'Blacksmith',s:3,hp:400,cost:\{w:150\},bt:25,rs:\['atkM','atkR','armI','armR','armC','atkM2','atkR2','bodkin'\]/,
  'Cavalry armour must be researched at the Blacksmith');
assert.match(html, /armC:\{n:'Cavalry Armour \+1',cost:\{f:150,g:100\},t:30,age:1\}/,
  'Cavalry Armour must have explicit cost, research time and age');
assert.match(html, /if\(k==='armC'&&ownCav>=3\)score\+=32/,
  'AI research priority must value cavalry armour when its own army fields cavalry');
assert.match(html, /if\(k==='armI'&&ownInf>=3\)score\+=30/,
  'AI research priority must value infantry armour when its own army fields infantry');
assert.match(html, /if\(k==='armR'&&ownRanged>=3\)score\+=32/,
  'AI research priority must value ranged armour when its own army fields ranged units');
assert.match(html, /if\(k==='armR'&&ownRanged<2\)score-=28/,
  'AI should delay ranged armour when it has no meaningful ranged force');
assert.match(html, /if\(k==='armC'&&ownCav<2\)score-=28/,
  'AI should delay cavalry armour when it has no meaningful cavalry force');
assert.match(html, /if\(\['atkR','bodkin','atkR2','ballistics'\]\.includes\(k\)&&ownRanged<2\)score-=20/,
  'AI should avoid premature ranged attack research before fielding ranged units');
assert.match(html, /cav=!!\(T\.armC&&CAVARM\.has\(k\)\)/,
  'Researched cavalry armour must be visible on matching battlefield units');
assert.match(html, /if\(cav\)\{[\s\S]*?X\.stroke\(\);[\s\S]*?X\.restore\(\)/,
  'Cavalry barding must be drawn inside the translated/scaled sprite context');
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
assert.match(html, /if\(k==='mil'\)return tech\.champ\?'Champion':tech\.twohand\?'Two-Handed Swordsman':tech\.longs\?'Long Swordsman':tech\.man\?'Man-at-Arms':U\[k\]\.n/,
  'Existing and newly trained Militia must display the highest researched infantry rank');
const {B:technologyBuildings}=vm.runInNewContext(readFileSync(new URL('../js/config.js',import.meta.url),'utf8')+'\n;({B})');
assert.ok(['man','longs','twohand','champ','pike','halb'].every(id=>technologyBuildings.bar.rs.includes(id)),
  'Barracks must offer the six infantry upgrade technologies, alongside any newer valid research');
assert.match(html, /twohand:\{n:'Two-Handed Swordsman',cost:\{f:300,g:100\},t:45,age:3,pre:'longs',hpb:\{mil:15\},atkb:\{mil:2\}\}/,
  'Two-Handed Swordsman must have explicit prerequisites and real unit effects');
assert.match(html, /champ:\{n:'Champion',cost:\{f:750,g:350\},t:60,age:3,pre:'twohand',hpb:\{mil:20\},atkb:\{mil:3\}\}/,
  'Champion must require Two-Handed Swordsman and add real health and attack');
assert.ok(html.includes("castle:{n:'Castle',s:4,hp:1400,cost:{w:200,s:350},bt:60,age:2,atk:'cs',tr:['knight','xbow','treb'],rs:['cons']}"),
  'Conscription must be researchable at the Castle');
assert.match(html, /cons:\{n:'Conscription',cost:\{f:150,g:150\},t:60,age:3\}/,
  'Conscription must have explicit cost, research time and Imperial Age requirement');
assert.match(html, /const MILITARY_PRODUCTION_BUILDINGS=new Set\(\['bar','rng','stable','siege','castle','monastery','dock'\]\)/,
  'Conscription must cover all military production buildings');
assert.match(html, /function trainRate\(b,k\)\{return S\.tech\[b\.t\]&&S\.tech\[b\.t\]\.cons&&MILITARY_PRODUCTION_BUILDINGS\.has\(b\.k\)&&!\['vil','cart','fish','trn','cog'\]\.includes\(k\)\?4\/3:1\}/,
  'Conscription must only speed military units, not villagers, traders, fishing or transport ships');
assert.match(html, /q\.t-=dt\*trainRate\(b,q\.k\)/,
  'Conscription must accelerate the live unit production queue, including units already queued');
assert.match(html, /if\(k==='cons'&&arm\.length>=8\)score\+=24/,
  'AI must value Conscription once it has a substantial army');
assert.ok(['pike','halb'].every(id=>technologyBuildings.bar.rs.includes(id)),
  'Pikeman and Halberdier must remain in the Barracks research list without excluding other valid upgrades');
assert.match(html, /halb:\{n:'Halberdier',cost:\{f:300,g:200\},t:45,age:3,pre:'pike',hpb:\{spear:20\},atkb:\{spear:2\}\}/,
  'Halberdier must require Pikeman and add health/attack effects');
assert.match(html, /a\.k==='spear'&&tk\.halb&&ak\.bn&&\(ak\.bn\[t\.k\]\|\|ak\.bn\[U\[t\.k\]\.lk\]\)\?6:0/,
  'Halberdier must add the specific anti-cavalry damage bonus to the spear unit line');
assert.match(html, /T\.halb\?'halb':T\.pike\?'pike'/,
  'Battlefield sprites must use the highest researched spear-line rank');
assert.match(html, /rank==='pike'\|\|rank==='halb'/,
  'Halberdiers must receive the upgraded polearm rendering path');
assert.ok(html.includes("stable:{n:'Stable',s:3,hp:500,cost:{w:150},bt:25,tr:['scout','camel','knight'],rs:['lcav','cavl','blood','husb'],req:'bar',age:1}"),
  'Husbandry must be researchable at the Stable');
assert.match(html, /husb:\{n:'Husbandry',cost:\{f:150,g:150\},t:40,age:2\}/,
  'Husbandry must have explicit cost, duration and Castle Age availability');
const speedStart=sim.indexOf('function unitSpeed(u){');
const speedEnd=sim.indexOf('\nfunction walk(',speedStart);
assert.ok(speedStart>=0&&speedEnd>speedStart,'shared unit speed calculation must be present');
const speedContext={S:{tech:[{husb:1}]},U:{knight:{sp:1},mil:{sp:1},vil:{sp:1}},
  CAVARM:new Set(['knight']),INFARM:new Set(['mil'])};
const speed=vm.runInNewContext(sim.slice(speedStart,speedEnd)+'\n;unitSpeed;',speedContext);
assert.equal(speed({t:0,k:'knight'}),1.1,'Husbandry grants ten percent speed to mounted units');
assert.equal(speed({t:0,k:'mil'}),1,'Husbandry alone cannot accelerate infantry');
assert.equal(speed({t:0,k:'vil'}),1,'Husbandry alone cannot accelerate villagers');
speedContext.S.tech[0].squires=1;
assert.equal(speed({t:0,k:'mil'}),1.1,'Squires independently improves infantry mobility');
assert.match(html, /const CAVARM=new Set\(\['scout','knight','camel','mamel','cata','ele','mgd','eled','conq','boyar','tarkan'\]\)/,
  'Mounted classification must cover unique cavalry and mounted raiders consistently');
assert.match(html, /if\(k==='husb'&&ownCav>=3\)score\+=22/,
  'AI should value Husbandry when it has a meaningful mounted force');
assert.match(html, /const rank=k==='mil'\?\(T\.champ\?'champ':T\.twohand\?'twohand':T\.longs\?'long':T\.man\?'man':''\)/,
  'The battlefield renderer must use the highest researched sword-line tier');
assert.match(html, /if\(rank==='man'\|\|rank==='long'\|\|rank==='twohand'\|\|rank==='champ'\)/,
  'Each sword-line tier must get the battlefield equipment drawing path');
assert.match(html, /if\(k==='spear'&&tech\.halb\)return 'Halberdier'/,
  'Pikemen must display as Halberdiers after the Imperial upgrade');
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
const handledFlags = new Set(['gath','carry','wheel','handcart','squires','arson','atkM','atkR','armI','armR','armC','cons','husb','fw','gtow','keep','crane','mas','slit','axe','saw','gmine','smine','coll','plow','crop','atkM2','atkR2','bodkin','ballistics','devotion','faith','heresy','redemption','atonement','fervor','blockPrinting','illumination','theocracy','herbalMedicine','murderHoles']);
const techRows = techMatches.map((match,index)=>{
 const end=index+1<techMatches.length?techMatches[index+1].index:techText.length;
 const block=techText.slice(match.index,end);
 return {key:match[1],hasEffectPayload:/\b(?:hpb|atkb):\{/.test(block)||/\bfx:/.test(block),hasRuntimeHandler:handledFlags.has(match[1])};
});
assert.deepEqual(techRows.filter(r=>!r.hasEffectPayload&&!r.hasRuntimeHandler).map(r=>r.key), [],
  'Every defined technology must have a generic effect payload or an explicitly handled gameplay flag');

console.log('technology-effects: static assertions passed');

