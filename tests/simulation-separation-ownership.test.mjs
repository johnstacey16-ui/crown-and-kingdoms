import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const separation = readFileSync(new URL('../js/simulation-separation.js', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

assert.match(separation, /const SEP_GRID=new Map\(\),SEP_BUCKET_POOL=\[\];/, 'simulation module must own reusable spatial separation buckets');
assert.match(separation, /function sep\(\)\{const us=S\.us;if\(us\.length<=64\)/, 'simulation module must preserve the linear path only for armies of 64 units or fewer');
assert.match(separation, /SEP_BUCKET_POOL\.pop\(\)\|\|\[\]/, 'large-army separation must reuse pooled bucket arrays');
assert.doesNotMatch(simulation, /SEP_GRID|function sep\(\)/, 'main simulation no longer duplicates separation');
assert.doesNotMatch(engine, /SEP_GRID|function sep\(\)/, 'engine orchestration must not own the separation algorithm');
assert.ok(html.indexOf('src="./js/simulation.js"') < html.indexOf('src="./js/simulation-separation.js"'), 'separation follows movement primitive');
assert.ok(html.indexOf('src="./js/simulation-separation.js"') < html.indexOf('src="./engine.js"'), 'separation loads before engine starts');
for(const paths of [browserScriptPaths(html),coreGameScriptPaths(html),coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
 const i=paths.indexOf('./js/simulation-separation.js');
 assert.ok(i>0);
 assert.equal(paths[i-1],'./js/simulation.js');
 assert.equal(paths[i+1],'./js/ai-policy.js');
 assert.equal(paths.filter(x=>x==='./js/simulation-separation.js').length,1);
}
assert.ok(sw.includes("'./js/simulation-separation.js'"));
assert.doesNotThrow(()=>new vm.Script(separation));
const W=24,H=24,n=W*H;
const S={us:Array.from({length:70},(_,i)=>({x:8.5+(i%7)*.08,y:8.5+Math.floor(i/7)*.07,hp:25,ld:null,sh:false,t:0})),g:new Uint8Array(n),gt:new Uint8Array(n),wt:new Uint8Array(n),nd:Array(n).fill(null)};
const context=vm.createContext({S,W,H});
const move=simulation.slice(simulation.indexOf('const mv=(u,dx,dy)=>'),simulation.indexOf('/* Local spatial grid'));
// The original movement primitive stays in the main simulation.
assert.ok(move.startsWith('const mv='));
vm.runInContext(move+'\n'+separation+'\nsep();',context);
assert.equal(S.us.length,70);
assert.ok(S.us.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H));
assert.ok(S.us.some((u,i)=>Math.abs(u.x-(8.5+(i%7)*.08))>1e-8||Math.abs(u.y-(8.5+Math.floor(i/7)*.07))>1e-8),'large-army separation moves overlapping units');
vm.runInContext('sep();',context);
assert.ok(S.us.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)));


console.log('simulation-separation-ownership: spatial grid, fallback and script order passed');
