import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const render=readFileSync(new URL('../js/render-terrain.js',import.meta.url),'utf8');
const from=render.indexOf('function chunkOf(');
const to=render.length;
assert.ok(from>=0&&to>from,'test extracts the exact production chunk painter');
const production=render.slice(from,to);

function scene({CW=2560,CH=1440,zoom=.8,DPR=1,center=128}={}){
 let paints=0,details=0;
 const blits=[],created=[],scales=[];
 const TCH=new Map();
 const fake={
  CKS:8,W:256,H:256,TCH,CW,CH,zm:zoom,DPR,S:{ex:new Uint8Array(256*256).fill(1)},
  cam:{x:0,y:0},
  document:{createElement(tag){
   assert.equal(tag,'canvas');
   // This suite exercises the original chunk fallback; the separate viewport
   // suite supplies a complete compositing context and checks its cache.
   const cv={width:0,height:0,getContext(kind,options){assert.equal(kind,'2d');if(options?.alpha===false){const i=created.indexOf(cv);if(i>=0)created.splice(i,1);return null}return {scale(...args){scales.push(args)}};}};
   created.push(cv);return cv;
  }},
  paintTile(){paints++},
  paintTileDetail(){details++},
  X:{drawImage(image,x,y,w,h){blits.push({image,x,y,w,h});}}
 };
 vm.runInNewContext(production+'\n;({chunkOf,drawChunks})',fake,{timeout:15000});
 function view(centerX=center,centerY=center){
  const z=fake.zm;
  fake.cam.x=(centerX-centerY)*32*z-fake.CW/2;
  fake.cam.y=(centerX+centerY)*16*z-fake.CH/2;
  const corners=[[0,0],[CW,0],[0,CH],[CW,CH]]
   .map(([sx,sy])=>{
    const ax=(sx+fake.cam.x)/(32*z),ay=(sy+fake.cam.y)/(16*z);
    return [(ax+ay)/2,(ay-ax)/2];
   });
  return [
   Math.max(0,Math.floor(Math.min(...corners.map(c=>c[0])))-1),
   Math.min(fake.W-1,Math.ceil(Math.max(...corners.map(c=>c[0])))+1),
   Math.max(0,Math.floor(Math.min(...corners.map(c=>c[1])))-1),
   Math.min(fake.H-1,Math.ceil(Math.max(...corners.map(c=>c[1])))+1)
  ];
 }
 function expected(rect){
  const [x0,x1,y0,y1]=rect,visible=[];
  for(let cy=y0>>3;cy<=y1>>3;cy++)for(let cx=x0>>3;cx<=x1>>3;cx++){
   const wx=cx*8,wy=cy*8,ox=(wx-wy-7)*32-32,oy=(wx+wy+1)*16-16;
   const sx=ox*fake.zm-fake.cam.x,sy=oy*fake.zm-fake.cam.y,
    sw=8*64*fake.zm,sh=((2*8-2)*16+32)*fake.zm;
   if(sx>=CW||sy>=CH||sx+sw<=0||sy+sh<=0)continue;
   visible.push({sx,sy,sw,sh,key:cx*4096+cy});
  }
  return visible;
 }
 function draw(rect=view()){
  blits.length=0;
  fake.drawChunks(...rect);
  return blits.map(b=>({...b}));
 }
 return {
  fake,TCH,created,scales,view,expected,draw,
  get paints(){return paints;},get details(){return details;},
  get blits(){return blits;}
 };
}

