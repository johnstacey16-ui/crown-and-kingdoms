#!/usr/bin/env node
// AUTHORING ONLY. Reject concept posters and incomplete image-generation grids
// before passing a sheet to the existing reflow/atlas builder.
// Usage: npm install --no-save sharp && node scripts/check-motion-source.mjs file.png
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extractSpriteGrid, reflowSpriteGrid } from './sprite-grid.mjs';
const input=process.argv[2];
if (!input) {console.error('Usage: node scripts/check-motion-source.mjs 4x4-poses.png');process.exit(2);}
let sharp;
try {sharp=createRequire(import.meta.url)('sharp')} catch (_) {
 console.error('Missing optional authoring dependency: npm install --no-save sharp');
 process.exit(2);
}
const {data,info}=await sharp(readFileSync(input)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width!==1536||info.height!==1024)throw Error('Expected the native 1536x1024 four-by-four source PNG');
const cells=16,cw=info.width/4,ch=info.height/4;
let opaque=0;for(let i=3;i<data.length;i+=4)if(data[i]>32)opaque++;
const fraction=opaque/(info.width*info.height);
if(fraction>.53||fraction<.035)throw Error('Invalid foreground coverage; require actual transparent individual character figures (not a poster): '+fraction.toFixed(3));
const reflow=reflowSpriteGrid(data,info.width,info.height,4,4,cells);
const extraction=extractSpriteGrid(reflow.data,reflow.width,reflow.height,4,4,cells);
const hashes=[],areas=[];
for(let i=0;i<cells;i++){
 const f=extraction.frames[i],c=i%4,r=Math.floor(i/4);
 const pX=reflow.width/4,pY=reflow.height/4;
 if(!f||f.w<15||f.h<20)throw Error('Missing full figure at '+i);
 if(f.x<c*pX+4||f.x+f.w>(c+1)*pX-4||
    f.y<r*pY+4||f.y+f.h>(r+1)*pY-4)throw Error('Pose '+i+' touches repacked cell edge');
 let visible=0;
 const h=createHash('sha256');
 for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){
  const z=((f.y+y)*reflow.width+f.x+x)*4;
  if(extraction.data[z+3]>32)visible++;
  h.update(extraction.data.subarray(z,z+4));
 }
 if(visible<350)throw Error('Empty or tiny character in pose '+i);
 hashes.push(h.digest('hex'));
 areas.push(visible);
}
if(new Set(hashes.slice(0,8)).size<7||new Set(hashes.slice(8)).size<7)
 throw Error('Too many duplicate frames: require actual animated poses');
if(extraction.coverage.some(s=>s.primary/s.foreground<.82))
 throw Error('Detached drawing fragments or poster elements found in one or more cells');
console.log('PASS: transparent 4x4 sheet, 16 full connected silhouettes, 8 walk + 8 action frames, distinct poses');
console.log('Note: manual costume, weapon, leg animation and pixel-art QA is still required.');
