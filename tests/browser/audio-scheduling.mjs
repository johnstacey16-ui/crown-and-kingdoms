import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Exercise the real WebAudio scheduler after delayed callbacks. This validates
// future scheduling and clock progress, not audible output on Xbox hardware.
export async function checkAudioScheduling(browser){
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.setContent('<button id="start">Start test audio</button>');
  const audio=readFileSync(new URL('../../js/audio.js',import.meta.url),'utf8');
  await page.addScriptTag({content:"let AC=null,snd=1,mus=1,mode='play',S={},gt=0,civ=0;const VOL={m:1,mu:1,sf:1,am:1};\n"+audio+"\ndocument.addEventListener('pointerdown',()=>{if(aInit())AC.resume().catch(()=>{})});"});
  await page.click('#start');await page.waitForFunction(()=>AC?.state==='running');
  const result=await page.evaluate(async()=>{
   aSt=()=> 'combat';const original=aStep,calls=[],cases=[];
   aStep=(at,d,state)=>{calls.push({at,now:AC.currentTime,phase:AUD.sp});original(at,d,state)};
   for(const delay of [120,350,700,950,1500]){
    AUD.nt=0;AUD.sp=0;aMus();const count=calls.length,start=AC.currentTime;
    await new Promise(resolve=>setTimeout(resolve,delay));aMus();
    cases.push({delay,audioElapsed:AC.currentTime-start,scheduled:calls.slice(count)});
   }
   const state=AC.state;await AC.close();return {state,cases};
  });
  assert.equal(result.state,'running');assert.deepEqual(errors,[]);assert.ok(result.cases.some(c=>c.scheduled.length),'music continues after delayed callbacks');
  for(const c of result.cases){assert.ok(c.audioElapsed>0);assert.ok(c.scheduled.length<=2,'no overdue-note burst');for(const s of c.scheduled)assert.ok(s.at>=s.now,'never schedule a past note after '+c.delay+'ms delay')}
  return result;
 }finally{await page.close()}
}
