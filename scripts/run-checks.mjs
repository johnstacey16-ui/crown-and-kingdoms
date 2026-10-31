/* Cross-platform, free-only validation runner; mirrors current GitHub workflows.
 * No network services, deployment or paid runners are started by this script.
 * Usage: node scripts/run-checks.mjs [--regressions | --full] */
import {readdirSync} from 'node:fs';
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

export function checkPlan(mode='quick',testFiles=[]){
 if(!['quick','regressions','full'].includes(mode))throw Error('Unknown check mode: '+mode);
 const jobs=QUICK.map(([label,file,args])=>({label,file,args}));
 if(mode==='quick')return jobs;
 if(!Array.isArray(testFiles)||!testFiles.length)throw Error('No standalone regression tests were found');
 for(const file of [...testFiles].sort()){
  if(!/^tests\/[A-Za-z0-9._-]+\.test\.mjs$/.test(file)||file.includes('..'))
   throw Error('Unsafe regression file: '+file);
  jobs.push({label:file,file,args:[],env:{CK_SKIP_CAMPAIGN:'1'}});
 }
 if(mode==='full'){
  jobs.push(
   {label:'Seeded AI skirmish',file:'scripts/run-skirmish.mjs',args:[]},
   {label:'Seeded hard-AI reload',file:'scripts/run-skirmish.mjs',args:[],
    env:{CK_DIFFICULTY:'3',CK_RELOAD_AT:'600'}},
   {label:'Active-player AI reload',file:'scripts/run-skirmish.mjs',args:[],
    env:{CK_PLAYER:'active',CK_DIFFICULTY:'3',CK_RELOAD_AT:'900',CK_MAX_SECONDS:'2700'}}
  );
  for(let i=0;i<19;i++)jobs.push({label:'Campaign '+i,
   file:'tests/simulation-smoke.test.mjs',args:[],env:{CK_MISSION:String(i)}});
 }
 return jobs;
}

export function runChecks({mode='quick',root=ROOT,log=console,spawn=spawnSync}={}){
 const names=mode==='quick'?[]:readdirSync(resolve(root,'tests'))
  .filter(name=>name.endsWith('.test.mjs')).map(name=>'tests/'+name);
 const jobs=checkPlan(mode,names),failures=[];
 for(let i=0;i<jobs.length;i++){
  const job=jobs[i];
  log.log('['+(i+1)+'/'+jobs.length+'] '+job.label);
  const result=spawn(process.execPath,[job.file,...job.args],{
   cwd:root,env:{...process.env,...job.env},stdio:'inherit'
  });
  if(result.error||result.status!==0){
   failures.push(job.label);
   log.error('FAIL: '+job.label+(result.error?' — '+result.error.message:''));
  }
 }
 log.log('Completed '+(jobs.length-failures.length)+'/'+jobs.length+' checks.');
 if(failures.length)log.error('Failed: '+failures.join(', '));
 return {total:jobs.length,failed:failures};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 const mode=args.length===0?'quick':args.length===1&&args[0]==='--regressions'?'regressions':
  args.length===1&&args[0]==='--full'?'full':null;
 if(!mode){console.error('Usage: node scripts/run-checks.mjs [--regressions | --full]');process.exitCode=2}
 else{
  try{const summary=runChecks({mode});if(summary.failed.length)process.exitCode=1}
  catch(error){console.error('Checks failed to start:',error.message);process.exitCode=1}
 }
}
