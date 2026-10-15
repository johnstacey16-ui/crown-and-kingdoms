import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');

assert.match(campaign, /t:'Train 6 ranged soldiers',ok:\(\)=>S\.us\.filter\(u=>u\.t===0&&u\.hp>0&&U\[u\.k\]\.rng>=4&&!U\[u\.k\]\.sh&&!\['vil','mon','king','ram','mang','scor','treb','bomb'\]\.includes\(u\.k\)\)\.length>=6/,
  'The ranged-soldier objective must count living ranged combat units rather than every military unit');
assert.doesNotMatch(campaign, /t:'Train 6 ranged soldiers',ok:\(\)=>cmil\(0\)>=6/,
  'Melee troops must not satisfy a ranged-soldier objective');

console.log('campaign-ranged-objective: only living ranged combat units count');
