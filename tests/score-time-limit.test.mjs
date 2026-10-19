import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

assert.match(html, /function kingdomScore\(t\)\{/,
  'The score victory mode must calculate a score for each kingdom');
assert.match(html, /const res=S\.res\[t\]\|\|\{\};let resources=0;for\(const n of Object\.values\(res\)\)resources\+=Math\.max\(0,Number\(n\)\|\|0\);resources\/=10/,
  'Held resources must contribute to kingdom score');
assert.match(html, /for\(const u of S\.us\)if\(u\.t===t&&u\.hp>0\)/,
  'All surviving army units, including garrisoned units, must contribute to score');
assert.match(html, /for\(const b of S\.bs\)if\(b\.t===t&&b\.hp>0\)/,
  'Surviving buildings must contribute to score');
assert.match(html, /const techs=techCount\*30/,
  'Researched technologies must contribute to score');
assert.match(html, /age=\(S\.age\[t\]\|\|0\)\*150/,
  'Advancing the age must contribute to score');
assert.match(html, /const relics=relicCount\*250/,
  'Stored relics must contribute to score');
assert.match(html, /if\(vm===4\)\{const limit=scoreLimit;if\(S\.t<limit\)return/,
  'Score victory must resolve at the selected game-time limit');
assert.match(html, /const ranked=Array\.from\(\{length:S\.teamN\},\(_,t\)=>\(\{t,score:kingdomScore\(t\)\}\)\)\.filter/,
  'Only the player and living hostile rivals should be ranked');
assert.match(html, /if\(leaders\.length>1\)\{endGame\('draw'/,
  'Equal highest scores must result in a visible draw, not arbitrarily grant a win');
assert.match(html, /\['Destroy Town Centre','Wonder \(5 min\)','Relics \(4 min\)','Regicide','Score at time limit','King of the Hill','Sudden Death'\]\[vm\]/,
  'The score/time-limit mode must be selectable in the controller setup menu');
assert.match(html, /if\(vm===4\)tx\('SCORE MODE · '/,
  'The HUD must show the remaining game time in score mode');
assert.match(html, /S\.over==='draw'\?'DRAW':'DEFEAT'/,
  'The results screen must render ties as draws');

assert.match(html, /const SCORE_LIMITS=\[600,900,1200,1500,1800\]/,
  'Score mode must offer selectable 10, 15, 20, 25 and 30 minute limits');
assert.match(html, /\{n:'Score time limit',v:\(\)=>Math\.round\(scoreLimit\/60\)\+' minutes'/,
  'The duration selector must be visible in the controller-driven setup menu');
assert.match(html, /Math\.max\(0,scoreLimit-S\.t\)/,
  'The score HUD countdown must reflect the selected duration');
assert.match(html, /Math\.round\(scoreLimit\/60\)\+'-minute time limit/,
  'The score winner message must state the selected duration');
assert.match(html, /Math\.round\(scoreLimit\/60\)\+'-minute score limit/,
  'The score draw message must state the selected duration');
assert.match(html, /JSON\.stringify\(\{ui,br,msz,diff,aiDifficultyVersion:2,vm,scoreLimit,mt,mapLayout,civ/,
  'Settings persistence must include versioned AI difficulty, selected score duration and current map layout');
assert.match(html, /vm=cl\(st\.vm\|0,0,6\);scoreLimit=SCORE_LIMITS\.includes\(st\.scoreLimit\)\?st\.scoreLimit:1200/,
  'Settings restoration must retain Score victory and safely default missing duration values');
assert.match(html, /sz:W,vm,scoreLimit,aip,pal:S\.pal/,
  'Saved games must include the selected duration');
assert.match(html, /vm=cl\(j\.vm\|0,0,6\);scoreLimit=SCORE_LIMITS\.includes\(j\.scoreLimit\)\?j\.scoreLimit:1200/,
  'Loading older saves must safely default duration and preserve Score victory');
assert.match(html, /if\(!PRF\)PRF=\{civ,msz,mt,mapLayout,diff,aip,vm,scoreLimit\}/,
  'Campaign entry must preserve the player setup');
assert.match(html, /\(\{civ,msz,mt,mapLayout,diff,aip,vm,scoreLimit\}=PRF\)/,
  'Returning from a campaign must restore the prior setup and duration');

console.log('score-time-limit: all 24 source regression assertions passed');
