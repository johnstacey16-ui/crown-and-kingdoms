import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');

assert.match(campaign, /const tcOf=t=>S\\.bs\\.find\\(b=>b\\.t===t&&b\\.k==='tc'&&b\\.hp>0\\),cb=/,
  'Campaign module must own shared Town Centre and building-count helpers');
assert.match(campaign, /const grp=\(t,k,n\)=>\{const tc=tcOf\(t\)/,
  'Campaign module must own scenario starting-group creation');
assert.match(campaign, /function put\(t,k,cx,cy\)\{/,
  'Campaign module must own completed scenario-building placement');
assert.doesNotMatch(engine, /const tcOf=|const grp=|function put\(/,
  'Campaign setup helpers must not remain in engine orchestration');
assert.ok(html.indexOf('src="./js/entities.js"') < html.indexOf('src="./js/campaign.js"') &&
  html.indexOf('src="./js/campaign.js"') < html.indexOf('src="./engine.js"'),
  'Entity factories and campaign helpers must load before engine initialization');

console.log('campaign-module-ownership: shared helpers and script order passed');
