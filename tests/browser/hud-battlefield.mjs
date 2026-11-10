/* Live battlefield + Canvas2D HUD acceptance, opt-in and weekly/manual only.
 * This paints through draw(0), including real painted terrain, units, fog,
 * selection HUD and in-world radial commands. It never steps the simulation.
 * Screenshot pixels are inspected against actual game drawing, not mock art. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {once} from 'node:events';
import {chromium} from 'playwright';
import {createApplication} from '../../server/app.mjs';

const output='artifacts/battlefield-art';
const cases=[
 {width:1280,height:720,scenes:['opening','large-battle']},
 {width:1920,height:1080,scenes:['opening','large-battle']},
 {width:390,height:844,scenes:['opening','large-battle']}
];
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
 for(const viewport of cases){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(origin,{waitUntil:'networkidle'});
   await page.waitForFunction(()=>typeof loadSeriesSLargeBattleSave==='function'&&
    typeof draw==='function'&&typeof drawWorld==='function'&&
    typeof hud==='function'&&typeof drawRadial==='function'&&
    typeof CK_SIM_SYNC!=='undefined'&&typeof ASSET!=='undefined');
   await page.waitForFunction(()=>ASSET.n===57&&!!PAINT.terrain);
   for(const scene of viewport.scenes){
    const initialized=await page.evaluate(scene=>{
     snd=mus=0;mode='title';
     if(scene==='large-battle'){
      if(!loadSeriesSLargeBattleSave())throw Error('Real Series S battle fixture unavailable');
      if(S.us.length!==372||S.bs.length!==238)throw Error('Large battle fixture changed');
      const lead=S.us.find(u=>u&&u.t===0&&u.k==='knight'&&u.hp>0);
      if(!lead)throw Error('Missing large battle selected knight');
      S.sel=[lead];ctr(W/2,H/2);
     }else{
      seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;
      startAge=2;startArmy=2;startRes=3;
      start();
      const home=S.bs.find(b=>b&&b.t===0&&b.k==='tc'&&b.hp>0);
      if(!home)throw Error('Missing normal-match Town Centre');
      S.sel=[home];ctr(home.x+home.s/2,home.y+home.s/2);
     }
     S.age[0]=2;S.t=94;menu=null;place=null;notes.length=0;
     perfFlatField=0;perfLayerMode=0;perfSharpHud=0;perfRenderScale=1;
     perfHud=0;mode='pause';
     return {scene,units:S.us.length,buildings:S.bs.length,canvas:{w:CW,h:CH},
      fogged:S.ex.some(v=>v===0),hasPaintedTerrain:!!PAINT.terrain};
    },scene);
    assert.deepEqual(initialized.canvas,{w:viewport.width,h:viewport.height});
    assert.ok(initialized.units>0&&initialized.buildings>0);
    assert.equal(initialized.hasPaintedTerrain,true,'real painted terrain is loaded');
    const shot=async(kind)=>{
     const info=await page.evaluate(kind=>{
      const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
      const original={mode,menu,place,tx,perfFlatField};
      const labels=[];
      const capture=(value,x,y,size,color,align)=>{
       const result=original.tx(value,x,y,size,color,align);
       if(typeof x==='number'&&typeof y==='number')labels.push({
        value:String(value),x,y,size,align:align||'left'
       });
       return result;
      };
      try{
       tx=capture;
       if(kind==='commands'){
        const names=['Town Centre','House','Lumber Camp','Mining Camp','Mill','Farm',
         'Barracks','Archery Range','Stable','Blacksmith','Market','Siege Workshop'];
        menu={title:'Build',items:names.map(l=>({l,c:{w:50},lk:'',fn(){}})),
         i:10,pg:0,rad:1};
       }else menu=null;
       mode='play';draw(0);
      }finally{
       tx=original.tx;menu=original.menu;place=original.place;
       perfFlatField=original.perfFlatField;mode='pause';
      }
      // Pixel sample excludes top/bottom controls; it demonstrates the world
      // background is real and varied rather than one flat swatch.
      const middleX=Math.floor(CW*.28),middleY=Math.floor(CH*.31);
      const sampleW=Math.max(1,Math.floor(CW*.44)),sampleH=Math.max(1,Math.floor(CH*.31));
      const pixels=WORLD_X.getImageData(middleX,middleY,sampleW,sampleH).data;
      const distinct=new Set();let coloured=0;
      for(let y=0;y<sampleH;y+=7)for(let x=0;x<sampleW;x+=7){
       const i=(y*sampleW+x)*4,red=pixels[i],green=pixels[i+1],blue=pixels[i+2];
       distinct.add((red>>4)+','+(green>>4)+','+(blue>>4));
       if(red+green+blue>65)coloured++;
      }
      const after=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
      return {before,after,distinct:distinct.size,coloured,
       labels,units:S.us.length,buildings:S.bs.length,
       topHeight:hudTopLayout(CW).height,
       commandVisible:kind==='commands'?
        labels.some(t=>t.value.includes('Market')):null,
       minimap:{x:mm.x,y:mm.y,w:mm.w,h:mm.h},
       shortcut:quickBarLayout(CW,CH,mm.x)};
     },kind);
     assert.equal(info.before,info.after,
      'rendering '+kind+' over '+scene+' must not change game state');
     assert.ok(info.distinct>10&&info.coloured>150,
      'world pixels must contain real varied painted terrain/units/fog');
     assert.ok(info.labels.every(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)),
      'real world and UI labels always use finite paint positions');
     if(kind==='hud'){
      const labels=info.labels.map(t=>t.value);
      assert.ok(labels.some(t=>t.includes('Castle Age')),'live Castle Age indicator');
      assert.ok(labels.some(t=>t.includes('1:34')),'live match clock');
      assert.ok(info.shortcut.x>=0&&info.shortcut.x+info.shortcut.w<=viewport.width,
       'the shortcut dock is on screen');
     }else{
      assert.equal(info.commandVisible,true,'selected Build command visible in real battlefield');
     }
     const path=output+'/figma-world-'+scene+'-'+kind+'-'+viewport.width+'x'+viewport.height+'.png';
     await page.locator('#c').screenshot({path});
     return {kind,distinct:info.distinct,coloured:info.coloured,
      unitCount:info.units,buildingCount:info.buildings,simulationUnchanged:true,
      path};
    };
    const hud=await shot('hud'),commands=await shot('commands');
    evidence.push({viewport:{width:viewport.width,height:viewport.height},scene,
     paintedTerrain:true,fogged:initialized.fogged,hud,commands,
     pageErrors:errors.length});
   }
   assert.deepEqual(errors,[],'real battlefield renderer must not throw page exceptions');
  }finally{await page.close();}
 }
 await writeFile(output+'/figma-world-ui-evidence.json',JSON.stringify({
  source:'live Canvas2D world draw + real game fixture',
  acceptance:'Chromium composition and simulation isolation only',
  hardwareAcceptance:false,renderFramesPerScene:2,scenes:evidence
 },null,2)+'\n');
 console.log('Composited battlefield + HUD/command verification passed: '+
  evidence.length+' real scenes, '+evidence.length*2+' screenshots; no simulated ticks.');
}finally{
 await browser.close();
 await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
}
