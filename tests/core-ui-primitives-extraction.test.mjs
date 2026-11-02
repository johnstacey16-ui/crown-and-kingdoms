import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui-screens.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('shared panel, match-result and runtime-error drawing live in js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /function panel\(x,y,w,h\)\{/);
  assert.match(ui, /function shade\(t,l1,l2,c\)\{/);
  assert.match(ui, /function drawError\(\)\{/);
  assert.doesNotMatch(engine, /function panel\(x,y,w,h\)\{/);
  assert.doesNotMatch(engine, /function shade\(t,l1,l2,c\)\{/);
  assert.doesNotMatch(engine, /function drawError\(\)\{/);
});

test('game-end presentation is UI-owned while the runtime exception boundary stays in engine.js', () => {
  assert.match(readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8'), /if\(mode==='end'\)\{const p=S\.pl;shade\(/);
  assert.doesNotMatch(engine, /if\(mode==='end'\)\{const p=S\.pl;shade\(/);
  assert.match(engine, /let CK_ERR=null;/);
  assert.match(engine, /function frame\(now\)\{requestAnimationFrame\(frame\);try\{frame2\(now\)\}catch\(e\)/);
  assert.match(engine, /function recordGameFailure\(e\)\{/);
  assert.match(engine, /recordGameFailure\(e\);try\{drawError\(\)\}/);
  assert.match(engine, /try\{drawError\(\)\}catch\(_\)/);
});

test('frame, browser error, promise rejection and audio timer report one stable game error',()=>{
 const start=engine.indexOf('let CK_ERR=null;'),end=engine.indexOf('let lastAutoSaveAt',start);
 const events=new Map();let tick=null,raf=0,drawn=0,logged=0;
 const footerStart=engine.indexOf("addEventListener('error',e=>");
 const footerEnd=engine.indexOf("['pointerdown','keydown','touchstart']",footerStart);
 assert.ok(start>=0&&end>start&&footerStart>=0&&footerEnd>footerStart);
 const ctx=vm.createContext({
  mode:'title',acc:.5,S:{t:31,us:[{hp:1}],bs:[{hp:2}]},W:128,H:128,
  requestAnimationFrame:()=>{raf++},frame2:()=>{throw Error('frame failed')},
  drawError:()=>{drawn++},addEventListener:(type,fn)=>events.set(type,fn),
  setInterval:(fn)=>{tick=fn},aTick:()=>{throw Error('audio tick failed')},
  console:{error:()=>{logged++}},X:{},CW:1280,CH:720
 });
 vm.runInContext(engine.slice(start,end)+'\n'+engine.slice(footerStart,footerEnd)+
  '\n;globalThis.snapshot=()=>({error:CK_ERR,mode,acc});'+
  'globalThis.reset=()=>{CK_ERR=null;mode="play";acc=.5};',ctx);
 assert.ok(events.has('error')&&events.has('unhandledrejection'));
 assert.equal(typeof tick,'function');
 events.get('error')({message:'ignored outside a game'});
 assert.equal(ctx.snapshot().error,null);
 assert.equal(ctx.snapshot().mode,'title');
 ctx.reset();
 events.get('error')({error:Error('event failure')});
 assert.equal(ctx.snapshot().error.message,'event failure');
 assert.equal(ctx.snapshot().error.time,31);
 assert.equal(ctx.snapshot().error.units,1);
 assert.equal(ctx.snapshot().error.buildings,1);
 assert.equal(ctx.snapshot().error.map,'128x128');
 assert.equal(ctx.snapshot().error.mode,'play','snapshot records the mode that failed');
 assert.equal(ctx.snapshot().mode,'error','runtime enters diagnostic error mode');
 assert.equal(ctx.snapshot().acc,0);
 events.get('unhandledrejection')({reason:Error('do not overwrite')});
 assert.equal(ctx.snapshot().error.message,'event failure','first failure is retained');
 ctx.reset();
 let prevented=0;
 events.get('unhandledrejection')({reason:Error('promise failed'),preventDefault:()=>prevented++});
 assert.equal(prevented,1);
 assert.equal(ctx.snapshot().error.message,'promise failed');
 ctx.reset();
 tick();
 assert.equal(ctx.snapshot().error.message,'audio tick failed');
 ctx.reset();
 ctx.frame(1);
 assert.equal(ctx.snapshot().error.message,'frame failed');
 assert.equal(raf,1,'animation frame is always requested before execution');
 assert.equal(drawn,1,'the existing in-game error screen is invoked');
 ctx.mode='title';tick();
 assert.equal(logged,1,'background audio failure is reported without opening a game crash screen');
});
