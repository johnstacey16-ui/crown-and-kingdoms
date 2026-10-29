// Repack complete connected figures before cell extraction. Generated long
// weapons can cross nominal source-cell edges; padding must not crop them.
// Optional environment mode retains multiple components (fish shoals) per cell
// and adds vertical padding for tree crowns crossing the source row boundary.
export function reflowSpriteGrid(data,width,height,columns,rows,count,allowMultiple=false,paddingX=64){
 if(data.length!==width*height*4||width%columns||height%rows||count>columns*rows)throw Error('Invalid RGBA sprite grid');
 if(!Number.isInteger(paddingX)||paddingX<0||paddingX>1024)throw Error('Invalid horizontal sprite padding');
 const cw=width/columns,ch=height/rows,padX=paddingX,padY=allowMultiple?64:16,nw=(cw+padX*2)*columns,nh=(ch+padY*2)*rows;
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height),figures=Array(count).fill(null);
 for(let first=0;first<seen.length;first++){
  if(seen[first]||data[first*4+3]<=32)continue;
  seen[first]=1;queue[0]=first;let tail=1,l=width,t=height,r=0,b=0;
  for(let head=0;head<tail;head++){
   const n=queue[head],x=n%width,y=Math.floor(n/width);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=width||yy>=height)continue;const next=yy*width+xx;
    if(!seen[next]&&data[next*4+3]>32){seen[next]=1;queue[tail++]=next}
   }
  }
  if(tail<64)continue;
  const col=Math.floor((l+r)/2/cw),row=Math.floor((t+b)/2/ch),cell=row*columns+col;
  if(cell>=count||(figures[cell]&&!allowMultiple))throw Error('Ambiguous source figure '+cell);
  const pixels=Array.from(queue.subarray(0,tail));
  if(figures[cell])figures[cell].pixels=figures[cell].pixels.concat(pixels);else figures[cell]={pixels,col,row};
 }
 const out=Buffer.alloc(nw*nh*4);
 figures.forEach((figure,cell)=>{
  if(!figure)throw Error('Missing source figure '+cell);
  const {col,row}=figure;
  for(const n of figure.pixels){const x=n%width,y=Math.floor(n/width);
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    const sx=x+dx,sy=y+dy;if(sx<0||sy<0||sx>=width||sy>=height)continue;
    const tx=col*(cw+padX*2)+sx-col*cw+padX,ty=row*(ch+padY*2)+sy-row*ch+padY;
    if(tx<col*(cw+padX*2)||tx>=(col+1)*(cw+padX*2)||ty<row*(ch+padY*2)||ty>=(row+1)*(ch+padY*2))throw Error('Source figure exceeds padding '+cell);
    const a=(sy*width+sx)*4,z=(ty*nw+tx)*4;
    if(data[a+3]>out[z+3])for(let k=0;k<4;k++)out[z+k]=data[a+k];
   }
  }
 });
 return {data:out,width:nw,height:nh};
}

// Isolate one connected character per generated grid cell, keeping edge alpha.
// Detached fragments from neighbouring cells must not appear in runtime art.
export function extractSpriteGrid(data,width,height,columns,rows,count,selection=null,keepDetached=false){
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
   if(keepDetached&&tail>=64){occupied+=tail;l=Math.min(l,cl);t=Math.min(t,ct);r=Math.max(r,cr);b=Math.max(b,cb);primary=primary.concat(Array.from(queue.subarray(0,tail)))}
   else if(!keepDetached&&tail>occupied){occupied=tail;l=cl;t=ct;r=cr;b=cb;primary=Array.from(queue.subarray(0,tail))}
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

