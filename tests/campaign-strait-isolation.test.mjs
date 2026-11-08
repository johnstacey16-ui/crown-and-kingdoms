import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('isolated full Strait relic siege preserves authentic win/loss evidence',()=>{
 const result=spawnSync(process.execPath,['tests/simulation-smoke.test.mjs'],{
  cwd:process.cwd(),encoding:'utf8',timeout:200000,maxBuffer:8*1024*1024,
  env:{...process.env,CK_MISSION:'13',CK_SKIP_CAMPAIGN:'0'}
 });
 assert.equal(result.status,0,'campaign runner must complete: '+(result.stderr||'').slice(-1800));
 const line=(result.stdout||'').split('\n').find(x=>x.includes('campaign-isolation-result: '));
 assert.ok(line,'campaign must emit real results: '+(result.stdout||'').slice(-1800));
 const data=JSON.parse(line.split('campaign-isolation-result: ')[1]);
 console.log('Strait pilgrim-guard full battle result '+JSON.stringify(data));
 assert.equal(data.mission,13);
 assert.ok(['win','lose','timeout'].includes(data.outcome));
});
