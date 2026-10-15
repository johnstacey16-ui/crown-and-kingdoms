import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');
const helpers = campaign.slice(0, campaign.indexOf('\nconst grp='));
assert.match(helpers, /cb=\(k,t=0\)=>S\.bs\.filter\(b=>b\.t===t&&b\.k===k&&b\.done&&b\.hp>0\)\.length/,
  'Destroyed buildings must not satisfy campaign construction objectives');
assert.match(helpers, /cu=\(k,t=0\)=>S\.us\.filter\(u=>u&&u\.hp>0&&u\.t===t&&\(!k\|\|u\.k===k\)\)\.length/,
  'Dead units must not satisfy campaign force-count objectives');
assert.match(helpers, /cmil=t=>S\.us\.filter\(u=>u&&u\.hp>0&&u\.t===t&&U\[u\.k\]&&u\.k!=='vil'&&u\.k!=='mon'&&u\.k!=='king'&&!U\[u\.k\]\.sh\)\.length/,
  'Military force counts must exclude dead, unknown, civilian, monk, king and ship units');

console.log('campaign-objective-counts: only living forces and surviving completed buildings count');
