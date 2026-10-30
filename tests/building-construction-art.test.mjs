import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function fixture(){
 const source=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
 const sandbox={};vm.createContext(sandbox);vm.runInContext(source.slice(source.indexOf('function drawBuildingAgeDetails('),source.indexOf('function drawBld('))+';globalThis.draw=drawBuildingArtwork',sandbox);
 const calls=[],g=new Proxy({drawImage(...args){calls.push(['image',...args])}},{get(o,k){return o[k]||((...args)=>calls.push([k,...args]))}});
 const image={},art={img:image,painted:true,f:{x:10,y:20,w:200,h:160,ax:100,ay:150}};
 return {draw:sandbox.draw,g,calls,art,image};
}
test('completed buildings, placement ghosts and nonpainted fallbacks keep exact native source sampling',()=>{
 for(const type of ['complete','ghost','fallback']){
  const f=fixture();if(type==='fallback')f.art.painted=false;
  f.draw(f.g,f.art,300,240,.5,type==='complete',.1,type==='ghost');
  assert.deepEqual(f.calls,[['image',f.image,10,20,200,160,250,165,100,80]]);
 }
});
test('four construction stages reveal foundations before roofs, clamp invalid progress and restore context',()=>{
 const rectangles=[];
 for(const progress of [0,.25,.6,.9,1,NaN,-1,2]){
  const f=fixture(),original=JSON.stringify(f.art.f);f.draw(f.g,f.art,300,240,.5,false,progress);
  const rect=f.calls.find(c=>c[0]==='rect');rectangles.push(rect);
  assert.equal(f.calls.filter(c=>c[0]==='save').length,2);assert.equal(f.calls.filter(c=>c[0]==='restore').length,2);
  assert.equal(f.calls.filter(c=>c[0]==='image').length,1);assert.equal(JSON.stringify(f.art.f),original);
 }
 assert.ok(rectangles[0][2]>rectangles[1][2]&&rectangles[1][2]>rectangles[2][2]&&rectangles[2][2]>rectangles[3][2]);
 assert.deepEqual(rectangles[0],rectangles[5]);assert.deepEqual(rectangles[0],rectangles[6]);assert.deepEqual(rectangles[4],rectangles[7]);
 const f=fixture();f.g.drawImage=()=>{throw Error('unavailable image')};assert.throws(()=>f.draw(f.g,f.art,0,0,1,false,.2));
 assert.equal(f.calls.at(-1)[0],'restore');
});
