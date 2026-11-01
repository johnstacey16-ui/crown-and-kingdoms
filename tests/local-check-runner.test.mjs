import test from 'node:test';
import assert from 'node:assert/strict';
import {checkPlan,runChecks} from '../scripts/run-checks.mjs';

test('quick command runs the current five independent validation gates',()=>{
 const jobs=checkPlan();
 assert.deepEqual(jobs.map(x=>x.file),[
  'scripts/check-game.mjs','scripts/audit-runtime-graph.mjs',
  'scripts/check-civilization-catalogue.mjs','tests/validate-atlas.mjs',
  'scripts/audit-graphics.mjs'
 ]);
 assert.deepEqual(jobs[4].args,['--check']);
});
test('regression mode sorts test files and keeps campaigns isolated',()=>{
 const jobs=checkPlan('regressions',['tests/z.test.mjs','tests/a.test.mjs']);
 assert.equal(jobs.length,7);
 assert.deepEqual(jobs.slice(5).map(x=>x.file),['tests/a.test.mjs','tests/z.test.mjs']);
 assert.ok(jobs.slice(5).every(x=>x.env.CK_SKIP_CAMPAIGN==='1'));
});
test('full mode includes three seeded skirmishes and all nineteen isolated campaigns',()=>{
 const jobs=checkPlan('full',['tests/sample.test.mjs']);
 assert.equal(jobs.length,5+1+3+19);
 assert.equal(jobs.filter(x=>x.file==='scripts/run-skirmish.mjs').length,3);
 const campaigns=jobs.filter(x=>x.label.startsWith('Campaign '));
 assert.deepEqual(campaigns.map(x=>x.env.CK_MISSION),Array.from({length:19},(_,i)=>String(i)));
 assert.equal(jobs.find(x=>x.label==='Active-player AI reload').env.CK_MAX_SECONDS,'2700');
});
test('runner reports individual failures while continuing to check all jobs',()=>{
 const calls=[],messages=[];
 const fake=(_exe,args,options)=>{calls.push({args,options});return{status:calls.length===2?1:0}};
 const log={log:x=>messages.push(x),error:x=>messages.push(x)};
 const result=runChecks({mode:'quick',root:'/some/game',spawn:fake,log});
 assert.equal(result.total,5);
 assert.deepEqual(result.failed,['Browser/offline graph']);
 assert.equal(calls.length,5);
 assert.ok(calls.every(c=>c.options.cwd==='/some/game'&&c.options.stdio==='inherit'));
 assert.ok(messages.some(s=>s.includes('Completed 4/5')));
});
test('unsafe or unsupported test references fail before running subprocesses',()=>{
 assert.throws(()=>checkPlan('full',[]),/No standalone/);
 assert.throws(()=>checkPlan('regressions',['tests/../escape.test.mjs']),/Unsafe regression/);
 assert.throws(()=>checkPlan('unknown',[]),/Unknown check mode/);
});

