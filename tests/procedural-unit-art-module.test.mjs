import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {coreGameScriptPaths,browserScriptPaths} from '../scripts/runtime-sources.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const render=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const procedural=readFileSync(new URL('../js/render-procedural-units.js',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');

test('fallback art has a single new source owner and is still offline',()=>{
 const paths=browserScriptPaths(html);
 assert.equal(paths.filter(p=>p==='./js/render-procedural-units.js').length,1,
  'procedural fallback must have exactly one runtime script owner');
 assert.equal(paths.indexOf('./js/render-procedural-units.js'),paths.indexOf('./js/render.js')+1);
 assert.ok(coreGameScriptPaths(html).includes('./js/render-procedural-units.js'));
 assert.ok(sw.includes("'./js/render-procedural-units.js'"));
 assert.doesNotMatch(render,/const MP=|function paintUnit\(|function man\(|const USZ=/);
 assert.match(procedural,/const MP=\{/);
 assert.match(procedural,/function paintUnit\(/);
 assert.match(render,/function spr\(/);
});
test('procedural palette and original fallback sizing are unchanged',()=>{
 assert.doesNotThrow(()=>new vm.Script(procedural));
 const U={vil:{},mil:{},knight:{mt:true},ele:{mt:true},gal:{sh:true},ram:{}};
 const {MP,USZ}=vm.runInNewContext(procedural+'\n({MP,USZ})',{U});
 assert.ok(MP.vil&&MP.mil&&MP.conq&&MP.genoa);
 for(const [kind,size] of [['vil',[56,72]],['knight',[90,86]],['ram',[100,90]],
  ['gal',[110,90]],['ele',[130,120]]])
  assert.deepEqual(JSON.parse(JSON.stringify(USZ(kind))),size);
});
test('fallback dispatcher retains original painted-miss routes',()=>{
 for(const part of ['if(U[k].sh)shp(', "else if(k==='ram'",'else if(U[k].mt','else man(g,k,tc,st,fr)'])
  assert.ok(procedural.includes(part),part);
 assert.match(procedural,/Object\.assign\(MP,\{/);
 assert.match(render,/paintUnit\(/);
});
