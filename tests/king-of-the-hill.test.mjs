import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/formations.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/minimap.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

assert.match(html, /function prepareHillMap\(starts\)\{/,
  'King of the Hill must prepare a dedicated objective map');
assert.match(html, /for\(const b of starts\)carve\(b\[0\]\+\.5,b\[1\]\+\.5,hx,hy,2\.2\)/,
  'Every starting position must have a cleared land route toward the hill');
assert.match(html, /carve\(hx,hy,hx,hy,6\)/,
  'The centre of the map must be cleared for the capture area');
assert.match(html, /if\(vm===5\)prepareHillMap\(bs\);bs\.forEach/,
  'Hill routes must be prepared before starting-base resources and buildings are added');
assert.match(html, /S\.kh=Array\(S\.teamN\)\.fill\(0\)/,
  'Each match must start with zero hold progress for every kingdom');

assert.match(html, /function kingHillControl\(dt\)\{/,
  'The mode needs a dedicated hill-capture controller');
assert.match(html, /u\.hp>0&&!u\.ld&&u\.k!=='vil'&&u\.k!=='cart'&&u\.k!=='cog'&&!\(U\[u\.k\]&&U\[u\.k\]\.sh\)&&Math\.hypot\(u\.x-W\/2,u\.y-H\/2\)<=5\.2/,
  'Only living, ungarrisoned land combat units inside the control radius may capture');
assert.match(html, /diplomacyRelation\(0,u\.t\)==='ally'\?0:u\.t/,
  'Allied combat units can help the player, but neutral units cannot be counted as player units');
assert.match(html, /if\(holders\.length!==1\)\{progress\.fill\(0\);return\}/,
  'No holder or contested presence must reset the continuous-control timer');
assert.match(html, /Math\.min\(300,\(progress\[t\]\|\|0\)\+dt\)/,
  'Capture progress must accumulate to five uninterrupted game minutes');
assert.match(html, /if\(vm===5\)\{kingHillControl\(dt\);return\}/,
  'King of the Hill must run through the regular victory evaluation');
assert.match(html, /Your kingdom held the central hill for 5 minutes/,
  'The player victory result must identify the hill objective');
assert.match(html, /' held the central hill for 5 minutes'/,
  'A rival victory result must identify the hill objective');

assert.match(html, /tgt=vm===5\?\{x:W\/2,y:H\/2,t:-1,k:'hill',hp:1\}/,
  'AI attack groups must target the central hill in this mode');
assert.match(html, /const sx=vm===5\?W\/2:tc\.x\+\(tgt\.x-tc\.x\)\*\.35,sy=vm===5\?H\/2:tc\.y\+\(tgt\.y-tc\.y\)\*\.35/,
  'AI must move its attack rally point to the hill rather than stopping short');
assert.match(html, /const fo=vm===5\?\[\(i%5-2\),\(\(Math\.floor\(i\/5\)%5\)-2\)\]:fslot/,
  'AI combat units must gather in a compact capture formation');

assert.match(html, /'King of the Hill','Sudden Death'\]\[vm\]/,
  'King of the Hill must be selectable in the controller-driven victory menu');
assert.match(html, /vm=cl\(st\.vm\|0,0,6\)/,
  'Settings restoration must accept the new victory mode');
assert.match(html, /vm=cl\(j\.vm\|0,0,6\)/,
  'Saved games must restore the new victory mode');
assert.match(html, /kh:S\.kh/,
  'Save slots must preserve hill control progress');
assert.match(html, /S\.kh=Array\.isArray\(j\.kh\)&&j\.kh\.length===S\.teamN\?j\.kh\.map\(n=>Number\.isFinite\(n\)\?cl\(n,0,300\):0\):Array\(S\.teamN\)\.fill\(0\)/,
  'Load must safely restore finite progress and default older saves to zero');
assert.match(html, /KING OF THE HILL · HOLD THE CENTRAL HILL FOR 5 MIN/,
  'The HUD must tell players how to win');
assert.match(html, /CONTROLS THE HILL · /,
  'The HUD must show the active capture countdown');
assert.match(html, /function drawHill\(o\)\{/,
  'The central objective must have its own visible landmark');
assert.match(html, /if\(vm===5&&S\.ex\[\(H\/2\|0\)\*W\+\(W\/2\|0\)\]\)L\.push/,
  'World rendering must respect explored fog before drawing the hill landmark');
assert.match(html, /if\(vm===5\)\{const P=w2m\(r,W\/2,H\/2\)/,
  'The hill objective must have a minimap marker');

assert.match(html, /diplomacyRelation\(0,u\.t\)!=='neutral'/,
  'Neutral units must not count as capture units');
assert.match(html, /nx:\(vm===5\?180:/,
  'AI should begin its first hill attack earlier than a standard attack wave');
assert.match(html, /A\.nx=S\.t\+\(vm===5\?\[180,150,120\]\[diff\]:\[300,240,180\]\[diff\]\)/,
  'AI should make repeated attempts to capture or retake a hill');
assert.match(html, /S\.mapAudit=\{\.\.\.auditGeneratedMap\(starts\),hillReachable:true\}/,
  'Map connectivity should be refreshed after the hill roads are carved');

console.log('king-of-the-hill: all 30 source regression assertions passed');
