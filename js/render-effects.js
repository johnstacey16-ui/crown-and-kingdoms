/* Original projectile art, particle lifetime/drawing and bounded sprite warm-up.
 * Presentation-only helpers extracted unchanged from js/render.js.
 * The world draw dispatcher and viewport caches remain in js/render.js. */
// Copied visual descriptions only: no entity/target references, RNG or combat
// state are needed to distinguish the current catalogue's projectile families.
const PROJECTILE_STYLES=Object.freeze({xbow:'bolt',genoa:'bolt',chuko:'bolt',scor:'heavy-bolt',skirm:'javelin',jan:'bullet',hcan:'bullet',conq:'bullet',bomb:'cannon',cgal:'cannon',mang:'stone',treb:'stone',axe:'axe',gbeto:'blade'});
function projectileVisualStyle(kind){const style=typeof kind==='string'?PROJECTILE_STYLES[kind]:null;return typeof style==='string'?style:'arrow'}
function projectileVisualHeading(p){
 if(!p||![p.x,p.y,p.tx,p.ty].every(Number.isFinite))return null;
 return Math.atan2(p.ty-p.y,p.tx-p.x);
}
function drawProjectileArtwork(g,x,y,heading,style,time,scale=1){
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 const t=Number.isFinite(time)?time:0,z=Number.isFinite(scale)&&scale>0?scale:1;
 g.save();
 try{
  g.translate(x,y);g.rotate(Number.isFinite(heading)?heading:0);g.scale(z,z);g.lineCap='round';g.lineJoin='round';
  const line=(x1,y1,x2,y2,color,width)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()};
  if(style==='cannon'){
   line(-11,0,-4,0,'rgba(174,165,146,.45)',1.5);g.fillStyle='#25282a';g.strokeStyle='#aaa28e';g.lineWidth=.6;g.beginPath();g.arc(0,0,3,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#8d969a';g.beginPath();g.arc(.6,-.8,.9,0,Math.PI*2);g.fill();
  }else if(style==='stone'){
   g.rotate(t*2);g.fillStyle='#777570';g.strokeStyle='#302d27';g.lineWidth=.8;g.beginPath();g.moveTo(-3,-2);g.lineTo(0,-3.7);g.lineTo(3,-2);g.lineTo(3.5,1);g.lineTo(1,3);g.lineTo(-3,2);g.closePath();g.fill();g.stroke();line(-1.8,-1.6,.7,-2.2,'#c0b8a5',1.2);
  }else if(style==='bullet'){
   line(-7,0,0,0,'rgba(230,215,171,.7)',1);line(-1,0,1.5,0,'#fff0cb',1.5);
  }else if(style==='axe'){
   g.rotate(t*13);line(-5,0,4,0,'#3b2a1b',2.4);line(-5,-.3,4,-.3,'#b78d57',1.1);g.fillStyle='#a6b2b4';g.strokeStyle='#303536';g.lineWidth=.6;g.beginPath();g.moveTo(1,-1);g.lineTo(2,-5);g.quadraticCurveTo(7,-5,6,2);g.lineTo(2,1);g.closePath();g.fill();g.stroke();line(5,-3,5.6,.5,'#edf0df',.8);
  }else if(style==='blade'){
   g.rotate(t*15);g.fillStyle='#b2bec1';g.strokeStyle='#30373a';g.lineWidth=.6;g.beginPath();g.moveTo(-4,1);g.quadraticCurveTo(1,-5,6,-2);g.quadraticCurveTo(2,-1,0,2);g.closePath();g.fill();g.stroke();line(-5,1,-2,0,'#b08a4a',1.7);
  }else{
   const spear=style==='javelin',heavy=style==='heavy-bolt',bolt=style==='bolt',length=spear?19:heavy?16:bolt?10:13,tail=-length*.55,tip=length*.45;
   line(tail,0,tip-2,0,'#33291f',heavy?2.4:1.8);line(tail,-.2,tip-2,-.2,spear?'#d0b17c':'#b99863',heavy?1.2:.9);
   g.fillStyle=heavy?'#c6ccca':'#d9ded1';g.beginPath();g.moveTo(tip,0);g.lineTo(tip-(spear?4:3),heavy?-2:-1.3);g.lineTo(tip-(spear?4:3),heavy?2:1.3);g.closePath();g.fill();
   if(!spear){line(tail,0,tail-1.3,-1.7,'#e8dcc0',.9);line(tail+1.8,0,tail+.4,1.6,'#a89777',.8)}
  }
 }finally{g.restore()}
 return true;
}

