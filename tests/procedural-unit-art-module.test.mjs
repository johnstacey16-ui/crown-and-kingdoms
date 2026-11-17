import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {coreGameScriptPaths,browserScriptPaths} from '../scripts/runtime-sources.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const render=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const procedural=readFileSync(new URL('../js/render-procedural-units.js',import.meta.url),'utf8');
const troops=readFileSync(new URL('../js/render-troops.js',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');

test('fallback art has a single new source owner and is still offline',()=>{
 const paths=browserScriptPaths(html);
 assert.equal(paths.filter(p=>p==='./js/render-procedural-units.js').length,1,
  'procedural fallback must have exactly one runtime script owner');
 assert.equal(paths.indexOf('./js/render-procedural-units.js'),paths.indexOf('./js/render-buildings.js')+1);
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
 assert.match(troops,/paintUnit\(/);
});

test('unique DLC fallback weapons have distinct deterministic illustrated poses',()=>{
 const U={vil:{},mil:{},knight:{mt:true},ele:{mt:true},gal:{sh:true},ram:{}};
 const {MP,man}=vm.runInNewContext(procedural+'\n({MP,man})',{
  U,
  pg:()=>{},
  shd:color=>color,
  lin:(_g,_a,_b,_c,_d,color)=>color
 });
 assert.equal(MP.warpriest.wpn,'mace');
 assert.equal(MP.obuch.wpn,'mace');
 assert.equal(MP.chakram.wpn,'chakram');
 assert.equal(MP.urumi.wpn,'urumi');
 for(const name of ["case'mace'","case'chakram'","case'urumi'"])
  assert.ok(procedural.includes(name),name+' draw state');
 for(const kind of ['warpriest','obuch','chakram','urumi']){
  const signatures=[];
  for(const frame of [0,1,2,3]){
   const calls=[];
   const g={createRadialGradient(){return {addColorStop(){}}}};
   for(const op of ['save','restore','scale','translate','rotate','beginPath','moveTo','lineTo',
    'closePath','fill','stroke','fillRect','strokeRect','arc','ellipse','quadraticCurveTo']){
    g[op]=(...args)=>{calls.push([op,...args]);for(const val of args)assert.ok(Number.isFinite(val),kind+' invalid geometry')};
   }
   assert.doesNotThrow(()=>man(g,kind,'#3399ee',2,frame,true),kind+' attack frame '+frame);
   assert.ok(calls.some(call=>call[0]==='stroke'),kind+' must draw weapon strokes');
   signatures.push(JSON.stringify(calls));
  }
  assert.ok(new Set(signatures).size>1,kind+' attack poses should not collapse');
 }
});