test('standalone hosted acceptance modes share one plan without repeating expensive checks',()=>{
 const files=['tests/z.test.mjs','tests/a.test.mjs'];
 const standalone=checkPlan('regression-files',files);
 assert.deepEqual(standalone.map(x=>x.file),['tests/a.test.mjs','tests/z.test.mjs']);
 assert.ok(standalone.every(x=>x.env.CK_SKIP_CAMPAIGN==='1'));
 const skirmishes=checkPlan('skirmishes');
 assert.equal(skirmishes.length,3);
 assert.ok(skirmishes.every(x=>x.file==='scripts/run-skirmish.mjs'));
 assert.deepEqual(skirmishes.map(x=>x.env||{}),[
  {},{CK_DIFFICULTY:'3',CK_RELOAD_AT:'600'},
  {CK_PLAYER:'active',CK_DIFFICULTY:'3',CK_RELOAD_AT:'900',CK_MAX_SECONDS:'2700'}
 ]);
 const campaigns=checkPlan('campaigns');
 assert.equal(campaigns.length,19);
 assert.deepEqual(campaigns.map(x=>x.env.CK_MISSION),
  Array.from({length:19},(_,i)=>String(i)));
 assert.ok(campaigns.every(x=>x.file==='tests/simulation-smoke.test.mjs'));
 assert.deepEqual(checkPlan('browser').map(x=>x.file),[
  'tests/browser/battlefield-art.mjs','tests/browser/room-layout.mjs'
 ]);
 const xbox=checkPlan('xbox-contracts');
 assert.ok(xbox.length>=8);
 assert.ok(xbox.some(x=>x.file==='tests/xbox-controller-contract.test.mjs'));
 assert.ok(xbox.some(x=>x.file==='tests/gamepad-focus-edges.test.mjs'));
 assert.equal(checkPlan('full',files).length,
  checkPlan('quick').length+standalone.length+skirmishes.length+campaigns.length);
});
test('hosted jobs group failures and write an accurate summary without aborting later checks',()=>{
 const messages=[],writes=[],calls=[];
 const result=runChecks({mode:'campaigns',root:'/tmp/game',
  spawn:(_exe,args,options)=>{
   calls.push({args,options});
   return {status:calls.length===7?1:0};
  },
  log:{log:x=>messages.push(x),error:x=>messages.push(x)},
  grouped:true,summaryPath:'/tmp/summary',
  appendSummary:(path,body,encoding)=>writes.push({path,body,encoding})
 });
 assert.equal(calls.length,19);
 assert.deepEqual(result.failed,['Campaign 6']);
 assert.equal(messages.filter(x=>x.startsWith('::group::')).length,19);
 assert.equal(messages.filter(x=>x==='::endgroup::').length,19);
 assert.ok(messages.some(x=>x.includes('Completed 18/19')));
 assert.equal(writes.length,1);
 assert.equal(writes[0].encoding,'utf8');
 assert.match(writes[0].body,/Passed: 18 \/ 19/);
 assert.match(writes[0].body,/Failed: 1/);
 assert.match(writes[0].body,/- Campaign 6/);
 assert.deepEqual(calls[6].options.env.CK_MISSION,'6');
});
test('browser and Xbox software contracts never present themselves as hardware acceptance',()=>{
 const browser=checkPlan('browser');
 assert.equal(browser.length,2);
 assert.ok(browser.every(x=>x.file.startsWith('tests/browser/')));
 const xbox=checkPlan('xbox-contracts');
 assert.ok(xbox.every(x=>x.file.startsWith('tests/')&&x.file.endsWith('.test.mjs')));
 assert.equal(checkPlan('campaigns').length,19);
});

test('fast hosted contract selection is one explicit reproducible Node test plan',()=>{
 const focused=checkPlan('focused');
 assert.equal(focused.length,1);
 assert.equal(focused[0].file,'--test');
 const files=focused[0].args;
 assert.equal(files.length,new Set(files).size,'focused files must not be duplicated');
 assert.ok(files.length>=30);
 for(const file of files)assert.match(file,/^tests\/[a-z0-9-]+\.test\.mjs$/);
 for(const file of ['tests/local-check-runner.test.mjs',
  'tests/ci-free-runner-policy.test.mjs','tests/runtime-script-order.test.mjs',
  'tests/ai-siege-target-runtime.test.mjs','tests/technology-catalogue.test.mjs',
  'tests/town-bell.test.mjs','tests/map-generation-static.test.mjs',
  'tests/ai-enemy-composition-guards.test.mjs',
  'tests/training-cap-drop.test.mjs','tests/ai-save-for-age.test.mjs',
  'tests/repository-evidence-inventory.test.mjs','tests/network-sync-protocol.test.mjs',
  'tests/network-frame-replay.test.mjs','tests/seeded-world-continuation.test.mjs',
  'tests/economy-invariants.test.mjs',
  'tests/simulation-production-queues-ownership.test.mjs','tests/large-army-chokepoint.test.mjs',
  'tests/waypoint-collision-safety.test.mjs',
  'tests/network-command-uplink.test.mjs',
  'tests/network-sync-authority.test.mjs'])
  assert.ok(files.includes(file),'critical focused contract absent: '+file);
});