/* Particle emission, lifetime, rendering and queued procedural warm-up. */
const PMAX=[100,260,520],PT=[];
// Local-only accessibility preference: presentation particles, never world state.
let reducedCosmeticEffects=false;
try{reducedCosmeticEffects=localStorage.getItem('ck_reduced_effects')==='1'}catch(_){}
function toggleReducedCosmeticEffects(){
 reducedCosmeticEffects=!reducedCosmeticEffects;
 try{localStorage.setItem('ck_reduced_effects',reducedCosmeticEffects?'1':'0')}catch(_){}
 return reducedCosmeticEffects;
}
function nonessentialParticle(k){return k==='dust'||k==='smk'||k==='puff'}


/* Particle emission, lifetime and bounded sprite warm-up share the renderer's
 * texture state; the fixed-step engine only schedules these operations. */
function emit(k,x,y,n,o){if(reducedCosmeticEffects&&nonessentialParticle(k))return;const cap=PMAX[gq];o=o||{};for(let i=0;i<n;i++){if(PT.length>=cap)return;PT.push({k,x,y,z:0,vx:(Math.random()-.5)*(o.s||1),vy:(Math.random()-.5)*(o.s||1),vz:(o.vz||0)*(.6+Math.random()*.8),l:o.l||.6,t:0,c:o.c||'#ccc',r:o.r||2})}}
function updP(dt){for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.t+=dt;if(p.t>=p.l){PT[i]=PT[PT.length-1];PT.pop();continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.k==='deb'||p.k==='spark')p.vz-=9*dt}}
// Best-effort native tint preparation. Rendering still resolves exact poses;
// draining this queue is not a promise that an entire roster fits in the cache.
const TINT_WARMUP={jobs:[],required:[],world:null,index:0,total:0,processed:0,status:'idle',plannedPixels:0,skipped:0,scanned:0,creations:0,failed:0,stale:0,capHits:0,source:null,sourceKey:null,sourceReads:0,sourceReuses:0};
const TINT_WARMUP_CREATIONS=4,TINT_WARMUP_JOBS=512,TINT_WARMUP_SCAN=8192;
function clearTintWarmupSource(){TINT_WARMUP.source=null;TINT_WARMUP.sourceKey=null}
function cancelRosterTintWarmup(){TINT_WARMUP.jobs=[];TINT_WARMUP.required=[];TINT_WARMUP.world=null;TINT_WARMUP.index=0;TINT_WARMUP.status='cancelled';clearTintWarmupSource()}
function finishTintWarmupPlan(){
 // Admission retains idle-first priority. Execute each selected source's
 // palettes together so one readback can survive a callback boundary.
 const q=TINT_WARMUP,groups=new Map();
 for(const job of q.jobs){
  job.sourceKey=teamFrameCacheKey(job.atlas,0,job.frame,'source','');
  if(!groups.has(job.sourceKey))groups.set(job.sourceKey,[]);
  groups.get(job.sourceKey).push(job);
 }
 q.jobs=[];for(const jobs of groups.values())q.jobs.push(...jobs);
 q.required=q.jobs.slice();
 q.total=q.jobs.length;q.status=q.total?'pending':'drained';
}
function rosterTintWarmupSource(atlas,frame){
 return sharedTintWarmupSource(TINT_WARMUP,atlas,frame);
}
function sharedTintWarmupSource(q,atlas,frame){
 const key=teamFrameCacheKey(atlas,0,frame,'source','');
 if(q.source&&q.sourceKey===key&&q.source.img===atlas.img){q.sourceReuses++;return q.source}
 q.source=null;q.sourceKey=null;
 const source=readTeamFrameSource(atlas,frame);
 if(source){source.original=source.pixels.data.slice();q.source=source;q.sourceKey=key;q.sourceReads++}
 return source;
}
function queueRosterTintWarmup(world){
 const q=TINT_WARMUP;
 q.required=[];q.world=world;
 q.jobs=[];q.index=0;q.total=0;q.processed=0;q.plannedPixels=0;q.skipped=0;q.scanned=0;q.creations=0;q.failed=0;q.stale=0;q.capHits=0;q.status='drained';
 clearTintWarmupSource();q.sourceReads=0;q.sourceReuses=0;
 if(typeof ASSET==='undefined'||!ASSET.n||!Array.isArray(world?.us))return;
 const pairs=[],seenPairs=new Set(),seenFrames=new Set();
 for(const unit of world.us){
  if(!unit||!(unit.hp>0)||unit.ld||typeof unit.k!=='string'||!Number.isInteger(unit.t)||unit.t<0||unit.t>=(world.teamN||4))continue;
  const key=unit.k+'/'+unit.t;
  if(!seenPairs.has(key)){seenPairs.add(key);pairs.push({kind:unit.k,team:unit.t,elite:typeof eliteUniqueUnitUpgrade==='function'&&!!eliteUniqueUnitUpgrade(unit.k,unit.t,world)})}
 }
 const group=TEAM_FRAME_GROUPS.troop;
 const limit=Math.min(group.limit,Math.max(0,TEAM_FRAME_CACHE.limit-(TEAM_FRAME_CACHE.pixels-group.pixels)));
 // First admit an idle pose for each actual roster pair, then motion states.
 for(const state of[0,1,2,3])for(const pair of pairs){
  const {team}=pair,kind=pair.elite&&hasReadyAssetPose(pair.kind+'_elite',team,state)?pair.kind+'_elite':pair.kind;
  const key=(SHIP_ART_FALLBACK[kind]||kind)+'/'+STN[state]+'/'+team;
  for(const atlas of ASSET_ANIM_INDEX.get(key)||[]){
   if(!atlas.ok||!atlas.img)continue;
   const animation=atlas.meta?.anims?.[key],lists=animation?.dirs||(animation?.frames?[animation.frames]:[]);
   if(!Array.isArray(lists)||!lists.some(list=>Array.isArray(list)&&list.length))continue;
   if(!atlas.meta.painted||atlas.meta.neutral)break;
   for(const frames of lists){
    if(!Array.isArray(frames))continue;
    for(const frame of frames){
     if(q.scanned>=TINT_WARMUP_SCAN){q.skipped++;finishTintWarmupPlan();return}
     q.scanned++;
     if(!frame||![frame.x,frame.y,frame.w,frame.h].every(Number.isInteger)||frame.w<=0||frame.h<=0){q.skipped++;continue}
     const color=teamColor(team),cacheKey=teamFrameCacheKey(atlas,team,frame,'troop',color);
     if(seenFrames.has(cacheKey))continue;
     seenFrames.add(cacheKey);
     const pixels=frame.w*frame.h;
     if(q.jobs.length>=TINT_WARMUP_JOBS||q.plannedPixels+pixels>limit){q.skipped++;continue}
     q.jobs.push({atlas,team,frame,kind,color,cacheKey,animation,animationKey:key});q.plannedPixels+=pixels;
    }
   }
   break;
  }
 }
 finishTintWarmupPlan();
}
function currentTintWarmupJob(job){
 return job.atlas.ok&&(ASSET_ANIM_INDEX.get(job.animationKey)||[]).includes(job.atlas)&&
  job.atlas.meta.anims[job.animationKey]===job.animation&&teamColor(job.team)===job.color&&
  teamFrameCacheKey(job.atlas,job.team,job.frame,'troop',job.color)===job.cacheKey;
}
// Observe residency without creating pixels, changing LRU order or retrying.
// A drained queue alone cannot establish that every required tint is usable.
function rosterTintWarmupReadiness(world){
 const q=TINT_WARMUP,result={ready:false,state:'blocked',reason:'stopped',required:q.required.length,resident:0};
 if(world!==q.world){result.reason='changed';return result}
 if(q.status==='pending'){result.state='pending';result.reason='preparing';return result}
 if(q.status!=='drained')return result;
 if(q.skipped){result.reason='incomplete';return result}
 if(q.failed){result.reason='failed';return result}
 if(q.stale){result.reason='changed';return result}
 for(const job of q.required){
  if(!currentTintWarmupJob(job)){result.reason='changed';return result}
  const canvas=TEAM_FRAME_CACHE.entries.get(job.cacheKey);
  if(canvas?.width===job.frame.w&&canvas?.height===job.frame.h&&healthyTeamFrame(canvas))result.resident++;
 }
 result.ready=result.resident===result.required;
 result.state=result.ready?'ready':'blocked';result.reason=result.ready?'ready':'missing';return result;
}
function advanceRosterTintWarmup(budgetMs=3,maxCreations=TINT_WARMUP_CREATIONS){
 const q=TINT_WARMUP;
 const cap=Number.isFinite(maxCreations)?Math.min(TINT_WARMUP_CREATIONS,Math.max(0,Math.floor(maxCreations))):0;
 const budget=Number.isFinite(budgetMs)?Math.min(3,Math.max(0,budgetMs)):0;
 let created=0,attempts=0;
 if(!cap||!budget||q.status!=='pending')return {created,attempts};
 const start=performance.now();
 while(q.index<q.jobs.length&&created<cap&&attempts<64&&performance.now()-start<budget){
  const job=q.jobs[q.index++];attempts++;q.processed++;
  try{
   if(!currentTintWarmupJob(job)){q.stale++;continue}
   const before=TEAM_FRAME_CACHE.creations;
   try{
    const result=paintedTeamFrame(job.atlas,job.team,job.frame,job.kind,rosterTintWarmupSource);
    if(result.img===job.atlas.img)q.failed++;
   }catch(error){if(error?.code!=='CK_TEAM_TINT_UNAVAILABLE')throw error;q.failed++}
   finally{const count=TEAM_FRAME_CACHE.creations-before;created+=count;q.creations+=count}
  }finally{if(q.jobs[q.index]?.sourceKey!==q.sourceKey)clearTintWarmupSource()}
 }
 if(q.index===q.jobs.length){q.jobs=[];q.index=0;q.status='drained';clearTintWarmupSource()}
 else if(created>=cap)q.capHits++;
 if(typeof GRAPHICS_TRACE!=='undefined'){GRAPHICS_TRACE.frame.warmCreations+=created;GRAPHICS_TRACE.frame.warmAttempts+=attempts}
 return {created,attempts};
}
// Hints come only from troop draw queries, never from a second pose evaluation.
// They expire after two completed callbacks and cannot evict resident frames.
const TINT_PREDICTION={jobs:new Map(),world:null,creations:0,attempts:0,expired:0,skipped:0,capHits:0};
function cancelTintPredictions(){TINT_PREDICTION.jobs.clear();TINT_PREDICTION.world=null}
function tintPredictionAllowed(){
 return typeof S!=='undefined'&&S&&mode==='play'&&
  !(typeof window!=='undefined'&&window.CK_NET?.isRunning?.())&&
  !(typeof graphicsRestorePending==='function'&&graphicsRestorePending());
}
function queueTintPrediction(atlas,team,frame,kind,animationKey,animation){
 if(!tintPredictionAllowed()||!atlas.meta.painted||atlas.meta.neutral||typeof kind!=='string'||kind.startsWith('bld_')||
    !Number.isInteger(team)||team<0||team>=(S.teamN||4)||!frame||
    ![frame.x,frame.y,frame.w,frame.h].every(Number.isInteger)||frame.w<=0||frame.h<=0)return;
 const q=TINT_PREDICTION;
 if(q.world!==S){cancelTintPredictions();q.world=S}
 const color=teamColor(team),cacheKey=teamFrameCacheKey(atlas,team,frame,'troop',color);
 if(TEAM_FRAME_CACHE.entries.has(cacheKey))return;
 const seen=GRAPHICS_TRACE.sequence,existing=q.jobs.get(cacheKey);
 if(existing){existing.seen=seen;return}
 if(q.jobs.size>=128){q.jobs.delete(q.jobs.keys().next().value);q.skipped++;GRAPHICS_TRACE.frame.predictSkipped++}
 q.jobs.set(cacheKey,{atlas,team,frame,kind,color,cacheKey,animationKey,animation,seen});
}
function advanceTintPredictions(budgetMs=3,maxCreations=4){
 const q=TINT_PREDICTION,cap=Number.isFinite(maxCreations)?Math.min(4,Math.max(0,Math.floor(maxCreations))):0;
 const budget=Number.isFinite(budgetMs)?Math.min(3,Math.max(0,budgetMs)):0;
 let created=0,attempts=0;
 if(!tintPredictionAllowed()||q.world!==S){cancelTintPredictions();return {created,attempts}}
 if(!cap||!budget)return {created,attempts};
 const start=performance.now(),dropped=q.skipped+q.expired;
 const source={source:null,sourceKey:null,sourceReads:0,sourceReuses:0};
 while(q.jobs.size&&created<cap&&attempts<64&&performance.now()-start<budget){
  const key=q.jobs.keys().next().value,job=q.jobs.get(key);q.jobs.delete(key);attempts++;
  if(GRAPHICS_TRACE.sequence-job.seen>2||!currentTintWarmupJob(job)){q.expired++;continue}
  if(healthyTeamFrame(TEAM_FRAME_CACHE.entries.get(key)))continue;
  const group=TEAM_FRAME_GROUPS.troop;
  const limit=Math.min(group.limit,Math.max(0,TEAM_FRAME_CACHE.limit-(TEAM_FRAME_CACHE.pixels-group.pixels)));
  if(job.frame.w*job.frame.h>limit-group.pixels){q.skipped++;continue}
  const before=TEAM_FRAME_CACHE.creations;
  try{
   const result=paintedTeamFrame(job.atlas,job.team,job.frame,job.kind,(a,f)=>sharedTintWarmupSource(source,a,f));
   if(TEAM_FRAME_CACHE.creations>before)markTeamFramePrediction(key,result.img);
   if(result.img===job.atlas.img)q.skipped++;
  }catch(error){if(error?.code!=='CK_TEAM_TINT_UNAVAILABLE')throw error;q.skipped++}
  finally{created+=TEAM_FRAME_CACHE.creations-before}
 }
 if(q.jobs.size&&created>=cap)q.capHits++;
 if(!q.jobs.size)q.world=null;
 q.creations+=created;q.attempts+=attempts;
 GRAPHICS_TRACE.frame.warmCreations+=created;GRAPHICS_TRACE.frame.warmAttempts+=attempts;
 GRAPHICS_TRACE.frame.predictCreations+=created;GRAPHICS_TRACE.frame.predictAttempts+=attempts;
 GRAPHICS_TRACE.frame.predictSkipped+=q.skipped+q.expired-dropped;
 return {created,attempts};
}
let WQ=[];
function queueWarm(){WQ=[];cancelTintPredictions();queueRosterTintWarmup(S);const uu=new Set(CIV.map(c=>c.uu)),mine=new Set((S.civ||[0,1]).map(c=>CIV[c].uu));for(const k in U){if(k==='tw'||k==='cs'||k==='tca')continue;if(uu.has(k)&&!mine.has(k))continue;for(const t of[0,1,2,3]){WQ.push([k,t,0,0]);for(let f=0;f<4;f++)WQ.push([k,t,1,f])}}WQ.reverse()}
function warm(){
 const t0=performance.now();
 const restoring=typeof graphicsRestorePending==='function'&&graphicsRestorePending();
 let nativeCreated=0;
 if(typeof mode==='string'&&mode!=='play'&&mode!=='pause'&&!restoring)cancelRosterTintWarmup();
 else nativeCreated=advanceRosterTintWarmup(Math.max(0,3-(performance.now()-t0))).created;
 if(restoring)return;
 if(TINT_WARMUP.status!=='pending')advanceTintPredictions(Math.max(0,3-(performance.now()-t0)),4-nativeCreated);
 while(WQ.length&&performance.now()-t0<3){const q=WQ.pop(),k=q[0];if(typeof hasReadyAssetPose==='function'&&hasReadyAssetPose(k,q[1],q[2]))continue;const sz=USZ(k);spr(k+'|'+q[1]+'|'+q[2]+'|'+q[3],sz[0],sz[1],g=>paintUnit(g,k,teamColor(q[1]),q[2],q[3]))}
}

/* Draw the particles whose lifecycle is updated by engine.js. */
function drawP(){for(const p of PT){if(reducedCosmeticEffects&&nonessentialParticle(p.k))continue;const P=w2s(p.x,p.y),a=1-p.t/p.l;X.globalAlpha=a*(p.k==='smk'||p.k==='puff'||p.k==='dust'?.55:.95);X.fillStyle=p.c;X.beginPath();X.arc(P[0],P[1]-Math.max(0,p.z)*zm*14,(p.r+(p.k==='smk'||p.k==='puff'||p.k==='dust'?p.t*6:0))*zm,0,7);X.fill()}X.globalAlpha=1}

