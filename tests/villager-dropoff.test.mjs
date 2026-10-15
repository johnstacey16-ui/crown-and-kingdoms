import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
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
contains("if(++failed>=2)break;",
  'At most two unreachable drop-offs should be path-tested per retry');
contains("candidates.sort((a,b)=>(dropoffKey(a)===u.dropKey?-1:dropoffKey(b)===u.dropKey?1:0)||d2(u.x,u.y,a)-d2(u.x,u.y,b));",
  'A previously selected reachable drop-off must be preferred while it remains eligible');
contains("if(!dest){u.dropKey='';u.p=[];u.dropRetry=3;return}",
  'When no destination is reachable, a short retry delay must prevent pathfinding every simulation tick');
contains("const b=S.bs.find(q=>dropoffKey(q)===u.dropKey&&dropoffCompatible(u,q));",
  'Travelling villagers must resolve their saved drop-off key and detect destroyed/incompatible destinations');
contains("u.car=0;u.ret=0;u.p=[];u.dropKey='';u.dropRetry=0;return",
  'Successful delivery must deposit the carried amount and clear transient drop-off state');
contains("us:S.us.map(u=>({...u,tg:rf(u.tg),rel:null,ld:rf(u.ld),cg:u.cg?u.cg.map(rf):undefined}))",
  'Drop-off retry state must stay serializable within the existing compatible save payload');
console.log('villager-dropoff: all 12 source regression assertions passed');