test('wide zoomed-out isometric view paints ONLY visible chunks, never its rectangular world padding',()=>{
 const s=scene(),r=s.view(),raw=((r[1]>>3)-(r[0]>>3)+1)*((r[3]>>3)-(r[2]>>3)+1);
 const visible=s.expected(r),actual=s.draw(r);
 assert.ok(raw>=150,'large diamond projection historically requested many chunks');
 assert.ok(visible.length>48,'the old fixed 48-entry LRU would repeatedly evict visible terrain');
 assert.ok(visible.length<raw,'offscreen isometric corners are excluded before painting');
 assert.equal(actual.length,visible.length,'all on-screen chunks appear once');
 assert.equal(s.created.length,visible.length,'no offscreen canvas allocation');
 assert.equal(s.paints,visible.length*64,'only 8x8 tiles in onscreen chunks are repainted');
 assert.equal(s.details,s.paints,'per-tile detail is cached alongside painted terrain');
 for(let i=0;i<actual.length;i++){
  const a=actual[i],e=visible[i];
  assert.equal(a.x,e.sx,'identical placement, no parallax');
  assert.equal(a.y,e.sy,'identical placement, no terrain seam offset');
  assert.equal(a.w,e.sw,'same painted source width');
  assert.equal(a.h,e.sh,'same painted source height');
  assert.equal(a.image.width,512,'original cached chunk backing width preserved');
  assert.equal(a.image.height,256,'original cached chunk backing height preserved');
 }
});
test('terrain is NOT repainted on successive gameplay frames when camera is stationary',()=>{
 const s=scene(),r=s.view();
 const first=s.draw(r),count=s.paints;
 assert.ok(first.length>48);
 for(let i=0;i<30;i++){
  assert.equal(s.draw(r).length,first.length,'same complete terrain every frame');
  assert.equal(s.paints,count,'no repeated texture sampling/paint calls');
 }
 assert.equal(s.TCH.size,first.length,'visible chunks retained across all frames');
});
test('camera panning retains an overlap cushion while bounding terrain canvas memory',()=>{
 const s=scene({CW:1920,CH:1080,zoom:.8});
 s.draw(s.view(110,110));
 let paints=s.paints;
 for(let k=0;k<30;k++){
  const r=s.view(110+k*.6,110+k*.4),v=s.expected(r);
  assert.equal(s.draw(r).length,v.length,'each camera position fully covered');
  assert.ok(s.TCH.size<=224,'cache never grows beyond memory budget');
  const added=(s.paints-paints)/64;
  assert.ok(added<v.length,'small pan reuses most formerly painted chunks');
  paints=s.paints;
 }
});
test('fog-hidden chunks cost no draws, then reappear exactly when exploration expands',()=>{
 const s=scene({CW:1280,CH:720,zoom:1.4,center:128}),r=s.view(),original=s.expected(r);
 assert.ok(original.length>1);
 s.fake.S.ex.fill(0);
 assert.equal(s.draw(r).length,0,'unknown terrain never uploads');
 assert.equal(s.created.length,0,'unknown terrain never allocates');
 assert.equal(s.paints,0,'unknown terrain never textures tiles');
 const central=original[Math.floor(original.length/2)],cx=Math.floor(central.key/4096),cy=central.key%4096;
 s.fake.S.ex[(cy*8)*s.fake.W+cx*8]=1;
 let actual=s.draw(r);
 assert.equal(actual.length,1,'the first explored tile reveals its chunk immediately');
 assert.equal(s.TCH.size,1);
 assert.equal(s.paints,64,'only the discovered chunk is painted');
 assert.deepEqual([actual[0].x,actual[0].y,actual[0].w,actual[0].h],
  [central.sx,central.sy,central.sw,central.sh]);
 const before=s.paints;s.draw(r);assert.equal(s.paints,before,'explored chunks still reuse atlas cache');
 s.fake.S.ex.fill(1);actual=s.draw(r);
 assert.equal(actual.length,original.length);
 for(let i=0;i<original.length;i++)assert.deepEqual(
  [actual[i].x,actual[i].y,actual[i].w,actual[i].h],
  [original[i].sx,original[i].sy,original[i].sw,original[i].sh]);
 s.fake.S.ex.fill(0);
 assert.equal(s.draw(r).length,0,'cached chunks become invisible if exploration is reset');
});

test('map-edge visibility is bounded and an explored chunk still renders at any tile kind',()=>{
 const s=scene({CW:1280,CH:720,zoom:1.4,center:12}),r=s.view(),original=s.expected(r);
 assert.ok(original.length);
 s.fake.S.ex.fill(0);
 const focus=original[0],cx=Math.floor(focus.key/4096),cy=focus.key%4096;
 s.fake.S.ex[cy*8*s.fake.W+cx*8]=1;
 assert.equal(s.draw(r).length,1);
});

