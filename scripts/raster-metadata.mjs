// Read WebP dimensions without a native image dependency (used by CI).
export function webpDimensions(data){
 if(data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WEBP')throw Error('Invalid WebP container');
 for(let p=12;p+8<=data.length;){
  const type=data.toString('ascii',p,p+4),size=data.readUInt32LE(p+4),o=p+8;
  if(o+size>data.length)throw Error('Truncated WebP chunk');
  if(type==='VP8X')return {width:1+data.readUIntLE(o+4,3),height:1+data.readUIntLE(o+7,3)};
  if(type==='VP8 ')return {width:data.readUInt16LE(o+6)&16383,height:data.readUInt16LE(o+8)&16383};
  if(type==='VP8L'){const n=data.readUInt32LE(o+1);return {width:1+(n&16383),height:1+((n>>>14)&16383)}}
  p=o+size+(size%2);
 }
 throw Error('WebP has no image dimensions');
}
