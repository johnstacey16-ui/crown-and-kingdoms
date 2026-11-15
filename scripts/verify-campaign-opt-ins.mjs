/* Opt-in campaign diagnostics for the GitHub validation workflow.
 * Keep exact historic mission IDs and victory policies; no normal push starts a mission.
 */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const MISSION_OPT_INS=Object.freeze([["verify-causeway",16,false],["verify-crossing",17,false],["verify-golden-coast",12,false],["verify-redwater",7,true],["verify-kings-road",10,true],["verify-relic-road",3,true],["verify-reliquary",11,true],["verify-ashford",8,true],["verify-northern",6,true],["verify-raiders-ford",1,true],["verify-kronburg",4,true],["verify-greywatch",9,true],["verify-iron-pass",18,true],["verify-blackwood",15,true],["verify-frontier",2,true]]);
export function missionOptInPlan(message=''){
 if(typeof message!=='string')throw TypeError('Commit message must be text');
 return MISSION_OPT_INS.filter(([marker])=>message.includes('['+marker+']'))
  .map(([marker,mission,requireVictory])=>({marker,mission,requireVictory}));
}
export function runCampaignOptIns({message='',root=ROOT,spawn=spawnSync,
 env=process.env,log=console}={}){
 const selected=missionOptInPlan(message),failed=[];
 for(const mission of selected){
  const childEnv={...env,CK_MISSION:String(mission.mission)};
  if(mission.requireVictory)childEnv.CK_REQUIRE_CAMPAIGN_VICTORY='1';
  else delete childEnv.CK_REQUIRE_CAMPAIGN_VICTORY;
  log.log('Checking mission '+mission.mission+' ('+mission.marker+')');
  const result=spawn(process.execPath,['tests/simulation-smoke.test.mjs'],{
   cwd:root,env:childEnv,stdio:'inherit'
  });
  if(result.error||result.status!==0){
   failed.push(mission.marker);
   log.error('Campaign check failed: '+mission.marker+
    (result.error?' — '+result.error.message:''));
  }
 }
 log.log('Explicit mission checks: '+(selected.length-failed.length)+'/'+selected.length+
  ' passed. Full 19-mission acceptance is separate.');
 return {selected,failed};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=runCampaignOptIns({message:process.env.CK_COMMIT_MESSAGE||''});
 if(result.failed.length)process.exitCode=1;
}
