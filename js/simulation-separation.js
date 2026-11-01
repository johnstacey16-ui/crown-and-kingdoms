/* Original pooled collision separation, moved unchanged from simulation.js.
 * Invoked by simulation.step after both classic scripts have loaded. */
/* Unified movement and collision owner. Original bodies retained verbatim;
 * classic runtime loads the module before its first simulation tick. */
const mv=(u,dx,dy)=>{const x=u.x+dx,y=u.y+dy;if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=W||y>=H)return;const i=(y|0)*W+(x|0);if(u.sh?S.wt[i]&&!S.nd[i]:(!S.g[i]||S.gt[i]===u.t+1)&&S.wt[i]!==1){u.x=x;u.y=y}};
/* A* waypoints are tile-centred, but separation can nudge a soldier off the
 * centreline beside a wall. Prefer a terrain-checked axis slide to falsely
 * completing a move just because the direct diagonal crosses a solid corner. */
function walkAxisSlide(u,dx,dy){
 // Tiny floating-point noise is not genuine motion; otherwise soldiers can
 // remain forever on a blocked waypoint without triggering route repair.
 if(Math.abs(dx)<1e-5||Math.abs(dy)<1e-5)return false;
 const ox=u.x,oy=u.y;mv(u,0,dy);
 if(Math.abs(u.y-oy)>1e-5)return true;
 mv(u,dx,0);return Math.abs(u.x-ox)>1e-5;
}
function recoverMoveRoute(u,p){
 // Formation separation may push a soldier across a choke while its next
 // saved waypoint remains behind the wall. Replan only normal move orders
 // toward their original final destination, never arbitrary gather/attack paths.
 if(u.o!=='m'||p.length<2)return false;
 const destination=p[p.length-1],route=path(u,gp(destination[0],destination[1],.8));
 if(!route?.length)return false;
 if(route.length===p.length&&route.every((q,i)=>q[0]===p[i][0]&&q[1]===p[i][1]))return false;
 u.p=route;
 return true;
}
function walk(u,dt){const p=u.p;if(!p.length)return true;if(!Number.isFinite(dt)||dt<=0)return false;if(!Array.isArray(p[0])||p[0].length!==2){u.p=[];u.rp=0;return true}const[tx,ty]=p[0];if(!Number.isFinite(tx)||!Number.isFinite(ty)||tx<0||ty<0||tx>=W||ty>=H){u.p=[];u.rp=0;return true}if((u.sh?!(S.wt[(ty|0)*W+(tx|0)]&&!S.nd[(ty|0)*W+(tx|0)]):(S.wt[(ty|0)*W+(tx|0)]===1||S.g[(ty|0)*W+(tx|0)]&&S.gt[(ty|0)*W+(tx|0)]!==u.t+1))&&p.length>1){u.p=[];u.rp=0;return true}
const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy),st=Math.max(0,unitSpeed(u)*dt),tl=p.length>1?.45:u.o==='m'?.6:0;if(d<=st){const ox=u.x,oy=u.y;mv(u,dx,dy);if(u.x===ox&&u.y===oy&&d>0){if(walkAxisSlide(u,dx,dy))return false;if(recoverMoveRoute(u,p))return false;u.p=[];u.rp=0;return true}p.shift()}else if(d<=tl)p.shift();else{const ox=u.x,oy=u.y;mv(u,dx/d*st,dy/d*st);if(u.x===ox&&u.y===oy){if(walkAxisSlide(u,dx/d*st,dy/d*st))return false;if(recoverMoveRoute(u,p))return false;u.p=[];u.rp=0;return true}}return!p.length}

/* Local spatial grid for unit separation. The old all-pairs pass compared every unit with every other unit (O(n²)); units only need checking against nearby cells. The separation radius and displacement remain unchanged. */
const SEP_GRID=new Map(),SEP_BUCKET_POOL=[];
function sep(){const us=S.us;if(us.length<=64){for(let i=0;i<us.length;i++){const a=us[i];if(a.hp<=0)continue;for(let j=i+1;j<us.length;j++){const b=us[j];if(a.ld||b.ld||a.hp<=0||b.hp<=0||Math.abs(a.x-b.x)>.5||Math.abs(a.y-b.y)>.5)continue;let dx=a.x-b.x,dy=a.y-b.y;const ds=dx*dx+dy*dy;if(ds<.25){const dist=Math.sqrt(ds)||.01,p=(.5-dist)*.25;dx/=dist;dy/=dist;mv(a,dx*p,dy*p);mv(b,-dx*p,-dy*p)}}}return}const grid=SEP_GRID;for(const bucket of grid.values()){bucket.length=0;SEP_BUCKET_POOL.push(bucket)}grid.clear();const gw=W*2+4,key=(x,y)=>y*gw+x;/* Return used buckets to a pool, then reuse their arrays to avoid per-tick garbage. */for(let i=0;i<us.length;i++){const a=us[i];if(a.ld||a.hp<=0)continue;if(!Number.isFinite(a.x)||!Number.isFinite(a.y))continue;const gx=Math.floor(a.x*2),gy=Math.floor(a.y*2);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const bucket=grid.get(key(gx+ox,gy+oy));if(!bucket)continue;for(const j of bucket){const b=us[j];if(b.ld||b.hp<=0||Math.abs(a.x-b.x)>.5||Math.abs(a.y-b.y)>.5)continue;let dx=a.x-b.x,dy=a.y-b.y;const ds=dx*dx+dy*dy;if(ds<.25){const dist=Math.sqrt(ds)||.01,p=(.5-dist)*.25;dx/=dist;dy/=dist;mv(a,dx*p,dy*p);mv(b,-dx*p,-dy*p)}}}const k=key(gx,gy),bucket=grid.get(k);if(bucket)bucket.push(i);else{const next=SEP_BUCKET_POOL.pop()||[];next.push(i);grid.set(k,next)}}}

