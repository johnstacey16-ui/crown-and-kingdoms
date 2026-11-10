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
     assert.ok(words.some(s=>s.includes('RB Map')&&s.includes('B Back')),
      'controller map/back hints must remain readable without truncation');
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
   evidence.push({viewport,hud:{labels:words.length,topHeight:hudProof.header.height,
    compact:!!hudProof.lower,quick:hudProof.quick,minimap:hudProof.minimap},
    command:{labels:commands.labels.length,compact:!!commands.command},
    simulationUnchanged:true,pageErrors:errors.length});
  }finally{await page.close()}
 }
 await writeFile(output+'/figma-live-ui-evidence.json',JSON.stringify({
  source:'current checkout',type:'real Chromium Canvas2D UI screenshots',
  hardwareAcceptance:false,viewports:evidence
 },null,2)+'\n');
 console.log('Live Canvas2D HUD/command screenshots verified: '+evidence.length+' viewports, '
  +(evidence.length*2)+' screenshots; simulation checks unchanged.');
}finally{
 await browser.close();
 await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
}
