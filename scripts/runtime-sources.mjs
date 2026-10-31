/* Read classic browser script order from its single live source: index.html.
 * Production remains regular script tags; validation and headless tests use
 * this source-of-truth instead of separate handwritten script concatenations. */
import {readFileSync} from 'node:fs';
const ROOT=new URL('../',import.meta.url);
export function browserScriptPaths(html){
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>m[1]);
 if(!scripts.length)throw Error('Browser script list is empty');
 if(new Set(scripts).size!==scripts.length)throw Error('Duplicate browser script reference');
 for(const path of scripts)if(!/^\.\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.js$/.test(path)||
  path.split('/').includes('..'))throw Error('Unsafe browser script path: '+path);
 return scripts;
}
export function coreGameScriptPaths(html,{includeUI=true,includeAssets=true}={}){
 const scripts=browserScriptPaths(html),start=scripts.indexOf('./js/config.js'),end=scripts.indexOf('./engine.js');
 if(start<0||end<=start)throw Error('Game scripts are missing or misordered in index.html');
 const excluded=new Set([!includeUI&&'./js/ui.js',!includeAssets&&'./js/assets.js'].filter(Boolean));
 return scripts.slice(start,end+1).filter(path=>!excluded.has(path));
}
export function readBrowserRuntime({html=readFileSync(new URL('index.html',ROOT),'utf8'),root=ROOT}={}){
 return browserScriptPaths(html).map(path=>({path,source:readFileSync(new URL(path,root),'utf8')}));
}
export function loadCoreGameSource({html=readFileSync(new URL('index.html',ROOT),'utf8'),
 root=ROOT,includeUI=false,includeAssets=false}={}){
 return coreGameScriptPaths(html,{includeUI,includeAssets})
  .map(path=>readFileSync(new URL(path,root),'utf8')).join('\n');
}
