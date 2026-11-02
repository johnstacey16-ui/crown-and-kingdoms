import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui-screens.js', import.meta.url), 'utf8');
const menus = readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8');

test('title, new-game setup and options screens are drawn in js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./js/menus.js'));
  assert.match(ui, /function drawTitle\(\)\{titleBg\(\)/);
  assert.match(ui, /function drawSetup\(\)\{titleBg\(\);drawList\('NEW GAME'/);
  assert.match(ui, /function drawOpts\(\)\{titleBg\(\);drawList\('OPTIONS'/);
  for (const name of ['drawTitle','drawSetup','drawOpts']) {
    assert.ok(!menus.includes('function '+name+'('), name+' drawing should not be duplicated in menus.js');
  }
});

test('menu models, option state and controller handlers remain in js/menus.js', () => {
  assert.match(menus, /const setRows=\(\)=>/);
  assert.match(menus, /const optsItems=\(\)=>/);
  assert.match(menus, /function titleCtl\(\)\{/);
  assert.match(menus, /function setupCtl\(\)\{/);
  assert.match(menus, /function optsCtl\(\)\{/);
  assert.match(ui, /drawList\('NEW GAME',setRows\(\),si/);
  assert.match(ui, /drawList\('OPTIONS',optsItems\(\),oi/);
});

test('Menu/Start performs the advertised back action in setup, options, slots and campaign screens',()=>{
 const extract=(source,name)=>{
  const at=source.indexOf('function '+name+'(){');
  assert.ok(at>=0,'production handler '+name+' exists');
  const opening=source.indexOf('{',at);
  let depth=0;
  for(let i=opening;i<source.length;i++){
   if(source[i]==='{')depth++;
   else if(source[i]==='}'&&!--depth)return source.slice(at,i+1);
  }
  throw Error('Unclosed handler '+name);
 };
 const save=readFileSync(new URL('../js/save.js',import.meta.url),'utf8');
 const campaign=readFileSync(new URL('../js/campaign.js',import.meta.url),'utf8');
 const input=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
 const ctx=vm.createContext({
  E:[],mode:'setup',si:0,oi:0,ci:0,sb:'pause',sm:'save',
  overwriteSlotTarget:null,deleteSlotTarget:null,slot:0,SI:[],
  setRows:()=>[{}],optsItems:()=>[{}],slotItems:()=>[{}],campItems:()=>[{}],
  sset(){},leaveCampaign(){ctx.mode='title';ctx.exits++},exits:0,
  saveG(){throw Error('Menu button must never save')},
  deleteSavedGame(){throw Error('Menu button must never delete')},
  refreshSlots(){throw Error('Menu button must never refresh a deleted slot')}
 });
 const declarations=['setupCtl','optsCtl'].map(x=>extract(menus,x)).join('\n')+
  ['slotsCtl'].map(x=>extract(save,x)).join('\n')+
  ['campCtl','briefCtl'].map(x=>extract(campaign,x)).join('\n');
 vm.runInContext(declarations,ctx);
 ctx.E[9]=true;
 for(const [mode,handler,expected] of [
  ['setup','setupCtl','title'],['opts','optsCtl','title'],
  ['slots','slotsCtl','pause'],['camp','campCtl','title'],
  ['brief','briefCtl','camp']
 ]){
  ctx.mode=mode;ctx[handler]();assert.equal(ctx.mode,expected,mode+' Menu/Start back');
 }
 assert.equal(ctx.exits,1,'campaign exit uses the normal leave handler');
 ctx.mode='slots';ctx.overwriteSlotTarget=1;ctx.slotsCtl();
 assert.equal(ctx.overwriteSlotTarget,null,'Menu cancels an overwrite confirmation');
 assert.equal(ctx.mode,'slots','cancel does not close the slots screen');
 ctx.deleteSlotTarget=2;ctx.slotsCtl();
 assert.equal(ctx.deleteSlotTarget,null,'Menu cancels deletion without deleting any save');
 ctx.E[9]=false;ctx.E[1]=true;
 ctx.mode='setup';ctx.setupCtl();assert.equal(ctx.mode,'title','existing B back still works');
 assert.match(input,/mode!=='title'\)uis\('back'\)/,
  'title screen no longer plays a back sound for an unavailable action');
});
