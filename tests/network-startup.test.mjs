import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createTransport } from '../server/transport.mjs';
import { headlessGame } from './helpers/headless-game.mjs';

const read = name => readFileSync(new URL('../js/' + name + '.js', import.meta.url), 'utf8');
const startupSource = read('network-startup');
function game(origin, preferences) {
  const { source, sandbox } = headlessGame();
  Object.assign(sandbox, { location:{origin}, URL, AbortController, TextEncoder, fetch, setTimeout, clearTimeout });
  vm.runInNewContext(source + '\n' + read('network-sync') + '\n' + read('network-transport') +
    '\n' + startupSource + '\n' + read('network-lobby') + '\n' + preferences + `
    globalThis.testSettings=()=>({msz,mt,kingdoms,civ,aiCiv,diff,aip,vm,mapLayout,startAge,
      startRes,startArmy,startVillagers,popLimit,gameMode,scoreLimit,seedOv,cmp,gs});
    globalThis.testWorld=()=>({time:S.t,mode,resources:S.res,age:S.age,units:S.us.length,
      buildings:S.bs.length,width:W});
    globalThis.testControl=button=>{E=[];E[button]=true;window.CK_AUTH_LOBBY.control();E=[];};
  `, sandbox);
  return sandbox;
}
async function pair(t) {
  const server = createTransport(); server.listen(0,'127.0.0.1'); await once(server,'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const hostGame = game(origin, 'msz=0;mt=3;mapLayout=0;diff=5;startAge=2;startRes=3;startArmy=2;startVillagers=2;popLimit=300;gameMode=0;vm=4;scoreLimit=900;');
  const guestGame = game(origin, 'msz=3;mt=1;mapLayout=11;diff=0;startAge=0;startRes=5;startArmy=3;startVillagers=0;popLimit=50;gameMode=1;vm=0;scoreLimit=1800;gs=2;');
  const host = hostGame.CK_AUTH_TRANSPORT.createClient(), guest = guestGame.CK_AUTH_TRANSPORT.createClient();
  t.after(() => new Promise(resolve => { host.close(); guest.close(); server.close(resolve); server.closeAllConnections(); }));
  const room = await host.connect(); await guest.connect(room.roomId); await host.refreshRoster();
  return {host,guest,hostGame,guestGame};
}

test('real HTTP startup overrides conflicting preferences and requires final confirmation without advancing time', async t => {
  const {host,guest,hostGame,guestGame} = await pair(t);
  const hostBefore = hostGame.testSettings(), guestBefore = guestGame.testSettings();
  const hp = hostGame.CK_AUTH_LOBBY.preparation(), gp = guestGame.CK_AUTH_LOBBY.preparation();
  const hostStart = hostGame.CK_MATCH_STARTUP.create({transport:host,validateConfig:hostGame.CK_AUTH_LOBBY.validConfig,prepare:hp.prepare});
  const guestStart = guestGame.CK_MATCH_STARTUP.create({transport:guest,validateConfig:guestGame.CK_AUTH_LOBBY.validConfig,prepare:gp.prepare});
  const config = hostGame.CK_AUTH_LOBBY.settings(123456);
  await hostStart.begin(config);
  config.seed = 999; // Caller cannot change the in-flight settings.
  assert.equal(hostStart.snapshot().config.seed,123456);
  await guestStart.pump();
  assert.equal(guestStart.snapshot().phase,'awaiting-commit');
  assert.equal(hostStart.snapshot().hash,guestStart.snapshot().hash);
  await hostStart.pump();
  assert.equal(hostStart.snapshot().phase,'awaiting-commit-ack');
  await guestStart.pump(); await hostStart.pump();
  assert.equal(hostStart.snapshot().phase,'verified');
  assert.equal(guestStart.snapshot().phase,'verified');
  assert.equal(JSON.stringify(hostGame.testWorld()),JSON.stringify(guestGame.testWorld()));
  assert.equal(hostGame.testWorld().time,0); assert.equal(guestGame.testWorld().time,0);
  assert.equal(guestGame.testWorld().mode,'multiplayer');
  assert.equal(guestGame.testWorld().age[1],2);
  assert.equal(guestGame.testSettings().startRes,3);
  assert.equal(guestGame.testSettings().popLimit,300);
  hp.restore(); gp.restore();
  assert.equal(JSON.stringify(hostGame.testSettings()),JSON.stringify(hostBefore));
  assert.equal(JSON.stringify(guestGame.testSettings()),JSON.stringify(guestBefore));
});

test('settings validation covers every start field and all current difficulty/victory options', async t => {
  const {hostGame} = await pair(t);
  const api = hostGame.CK_AUTH_LOBBY, config = api.settings(1);
  assert.equal(api.validConfig(config),true);
  for (const [key,value] of Object.entries(config)) {
    const missing = {...config}; delete missing[key];
    assert.equal(api.validConfig(missing),false,key+' required');
    assert.equal(api.validConfig({...config,[key]:String(value)}),false,key+' numeric');
    assert.equal(api.validConfig({...config,[key]:1e9}),false,key+' bounded');
  }
  assert.equal(api.validConfig({...config,extra:1}),false);
  assert.equal(api.validConfig({...config,diff:5,vm:6}),true);
});

test('mismatched generated worlds fail closed before any commit', async t => {
  const {host,guest,hostGame,guestGame} = await pair(t);
  const hostStart = hostGame.CK_MATCH_STARTUP.create({transport:host,validateConfig:()=>true,prepare:()=> 'aaaaaaaa'});
  const guestStart = guestGame.CK_MATCH_STARTUP.create({transport:guest,validateConfig:()=>true,prepare:()=> 'bbbbbbbb'});
  await hostStart.begin({seed:1});
  await assert.rejects(guestStart.pump(),/worlds differ/);
  assert.equal(guestStart.snapshot().phase,'failed');
  assert.notEqual(hostStart.snapshot().phase,'verified');
});

test('wrong version, premature commit and forbidden guest setup cannot confirm startup', async t => {
  for (const invalid of [
    {kind:'setup',payload:{v:'old-version',config:{seed:1},hash:'aaaaaaaa'}},
    {kind:'commit',payload:{v:'ck-auth-start-1',hash:'aaaaaaaa'}}
  ]) {
    const {host,guest,guestGame} = await pair(t);
    let prepared = 0;
    const start = guestGame.CK_MATCH_STARTUP.create({transport:guest,validateConfig:()=>true,prepare:()=>{prepared++;return 'aaaaaaaa';}});
    await host.send(invalid.kind,invalid.payload);
    await assert.rejects(start.pump());
    assert.equal(prepared,0); assert.equal(start.snapshot().phase,'failed');
  }
  const {guest} = await pair(t);
  await assert.rejects(guest.send('setup',{v:'ck-auth-start-1'}),/Invalid outgoing/);
});

test('deadline and closing during asynchronous generation prevent late startup sends', async t => {
  const {host,hostGame} = await pair(t);
  let clock = 0, release;
  const start = hostGame.CK_MATCH_STARTUP.create({transport:host,validateConfig:()=>true,
    prepare:()=> 'aaaaaaaa',now:()=>clock,timeoutMs:10});
  await start.begin({seed:1}); clock = 10;
  await assert.rejects(start.pump(),/timed out/); assert.equal(start.snapshot().phase,'failed');
  const second = await pair(t);
  const delayed = second.hostGame.CK_MATCH_STARTUP.create({transport:second.host,validateConfig:()=>true,
    prepare:()=>new Promise(resolve=>{release=resolve;})});
  const pending = delayed.begin({seed:1});
  const rejected = assert.rejects(pending,/ended/);
  delayed.close(); release('aaaaaaaa'); await rejected;
  assert.equal(delayed.snapshot().phase,'closed');
});

// DOM surface fixture exercises the actual UI event handlers and relay, not a renderer.
function attachDOM(game) {
  const elements = [];
  const document = game.document;
  document.createElement = tag => {
    const handlers = new Map();
    const element = {tag,style:{},children:[],value:'',disabled:false,textContent:'',
      setAttribute(name,value){this[name]=value;},
      append(...children){this.children.push(...children);},
      addEventListener(name,handler){handlers.set(name,handler);},
      focus(){document.activeElement=this;}, select(){}, remove(){this.removed=true;},
      click(){if(!this.disabled)return handlers.get('click')?.();}
    };
    elements.push(element); return element;
  };
  document.body = {appendChild(){}};
  game.crypto = {getRandomValues(array){array[0]=123456;return array;}};
  game.setTimeout = (handler,delay)=>setTimeout(handler,delay===500?10:delay);
  return {button:text=>elements.find(e=>e.tag==='button'&&e.textContent===text),
    input:()=>elements.find(e=>e.tag==='input'),status:()=>elements.find(e=>e.role==='status'),
    dialog:()=>elements.find(e=>e.role==='dialog')};
}
async function eventually(check) {
  for(let attempt=0;attempt<200;attempt++){
    if(check())return;
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  assert.fail('UI condition did not become true');
}

test('DOM/controller setup flow creates and joins, confirms frozen worlds, and handles guest leave', async t => {
  const {host,guest,hostGame,guestGame} = await pair(t);
  // Release the fixture's original room; the UI must establish fresh credentials itself.
  host.close(); guest.close();
  const hd=attachDOM(hostGame),gd=attachDOM(guestGame);
  let hostLeft=0,guestLeft=0;
  hostGame.CK_AUTH_LOBBY.open(()=>hostLeft++);
  guestGame.CK_AUTH_LOBBY.open(()=>guestLeft++);
  t.after(()=>{hostGame.CK_AUTH_LOBBY.close();guestGame.CK_AUTH_LOBBY.close();});
  assert.equal(hd.dialog()['aria-modal'],'true');
  hostGame.testControl(0); // A on the focused Create button.
  await eventually(()=>hd.input().value.length===43);
  gd.input().value=hd.input().value;
  gd.button('Join room').click();
  await eventually(()=>!hd.button('Verify shared map').disabled);
  // The poll may be finishing; retrying clicks is harmless while its guard is active.
  for(let i=0;i<10&&!/confirmed/.test(hd.status().textContent);i++){
    await hd.button('Verify shared map').click();
    await new Promise(resolve=>setTimeout(resolve,20));
  }
  await eventually(()=>/Both players confirmed/.test(hd.status().textContent)&&/Both players confirmed/.test(gd.status().textContent));
  assert.equal(hostGame.testWorld().time,0);assert.equal(guestGame.testWorld().time,0);
  assert.equal(hostGame.testWorld().mode,'multiplayer');
  guestGame.testControl(1); // B closes the modal and the room.
  assert.equal(guestLeft,1);assert.equal(gd.dialog().removed,true);
  await eventually(()=>/Room setup stopped/.test(hd.status().textContent));
  hostGame.testControl(1);
  assert.equal(hostLeft,1);assert.equal(hd.dialog().removed,true);
});
