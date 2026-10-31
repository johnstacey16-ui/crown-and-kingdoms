/* Single cross-platform acceptance plan for local and GitHub-hosted checks.
 * Keep each regression and campaign in its own process to isolate global game state.
 * Full suites run on request or weekly: never on every hosted push.
 * Usage: node scripts/run-checks.mjs [--focused | --regressions | --regression-files |
 *   --skirmishes | --campaigns | --browser | --xbox-contracts | --full]
 */
import {readdirSync,appendFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const QUICK=[
 ['Source','scripts/check-game.mjs',[]],
 ['Browser/offline graph','scripts/audit-runtime-graph.mjs',[]],
 ['Civilizations','scripts/check-civilization-catalogue.mjs',[]],
 ['Atlas manifest','tests/validate-atlas.mjs',[]],
 ['Graphics inventory','scripts/audit-graphics.mjs',['--check']]
];
// Centralizes the fast hosted selection; all files run under node --test.
const FOCUSED=[
 "tests/simulation-victory-ownership.test.mjs",
 "tests/simulation-logistics-ownership.test.mjs",
 "tests/score-time-limit.test.mjs",
 "tests/sudden-death.test.mjs",
 "tests/king-of-the-hill.test.mjs",
 "tests/diplomacy.test.mjs",
 "tests/browser-foundation.test.mjs",
 "tests/runtime-script-order.test.mjs",
 "tests/procedural-unit-art-module.test.mjs",
 "tests/technology-catalogue.test.mjs",
 "tests/local-check-runner.test.mjs",
 "tests/ci-free-runner-policy.test.mjs",
 "tests/tribute.test.mjs",
 "tests/map-layout-content.test.mjs",
 "tests/map-generation-static.test.mjs",
 "tests/ai-enemy-composition-guards.test.mjs",
 "tests/guard-follow.test.mjs",
 "tests/villager-priority.test.mjs",
 "tests/population-limits.test.mjs",
 "tests/no-attack-stance.test.mjs",
 "tests/town-bell.test.mjs",
 "tests/training-cap-drop.test.mjs",
 "tests/fish-traps.test.mjs",
 "tests/art-revisions.test.mjs",
 "tests/engine-graphics-benchmark-ownership.test.mjs",
 "tests/series-s-auto-pixel-benchmark.test.mjs",
 "tests/series-s-auto-layer-benchmark.test.mjs",
 "tests/series-s-benchmark-controller-isolation.test.mjs",
 "tests/series-s-sharp-hud-canvas.test.mjs",
 "tests/series-s-xbox-picture-presets.test.mjs",
 "tests/ai-policy-ownership.test.mjs",
 "tests/ai-module-ownership.test.mjs",
 "tests/ai-defence-priority.test.mjs",
 "tests/ai-save-for-age.test.mjs",
 "tests/aoe2-de-camel-line-civilizations.test.mjs",
 "tests/aoe-villager-resource-parity.test.mjs",
 "tests/villager-site-assignment.test.mjs",
 "tests/ai-siege-target-runtime.test.mjs",
 "tests/ai-queued-unit-limits.test.mjs",
 "tests/ai-economy-difficulty.test.mjs",
 "tests/ai-rebuild-destroyed-buildings.test.mjs"
];
const SKIRMISHES=[
 {label:'Seeded AI skirmish',file:'scripts/run-skirmish.mjs',args:[]},
 {label:'Seeded hard-AI reload',file:'scripts/run-skirmish.mjs',args:[],
  env:{CK_DIFFICULTY:'3',CK_RELOAD_AT:'600'}},
 {label:'Active-player AI reload',file:'scripts/run-skirmish.mjs',args:[],
  env:{CK_PLAYER:'active',CK_DIFFICULTY:'3',CK_RELOAD_AT:'900',CK_MAX_SECONDS:'2700'}}
];
const CAMPAIGNS=Array.from({length:19},(_,i)=>({
 label:'Campaign '+i,file:'tests/simulation-smoke.test.mjs',args:[],env:{CK_MISSION:String(i)}
}));
const BROWSER=[
 {label:'Battlefield artwork in Chromium',file:'tests/browser/battlefield-art.mjs',args:[]},
 {label:'Responsive multiplayer room in Chromium',file:'tests/browser/room-layout.mjs',args:[]}
];
// Software/controller contracts, not measurements on physical Series S Edge.
const XBOX=[
 'tests/xbox-controller-contract.test.mjs',
 'tests/gamepad-focus-edges.test.mjs',
 'tests/xbox-flat-field-isolation.test.mjs',
 'tests/xbox-built-in-performance-save.test.mjs',
 'tests/series-s-benchmark-controller-isolation.test.mjs',
 'tests/series-s-xbox-picture-presets.test.mjs',
 'tests/series-s-resource-sprite-cache.test.mjs',
 'tests/series-s-painted-troop-frame-cache.test.mjs'
];
const MODES=['quick','focused','regressions','regression-files','skirmishes','campaigns',
 'browser','xbox-contracts','full'];

export function checkPlan(mode='quick',testFiles=[]){
 if(!MODES.includes(mode))throw Error('Unknown check mode: '+mode);
 const jobs=['quick','regressions','full'].includes(mode)
  ?QUICK.map(([label,file,args])=>({label,file,args})):[];
 if(['regressions','regression-files','full'].includes(mode)){
  if(!Array.isArray(testFiles)||!testFiles.length)
   throw Error('No standalone regression tests were found');
  for(const file of [...testFiles].sort()){
   if(!/^tests\/[A-Za-z0-9._-]+\.test\.mjs$/.test(file)||file.includes('..'))
    throw Error('Unsafe regression file: '+file);
   jobs.push({label:file,file,args:[],env:{CK_SKIP_CAMPAIGN:'1'}});
  }
 }
 if(mode==='focused')jobs.push({label:'Focused game, controller and graphics contracts',
  file:'--test',args:[...FOCUSED]});
 if(mode==='skirmishes'||mode==='full')jobs.push(...SKIRMISHES);
 if(mode==='campaigns'||mode==='full')jobs.push(...CAMPAIGNS);
 if(mode==='browser')jobs.push(...BROWSER);
 if(mode==='xbox-contracts')jobs.push(...XBOX.map(file=>({label:file,file,args:[],
  env:{CK_SKIP_CAMPAIGN:'1'}})));
 return jobs;
}

export function checkSummary({mode,total,failed}){
 const rows=['## '+mode+' acceptance','Passed: '+(total-failed.length)+' / '+total,
  'Failed: '+failed.length];
 if(failed.length)rows.push('', '### Failed checks',...failed.map(name=>'- '+name));
 return rows.join('\n')+'\n';
}

export function runChecks({mode='quick',root=ROOT,log=console,spawn=spawnSync,
 summaryPath=process.env.GITHUB_STEP_SUMMARY,appendSummary=appendFileSync,
 grouped=Boolean(process.env.GITHUB_ACTIONS)}={}){
 const scan=['regressions','regression-files','full'].includes(mode);
 const names=scan?readdirSync(resolve(root,'tests'))
  .filter(name=>name.endsWith('.test.mjs')).map(name=>'tests/'+name):[];
 const jobs=checkPlan(mode,names),failures=[];
 for(let i=0;i<jobs.length;i++){
  const job=jobs[i];
  if(grouped)log.log('::group::'+job.label);
  log.log('['+(i+1)+'/'+jobs.length+'] '+job.label);
  const result=spawn(process.execPath,[job.file,...job.args],{
   cwd:root,env:{...process.env,...job.env},stdio:'inherit'
  });
  if(result.error||result.status!==0){
   failures.push(job.label);
   log.error('FAIL: '+job.label+(result.error?' — '+result.error.message:''));
  }
  if(grouped)log.log('::endgroup::');
 }
 log.log('Completed '+(jobs.length-failures.length)+'/'+jobs.length+' checks.');
 if(failures.length)log.error('Failed: '+failures.join(', '));
 const summary={mode,total:jobs.length,failed:failures};
 if(summaryPath)appendSummary(summaryPath,checkSummary(summary),'utf8');
 return summary;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 const requested=args.length===0?'quick':args.length===1&&args[0].startsWith('--')
  ?args[0].slice(2):null;
 const mode=MODES.includes(requested)?requested:null;
 if(!mode){
  console.error('Usage: node scripts/run-checks.mjs [--focused | --regressions | --regression-files | --skirmishes | --campaigns | --browser | --xbox-contracts | --full]');
  process.exitCode=2;
 }else{
  try{const result=runChecks({mode});if(result.failed.length)process.exitCode=1}
  catch(error){console.error('Checks failed to start:',error.message);process.exitCode=1}
 }
}
