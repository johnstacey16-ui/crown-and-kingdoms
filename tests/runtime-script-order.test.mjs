import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths,readBrowserRuntime,readBrowserSubset,loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('browser script references are unique, safely rooted and in declared order',()=>{
 const scripts=browserScriptPaths(html);
 const core=coreGameScriptPaths(html);
 assert.ok(scripts.length>core.length,'browser bootstrap and transports must surround the core game');
 for(const path of ['./js/simulation-combat-bonuses.js','./js/simulation-victory.js','./js/simulation-logistics.js','./js/simulation-resource-routing.js','./js/simulation-production-queues.js','./js/simulation-research.js','./js/simulation-building-production.js',
  './js/ai-policy.js','./js/engine-graphics-benchmark.js'])
  assert.ok(scripts.includes(path),'required split runtime module '+path);
 assert.equal(scripts[0],'./persistence.js');
 assert.equal(scripts.at(-1),'./multiplayer.js');
 assert.ok(scripts.includes('./js/network-webrtc.js'));
 assert.ok(scripts.includes('./js/network-supabase.js'));
 assert.equal(scripts.indexOf('./js/render-procedural-units.js'),scripts.indexOf('./js/render.js')+1);
 assert.equal(scripts.indexOf('./js/simulation-logistics.js')+1,scripts.indexOf('./js/simulation-resource-routing.js'));
 assert.equal(scripts.indexOf('./js/simulation-resource-routing.js')+1,scripts.indexOf('./js/simulation-production-queues.js'));
 assert.equal(scripts.indexOf('./js/simulation-production-queues.js')+1,scripts.indexOf('./js/simulation-research.js'));
 assert.equal(scripts.indexOf('./js/simulation-research.js')+1,scripts.indexOf('./js/simulation-building-production.js'));
 assert.equal(scripts.indexOf('./js/simulation-building-production.js')+1,scripts.indexOf('./js/simulation.js'));
 assert.equal(scripts.indexOf('./js/simulation-combat-bonuses.js'),scripts.indexOf('./js/simulation-victory.js')-1);
 assert.throws(()=>browserScriptPaths('<script src="../secret.js"></script>'),/Unsafe browser script path/);
 assert.throws(()=>browserScriptPaths('<script src="./engine.js"></script><script src="./engine.js"></script>'),/Duplicate browser script reference/);
});
test('headless production source order excludes only canvas UI and atlas manager',()=>{
 const production=coreGameScriptPaths(html),paths=coreGameScriptPaths(html,{includeUI:false,includeAssets:false});
 assert.deepEqual(paths,production.filter(p=>p!=='./js/ui.js'&&p!=='./js/assets.js'));
 assert.equal(paths[0],'./js/config.js');
 assert.equal(paths.at(-1),'./engine.js');
 assert.ok(paths.indexOf('./js/ai.js')<paths.indexOf('./js/pathfinding.js'));
 assert.ok(paths.indexOf('./js/kingdom.js')<paths.indexOf('./js/entities.js'));
 assert.ok(paths.includes('./js/render-procedural-units.js'));
 assert.ok(production.includes('./js/ui.js')&&production.includes('./js/assets.js'));
 assert.equal(paths.length,production.length-2,'headless excludes exactly UI and atlas manager');
 assert.equal(loadCoreGameSource(),paths.map(p=>readFileSync(new URL('../'+p.slice(2),import.meta.url),'utf8')).join('\n'));
});
test('source validator sees every browser script, including both network transport implementations',()=>{
 const scripts=readBrowserRuntime({html});
 assert.deepEqual(scripts.map(x=>x.path),browserScriptPaths(html),
  'source syntax scanner must load every production browser script');
 for(const {path,source} of scripts)assert.doesNotThrow(()=>new vm.Script(source,{filename:path}));
});
test('broken production script ranges are rejected rather than silently omitted',()=>{
 assert.throws(()=>coreGameScriptPaths('<script src="./engine.js"></script><script src="./js/config.js"></script>'),/missing or misordered/);
 assert.throws(()=>coreGameScriptPaths('<script src="./engine.js"></script>'),/missing or misordered/);
});

test('focused multiplayer test harness loads its authenticated command stack in live order',()=>{
 const subset=['./js/network-sync.js','./js/network-commands.js',
  './js/network-delivery.js','./js/network-uplink.js'];
 const loaded=readBrowserSubset(subset,{html});
 assert.deepEqual(loaded.map(x=>x.path),subset);
 for(const {path,source} of loaded)assert.doesNotThrow(()=>new vm.Script(source,{filename:path}));
 assert.throws(()=>readBrowserSubset([...subset].reverse(),{html}),/out-of-order/);
 assert.throws(()=>readBrowserSubset(['./js/not-a-script.js'],{html}),/Missing, duplicate or out-of-order/);
 const networkFixture=readFileSync(new URL('./helpers/network-world.mjs',import.meta.url),'utf8');
 assert.match(networkFixture,/const networkSource=readBrowserSubset\(/);
 assert.doesNotMatch(networkFixture,/new URL\('\.\.\/\.\.\/js\/network-(?:sync|commands|delivery|uplink)\.js'/);
});
