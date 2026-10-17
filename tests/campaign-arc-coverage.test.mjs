import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../js/campaign.js',import.meta.url),'utf8');
const arcsText=source.match(/const CAMP_ARCS=\[[^\n]+/);
assert.ok(arcsText,'campaign arc definitions must exist');
const arcs=vm.runInNewContext(arcsText[0].replace(/^const CAMP_ARCS=/,'').replace(/;$/,''),{});
const ids=arcs.flatMap(arc=>arc.ids);
assert.equal(ids.length,19,'all 19 missions should appear exactly once');
assert.equal(new Set(ids).size,19,'mission must not appear in multiple arcs');
assert.deepEqual([...ids].sort((a,b)=>a-b),Array.from({length:19},(_,i)=>i));
const next=(i)=>{const arc=arcs.find(a=>a.ids.includes(i));if(!arc)return null;const pos=arc.ids.indexOf(i);return pos<arc.ids.length-1?arc.ids[pos+1]:null};
for(const arc of arcs){
 for(let j=0;j<arc.ids.length;j++)assert.equal(next(arc.ids[j]),arc.ids[j+1]??null);
}
assert.equal(next(-1),null);
assert.equal(next(19),null);
assert.match(source,/cmp\.t\+=dt;cmp\.k=/,'campaign clock advances by simulation delta');
assert.match(source,/sc\.ev\.forEach\(/,'events checked each tick');
assert.match(source,/if\(!tcOf\(0\)\)/,'Town Centre defeat remains enforced');
console.log('Campaign arc and event wiring regression passed');
