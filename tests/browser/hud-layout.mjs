/* Browser-only UI visual acceptance. This runs on the manual/weekly browser
 * workflow and on explicit [verify-hud-browser] pushes, never on normal pushes.
 * Images show the actual Canvas2D HUD/command renderers, not Figma mockups. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {once} from 'node:events';
import {chromium} from 'playwright';
import {createApplication} from '../../server/app.mjs';

const output='artifacts/battlefield-art';
const viewports=[
 {width:1920,height:1080},
 {width:1280,height:720},
 {width:480,height:720},
 {width:390,height:844}
];
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
await mkdir(output,{recursive:true});
const server=createApplication();
server.listen(0,'127.0.0.1');await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({
 headless:true,
 ...(process.env.CK_BROWSER_EXECUTABLE?{
  executablePath:process.env.CK_BROWSER_EXECUTABLE,
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']
 }:{})
});
const evidence=[];
try{
 for(const viewport of viewports){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  try{
   await page.goto(origin,{waitUntil:'networkidle'});
   await page.waitForFunction(()=>typeof hud==='function'&&
    typeof hudTopLayout==='function'&&typeof hudLowerLayout==='function'&&
    typeof quickBarLayout==='function'&&typeof drawRadial==='function');
   // Capture the real entry screen before creating a skirmish or evidence overlay.
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForFunction(()=>typeof titleLayout==='function'&&typeof drawTitle==='function'&&ckTitleScene!==null);
   const titleProof=await page.evaluate(()=>{
    const priorTx=tx,priorSelection=ti,labels=[];
    try{
     tx=(value,x,y,size,color,align)=>{
      priorTx(value,x,y,size,color,align);
      const width=X.measureText(String(value)).width;
      const left=X.textAlign==='center'?x-width/2:X.textAlign==='right'?x-width:x;
      labels.push({value:String(value),left,right:left+width,y});
     };
     const proofs=[];
     for(let i=0;i<9;i++){
      ti=i;labels.length=0;drawTitle();
      const layout=titleLayout(CW,CH,i),selected=CK_TITLE_OPTIONS[i][0];
      proofs.push({i,layout,selected,shown:labels.some(t=>t.value.startsWith(selected)),
       fits:labels.every(t=>t.left>=-1&&t.right<=CW+1&&t.y>=0&&t.y<=CH)});
     }
     return {proofs,width:CW,height:CH,cache:{width:ckTitleScene.width,height:ckTitleScene.height}};
    }finally{tx=priorTx;ti=priorSelection;drawTitle()}
   });
   assert.equal(titleProof.width,viewport.width);
   assert.equal(titleProof.height,viewport.height);
   assert.deepEqual(titleProof.cache,{width:960,height:540});
   for(const proof of titleProof.proofs){
    assert.ok(proof.shown,'title selection '+proof.selected+' remains visible at '+viewport.width);
    assert.ok(proof.fits,'title text stays inside the actual canvas at '+viewport.width+' for '+proof.selected);
    assert.ok(proof.layout.start<=proof.i&&proof.i<proof.layout.start+proof.layout.visible);
   }
   await page.locator('#c').screenshot({path:output+'/figma-live-title-'+viewport.width+'x'+viewport.height+'.png'});
   // The same cached world now backs setup, campaign and options.
   const sharedProof=await page.evaluate(()=>{
    const oldMode=mode,oldTx=tx,scene=ckTitleScene,labels=[];
    try{
     tx=(value,x,y,size,color,align)=>{oldTx(value,x,y,size,color,align);labels.push(String(value));};
     return [['setup',drawSetup,'NEW GAME'],['camp',drawCamp,'CAMPAIGNS & MISSIONS'],['opts',drawOpts,'OPTIONS']].map(([m,draw,heading])=>{
      mode=m;labels.length=0;draw();
      return {mode:m,heading:labels.some(t=>t===heading||heading.startsWith(t.replace(/…$/,''))),sameScene:scene===ckTitleScene};
     });
    }finally{tx=oldTx;mode=oldMode;drawTitle()}
   });
   // Widescreen defaults should not be needlessly shortened in the settings list.
   if(viewport.width>=1280){
    const values=await page.evaluate(()=>{
     const saved=tx,labels=[];
     try{tx=(s,...args)=>{saved(s,...args);labels.push(String(s))};drawSetup();return labels}
     finally{tx=saved}
    });
    assert.ok(values.includes('Standard'),'setup shows full default game mode');
    assert.ok(values.some(s=>s.includes('Dark Age')),'setup shows full starting age');
   }
   assert.equal(sharedProof.length,3);
   assert.ok(sharedProof.every(p=>p.heading&&p.sameScene),'front-end lists retain headings and reuse cached kingdom scene');
   for(const m of ['setup','camp','opts']){
    await page.evaluate(m=>{mode=m},m);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.locator('#c').screenshot({path:output+'/figma-live-'+m+'-'+viewport.width+'x'+viewport.height+'.png'});
   }
   // Capture the paged guide and album credit using the real canvas.
   const guideProof=await page.evaluate(()=>{
    const previous=inf,previousMode=mode;
    try{
     mode='info';
     return [true,false].map(c=>{
      inf=c?'c':'a';const layout=infoLayout(CW,CH),pages=infoPages(c,layout);
      for(let i=0;i<pages.length;i++){infoPage=i;drawInfo2()}
      return {controls:c,pages:pages.length,fit:pages.every(p=>p.reduce((s,row)=>s+row.height,0)<=layout.body&&p.every(row=>row.lines.every(line=>menuMeasure(line,layout.size)<=layout.textWidth)))};
     });
    }finally{inf=previous;mode=previousMode;infoPage=0}
   });
   assert.ok(guideProof.every(p=>p.pages>=1&&p.fit),'all controller guide and about pages fit');
   for(const section of ['c','a']){
    await page.evaluate(section=>{mode='info';inf=section;infoPage=0},section);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.locator('#c').screenshot({path:output+'/figma-live-info-'+section+'-'+viewport.width+'x'+viewport.height+'.png'});
   }
   // Exercise the in-match Objectives entry and close actions through controller routing.
   const objectiveViewport=viewport.width===390?{width:390,height:360}:viewport;
   if(objectiveViewport!==viewport)await page.setViewportSize(objectiveViewport);
   await page.waitForFunction(size=>CW===size.width&&CH===size.height,objectiveViewport);
   const briefing=await page.evaluate(()=>{
    const select=button=>{E=[];E[button]=true;ctl(0);E=[]};
    ca=0;ci=1;mode='camp';select(15);
    const switched=ca===1&&ci===0;
    select(13);select(0);
    const opened=mode==='brief'&&bi===CAMP_ARCS[1].ids[0];
    bi=CAMP.findIndex(mission=>mission.goals.length===6);
    const originalTx=tx,labels=[];
    let fits=true;
    try{
     tx=(value,x,y,size,color,align)=>{
      originalTx(value,x,y,size,color,align);
      const width=X.measureText(String(value)).width;
      const left=align==='center'?x-width/2:x;
      fits&&=left>=0&&left+width<=CW;
      labels.push({text:String(value),y,align});
     };
     drawBrief();
     const scrollable=briefScrollMax>0;
     if(scrollable)for(let n=0;n<30;n++)select(13);
     labels.length=0;drawBrief();
     const layout=briefingLayout(CAMP[bi]),last=labels.filter(label=>label.align!=='center').at(-1);
     const finalGoalVisible=last.y>=layout.clipTop&&last.y<=layout.clipBottom;
     const action=labels.find(label=>label.text.startsWith('A: start mission'));
     const footer=action&&action.y>layout.clipBottom&&action.y<CH;
     select(9);const backed=mode==='camp';
     tx=originalTx;drawCamp();mode='brief';drawBrief();
     return {switched,opened,fits,scrollable,finalGoalVisible,footer,backed,reset:briefScroll===0};
    }finally{tx=originalTx}
   });
   assert.ok(briefing.switched&&briefing.opened&&briefing.backed&&briefing.reset);
   assert.ok(briefing.fits&&briefing.finalGoalVisible&&briefing.footer,JSON.stringify(briefing));
   if(viewport.width===390)assert.ok(briefing.scrollable,'short viewport scrolls long mission briefings');
   await page.locator('#c').screenshot({path:output+'/campaign-briefing-'+objectiveViewport.width+'x'+objectiveViewport.height+'.png'});
   const objectives=await page.evaluate(()=>{
    snd=mus=0;
    const mission=CAMP.findIndex(sc=>sc.goals.length===6);
    startScenario(mission);mode='play';
    const goals=CAMP[mission].goals,completed=goals.find(goal=>!goal.optional);
    cmp.d[completed.id]=1;
    const priorPad=pad;pad={axes:[0,0,0,0]};
    try{E=[];E[8]=true;ctl(0)}finally{pad=priorPad;E=[]}
    const entered=mode==='obj',labels=[],priorTx=tx;
    let fits=true;
    const pages=objectiveLayout().count;
    try{
     tx=(value,x,y,size,color,align)=>{
      priorTx(value,x,y,size,color,align);
      const width=X.measureText(String(value)).width;
      const left=X.textAlign==='center'?x-width/2:X.textAlign==='right'?x-width:x;
      fits &&= left>=0&&left+width<=CW&&y>=0&&y<=CH;
      labels.push(String(value));
     };
     for(let i=0;i<pages;i++){
      drawObj();E[15]=true;ctl(0);E=[];
     }
    }finally{tx=priorTx}
    E[5]=true;ctl(0);E=[];
    const returned=mode==='play';
    mode='pause';pmItems().find(item=>item.n==='Objectives').a();
    const reopened=mode==='obj'&&objectiveLayout().page===0;
    return {entered,returned,reopened,pages,fits,goals:labels.filter(label=>/^\[[x ]\]/.test(label)).length,
     progress:labels.some(label=>label.includes('1 / 5 required goals met')),
     optional:labels.some(label=>label.includes('Optional:'))};
   });
   assert.ok(objectives.entered&&objectives.returned&&objectives.reopened,JSON.stringify(objectives));
   assert.ok(objectives.fits&&objectives.progress&&objectives.optional,JSON.stringify(objectives));
   assert.equal(objectives.goals,6);
   if(viewport.width===390)assert.ok(objectives.pages>1,'short viewport paginates campaign objectives');
   await page.locator('#c').screenshot({path:output+'/campaign-objectives-'+objectiveViewport.width+'x'+objectiveViewport.height+'.png'});
   await page.evaluate(()=>leaveCampaign());
   if(objectiveViewport!==viewport){
    await page.setViewportSize(viewport);
    await page.waitForFunction(size=>CW===size.width&&CH===size.height,viewport);
   }
   await page.evaluate(()=>{mode='title'});

   await page.evaluate(()=>{
    seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;
    startAge=2;startArmy=0;startRes=3;
    start();snd=mus=0;mode='pause';
    const town=S.bs.find(b=>b&&b.t===0&&b.k==='tc'&&b.hp>0);
    if(!town)throw Error('Missing playable Town Centre for visual HUD proof');
    S.sel=[town];S.age[0]=2;S.t=94;
    Object.assign(S.res[0],{f:840,w:1125,g:325,s:100});
    notes.length=0;menu=null;place=null;
    const canvas=document.createElement('canvas');
    canvas.id='ck-ui-evidence';canvas.width=CW;canvas.height=CH;
    canvas.style.cssText='position:fixed;inset:0;z-index:10000;pointer-events:none;width:100%;height:100%;';
    document.body.append(canvas);
    const context=canvas.getContext('2d');
    window.captureCKUi=(kind)=>{
     const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
     const priorX=X,priorTx=tx,priorMenu=menu,priorPlace=place;
     const labels=[];
     try{
      X=context;X.save();X.setTransform(1,0,0,1,0,0);
      X.fillStyle='#243d38';X.fillRect(0,0,CW,CH);
      tx=(value,x,y,size,color,align)=>{
       const output=priorTx(value,x,y,size,color,align);
       const measured=X.measureText(String(value)).width;
       const actualAlign=X.textAlign;
       const left=actualAlign==='center'?x-measured/2:actualAlign==='right'?x-measured:x;
       labels.push({value:String(value),x,y,size,align:actualAlign,left,right:left+measured});
       return output;
      };
      if(kind==='hud'){menu=null;place=null;hud()}
      else{
       const names=['Town Centre','House','Lumber Camp','Mining Camp',
        'Mill','Farm','Barracks','Archery Range','Stable',
        'Blacksmith','Market','Siege Workshop'];
       menu={title:'Build',items:names.map(l=>({l,c:{w:50},lk:'',fn(){}})),
        i:10,pg:0,rad:1};
       drawRadial();
      }
      X.restore();
     }finally{tx=priorTx;X=priorX;menu=priorMenu;place=priorPlace}
     const after=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
     const header=hudTopLayout(CW),quick=quickBarLayout(CW,CH,mm.x);
     const lower=CW<1000?hudLowerLayout(CW,CH):null;
     const command=CW<720||CH<500?compactCommandLayout(CW,CH,12,10):null;
     return {before,after,labels,header,quick,lower,command,
      minimap:{x:mm.x,y:mm.y,w:mm.w,h:mm.h},width:CW,height:CH};
    };
   });
   const hudProof=await page.evaluate(()=>captureCKUi('hud'));
   assert.equal(hudProof.width,viewport.width,'actual canvas width matches Chromium viewport');
   assert.equal(hudProof.height,viewport.height,'actual canvas height matches Chromium viewport');
   assert.equal(hudProof.before,hudProof.after,'HUD rendering is simulation-read-only');
   const words=hudProof.labels.map(row=>row.value);
   for(const value of ['840','1125','325','100','Castle Age','1:34']){
    assert.ok(words.some(s=>s.includes(value)),
     'HUD at '+viewport.width+'x'+viewport.height+' shows '+value);
   }
   assert.ok(words.some(s=>s.includes('Town Centre')),
    'selected building remains visible at '+viewport.width+'px');
   assert.ok(hudProof.labels.every(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)&&
    Number.isFinite(t.left)&&Number.isFinite(t.right)),
    'HUD paints only finite text coordinates and widths');
   assert.ok(words.some(s=>s.includes('Idle 5')),'active idle worker number remains readable');
   // On the wide Xbox picture, lower-unit captions must not cover the shortcut tiles.
   // On narrow layouts, the entire lower-caption is constrained inside its own panel.
   const leftText=hudProof.labels.filter(t=>t.x===20&&
    t.y>=(hudProof.lower?hudProof.lower.y:viewport.height-120));
   const textEdge=hudProof.lower?viewport.width-14:hudProof.quick.x-8;
   for(const entry of leftText){
    assert.ok(entry.left>=8&&entry.right<=textEdge+1,
     'live HUD text must not overlap the D-pad dock at '+viewport.width+
     ': '+entry.value+' right='+entry.right.toFixed(1)+' limit='+textEdge);
   }
   const q=hudProof.quick,mm=hudProof.minimap;
   assert.ok(q.x>=0&&q.y>=0&&q.x+q.w<=viewport.width&&q.y+q.h<=viewport.height,
    'all four D-pad shortcuts are inside viewport');
   assert.equal(overlaps(q,mm),false,'shortcuts do not cover minimap');
   if(viewport.width<1000){
    const lower=hudProof.lower;
    assert.ok(lower.y+lower.h<=q.y-8,
     'compact selection description clears the D-pad shortcut row');
    if(viewport.height>=580){
     assert.ok(words.some(s=>s.includes('A Select')),'selected-unit help is visible');
     const backHint=hudProof.labels.find(t=>t.value.includes('RB Map')&&t.value.includes('B Back'));
     assert.ok(backHint,'controller map/back hints must remain readable without truncation');
     assert.ok(backHint.y<=lower.y+lower.h-22,
      'compact help clears the decorative bottom divider rather than crossing it');
    }
   }
   if(viewport.width>=1000)assert.equal(hudProof.header.compact,false,
    'Xbox-sized resource bar stays in one row');
   await page.locator('#ck-ui-evidence').screenshot({
    path:output+'/figma-live-hud-'+viewport.width+'x'+viewport.height+'.png'
   });
   const commands=await page.evaluate(()=>captureCKUi('command'));
   assert.equal(commands.before,commands.after,'radial presentation is simulation-read-only');
   assert.ok(commands.labels.some(t=>t.value.includes('Market')),
    'selected Build command stays visible in the actual renderer');
   assert.ok(commands.labels.every(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)));
   if(viewport.width<720||viewport.height<500){
    const l=commands.command;
    assert.ok(l.y>=0&&l.y+l.h<=viewport.height,
     'compact command menu fits above and below the viewport edges');
    assert.ok(commands.labels.some(t=>t.value.includes('11/12')),
     'selected option remains in the scrolled command list');
    const footer=commands.labels.find(t=>t.value.startsWith('LS Choose'));
    assert.ok(footer&&footer.left>=8&&footer.right<=viewport.width-8,
     'compact controller footer must be fully readable in the real browser');
   }
   await page.locator('#ck-ui-evidence').screenshot({
    path:output+'/figma-live-commands-'+viewport.width+'x'+viewport.height+'.png'
   });
   assert.deepEqual(errors,[],'no Chromium page exceptions');
   evidence.push({viewport,title:{actions:titleProof.proofs.length,scene:titleProof.cache,sharedScreens:sharedProof,guide:guideProof},hud:{labels:words.length,topHeight:hudProof.header.height,
    compact:!!hudProof.lower,quick:hudProof.quick,minimap:hudProof.minimap},
    briefing:{viewport:objectiveViewport,...briefing},
    objectives:{viewport:objectiveViewport,...objectives},
    command:{labels:commands.labels.length,compact:!!commands.command},
    simulationUnchanged:true,pageErrors:errors.length});
  }finally{await page.close()}
 }
 await writeFile(output+'/figma-live-ui-evidence.json',JSON.stringify({
  source:'current checkout',type:'real Chromium Canvas2D UI screenshots',
  hardwareAcceptance:false,viewports:evidence
 },null,2)+'\n');
 console.log('Live Canvas2D menu, campaign and HUD screenshots verified: '+evidence.length+' viewports, '
  +(evidence.length*10)+' screenshots; simulation checks unchanged.');
}finally{
 await browser.close();
 await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
}
