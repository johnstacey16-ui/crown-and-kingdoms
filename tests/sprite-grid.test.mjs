import test from 'node:test';
import assert from 'node:assert/strict';
import {extractSpriteGrid,reflowSpriteGrid} from '../scripts/sprite-grid.mjs';
function fixture(){const width=40,height=31,data=Buffer.alloc(width*height*4);for(let cell=0;cell<4;cell++){
 const x0=cell%2*20,y0=Math.round(Math.floor(cell/2)*height/2);
 for(let y=2;y<12;y++)for(let x=3;x<11;x++)data[((y0+y)*width+x0+x)*4+3]=255;
 data[((y0+6)*width+x0+2)*4+3]=20; // retain a soft edge adjacent to the body
 data[((y0+3)*width+x0+18)*4+3]=255; // reject detached neighbour fragment
}return{data,width,height};}

test('uneven grid rows isolate the main pose, preserve edge alpha and remove neighbouring fragments',()=>{
 const f=fixture(),result=extractSpriteGrid(f.data,f.width,f.height,2,2,4);
 for(let cell=0;cell<4;cell++){
  const x0=cell%2*20,y0=Math.round(Math.floor(cell/2)*f.height/2),frame=result.frames[cell];
  assert.equal(result.data[((y0+3)*f.width+x0+18)*4+3],0);
  assert.equal(result.data[((y0+6)*f.width+x0+2)*4+3],20);
  assert.equal(result.coverage[cell].primary,80);
  assert.ok(frame.x>=x0&&frame.y>=y0&&frame.x+frame.w<=x0+20&&frame.y+frame.h<=y0+16);
 }
 assert.equal(f.data[((3)*f.width+18)*4+3],255,'authoring source is preserved');
});

test('selective cleanup preserves unselected multi-part sprite cells byte for byte',()=>{
 const f=fixture(),r=extractSpriteGrid(f.data,f.width,f.height,2,2,4,[0]);
 assert.equal(r.frames[1],null);for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++)if(x>=20||y>=16){const i=(y*f.width+x)*4;assert.deepEqual(r.data.subarray(i,i+4),f.data.subarray(i,i+4));}
});

test('reflow preserves a complete weapon across a source-cell boundary and keeps soft edges',()=>{
 const width=160,height=80,data=Buffer.alloc(width*height*4),alpha=(x,y,a=255)=>{data[(y*width+x)*4+3]=a};
 for(const left of [20,120])for(let y=20;y<=50;y++)for(let x=left;x<=left+20;x++)alpha(x,y);
 for(let y=30;y<=32;y++)for(let x=40;x<=90;x++)alpha(x,y); // first figure's sword crosses x=80
 alpha(91,31,20);alpha(153,5);const before=Buffer.from(data);
 const packed=reflowSpriteGrid(data,width,height,2,1,2),frames=extractSpriteGrid(packed.data,packed.width,packed.height,2,1,2);
 assert.equal(packed.width,416);assert.equal(packed.height,112);
 const at=(x,y)=>frames.data[(y*packed.width+x)*4+3];
 assert.equal(at(90+64,31+16),255,'the full sword tip survives');
 assert.equal(at(91+64,31+16),20,'soft alpha at the tip survives');
 assert.equal(at(120+192,20+16),255,'the neighbouring character retains its own cell');
 assert.equal(at(153+192,5+16),0,'detached noise is excluded');
 assert.ok(frames.frames[0].x+frames.frames[0].w<208);
 assert.deepEqual(data,before,'reflow never alters its source');
});

test('reflow rejects missing or ambiguous full figures rather than publishing a partial sheet',()=>{
 const data=Buffer.alloc(80*80*4);for(const x0 of [5,30])for(let y=5;y<15;y++)for(let x=x0;x<x0+10;x++)data[(y*80+x)*4+3]=255;
 assert.throws(()=>reflowSpriteGrid(data,80,80,1,1,1),/Ambiguous/);
 assert.throws(()=>reflowSpriteGrid(Buffer.alloc(80*80*4),80,80,1,1,1),/Missing/);
});


test('mounted spear extensions use explicit wider padding without cropping or changing default packing',()=>{
 const width=400,height=32,data=Buffer.alloc(width*height*4);
 for(const [left,right]of [[100,140],[320,345]])for(let y=4;y<24;y++)for(let x=left;x<right;x++)data[(y*width+x)*4+3]=255;
 for(let x=140;x<=285;x++)data[(10*width+x)*4+3]=255;
 assert.throws(()=>reflowSpriteGrid(data,width,height,2,1,2),/exceeds padding/);
 const packed=reflowSpriteGrid(data,width,height,2,1,2,false,96);
 assert.equal(packed.width,784);assert.equal(packed.data[((10+16)*packed.width+285+96)*4+3],255,'spear tip survives');
 assert.throws(()=>reflowSpriteGrid(data,width,height,2,1,2,false,-1),/padding/);
});

test('explicit multipart extraction retains a detached hoof while default cleanup still removes fragments',()=>{
 const width=64,height=64,data=Buffer.alloc(width*height*4);
 for(let y=10;y<20;y++)for(let x=10;x<20;x++)data[(y*width+x)*4+3]=255;
 for(let y=30;y<54;y++)for(let x=40;x<43;x++)data[(y*width+x)*4+3]=255;
 data[(12*width+9)*4+3]=20;data[(60*width+60)*4+3]=255;
 const usual=extractSpriteGrid(data,width,height,1,1,1),multipart=extractSpriteGrid(data,width,height,1,1,1,null,true);
 assert.equal(usual.data[(40*width+41)*4+3],0);
 assert.equal(multipart.data[(40*width+41)*4+3],255);assert.equal(multipart.data[(12*width+9)*4+3],20);
 assert.equal(multipart.data[(60*width+60)*4+3],0,'tiny detached debris is still excluded');assert.equal(multipart.coverage[0].primary,172);
});