test('zoom changes, resolution changes and terrain invalidation remain safe',()=>{
 for(const [w,h,z] of [[1280,720,1.4],[1920,1080,1],[2560,1440,.8],[3840,2160,.8],[5120,2880,.8],[1920,1080,3]]){
  const s=scene({CW:w,CH:h,zoom:z}),r=s.view(),v=s.expected(r);
  assert.equal(s.draw(r).length,v.length,'visible terrain count for '+[w,h,z]);
  assert.equal(s.created.length,v.length,'offscreen chunks not created for '+[w,h,z]);
  assert.ok(s.TCH.size>=v.length,'large viewport never evicts its own visible chunks');
  const before=s.paints;
  s.draw(r);
  assert.equal(s.paints,before,'stable viewport never invalidates '+[w,h,z]);
  s.TCH.clear();
  s.draw(r);
  assert.equal(s.paints,before*2,'explicit map/texture invalidation paints fresh terrain '+[w,h,z]);
 }
});


test('unavailable or lost terrain chunks request tile fallback and can rebuild on the next frame',()=>{
 const s=scene(),rect=s.view();s.draw(rect);
 const first=s.TCH.values().next().value,ctx={isContextLost:()=>true};first.cv.getContext=()=>ctx;
 assert.equal(s.fake.drawChunks(...rect),true);assert.ok(![...s.TCH.values()].includes(first),'lost cached chunk was replaced');
 s.TCH.clear();s.fake.document.createElement=()=>({width:0,height:0,getContext:()=>null});
 assert.equal(s.fake.drawChunks(...rect),false,'drawWorld must paint its existing tile fallback');assert.equal(s.TCH.size,0);
 s.fake.document.createElement=()=>{throw Error('out of canvas storage')};
 assert.equal(s.fake.drawChunks(...rect),false,'allocation failure cannot leave a valid blank terrain cache');
});

test('half-resolution Xbox canvas retains the same terrain extent with 75% fewer chunk backing pixels',()=>{
 const s=scene({CW:1280,CH:720,zoom:.8,DPR:.5}),rect=s.view(),expected=s.expected(rect);
 const first=s.draw(rect);
 assert.equal(first.length,expected.length);
 assert.ok(first.length>0);
 for(let i=0;i<first.length;i++){
  assert.deepEqual([first[i].x,first[i].y,first[i].w,first[i].h],
   [expected[i].sx,expected[i].sy,expected[i].sw,expected[i].sh],
   'source prefilter cannot move or shrink buildings, units or terrain on screen');
  assert.equal(first[i].image.width,256);assert.equal(first[i].image.height,128);
 }
 assert.equal(s.scales.length,first.length);
 assert.ok(s.scales.every(args=>args[0]===.5&&args[1]===.5));
 const firstPaints=s.paints;
 for(let i=0;i<30;i++)s.draw(rect);
 assert.equal(s.paints,firstPaints,'stationary reduced terrain does not rebuild');
 assert.equal([...s.TCH.values()].reduce((n,c)=>n+c.cv.width*c.cv.height,0),first.length*256*128);
});
test('zoom/DPR upgrade restores native terrain pixels and releases obsolete cache surfaces',()=>{
 const s=scene({CW:1280,CH:720,zoom:.8,DPR:.5}),rect=s.view(),reduced=s.draw(rect);
 const first=reduced[0].image,n=reduced.length;
 s.fake.DPR=1;
 const sharp=s.draw(rect);
 assert.equal(sharp.length,n);
 assert.ok(sharp.every(d=>d.image.width===512&&d.image.height===256));
 assert.deepEqual(sharp.map(d=>[d.x,d.y,d.w,d.h]),reduced.map(d=>[d.x,d.y,d.w,d.h]));
 assert.equal(first.width,1,'the superseded reduced texture releases its GPU backing store');
 assert.equal(s.TCH.size,n,'replacing density never doubles the terrain cache');
 s.fake.DPR=.5;
 const again=s.draw(rect);
 assert.ok(again.every(d=>d.image.width===256&&d.image.height===128));
 assert.equal(s.TCH.size,n);
});
test('failed higher-resolution terrain allocation continues using valid reduced tiles without a blank map',()=>{
 const s=scene({CW:1280,CH:720,zoom:.8,DPR:.5}),rect=s.view(),first=s.draw(rect);
 s.fake.DPR=1;
 s.fake.document.createElement=()=>({width:0,height:0,getContext:()=>null});
 const fallback=s.draw(rect);
 assert.equal(fallback.length,first.length);
 assert.ok(fallback.every((x,i)=>x.image===first[i].image&&x.w===first[i].w));
 assert.ok([...s.TCH.values()].every(c=>c.density===.5));
});
