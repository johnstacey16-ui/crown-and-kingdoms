import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../.github/workflows/'+name+'.yml',import.meta.url),'utf8');
test('hosted expensive workflows remain manually dispatchable and weekly, not triggered by every commit',()=>{
 for(const name of ['game-regression','battlefield-browser']){
  const source=read(name);
  const triggers=source.slice(source.indexOf('\non:')+1,source.indexOf('\npermissions:'));
  assert.match(triggers,/workflow_dispatch:/);
  assert.match(triggers,/schedule:/);
  assert.match(triggers,/cron: '0 7 \* \* 0'/);
  assert.doesNotMatch(triggers,/\n  push:|\n  pull_request:/);
 }
 const regression=read('game-regression');
 assert.match(regression,/node scripts\/run-checks\.mjs --regression-files/);
 assert.match(regression,/node scripts\/run-checks\.mjs --skirmishes/);
 // The three AI simulations must execute even when any standalone regression fails.
 const regressionJob=regression.match(/\n  node-checks:\n([\s\S]*?)(?=\n  [a-z][a-z-]*:\n|$)/)?.[1];
 const aiJob=regression.match(/\n  seeded-skirmishes:\n([\s\S]*?)(?=\n  [a-z][a-z-]*:\n|$)/)?.[1];
 assert.ok(regressionJob&&aiJob,'standalone regressions and AI skirmishes require separate jobs');
 assert.match(regressionJob,/run: node scripts\/run-checks\.mjs --regression-files/);
 assert.doesNotMatch(regressionJob,/--skirmishes/);
 assert.match(aiJob,/run: node scripts\/run-checks\.mjs --skirmishes/);
 assert.doesNotMatch(aiJob,/--regression-files|\n    needs:/);
 assert.match(aiJob,/timeout-minutes: 45/);
 assert.match(regression,/node scripts\/run-checks\.mjs --campaigns/);
 assert.match(read('battlefield-browser'),/node scripts\/run-checks\.mjs --browser/);
 assert.doesNotMatch(regression,/for mission in|for test_file in|tests=\(/);
});
test('fast hosted validation uses one shared focused plan',()=>{
 const source=read('game-validation');
 assert.match(source,/node scripts\/run-checks\.mjs --focused/);
 assert.match(source,/node scripts\/run-checks\.mjs --quick/);
 assert.doesNotMatch(source,/run: node scripts\/check-game\.mjs/);
 assert.doesNotMatch(source,/node --test \\/);
});
test('trusted manual Windows self-hosted workflow offers full Node, AI and Chromium acceptance',()=>{
 const source=read('free-self-hosted-acceptance');
 assert.match(source,/workflow_dispatch:/);
 assert.match(source,/runs-on: \[self-hosted, Windows, X64\]/);
 assert.match(source,/github\.ref == 'refs\/heads\/main'/);
 assert.match(source,/node scripts\/run-checks\.mjs --full/);
 assert.match(source,/node scripts\/run-checks\.mjs --browser/);
 assert.doesNotMatch(source,/\n  push:|\n  pull_request:/);
});
