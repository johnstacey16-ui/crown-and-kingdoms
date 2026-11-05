import assert from 'node:assert/strict';

export async function checkTerrainBlending(page,output){
 const result=await page.evaluate(()=>{
  const original=PAINT.terrain,before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const source=document.createElement('canvas');source.width=192;source.height=128;
  const sg=source.getContext('2d');
  ['#e02020','#20d020','#2040e0','#d0c090','#777777','#cccccc'].forEach((c,k)=>{sg.fillStyle=c;sg.fillRect(k%3*64,Math.floor(k/3)*64,64,64)});
  let edges,cacheHit,bounded,reloaded;
  try{
   PAINT.terrain=source;
   edges=[0,1,2,3].map(edge=>{
    const neighbors=[-1,-1,-1,-1];neighbors[edge]=1;
    const tile=terrainTileTexture(0,0,0,neighbors),g=tile.getContext('2d');
    const points=[[0,32],[63,32],[32,0],[32,63]];
    return {edge,pixels:points.map(([x,y])=>Array.from(g.getImageData(x,y,1,1).data)),center:Array.from(g.getImageData(32,32,1,1).data)};
   });
   const a=terrainTileTexture(0,0,0,[1,-1,-1,-1]);cacheHit=a===terrainTileTexture(0,0,0,[1,-1,-1,-1]);
   for(let i=0;i<400;i++)terrainTileTexture(0,i%3,0,[1,(i>>2)%6,(i>>5)%6,(i>>1)%6]);
   bounded=TERRAIN_BLEND.size<=256;
   PAINT.terrain=original;reloaded=terrainTileTexture(0,0,0,[1,-1,-1,-1])!==a;
  }finally{PAINT.terrain=original;clearTerrainBlend()}
  // Controlled offscreen loss: blank the actual cached canvases and expose the
  // loss flag before event delivery. The old reuse path leaves black transition
  // tiles; the production recovery path must recreate the exact original pixels.
  const texture=terrainTileTexture,recorded=new Map(),retired=new Set();let recovery;
  const probe=()=>{const c=document.createElement('canvas');c.width=640;c.height=384;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);const kindAt=(x,y)=>x>=3&&x<=6&&y>=3&&y<=6?1:0;for(let y=0;y<9;y++)for(let x=0;x<9;x++)paintTerrain(g,kindAt(x,y),x,y,320+(x-y)*32,48+(x+y)*16,64,32,true,terrainNeighborKinds(x,y,kindAt,9,9));return c};
  try{
   clearTerrainBlend();terrainTileTexture=(...args)=>{const tile=texture(...args);if(tile)recorded.set(JSON.stringify(args),tile);return tile};
   const healthy=probe(),expected=healthy.getContext('2d').getImageData(0,0,640,384).data;
   for(const tile of recorded.values()){const g=tile.getContext('2d');g.clearRect(0,0,tile.width,tile.height);g.isContextLost=()=>true;retired.add(tile)}
   terrainTileTexture=(...args)=>recorded.get(JSON.stringify(args))||null;
   const broken=probe();terrainTileTexture=texture;const repaired=probe();
   const compare=c=>{const data=c.getContext('2d').getImageData(0,0,640,384).data;let differences=0,blackPixels=0;for(let i=0;i<data.length;i++){if(data[i]!==expected[i])differences++;if(i%4===0&&expected[i]+expected[i+1]+expected[i+2]>30&&data[i]+data[i+1]+data[i+2]===0)blackPixels++}return {differences,blackPixels}};
   const pixels=terrainBlendPixels,entries=TERRAIN_BLEND.size;
   for(const tile of retired)tile.dispatchEvent(new Event('contextlost'));
   recovery={blankedTextures:retired.size,broken:compare(broken),repaired:compare(repaired),lateEventsPreserveReplacement:pixels===terrainBlendPixels&&entries===TERRAIN_BLEND.size,brokenImage:broken.toDataURL(),repairedImage:repaired.toDataURL()};
  }finally{terrainTileTexture=texture;clearTerrainBlend()}
  // Original art, same world geometry: a clear visual comparison in both projections.
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=720;
  const g=canvas.getContext('2d');g.fillStyle='#111c24';g.fillRect(0,0,1200,720);
  const kindAt=(x,y)=>y<3?(x<3?0:1):y===3?3:2;
  for(let side=0;side<2;side++){
   g.fillStyle='#eadfc2';g.font='22px Georgia';g.fillText(side?'Textured transitions':'Previous tile edges',side*600+25,35);
   for(let y=0;y<7;y++)for(let x=0;x<7;x++){
    const ns=side?terrainNeighborKinds(x,y,kindAt,7,7):null;
    paintTerrain(g,kindAt(x,y),x,y,side*600+300+(x-y)*32,90+(x+y)*16,64,32,true,ns);
    paintTerrain(g,kindAt(x,y),x,y,side*600+70+x*64,350+y*48,64,48,false,ns);
   }
  }
  const data=canvas.toDataURL();
  return {recovery,edges,cacheHit,bounded,reloaded,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data};
 });
 assert.equal(result.before,result.after,'drawing preserves the world checkpoint');
 for(const {edge,pixels,center}of result.edges){
  assert.deepEqual(center,[224,32,32,255],'tile interior keeps its original texture');
  for(let i=0;i<4;i++)if(i===edge)assert.ok(pixels[i][1]>90&&pixels[i][0]<150,'only requested edge mixes the neighbor texture');
  else assert.deepEqual(pixels[i],[224,32,32,255],'other edges remain unchanged');
 }
 assert.ok(result.cacheHit&&result.bounded&&result.reloaded,'bounded texture reuse and image invalidation');
 assert.ok(result.recovery.blankedTextures>0&&result.recovery.broken.blackPixels>100,'controlled loss reproduces black holes around dirt');
 assert.equal(result.recovery.repaired.differences,0,'recovered transitions match original terrain exactly');
 assert.equal(result.recovery.repaired.blackPixels,0);assert.equal(result.recovery.lateEventsPreserveReplacement,true);
 const {writeFile}=await import('node:fs/promises');
 await writeFile(output+'/terrain-transitions.png',Buffer.from(result.data.split(',')[1],'base64'));
 await writeFile(output+'/terrain-blend-loss-before.png',Buffer.from(result.recovery.brokenImage.split(',')[1],'base64'));
 await writeFile(output+'/terrain-blend-loss-after.png',Buffer.from(result.recovery.repairedImage.split(',')[1],'base64'));
 delete result.recovery.brokenImage;delete result.recovery.repairedImage;
 delete result.data;return result;
}
