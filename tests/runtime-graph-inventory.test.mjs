import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectRuntimeGraph} from '../scripts/audit-runtime-graph.mjs';

function sample(){
 const src='./engine.js',terrain='./assets/terrain.webp',atlas='./assets/troop.webp';
 const cached=['./','./index.html','./styles.css','./assets/atlas-manifest.json',
  './assets/art-revisions.json',src,terrain,atlas];
 return {
  html:'<script src="'+src+'"></script>',
  serviceWorker:'const CORE_ASSETS = '+JSON.stringify(cached).replace(/"/g,"'")+';',
  manifest:{terrain:{src:terrain},atlases:[{src:atlas}]},
  exists:p=>cached.includes(p)
 };
}

test('valid game shell with script and terrain/unit images passes',()=>{
 const r=inspectRuntimeGraph(sample());
 assert.deepEqual(r.errors,[]);
 assert.equal(r.scripts.length,1);
 assert.equal(r.images.length,2);
});

test('missing script in offline shell fails',()=>{
 const s=sample();s.serviceWorker=s.serviceWorker.replace("'./engine.js',",'');
 const r=inspectRuntimeGraph(s);
 assert.ok(r.errors.some(x=>x.includes('absent from offline cache: ./engine.js')));
});

test('missing artwork, duplicate cached paths and unsafe parent traversal fail',()=>{
 const s=sample();s.exists=p=>p!=='./assets/troop.webp';
 s.serviceWorker=s.serviceWorker.replace("'./engine.js',","'./engine.js','./engine.js',");
 s.html='<script src="../private.js"></script>';
 const r=inspectRuntimeGraph(s);
 assert.ok(r.errors.some(x=>x.includes('Missing runtime file or directory: ./assets/troop.webp')));
 assert.ok(r.errors.some(x=>x.includes('Duplicate cached path: ./engine.js')));
 assert.ok(r.errors.some(x=>x.includes('Unsafe/invalid runtime path: ../private.js')));
});
