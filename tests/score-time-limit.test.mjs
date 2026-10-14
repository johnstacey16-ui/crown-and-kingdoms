import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /function kingdomScore\(t\)\{/,
  'The score victory mode must calculate a score for each kingdom');
assert.match(html, /const resources=Object\.values\(S\.res\[t\]\|\|\{\}\)\.reduce/,
  'Held resources must contribute to kingdom score');
assert.match(html, /const units=S\.us\.filter\(u=>u\.t===t&&u\.hp>0&&!u\.ld\)\.reduce/,
  'Surviving ungarrisoned army units must contribute to score');
assert.match(html, /const buildings=S\.bs\.filter\(b=>b\.t===t&&b\.hp>0\)\.reduce/,
  'Surviving buildings must contribute to score');
assert.match(html, /const techs=Object\.entries\(S\.tech\[t\]\|\|\{\}\)\.filter/,
  'Researched technologies must contribute to score');
assert.match(html, /const age=\(S\.age\[t\]\|\|0\)\*150/,
  'Advancing the age must contribute to score');
assert.match(html, /const relics=S\.rel\.filter\(r=>r\.m&&r\.m\.t===t\)\.length\*250/,
  'Stored relics must contribute to score');
assert.match(html, /if\(vm===4\)\{const limit=1200;if\(S\.t<limit\)return/,
  'Score victory must resolve at the 20-minute game-time limit');
assert.match(html, /const ranked=Array\.from\(\{length:S\.teamN\},\(_,t\)=>\(\{t,score:kingdomScore\(t\)\}\)\)\.filter/,
  'Only the player and living hostile rivals should be ranked');
assert.match(html, /if\(leaders\.length>1\)\{endGame\('draw'/,
  'Equal highest scores must result in a visible draw, not arbitrarily grant a win');
assert.match(html, /\['Destroy Town Centre','Wonder \(5 min\)','Relics \(4 min\)','Regicide','Score at 20 min'\]\[vm\]/,
  'The score/time-limit mode must be selectable in the controller setup menu');
assert.match(html, /if\(vm===4\)tx\('SCORE MODE · '/,
  'The HUD must show the remaining game time in score mode');
assert.match(html, /S\.over==='draw'\?'DRAW':'DEFEAT'/,
  'The results screen must render ties as draws');

console.log('score-time-limit: all 13 source regression assertions passed');
