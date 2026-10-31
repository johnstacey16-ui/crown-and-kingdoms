/* Reproducible 200-unit artificial choke stress, using production formation,
 * A* planner, movement and separation; timing is Node.js only, NOT Xbox FPS.
 * Usage: node scripts/stress-200.mjs [--ticks=360] */
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {headlessGame} from '../tests/helpers/headless-game.mjs';

export function runChokepoint({ticks=360,seed=123456,count=200}={}){
 if(!Number.isInteger(ticks)||ticks<0||ticks>2400||
    !Number.isInteger(seed)||count!==200)
  throw Error('Expected 200 units, integer seed and 0..2400 simulation ticks');
 const {source,sandbox}=headlessGame();
 const start=performance.now();
 const setup=`
  seedOv=${seed};msz=0;kingdoms=2;cmp=null;gameMode=0;
  startAge=0;startRes=0;startArmy=0;start();
  S.us=[];S.bs=[];S.nodes=[];S.pj=[];S.rel=[];
  S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.nd.fill(null);
  S.sel=[];S.vp.enabled=0;mode='play';snd=0;fm=0;
  // Complete wall edge-to-edge. Only two tiles can pass from west to east.
  for(let y=0;y<H;y++)if(y!==35&&y!==36)S.g[y*W+35]=1;
  const sentinel=addU(0,'mil',30.5,35.5);
  const closedRoute=(()=>{
   S.g[35*W+35]=1;S.g[36*W+35]=1;
   const blocked=path(sentinel,gp(50.5,35.5,.8));
   S.g[35*W+35]=0;S.g[36*W+35]=0;
   return blocked===null;
  })();
  S.us=[];
  for(let i=0;i<200;i++)addU(0,'mil',25+(i%10)+.5,26+Math.floor(i/10)+.5);
  S.sel=S.us.slice();
  window.CK_PATH_DIAGNOSTICS.reset();
  const ordered=orderSel(null,50.5,35.5);
  const original=S.us.map(u=>({x:u.x,y:u.y}));
  const validRoutes=S.us.filter(u=>u.o==='m'&&u.p.length>0).length;
  const planned=window.CK_PATH_DIAGNOSTICS.snapshot();
  globalThis.CK_STRESS={
   advance:()=>{for(const u of S.us)if(u.o==='m'&&walk(u,DT))u.o='i';sep()},
   snapshot:()=>({
    closedRoute,ordered,unitCount:S.us.length,validRoutes,planned,
    moved:S.us.filter((u,i)=>Math.hypot(u.x-original[i].x,u.y-original[i].y)>.25).length,
    crossed:S.us.filter(u=>u.x>35.5).length,
    completed:S.us.filter(u=>u.o==='i').length,
    pending:S.us.filter(u=>u.o==='m').slice(0,8).map(u=>({id:u.netId,x:u.x,y:u.y,next:u.p[0],last:u.p[u.p.length-1],remaining:u.p.length})),
    stragglers:S.us.filter(u=>u.x<=35.5).slice(0,8).map(u=>({id:u.netId,x:u.x,y:u.y,order:u.o,remaining:u.p.length})),
    blockedCellUnits:S.us.filter(u=>!!S.g[(u.y|0)*W+(u.x|0)]).length,
    invalidCoordinates:S.us.filter(u=>!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.x<0||u.x>=W||u.y<0||u.y>=H).length
   })
  };
 `;
 vm.runInNewContext(source+'\n'+setup,sandbox,{timeout:20000,filename:'stress-200-headless.js'});
 const init=performance.now();
 for(let i=0;i<ticks;i++)sandbox.CK_STRESS.advance();
 return {...sandbox.CK_STRESS.snapshot(),seed,ticks,
  elapsedMs:Math.round(performance.now()-start),motionMs:Math.round(performance.now()-init),
  environment:'Node headless, 72x72 artificial 2-tile chokepoint; not Xbox performance'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const argv=process.argv.slice(2);
 const ticks=argv.length===0?360:argv.length===1&&/^--ticks=\d+$/.test(argv[0])
  ?Number(argv[0].slice(8)):NaN;
 try{
  const report=runChokepoint({ticks});console.log(JSON.stringify(report,null,2));
  if(!report.closedRoute||!report.ordered||report.validRoutes!==200||
   report.blockedCellUnits||report.invalidCoordinates||report.planned.invalid)process.exitCode=1;
 }catch(e){console.error(e.message);process.exitCode=1}
}
