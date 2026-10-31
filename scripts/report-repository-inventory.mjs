/* Current checked-out tree inventory. Counts are observations, not release claims.
 * Run: node scripts/report-repository-inventory.mjs
 * This avoids audit notes relying on historical, manually copied totals. */
import {readdirSync,readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {browserScriptPaths,coreGameScriptPaths} from './runtime-sources.mjs';
import {checkPlan} from './run-checks.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');

export function reportRepositoryInventory(root=ROOT){
 const html=readFileSync(join(root,'index.html'),'utf8');
 const browser=browserScriptPaths(html);
 const core=coreGameScriptPaths(html);
 const headless=coreGameScriptPaths(html,{includeUI:false,includeAssets:false});
 const tests=readdirSync(join(root,'tests'))
  .filter(name=>/^[A-Za-z0-9._-]+\.test\.mjs$/.test(name)).sort();
 const focused=checkPlan('focused')[0].args;
 const markdown=(dir)=>{
  let count=0;
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   if(entry.isDirectory()){
    if(!['.git','node_modules','.vercel','dist','build'].includes(entry.name))
     count+=markdown(join(dir,entry.name));
   }else if(entry.isFile()&&entry.name.endsWith('.md'))count++;
  }
  return count;
 };
 return {
  standaloneRegressionFiles:tests.length,
  focusedFileCount:focused.length,
  productionScripts:browser.length,
  coreScripts:core.length,
  headlessScripts:headless.length,
  markdownFiles:markdown(root)
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 console.log(JSON.stringify(reportRepositoryInventory(),null,2));
}
