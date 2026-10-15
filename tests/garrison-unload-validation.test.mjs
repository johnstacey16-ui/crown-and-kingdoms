import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function unload(b){');
const end = simulation.indexOf('\nfunction townBell(', start);
assert.ok(start >= 0 && end > start, 'Unload command must remain isolated');
const unload = simulation.slice(start, end);

assert.match(unload, /^function unload\(b\)\{if\(!b\|\|b\.hp<=0\|\|!b\.done\|\|!Number\.isInteger\(b\.t\)\|\|!S\|\|!S\.tech\[b\.t\]\|\|!B\[b\.k\]\|\|!Array\.isArray\(b\.cg\)\|\|!GAR\[b\.k\]\|\|!b\.cg\.length\)/,
  'Unloading must reject dead, unfinished, invalid-owner, non-garrison and empty buildings');
assert.match(unload, /Select a living, completed garrison with units inside/,
  'Invalid unload requests must give a useful message');
assert.match(unload, /if\(sp\)\{c\.x=sp\[0\];c\.y=sp\[1\];c\.ld=null\}/,
  'Successfully placed units must be released from garrison');
assert.match(unload, /b\.cg=cg\.filter\(c=>c\.ld\);note\('Garrison unloaded'\);return true/,
  'Units that cannot safely spawn must remain garrisoned and valid unload reports success');

console.log('garrison-unload-validation: only valid occupied living garrisons can unload');
