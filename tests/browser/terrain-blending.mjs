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
  return {edges,cacheHit,bounded,reloaded,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data};
 });
 assert.equal(result.before,result.after,'drawing preserves the world checkpoint');
 for(const {edge,pixels,center}of result.edges){
  assert.deepEqual(center,[224,32,32,255],'tile interior keeps its original texture');
  for(let i=0;i<4;i++)if(i===edge)assert.ok(pixels[i][1]>90&&pixels[i][0]<150,'only requested edge mixes the neighbor texture');
  else assert.deepEqual(pixels[i],[224,32,32,255],'other edges remain unchanged');
 }
 assert.ok(result.cacheHit&&result.bounded&&result.reloaded,'bounded texture reuse and image invalidation');
 const {writeFile}=await import('node:fs/promises');
 await writeFile(output+'/terrain-transitions.png',Buffer.from(result.data.split(',')[1],'base64'));
 delete result.data;return result;
}
