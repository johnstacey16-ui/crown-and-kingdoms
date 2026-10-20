const FMN=['Box','Line','Column','Staggered','Wedge','Split'];
/* Capture one order's centroid and facing once, rather than scanning the entire
   army for each slot. The returned planner is local to that order, so it cannot
   retain stale positions or change another player's/AI's formation choice. */
function formationSlots(us,wx,wy,kind=fm){
 const n=us.length;
 if(!n)return ()=>[0,0];
 if(kind===0){const w=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/w);return i=>[(i%w-(w-1)/2)*1.1,((i/w|0)-(rows-1)/2)*1.1]}
 let cx=0,cy=0;for(const u of us){cx+=u.x;cy+=u.y}cx/=n;cy/=n;
 let dx=wx-cx,dy=wy-cy;const l=Math.hypot(dx,dy);if(l>1e-9){dx/=l;dy/=l}else{dx=1;dy=0}
 const px=-dy,py=dx;
 return i=>{
  // Split keeps two balanced wings with a clear central lane. Spacing is
  // provisional pending comparison on Xbox; existing formation IDs stay stable.
  if(kind===5){if(n===1)return[0,0];const left=Math.ceil(n/2),side=i<left?-1:1,j=i<left?i:i-left,count=i<left?left:n-left;
   const lateral=side*(1.8+(j%2)*1.2),depth=(Math.floor(j/2)-(Math.ceil(count/2)-1)/2)*1.1;
   return[px*lateral+dx*depth,py*lateral+dy*depth]}
  if(kind===1){const o=(i-(n-1)/2)*1.2;return[px*o,py*o]}
  if(kind===2){const o=(i-(n-1)/2)*1.1;return[dx*o,dy*o]}
  if(kind===3){const o=((i>>1)-(Math.ceil(n/2)-1)/2)*1.3,b=i%2?.9:0;return[px*o+dx*b,py*o+dy*b]}
  if(i===0)return[dx*.6,dy*.6];const row=Math.ceil(i/2),side=i%2?-1:1;
  return[dx*(.6-row*.85)+px*side*row*.75,dy*(.6-row*.85)+py*side*row*.75];
 };
}
function fslot(us,i,wx,wy){return formationSlots(us,wx,wy)(i)}
