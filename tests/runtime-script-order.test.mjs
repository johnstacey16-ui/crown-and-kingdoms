import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths,readBrowserRuntime,loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('browser script references are unique, safely rooted and in declared order',()=>{
 const scripts=browserScriptPaths(html);
 assert.equal(scripts.length,33);
 assert.equal(scripts[0],'./persistence.js');
 assert.equal(scripts.at(-1),'./multiplayer.js');
 assert.ok(scripts.includes('./js/network-webrtc.js'));
 assert.ok(scripts.includes('./js/network-supabase.js'));
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
 assert.equal(loadCoreGameSource(),paths.map(p=>readFileSync(new URL('../'+p.slice(2),import.meta.url),'utf8')).join('\n'));
});
test('source validator sees every browser script, including both network transport implementations',()=>{
 const scripts=readBrowserRuntime({html});
 assert.equal(scripts.length,33);
 for(const {path,source} of scripts)assert.doesNotThrow(()=>new vm.Script(source,{filename:path}));
});
test('broken production script ranges are rejected rather than silently omitted',()=>{
 assert.throws(()=>coreGameScriptPaths('<script src="./engine.js"></script><script src="./js/config.js"></script>'),/missing or misordered/);
 assert.throws(()=>coreGameScriptPaths('<script src="./engine.js"></script>'),/missing or misordered/);
});
