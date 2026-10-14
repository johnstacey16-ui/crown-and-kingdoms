import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

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

console.log('technology-effects: static assertions passed');
