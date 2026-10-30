import {mkdir} from 'node:fs/promises';
import {once} from 'node:events';
import {chromium} from 'playwright';
import {createApplication} from '../../server/app.mjs';
import {checkLargeArmyTints} from './large-army-tints.mjs';
const output=process.env.CK_ART_OUTPUT||'artifacts/battlefield-art';await mkdir(output,{recursive:true});
const server=createApplication();server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch({headless:true,...(process.env.CK_BROWSER_EXECUTABLE?{executablePath:process.env.CK_BROWSER_EXECUTABLE,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']}:{} )});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>typeof ASSET!=='undefined'&&ASSET.n===57&&PAINT.terrain);
 await page.evaluate(()=>{seedOv=123456;msz=0;kingdoms=4;cmp=null;gameMode=0;vm=0;startAge=3;startArmy=0;startRes=3;start();snd=mus=0;mode='title';});
 console.log(JSON.stringify(await checkLargeArmyTints(page,output),null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
