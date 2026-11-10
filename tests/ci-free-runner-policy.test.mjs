import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
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

test('unsupported Docker and Railway deployments stay retired without losing local HTTP tests',()=>{
 assert.equal(existsSync(new URL('../Dockerfile',import.meta.url)),false,
  'Dockerfile is not needed by the Vercel site or the local Node tests');
 assert.equal(existsSync(new URL('../.dockerignore',import.meta.url)),false,
  'the retired container build context should not be recreated');
 const workflows=new URL('../.github/workflows/',import.meta.url);
 for(const name of readdirSync(workflows).filter(name=>/\.ya?ml$/.test(name))){
  const source=readFileSync(new URL(name,workflows),'utf8');
  assert.doesNotMatch(source,/\bDockerfile\b|docker\s+(?:build|push)|railway\.app|railway\s+(?:up|deploy|run)/i,
   name+' must not reactivate an unsupported container or Railway deployment');
 }
 const localServer=readFileSync(new URL('../server/README.md',import.meta.url),'utf8');
 assert.match(localServer,/node server\/app\.mjs/,'local HTTP test harness remains available');
 assert.doesNotMatch(localServer,/up\.railway\.app/i,
  'local test documentation must not direct users to the retired external host');
});

test('new game HUD screenshots run in Chromium only weekly, manually, or on explicit commit opt-in',()=>{
 const full=read('battlefield-browser'),fast=read('game-validation');
 const script=readFileSync(new URL('../tests/browser/hud-layout.mjs',import.meta.url),'utf8');
 assert.match(full,/node scripts\/run-checks\.mjs --browser/);
 assert.match(full,/run: node tests\/browser\/hud-layout\.mjs/);
 const job=fast.slice(fast.indexOf('\n  hud-browser:'));
 assert.ok(job,'expected dedicated opt-in browser job');
 assert.match(job,/if: github\.event_name == 'push' && contains\(github\.event\.head_commit\.message, '\[verify-hud-browser\]'\)/);
 assert.match(job,/timeout-minutes: 10/);
 assert.match(job,/node tests\/browser\/hud-layout\.mjs/);
 assert.match(job,/if: always\(\)/);
 assert.doesNotMatch(fast.slice(0,fast.indexOf('\n  hud-browser:')),/playwright install|--browser/);
 for(const size of ['1920,height:1080','1280,height:720','480,height:720','390,height:844']){
  assert.ok(script.includes(size),'missing visual evidence viewport '+size);
 }
 assert.match(script,/hud\(\)/);
 assert.match(script,/drawRadial\(\)/);
 assert.match(script,/before,hud/);
 assert.match(script,/simulation-read-only/);
 assert.match(script,/\.screenshot\(/);
});

test('real battlefield + HUD screenshots remain opt-in and use the true large-army game fixture',()=>{
 const fast=read('game-validation'),weekly=read('battlefield-browser');
 const script=readFileSync(new URL('../tests/browser/hud-battlefield.mjs',import.meta.url),'utf8');
 assert.match(fast,/run: node tests\/browser\/hud-battlefield\.mjs/);
 assert.match(fast,/if: github\.event_name == 'push' && contains\(github\.event\.head_commit\.message, '\[verify-hud-browser\]'\)/);
 assert.match(weekly,/workflow_dispatch:/);
 assert.match(weekly,/run: node tests\/browser\/hud-battlefield\.mjs/);
 assert.doesNotMatch(weekly,/\n  push:|\n  pull_request:/);
 for(const requirement of ['draw(0)','loadSeriesSLargeBattleSave()',
  'S.us.length!==372||S.bs.length!==238','CK_SIM_SYNC.worldCheckpoint(S,1)',
  "page.locator('#ck-world-evidence').screenshot",'figma-world-ui-evidence.json']){
  assert.ok(script.includes(requirement),'world UI evidence contract absent: '+requirement);
 }
 assert.ok(script.includes('perfFlatField=0'),
  'world acceptance cannot quietly substitute flat-field visual isolation');
 assert.ok(script.includes('.drawImage(cv,0,0,CW,CH)'),
  'Chromium world evidence must be copied before the paused-menu RAF can replace it');
});
