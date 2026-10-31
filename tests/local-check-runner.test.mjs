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
