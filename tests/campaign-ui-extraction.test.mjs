import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui-screens.js', import.meta.url), 'utf8');
const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');

test('campaign list, briefing and objective overlays are presentation-owned by js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./js/campaign.js'));
  for (const name of ['cmpHud','cmpObj','wrapT','drawCamp','drawBrief']) {
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
 for(const height of [720,540,480]){
  const lines=[],clips=[];
  const context=vm.createContext({
   CW:1280,CH:height,bi:0,CAMP:missions,
   CIV:Array.from({length:26},(_,i)=>({n:'Kingdom '+i})),
   difficultyName:()=>'Normal',titleBg(){},panel(){},campItems:()=>[],ci:0,drawList(){},
   tx:(value,x,y)=>lines.push({text:String(value),y}),
   X:{font:'',fillRect(){},save(){},restore(){},beginPath(){},clip(){},
      rect:(...args)=>clips.push(args),measureText:text=>({width:String(text).length*10})},
   E:[]
  });
  vm.runInContext(ui.slice(start,end)+'\n'+campaign.slice(ctlStart)+
   '\nglobalThis.renderBrief=drawBrief;globalThis.renderCamp=drawCamp;',context);
  let scrollable=0;
  for(let i=0;i<missions.length;i++){
   context.bi=i;lines.length=0;clips.length=0;context.renderBrief();
   assert.equal(lines.filter(x=>x.text.startsWith('- ')).length,missions[i].goals.length,
     'each mission retains every scripted goal');
   const clip=clips[0];assert.ok(clip&&clip[1]+clip[3]<=height-110,'the story clip clears fixed footer');
   assert.ok(lines.some(x=>x.text.includes('A: start mission')&&x.y===height-62),
     'controller start/back guidance stays visible');
   const max=vm.runInContext('briefScrollMax',context);
   if(max>0){
    scrollable++;
    for(let n=0;n<40;n++){context.E[13]=true;context.briefCtl();}
    context.E[13]=false;lines.length=0;context.renderBrief();
    assert.equal(vm.runInContext('briefScroll',context),max,'D-pad Down clamps at final goal');
    const last=lines.filter(x=>x.text.startsWith('- ')).at(-1);
    assert.ok(last.y<=clip[1]+clip[3]-14,'last goal scrolls into the clipped reading area');
    context.E[12]=true;context.briefCtl();context.E[12]=false;
    assert.ok(vm.runInContext('briefScroll',context)<max,'D-pad Up restores earlier story');
   }
  }
  if(height===480)assert.ok(scrollable>0,'short Xbox/browser viewport needs scrolling');
  context.bi=17;context.renderBrief();context.E[13]=true;context.briefCtl();context.E[13]=false;
  context.renderCamp();context.renderBrief();
  assert.equal(vm.runInContext('briefScroll',context),0,'returning from campaign list resets briefing position');
 }
});
