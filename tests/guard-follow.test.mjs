import assert from 'node:assert/strict';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const html = loadCoreGameSource({includeUI:true,includeAssets:true});

assert.match(html, /function orderGuardFollow\(wx,wy,kind\)\{/,
  'Guard and Follow must use a shared controller-order handler');
assert.match(html, /target\.t!==0&&diplomacyRelation\(0,target\.t\)!=='ally'/,
  'Guard/Follow targets must be owned by the player or an ally');
assert.match(html, /u\.k!=='vil'&&u\.k!=='cart'&&u\.k!=='cog'&&!!\(U\[u\.k\]&&U\[u\.k\]\.sh\)===ship/,
  'Guard/Follow must exclude villagers/traders and keep land/ship movement types compatible');
assert.match(html, /if\(u\.o==='F'\|\|u\.o==='G'\)\{const target=u\.tg;/,
  'Guard/Follow orders must be processed continuously by the simulation');
assert.match(html, /if\(u\.o==='G'&&u\.st!==4\)\{const e=foe\(u,6\);if\(e&&e!==target&&d2\(target\.x,target\.y,e\)<=5\)/,
  'Guard must engage hostile units only around the protected target and respect No Attack');
assert.match(html, /const spacing=u\.o==='F'\?1\.25:2,dist=d2\(u\.x,u\.y,target\)/,
  'Follow and Guard must maintain separate target distances');
assert.match(html, /const guard=u\.guardTarget&&u\.guardTarget\.hp>0\?u\.guardTarget:null;u\.o=guard\?'G'/,
  'A guard unit must return to its protected target after its attack ends');
assert.match(html, /\{l:'Follow friendly target',c:\{\},lk:'',fn:\(\)=>\{menu=null;pat=3;/,
  'Follow must be accessible from the existing controller menu');
assert.match(html, /\{l:'Guard friendly target',c:\{\},lk:'',fn:\(\)=>\{menu=null;pat=4;/,
  'Guard must be accessible from the existing controller menu');
assert.match(html, /if\(pat===3\|\|pat===4\)orderGuardFollow\(wx,wy,pat===3\?'F':'G'\)/,
  'The next controller A press must apply Guard/Follow to the cursor target');
assert.match(html, /pat===3\?'FOLLOW: select a friendly target, B cancel':pat===4\?'GUARD: select a friendly target, B cancel'/,
  'The HUD must explain Guard/Follow targeting to the player');
assert.match(html, /u\.autoWorker=0;u\.guardTarget=null;/,
  'New direct player orders must cancel previous guard behaviour');
assert.match(html, /function stopSel\(\)\{[\s\S]{0,200}u\.guardTarget=null/,
  'Stop must clear guard/follow behavior');

console.log('guard-follow: all 13 source regression assertions passed');
