import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/pathfinding.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const contains = (needle, message) => assert.ok(html.includes(needle), message);

contains("function dropoffKey(q){return [q.t,q.k,q.x,q.y].join(':')}",
  'Drop-off targets must use a stable serializable key instead of storing a building object reference on a villager');
contains("function dropoffCompatible(u,q){return q.t===u.t&&q.hp>0&&q.done&&",
  'Drop-off selection must only consider completed, living, compatible friendly drop-off buildings');
contains("function skipDropoff(u,q){",
  'Unreachable drop-off locations must be remembered between retries');
contains("function findDropoffRoute(u){",
  'Carrying villagers must use a route-aware drop-off selector');
contains("const route=path(u,goalNear(q,1));",
  'Drop-off selection must verify a route before choosing a building');
contains("if(route&&route.length)return {b:q,route};",
  'The chosen drop-off result must return its already verified route');
contains("if(++failed>=6)break;",
  'Drop-off selection must bound unreachable route checks to six candidates');
contains("candidates.sort((a,b)=>Number(info.get(b).key===u.dropKey)-Number(info.get(a).key===u.dropKey)||info.get(a).dist2-info.get(b).dist2);",
  'The selected drop-off stays preferred using precomputed keys and squared distances');
contains("if(!dest){u.dropKey='';u.p=[];u.dropRetry=3;return}",
  'When no destination is reachable, a short retry delay must prevent pathfinding every simulation tick');
contains("const b=S.bs.find(q=>dropoffKey(q)===u.dropKey&&dropoffCompatible(u,q));",
  'Travelling villagers must resolve their saved drop-off key and detect destroyed/incompatible destinations');
contains("u.car=0;u.ret=0;u.p=[];u.dropKey='';u.dropRetry=0;return",
  'Successful delivery must deposit the carried amount and clear transient drop-off state');
contains("us:S.us.map(u=>({...u,tg:rf(u.tg),rel:null,ld:rf(u.ld),retreatTarget:",
  'Saved unit records must retain their own drop-off retry fields while serialising unit references');
const retry={dropKey:'0:lumber:12:12',dropSkipKeys:['0:lumber:15:12'],dropRetry:3};
const restored=JSON.parse(JSON.stringify({...retry,tg:null,ld:null}));
assert.deepEqual({dropKey:restored.dropKey,dropSkipKeys:restored.dropSkipKeys,dropRetry:restored.dropRetry},retry,
  'the transient drop-off retry state must remain JSON-serialisable');

const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const routeStart=simulation.indexOf('function dropoffKey(');
const routeEnd=simulation.indexOf('\nfunction deployFishTrap(',routeStart);
assert.ok(routeStart>=0&&routeEnd>routeStart,'drop-off route selector must exist');
const sites=Array.from({length:10},(_,i)=>({k:'lumber',t:0,x:i*3+12,y:12,s:2,done:true,hp:100}));
const actor={k:'vil',t:0,ct:'w',sh:false,x:10,y:10,dropSkipKeys:[],dropKey:''};
let pathChecks=0;
const sandbox={S:{bs:sites},W:100,H:100,path:()=>{pathChecks++;return null},goalNear:()=>()=>false};
const find=vm.runInNewContext(simulation.slice(routeStart,routeEnd)+'\nfindDropoffRoute;',sandbox);
assert.equal(find(actor),null,'no fabricated route must be returned if all checked depots are blocked');
assert.equal(pathChecks,6,'no more than six blocked depots may be path-tested in a retry');
assert.equal(actor.dropSkipKeys.length,6,'blocked depot keys must be saved for the next retry');

console.log('villager-dropoff: current routing and bounded retry checks passed');
