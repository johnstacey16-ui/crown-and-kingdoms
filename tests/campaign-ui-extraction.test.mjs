import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui-screens.js', import.meta.url), 'utf8');
const mainUi = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');

test('campaign list, briefing and objective overlays are presentation-owned by js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./js/campaign.js'));
  for (const name of ['cmpHud','cmpObj','briefingLayout','drawCamp','drawBrief']) {
    assert.ok(ui.includes('function '+name+'('), name+' must remain available in UI');
    assert.ok(!campaign.includes('function '+name+'('), name+' must not be duplicated in campaign logic');
  }
});

test('campaign data, progression, objective checks and controller handlers remain in js/campaign.js', () => {
  assert.match(campaign, /const CAMP=\[/);
  assert.match(campaign, /const CAMP_ARCS=\[/);
  assert.match(campaign, /function startScenario\(i\)\{/);
  assert.match(campaign, /function cmpTick\(dt\)\{/);
  assert.match(campaign, /const campItems=\(\)=>/);
  assert.match(campaign, /function campCtl\(\)\{/);
  assert.match(campaign, /function briefCtl\(\)\{/);
  assert.match(ui, /function cmpHud\(\)\{[\s\S]*?const pending=sc\.goals\.filter\(q=>!cmp\.d\[q\.id\]\),g=pending\.slice\(0,5\),more=pending\.length-g\.length/,
    'the campaign HUD retains a bounded five-row list and records overflow');
});
test('scrollable campaign briefings keep all nineteen mission goals readable above fixed Xbox controls',()=>{
 const start=ui.indexOf('let briefScroll='),end=ui.indexOf('/* Main title',start);
 const campStart=campaign.indexOf('const CAMP=['),campEnd=campaign.indexOf('\n];',campStart);
 const ctlStart=campaign.indexOf('function briefCtl(){');
 assert.ok(start>0&&end>start&&campStart>0&&campEnd>campStart&&ctlStart>0);
 const missions=vm.runInNewContext(campaign.slice(campStart,campEnd+3)+
  '\nCAMP.map(m=>({t:m.t,b:m.b,civ:m.civ,en:m.en,diff:m.diff,goals:m.goals.map(g=>({t:g.t}))}));');
 assert.equal(missions.length,19);
 const wrap=mainUi.slice(mainUi.indexOf('function infoWrap('),mainUi.indexOf('function infoPages('));
 const measure=ui.slice(ui.indexOf('function menuMeasure('),ui.indexOf('function menuFit('));
 for(const [width,height] of [[1920,1080],[1280,720],[854,480],[480,720],[390,360],[320,640]]){
  const lines=[],clips=[];
  const context=vm.createContext({
   CW:width,CH:height,bi:0,CAMP:missions,
   CIV:Array.from({length:26},(_,i)=>({n:'Kingdom '+i})),
   difficultyName:()=>'Normal',titleBg(){},panel(){},campItems:()=>[],ci:0,drawList(){},
   tx:(value,x,y,size,color,align)=>lines.push({text:String(value),x,y,size,align}),
   X:{font:'',fillRect(){},save(){},restore(){},beginPath(){},clip(){},
      rect:(...args)=>clips.push(args)},
   E:[]
  });
  vm.runInContext([ui.slice(start,end),campaign.slice(ctlStart),wrap,measure].join('\n')+
   '\nglobalThis.renderBrief=drawBrief;globalThis.renderCamp=drawCamp;',context);
  let scrollable=0;
  for(let i=0;i<missions.length;i++){
   context.bi=i;lines.length=0;clips.length=0;context.renderBrief();
   assert.equal(lines.filter(x=>x.text.startsWith('- ')).length,missions[i].goals.length,
     'each mission retains every scripted goal');
   const clip=clips[0];assert.ok(clip&&clip[3]>0&&clip[1]+clip[3]<=height-80,'the story clip clears the footer');
   const footer=lines.find(x=>x.text.includes('A: start mission'));
   assert.ok(footer&&footer.y>clip[1]+clip[3]&&footer.y<height,'controller guidance stays visible');
   for(const {text,x,size,align} of lines){
    const span=context.menuMeasure(text,size),left=align==='center'?x-span/2:x;
    assert.ok(left>=0&&left+span<=width,'briefing text fits at width '+width+' for '+text);
   }
   const max=vm.runInContext('briefScrollMax',context);
   if(max>0){
    scrollable++;
    for(let n=0;n<40;n++){context.E[13]=true;context.briefCtl();}
    context.E[13]=false;lines.length=0;context.renderBrief();
    assert.equal(vm.runInContext('briefScroll',context),max,'D-pad Down clamps at final goal');
    const last=lines.filter(x=>x.align!=='center').at(-1);
    assert.ok(last.y>=clip[1]&&last.y<=clip[1]+clip[3]-12,'last wrapped goal reaches the reading area');
    context.E[12]=true;context.briefCtl();context.E[12]=false;
    assert.ok(vm.runInContext('briefScroll',context)<max,'D-pad Up restores earlier story');
   }
  }
  if(height===360)assert.ok(scrollable>0,'short Xbox/browser viewport needs scrolling');
  context.bi=17;context.renderBrief();context.E[13]=true;context.briefCtl();context.E[13]=false;
  context.renderCamp();context.renderBrief();
  assert.equal(vm.runInContext('briefScroll',context),0,'returning from campaign list resets briefing position');
 }
});

test('campaign switching works from a mission row and Back wins over launch',()=>{
 const context=vm.createContext({CAMP:Array.from({length:19},(_,i)=>({t:'Mission '+i,b:'Story'})),
  campDone:()=>[],ca:0,ci:1,bi:0,E:[],mode:'camp',launches:[],
  leaveCampaign(){context.mode='title'},startScenario(i){context.launches.push(i)}});
 vm.runInContext(campaign.slice(campaign.indexOf('const CAMP_ARCS=')),context);
 context.E[15]=true;context.campCtl();context.E[15]=false;
 assert.equal(context.ca,1);assert.equal(context.ci,0);
 context.ci=2;
 assert.match(vm.runInContext('campItems()[ci].d()',context),/Complete Mission 6 to unlock/);
 context.E[0]=true;context.campCtl();
 assert.equal(context.mode,'camp','locked missions stay in the list');
 context.ci=1;context.E[9]=true;context.campCtl();
 assert.equal(context.mode,'title');
 context.mode='brief';context.bi=6;context.briefCtl();
 assert.equal(context.mode,'camp');assert.deepEqual(context.launches,[]);
 context.E[9]=false;context.mode='brief';context.briefCtl();
 assert.deepEqual(context.launches,[6]);
});
