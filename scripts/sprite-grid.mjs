// Isolate one connected character per generated grid cell, keeping edge alpha.
// Detached fragments from neighbouring cells must not appear in runtime art.
export function extractSpriteGrid(data,width,height,columns,rows,count,selection=null){
 const clean=Buffer.from(data),frames=[],coverage=[];
 if(data.length!==width*height*4||count>columns*rows)throw Error('Invalid RGBA sprite grid');
 for(let i=0;i<count;i++){
  if(selection&&!selection.includes(i)){frames.push(null);coverage.push(null);continue;}
  const x0=Math.round(i%columns*width/columns),y0=Math.round(Math.floor(i/columns)*height/rows),
   cw=Math.round((i%columns+1)*width/columns)-x0,ch=Math.round((Math.floor(i/columns)+1)*height/rows)-y0,
   visited=new Uint8Array(cw*ch),queue=new Int32Array(cw*ch);
  let l=cw,t=ch,r=0,b=0,occupied=0,primary=[],foreground=0;
  for(let py=0;py<ch;py++)for(let px=0;px<cw;px++){
   const first=py*cw+px;if(data[((y0+py)*width+x0+px)*4+3]>32)foreground++;
   if(visited[first]||data[((y0+py)*width+x0+px)*4+3]<=32)continue;
   visited[first]=1;queue[0]=first;let tail=1,cl=px,ct=py,cr=px,cb=py;
   for(let head=0;head<tail;head++){
    const index=queue[head],x=index%cw,y=Math.floor(index/cw);cl=Math.min(cl,x);ct=Math.min(ct,y);cr=Math.max(cr,x);cb=Math.max(cb,y);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;const n=ny*cw+nx;
     if(!visited[n]&&data[((y0+ny)*width+x0+nx)*4+3]>32){visited[n]=1;queue[tail++]=n}
    }
   }
   if(tail>occupied){occupied=tail;l=cl;t=ct;r=cr;b=cb;primary=Array.from(queue.subarray(0,tail))}
  }
  if(occupied<64)throw Error('Empty sprite cell '+i);
  const keep=new Uint8Array(cw*ch);
  for(const n of primary){const x=n%cw,y=Math.floor(n/cw);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<cw&&ny<ch)keep[ny*cw+nx]=1}}
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(!keep[y*cw+x])clean[((y0+y)*width+x0+x)*4+3]=0;
  l=Math.max(0,l-2);t=Math.max(0,t-2);r=Math.min(cw-1,r+2);b=Math.min(ch-1,b+2);
  frames.push({x:x0+l,y:y0+t,w:r-l+1,h:b-t+1,ax:cw/2-l,ay:b-t});
  coverage.push({cell:i,primary:occupied,foreground});
 }
 return {data:clean,frames,coverage};
}
