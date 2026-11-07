import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const commands = readFileSync(new URL('../js/ui-commands.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const input = readFileSync(new URL('../js/input.js', import.meta.url), 'utf8');
const policy = readFileSync(new URL('../js/input-selection.js', import.meta.url), 'utf8');
const picture = readFileSync(new URL('../js/engine-picture.js', import.meta.url), 'utf8');

test('radial menu, control-group and quick-select drawing live only in js/ui-commands.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./js/ui-commands.js'));
  assert.ok(html.indexOf('./js/ui-commands.js') < html.indexOf('./engine.js'));
  assert.ok(html.includes('./js/ui-commands.js'));
  for (const marker of ['const DS={','function stt(a){','function drawRadial(){','function drawCg(){','function quickBar(){']) {
    assert.ok(commands.includes(marker), marker+' must be command-overlay-owned');
    assert.ok(!ui.includes(marker),marker+' must not be duplicated in ui.js');
    assert.ok(!engine.includes(marker), marker+' must not be duplicated in engine.js');
  }
  assert.match(ui, /function hud\(\)[\s\S]*?quickBar\(\)/);
  assert.match(commands, /DS\[sit\.l\]/);
  assert.match(commands, /stt\(a\)/);
});

test('draw loop and command state remain connected to the extracted overlays', () => {
  assert.match(ui, /function drawGameOverlays\(dt\)\{[\s\S]*?if\(menu&&menu\.rad\)drawRadial\(\);if\(cgo\)drawCg\(\)/);
  assert.match(render, /else drawWorld\(\);[\s\S]*?const uiStart=perfHud\?performance\.now\(\):0/);
  assert.match(picture, /try\{drawGameOverlays\(dt\)\}finally\{X=WORLD_X\}/);
  assert.match(picture, /else drawGameOverlays\(dt\)/);
  assert.match(render, /drawXboxHudOverlays\(dt\)/);
  assert.match(policy, /function openRadial\(wx,wy\)\{/);
  assert.doesNotMatch(input, /function openRadial\(wx,wy\)\{/);
  assert.doesNotMatch(engine, /function openRadial\(wx,wy\)\{/);
  assert.match(input, /function playCtl\(dt\)\{/);
  assert.doesNotMatch(engine, /function playCtl\(dt\)\{/);
  assert.match(policy, /let aDown=null/);
  assert.doesNotMatch(input, /let aDown=null/);
  assert.doesNotMatch(engine, /let aDown=null/);
});

test('selected-unit stats include the owning kingdom’s real attack and armour upgrades',async()=>{
  const {default:vm}=await import('node:vm');
  const {headlessGame}=await import('./helpers/headless-game.mjs');
  const {source,sandbox}=headlessGame();
  vm.runInNewContext(source+'\n'+commands+`\nseedOv=123456;msz=0;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();snd=0;
    S.us=[];S.bs=[];S.tech=[{},{}];S.age=[3,3];globalThis.inspectStats=code=>eval(code);`,sandbox,{timeout:15000});
  const run=code=>sandbox.inspectStats(code);
  run("globalThis.rider=addU(0,'knight',20.5,20.5);S.tech[0]={forging:1,ironCasting:1,blastFurnace:1,cavl:1,pala:1,atkb:{knight:4},armC:1,armC2:1,armC3:1}");
  assert.equal(run('stt(rider)'),'Atk 10+8  Armor 5/7');
  run("globalThis.enemy=addU(1,'knight',24.5,20.5)");
  assert.equal(run('stt(enemy)'),'Atk 10  Armor 2/2','other kingdoms do not inherit selected-player research');
  assert.equal(run('(()=>{const hp=rider.hp;dmgT(enemy,rider);return hp-rider.hp})()'),5,'displayed melee armour agrees with a real incoming Knight hit');
  run("globalThis.infantry=addU(0,'mil',26.5,20.5);S.tech[0]={longs:1,armI:1,armI2:1,armI3:1,forging:1}");
  assert.equal(run('stt(infantry)'),'Atk 4+1  Armor 4/5');
  run("globalThis.skirm=addU(0,'skirm',28.5,20.5);S.tech[0]={elsk:1,armI:1,armI2:1,armI3:1,armR:1,armR2:1,armR3:1,atkR:1,bodkin:1,atkR2:1}");
  assert.match(run('stt(skirm)'),/^Atk 2\+3  Armor 3\/8  Rng /,'Skirmishers use archer armour, including Elite pierce armour');
  run("globalThis.scout=addU(0,'scout',30.5,20.5);S.tech[0]={};S.age[0]=0");
  assert.match(run('stt(scout)'),/^Atk 3  Armor /);run('S.age[0]=1');
  assert.match(run('stt(scout)'),/^Atk 3\+2  Armor /,'Feudal Scout attack is visible without research');
  run("globalThis.siege=addU(0,'mang',32.5,20.5);S.tech[0]={armI:1,armI2:1,armI3:1,armR:1,armR2:1,armR3:1,armC:1,armC2:1,armC3:1}");
  assert.match(run('stt(siege)'),/Armor 0\/0 /,'unrelated Blacksmith armour does not improve siege');
  const before=run('JSON.stringify(S)');for(let i=0;i<10;i++)run('stt(rider);stt(enemy);stt(infantry);stt(skirm);stt(scout);stt(siege)');
  assert.equal(run('JSON.stringify(S)'),before,'inspection is read-only');
  assert.equal(run("stt({q:[],k:'stable'})"),'');
});
