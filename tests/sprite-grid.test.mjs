import test from 'node:test';
import assert from 'node:assert/strict';
import {extractSpriteGrid} from '../scripts/sprite-grid.mjs';
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
