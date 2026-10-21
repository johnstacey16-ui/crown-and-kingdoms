import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {once} from 'node:events';
import {chromium} from 'playwright';
import {createApplication} from '../../server/app.mjs';
const output='artifacts/battlefield-art';
await mkdir(output,{recursive:true});
const server=createApplication();server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch({headless:true}),results=[];
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844},{width:320,height:640}]){
  const page=await browser.newPage({viewport});
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('supabase.co')||r.url().includes('/api/multiplayer/'))requests.push(r.url());});
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle'});
  await page.evaluate(()=>{
   window.openPeerPreviewFromMenu=()=>{
    CK_NET.openLobby();
    for(let i=0;i<8;i++){E=[];E[13]=true;CK_NET.control(1/30);}
    E=[];E[0]=true;CK_NET.control(1/30);E=[];
   };
   openPeerPreviewFromMenu();
  });
  const dialog=page.getByRole('dialog',{name:'Authenticated multiplayer setup'});
  await dialog.waitFor();
  const layout=await dialog.evaluate(el=>{
   const cards=[...el.querySelectorAll('.ck-room-card')].map(c=>({width:c.getBoundingClientRect().width,x:c.getBoundingClientRect().x}));
   return {overflow:el.scrollWidth>el.clientWidth+1,cards,focus:document.activeElement.textContent};
  });
  assert.equal(layout.overflow,false,'room must fit the viewport');
  assert.equal(layout.cards.length,3);
  assert.ok(layout.cards.every(c=>c.width>200));
  assert.equal(layout.focus,'Create private room');
  if(viewport.width<600)assert.ok(Math.abs(layout.cards[0].x-layout.cards[1].x)<1,'mobile cards stack');
  else assert.ok(layout.cards[1].x>layout.cards[0].x,'desktop cards use two columns');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('input[aria-label="Private room invitation"]').evaluate(el=>el===document.activeElement),true,'Tab reaches the invitation field');
  await page.mouse.move(viewport.width/2,viewport.height/2);
  await page.mouse.wheel(0,400);
  await page.waitForFunction(()=>document.querySelector('.ck-room-overlay').scrollTop>0);
  await dialog.evaluate(el=>{el.scrollTop=0;});
  await page.screenshot({path:output+'/room-'+viewport.width+'.png'});
  const leave=dialog.getByRole('button',{name:'Leave setup',exact:true});
  await leave.focus();
  assert.equal(await leave.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  await page.keyboard.press('Enter');
  await dialog.waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>CK_AUTH_LOBBY.active()),false);
  // Confirm the menu chooses the peer factory without creating a real Auth user.
  await page.evaluate(()=>{
   window.peerChosen=false;
   window.CK_WEBRTC_TRANSPORT=Object.freeze({createGuestClient:()=>{peerChosen=true;throw Error('Fixture stops before Auth');}});
   openPeerPreviewFromMenu();
  });
  await page.getByRole('button',{name:'Create private room',exact:true}).click();
  assert.equal(await page.evaluate(()=>peerChosen),true);
  await page.evaluate(()=>CK_AUTH_LOBBY.close());
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[],'opening the room screen must not sign up or connect');
  results.push({viewport,...layout,networkRequests:requests.length,controllerMenuPath:true,peerProviderSelected:true});await page.close();
 }
 await writeFile(output+'/room-layout.json',JSON.stringify(results,null,2));
 console.log('Room layout checks passed: '+results.length+' viewports; no multiplayer requests.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
