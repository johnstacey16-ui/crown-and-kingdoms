import assert from 'node:assert/strict';
import vm from 'node:vm';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createTransport } from '../../server/transport.mjs';
import { headlessGame } from './headless-game.mjs';

const read = name => readFileSync(new URL('../../js/' + name + '.js', import.meta.url), 'utf8');
const startupSource = read('network-startup');
function game(origin, preferences) {
  const { source, sandbox } = headlessGame();
  Object.assign(sandbox, { location:{origin}, URL, AbortController, TextEncoder, fetch, setTimeout, clearTimeout });
  vm.runInNewContext(source + '\n' + read('network-sync') + '\n' + read('network-transport') +
    '\n' + read('network-commands') + '\n' + read('network-delivery') + '\n' + read('network-uplink') + '\n' + startupSource + '\n' + read('network-session') + '\n' + read('network-unit-map') + '\n' + read('network-lobby') + '\n' + preferences + `
    globalThis.testSettings=()=>({msz,mt,kingdoms,civ,aiCiv,diff,aip,vm,mapLayout,startAge,
      startRes,startArmy,startVillagers,popLimit,gameMode,scoreLimit,seedOv,cmp,gs});
    globalThis.testWorld=()=>({time:S.t,mode,resources:S.res,age:S.age,units:S.us.length,
      buildings:S.bs.length,width:W});
    globalThis.testTeam=t=>({food:S.res[t].f,units:S.us.filter(u=>u.t===t&&u.hp>0).length,tc:S.bs.find(b=>b.t===t&&b.k==='tc').netId,queue:S.bs.find(b=>b.t===t&&b.k==='tc').q.length});
    globalThis.testRally=t=>JSON.parse(JSON.stringify(S.bs.find(b=>b.t===t&&b.k==='tc').rally||null));
    globalThis.testRallyPoint=t=>{const b=S.bs.find(b=>b.t===t&&b.k==='tc'),p=spawnPos(b),u={...S.us.find(u=>u.t===t&&u.k==='vil'),x:p[0],y:p[1]};for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){if(Math.hypot(x-u.x,y-u.y)<5||Math.hypot(x-u.x,y-u.y)>10)continue;const route=path(u,gp(x,y,1.5));if(route&&route.length>3)return {x,y};}throw Error('No fixture rally route');};
    globalThis.testFastTraining=()=>{U.vil.t=0.1;};
    globalThis.testNewestUnit=t=>{const u=S.us.filter(u=>u.t===t&&u.k==='vil').at(-1);return {id:u.netId,order:u.o,path:u.p,autoWorker:u.autoWorker};};
    globalThis.testAi=()=>JSON.stringify(S.ai);
    globalThis.testHash=()=>window.CK_SIM_SYNC.worldCheckpoint(S,Math.round(S.t/DT)).hash;
    globalThis.testUnit=t=>{const u=S.us.find(u=>u.t===t&&u.k==='vil');return {id:u.netId,x:u.x,y:u.y,order:u.o};};
    globalThis.testUnits=t=>S.us.filter(u=>u.t===t&&u.k==='vil'&&u.hp>0&&!u.ld).map(u=>({id:u.netId,x:u.x,y:u.y,order:u.o}));
    globalThis.testRefreshMap=(map,team,ready=true)=>map.refresh(S,team,W,H,ready);
    globalThis.testChangeFood=()=>{S.res[1].f++;};
    globalThis.testPreviewDefaults=()=>{startArmy=0;startVillagers=1;startAge=0;startRes=0;gameMode=0;vm=0;};
    globalThis.testControl=(button,held=[])=>{E=[];E[button]=true;P=held.slice();if(button===7)P[7]=true;window.CK_AUTH_LOBBY.control(1/30);E=[];P=[];};
  `, sandbox);
  return sandbox;
}
export async function pair(t) {
  const server = createTransport(); server.listen(0,'127.0.0.1'); await once(server,'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const hostGame = game(origin, 'msz=0;mt=3;mapLayout=0;diff=5;startAge=2;startRes=3;startArmy=2;startVillagers=2;popLimit=300;gameMode=0;vm=4;scoreLimit=900;');
  const guestGame = game(origin, 'msz=3;mt=1;mapLayout=11;diff=0;startAge=0;startRes=5;startArmy=3;startVillagers=0;popLimit=50;gameMode=1;vm=0;scoreLimit=1800;gs=2;');
  const host = hostGame.CK_AUTH_TRANSPORT.createClient(), guest = guestGame.CK_AUTH_TRANSPORT.createClient();
  t.after(() => new Promise(resolve => { host.close(); guest.close(); server.close(resolve); server.closeAllConnections(); }));
  const room = await host.connect(); await guest.connect(room.roomId); await host.refreshRoster();
  return {host,guest,hostGame,guestGame};
}

// DOM surface fixture exercises the actual UI event handlers and relay, not a renderer.
export function attachDOM(game) {
  const elements = [];
  const document = game.document;
  document.createElement = tag => {
    const handlers = new Map();
    const element = {tag,style:{},children:[],value:'',disabled:false,textContent:'',
      setAttribute(name,value){this[name]=value;},
      getContext(){return new Proxy({},{get:()=>()=>{}});},
      getBoundingClientRect(){return {left:0,top:0,width:680,height:680};},
      append(...children){this.children.push(...children);},
      addEventListener(name,handler){handlers.set(name,handler);},
      dispatch(name,event){return handlers.get(name)?.(event);},
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
    dialog:()=>elements.find(e=>e.role==='dialog'&&e['aria-label']==='Authenticated multiplayer setup'),
    menu:()=>elements.find(e=>e.role==='dialog'&&e['aria-label']==='Multiplayer menu'),
    active:()=>document.activeElement};
}
export async function eventually(check) {
  for(let attempt=0;attempt<200;attempt++){
    if(check())return;
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  assert.fail('UI condition did not become true');
}

