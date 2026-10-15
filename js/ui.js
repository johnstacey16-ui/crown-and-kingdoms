function drawPerfOverlay(dt){
 if(!perfHud||mode!=='play'||!S)return;
 const instant=dt>0?1/dt:0;perfFps=perfFps?perfFps*.85+instant*.15:instant;
 const names=['Blue','Red','Purple','Gold'],w=S.teamN>2?470:365,x=12,y=62,h=64;
 X.fillStyle='rgba(5,8,14,.88)';X.fillRect(x,y,w,h);X.strokeStyle='rgba(201,162,74,.7)';X.lineWidth=1;X.strokeRect(x+.5,y+.5,w-1,h-1);
 tx('PERF  '+perfFps.toFixed(0)+' FPS  '+(dt*1000).toFixed(1)+' ms  |  '+S.us.length+' units  '+S.bs.length+' buildings',x+9,y+17,13,'#f8fafc');
 const teamCounts=new Array(S.teamN).fill(0);for(const u of S.us)if(Number.isInteger(u.t)&&u.t>=0&&u.t<S.teamN)teamCounts[u.t]++;
 let xx=x+9;for(let t=0;t<S.teamN;t++){const label=names[t]+' '+teamCounts[t];tx(label,xx,y+36,12,teamColor(t));xx+=label.length*7.2+17}
 tx('SIM '+perfStepMs.toFixed(2)+' ms (peak '+perfStepPeak.toFixed(2)+')  |  DRAW '+perfDrawMs.toFixed(2)+' ms (peak '+perfDrawPeak.toFixed(2)+')',x+9,y+54,11,'#cbd5e1');
}

const ovr=()=>{const w=Math.min(CW-80,(CH-190)*2)|0;return{x:(CW-w)/2,y:(CH-w/2)/2+12,w,h:w/2}};
function drawOv(){const o=ovr();X.fillStyle='rgba(0,0,0,.85)';X.fillRect(0,0,CW,CH);minimapDraw(o,2);tx('STRATEGIC OVERVIEW'+(S.teamN>2?'    Blue: You  Red/Purple/Gold: rivals':'')+'    A: jump camera    B or View: close',CW/2,o.y-16,S.teamN>2?17:22,'#f2c14e','center')}
