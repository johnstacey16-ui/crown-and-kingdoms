import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const tags = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
const inline = tags.filter((m) => !/type=["']application\/json["']/i.test(m[0]));
if (inline.length === 0) throw new Error('No inline JavaScript found');

for (let i = 0; i < inline.length; i += 1) {
  new vm.Script(inline[i][1], { filename: `index.html:inline-script-${i + 1}` });
}

const checks = [
  ['farm capacity uses researched technologies', /function farmFood\(t\)[\s\S]{0,180}q\.coll\?75[\s\S]{0,80}q\.plow\?125[\s\S]{0,80}q\.crop\?175/.test(html)],
  ['player-built farms record ownership', /addN\('f',place\.x,place\.y,farmFood\(0\),1\);if\(n\)n\.t=0/.test(html)],
  ['AI-built farms record ownership', /addN\('f',x,y,farmFood\(t\),1\);if\(n\)n\.t=t/.test(html)],
  ['farm technology only affects the researching kingdom', /n\.k==='f'&&n\.fm&&n\.t===b\.t&&S\.nd\[n\.y\*W\+n\.x\]===n/.test(html)],
  ['infantry armour upgrades use explicit unit classes', html.includes("const INFARM=new Set(['mil','spear','tk','woad','bers','saml','huskarl','jaguar','kamayuk','shotel','axe','gbeto'])")],
  ['archer armour upgrades use explicit unit classes', html.includes("const ARCHARM=new Set(['arc','xbow','lbow','skirm','genoa','plumed','chuko','jan','hcan','conq','wagon','eled','mgd'])")],
  ['combat damage applies both armour class upgrades', html.includes('ib=(INFARM.has(t.k)&&ta.armI?1:0)+(ARCHARM.has(t.k)&&ta.armR?1:0)')],
  ['farm reseeding uses 60 wood and accurate feedback', /S\.res\[u\.t\]\.w>=60[\s\S]{0,120}Farm reseeded \(-60 wood\)/.test(html)],
];

for (const [name, ok] of checks) {
  if (!ok) throw new Error(`FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}
console.log(`PASS: parsed ${inline.length} inline JavaScript blocks`);
