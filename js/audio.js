/* Crown & Kingdoms — procedural audio synthesis, spatial sound and adaptive music. */
/* ===== AUDIO ENGINE: every sound is synthesised (no assets). Buses: master > music / effects / ambient / interface / voice ===== */
const AUD={ok:0,cd:{},vc:0,lc:-99,lv:{pad:0,bass:0,arp:0,drum:0,drone:0},nt:0,sp:0};let aT=0;
const R1=(a,b)=>a+Math.random()*(b-a);
function aInit(){if(AUD.ok)return AUD.ok>0;try{const C=window.AudioContext||window.webkitAudioContext;if(!C){AUD.ok=-1;return false}AC=AC||new C();const m=AC.createGain(),cp=AC.createDynamicsCompressor();cp.threshold.value=-16;cp.ratio.value=5;m.connect(cp);cp.connect(AC.destination);AUD.m=m;AUD.b={};for(const k of['mu','sf','am','ui','vo']){const g=AC.createGain();g.connect(m);AUD.b[k]=g}
const n=AC.sampleRate*2|0,bf=AC.createBuffer(1,n,AC.sampleRate),d=bf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;AUD.nb=bf;
const L=(ty,f,q)=>{const s=AC.createBufferSource();s.buffer=bf;s.loop=true;const fl=AC.createBiquadFilter();fl.type=ty;fl.frequency.value=f;fl.Q.value=q;const g=AC.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(AUD.b.am);s.start();return{g,fl}};
AUD.ly={wind:L('lowpass',420,.7),water:L('bandpass',520,.9),leaf:L('highpass',2600,.5)};AUD.ok=1;aVol();return true}catch(e){AUD.ok=-1;return false}}
function aVol(){if(AUD.ok<1)return;const t=AC.currentTime,dk=mode==='pause'?.35:1,B=AUD.b;AUD.m.gain.setTargetAtTime(snd?VOL.m:0,t,.05);B.mu.gain.setTargetAtTime(mus?VOL.mu*dk:0,t,.1);B.sf.gain.setTargetAtTime(VOL.sf,t,.05);B.ui.gain.setTargetAtTime(VOL.sf,t,.05);B.vo.gain.setTargetAtTime(VOL.sf,t,.05);B.am.gain.setTargetAtTime(VOL.am*dk,t,.1)}
function sOut(x,y,bus){const P=w2s(x,y),dx=(P[0]-CW/2)/(CW/2),dy=(P[1]-CH/2)/(CH/2);if(Math.abs(dx)>1.25||Math.abs(dy)>1.25)return null;const g=AC.createGain();g.gain.value=Math.max(.25,1-Math.max(0,Math.hypot(dx,dy*.8)-.5)*.7);g._ckPan=null;if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,dx))*.8;g.connect(p);p.connect(bus);g._ckPan=p}else g.connect(bus);return g}
function nz(o,t,d,ty,f,q,v,f2){const s=AC.createBufferSource();s.buffer=AUD.nb;s.loop=true;const fl=AC.createBiquadFilter();fl.type=ty;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+d);fl.Q.value=q;const g=AC.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(o);s.start(t,Math.random());s.stop(t+d+.03)}
function tn(o,t,d,ty,f,f2,v,at){at=at||.004;const s=AC.createOscillator(),g=AC.createGain();s.type=ty;s.frequency.setValueAtTime(f,t);if(f2)s.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(g);g.connect(o);s.start(t);s.stop(t+d+.03)}
function pd(o,t,d,f,v){const s=AC.createOscillator(),g=AC.createGain();s.type='sawtooth';s.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.9);g.gain.setValueAtTime(v,t+Math.max(1,d-1.3));g.gain.linearRampToValueAtTime(.0001,t+d);s.connect(g);g.connect(o);s.start(t);s.stop(t+d+.05)}
const FV={a:[800,1150],o:[500,900],u:[330,760],e:[520,1800],i:[300,2300]},VX={vil:[['o',.1,1],['e',.09,.9]],sol:[['a',.13,.85]],cav:[['a',.09,.9],['o',.14,.8]],arc:[['e',.11,.9]],mon:[['u',.4,1.05],['o',.4,.97]],king:[['o',.2,.9],['a',.2,.85]],die:[['o',.28,.55]],vdie:[['o',.3,.6]]},VP={vil:240,sol:125,cav:105,arc:150,mon:190,king:115};
function syl(o,t,d,f0,f1,v,vw,at){const s=AC.createOscillator(),g=AC.createGain();s.type='sawtooth';s.frequency.setValueAtTime(f0,t);s.frequency.linearRampToValueAtTime(f0*(f1||1),t+d);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+(at||.02));g.gain.exponentialRampToValueAtTime(.0001,t+d);for(const F of FV[vw]){const b=AC.createBiquadFilter();b.type='bandpass';b.frequency.value=F;b.Q.value=7;s.connect(b);b.connect(g)}g.connect(o);s.start(t);s.stop(t+d+.03)}
function vox(o,t,k,p){const q=VX[k];if(!q)return;let tt=t;for(const[v,d,m]of q){syl(o,tt,d,p*R1(.95,1.05),m,.28,v,k==='mon'?.12:.02);tt+=d*.9}}
const vk=k=>k==='vil'?'vil':k==='mon'?'mon':k==='king'?'king':(U[k]&&U[k].mt)||['scout','knight','camel','mgd','cata','mamel','ele','eled'].includes(k)?'cav':U[k]&&U[k].rng>2?'arc':'sol';
const SFX={blade:{cd:40,d:.3,f:(o,t)=>{nz(o,t,.08,'bandpass',R1(2200,3400),2.2,.32);tn(o,t,.2,'triangle',R1(1500,2100),R1(1000,1300),.1)}},
stab:{cd:40,d:.2,f:(o,t)=>{nz(o,t,.06,'bandpass',R1(1100,1600),1.4,.3);tn(o,t,.1,'sine',R1(280,360),120,.25)}},
blunt:{cd:40,d:.25,f:(o,t)=>{tn(o,t,.15,'sine',R1(140,190),55,.55);nz(o,t,.07,'lowpass',900,1,.3)}},
metal:{cd:38,d:.24,f:(o,t)=>{nz(o,t,.055,'bandpass',R1(2600,3900),3,.22);tn(o,t,.16,'triangle',R1(780,1040),R1(240,340),.18)}},
arrowhit:{cd:45,d:.18,f:(o,t)=>{nz(o,t,.045,'highpass',R1(2400,3600),1.8,.18);tn(o,t,.08,'triangle',R1(260,380),100,.22)}},
woodhit:{cd:45,d:.22,f:(o,t)=>{tn(o,t,.12,'sine',R1(105,155),R1(45,70),.46);nz(o,t,.055,'lowpass',R1(650,980),1.1,.2)}} ,
harvest:{cd:260,d:.2,f:(o,t)=>{nz(o,t,.045,'highpass',R1(1800,2600),1.4,.14);tn(o,t,.1,'triangle',R1(420,620),R1(250,360),.16)}},
arrow:{cd:50,d:.2,f:(o,t)=>{nz(o,t,.09,'highpass',3200,.7,.1);tn(o,t,.07,'triangle',R1(560,760),280,.16)}},
bow:{cd:45,d:.25,f:(o,t)=>{tn(o,t,.11,'triangle',R1(380,460),110,.18);nz(o,t,.13,'bandpass',R1(1800,2600),1.6,.14,500)}},
launch:{cd:120,d:.5,f:(o,t)=>{tn(o,t,.35,'sine',120,45,.5);nz(o,t,.3,'lowpass',700,.8,.25,150)}},
boom:{cd:110,d:1,f:(o,t)=>{tn(o,t,.7,'sine',95,28,.95);nz(o,t,.6,'lowpass',520,1,.55,80)}},
hammer:{cd:200,d:.15,f:(o,t)=>{tn(o,t,.08,'square',R1(230,300),170,.1);nz(o,t,.05,'bandpass',1400,2,.18)}},
chop:{cd:230,d:.15,f:(o,t)=>{tn(o,t,.1,'sine',R1(140,190),85,.32);nz(o,t,.05,'bandpass',700,1.2,.2)}},
mine:{cd:230,d:.2,f:(o,t)=>{tn(o,t,.14,'triangle',R1(1500,2300),R1(1000,1500),.09);nz(o,t,.04,'highpass',4000,1,.1)}},
built:{cd:150,d:.6,f:(o,t)=>{tn(o,t,.3,'triangle',523,0,.14);tn(o,t+.12,.4,'triangle',659,0,.14)}},
train:{cd:150,d:.9,f:(o,t)=>{tn(o,t,.8,'sine',880,0,.14);tn(o,t,.5,'sine',1320,0,.06)}},
tech:{cd:150,d:.7,b:'ui',f:(o,t)=>{[523,659,784].forEach((f,i)=>tn(o,t+i*.09,.35,'triangle',f,0,.12))}},
age:{cd:500,d:2,b:'ui',f:(o,t)=>{[392,494,587,784].forEach((f,i)=>{tn(o,t+i*.17,.7,'triangle',f,0,.16);tn(o,t+i*.17,.7,'sawtooth',f/2,0,.05)})}},
collapse:{cd:150,d:1.5,f:(o,t)=>{nz(o,t,1.2,'lowpass',900,.8,.8,90);tn(o,t,.9,'sine',70,28,.7);for(let i=0;i<4;i++)tn(o,t+.1+i*.13,.1,'triangle',R1(700,1400),R1(300,600),.07)}},
sink:{cd:150,d:.9,f:(o,t)=>{nz(o,t,.7,'lowpass',1800,.8,.35,300);tn(o,t,.5,'sine',200,80,.2)}},
death:{cd:60,d:.5,b:'vo',f:(o,t,a)=>vox(o,t,a.k==='vil'?'vdie':'die',a.k==='vil'?250:150)},
vox:{cd:200,d:.5,b:'vo',f:(o,t,a)=>{const k=a.k||'sol';vox(o,t,k,VP[k]*(.94+(civ%4)*.03))}},
creak:{cd:200,d:.5,f:(o,t)=>{nz(o,t,.35,'bandpass',180,5,.14,330);tn(o,t,.25,'square',90,70,.05)}},
bsel:{cd:150,d:.2,b:'ui',f:(o,t)=>{tn(o,t,.12,'square',330,0,.06);tn(o,t+.05,.12,'square',440,0,.05)}},
horn:{cd:1000,d:1.2,b:'ui',f:(o,t)=>{tn(o,t,.5,'sawtooth',196,190,.16,.05);tn(o,t+.3,.7,'sawtooth',262,255,.16,.05)}},
bird:{cd:300,d:.5,b:'am',f:(o,t)=>{const n=2+(Math.random()*3|0);for(let i=0;i<n;i++)tn(o,t+i*.11,.09,'sine',R1(2600,3800),R1(3800,5200),.05)}},
cmd:{cd:60,d:.1,b:'ui',f:(o,t)=>tn(o,t,.07,'triangle',440,0,.1)},select:{cd:40,d:.1,b:'ui',f:(o,t)=>tn(o,t,.04,'square',700,0,.05)},
u_move:{cd:30,d:.1,b:'ui',f:(o,t)=>tn(o,t,.04,'square',R1(520,540),0,.06)},u_ok:{cd:60,d:.2,b:'ui',f:(o,t)=>{tn(o,t,.08,'triangle',880,0,.1);tn(o,t+.05,.1,'triangle',1320,0,.08)}},
u_back:{cd:60,d:.2,b:'ui',f:(o,t)=>tn(o,t,.1,'triangle',330,220,.1)},u_note:{cd:80,d:.1,b:'ui',f:(o,t)=>tn(o,t,.06,'sine',520,0,.07)}};
function sfx(id,x,y,a){if(!snd||AUD.ok<0)return;try{if(!aInit())return;if(AC.state!=='running'){AC.resume().catch(()=>{});return}const def=SFX[id],nm=performance.now();if(!def||(AUD.cd[id]!==undefined&&nm-AUD.cd[id]<def.cd)||AUD.vc>=26)return;const base=AUD.b[def.b||'sf'];let d=base,spatial=false;if(x!==undefined){d=sOut(x,y,base);if(!d)return;spatial=true}AUD.cd[id]=nm;AUD.vc++;setTimeout(()=>{AUD.vc=Math.max(0,AUD.vc-1);if(spatial){try{if(d._ckPan)d._ckPan.disconnect();d.disconnect()}catch(e){}}},(def.d*1000|0)+150);def.f(d,AC.currentTime+.005,a||{})}catch(e){}}
const uis=id=>sfx('u_'+id);
function hitSnd(a,t){AUD.lc=gt;const d=U[a.k]||{},bx=(t.s||0)/2;let id;if(t.s)id=d.sg||d.bb?'boom':(Math.random()<.35?'woodhit':'blunt');else if(d.sg)id='boom';else if(d.rng>2)id=Math.random()<.28?'arrowhit':'arrow';else if(a.k==='spear'||a.k==='skirm')id='stab';else if(a.k==='ele'||a.k==='ram')id=Math.random()<.4?'woodhit':'blunt';else id=Math.random()<.32?'metal':'blade';sfx(id,t.x+bx,t.y+bx)}
function ack(u){if(!u)return;if(u.q){sfx('bsel',u.x+u.s/2,u.y+u.s/2);return}sfx('select');const d=U[u.k]||{};sfx(d.sh||d.sg?'creak':'vox',u.x,u.y,{k:vk(u.k)})}
function ackCmd(u){sfx('cmd');if(u&&!u.q&&Math.random()<.6){const d=U[u.k]||{};sfx(d.sh||d.sg?'creak':'vox',u.x,u.y,{k:vk(u.k)})}}
function sting(win){if(!snd||!aInit()||AC.state!=='running')return;const t=AC.currentTime+.05,o=AUD.b.ui;if(win)[523,659,784,1046,1319].forEach((f,i)=>{tn(o,t+i*.16,.9,'triangle',f,0,.16);tn(o,t+i*.16,.9,'sawtooth',f/2,0,.04)});else[392,330,262,196].forEach((f,i)=>{tn(o,t+i*.3,1.1,'sawtooth',f,0,.07,.04);tn(o,t+i*.3,1.1,'sine',f/2,0,.14)})}
function aAmb(){if(AUD.ok<1||AC.state!=='running')return;const t=AC.currentTime,pl=mode==='play'&&S&&snd;let wf=0,ff=0;if(pl){const c=s2w(CW/2,CH/2),cx=c[0]|0,cy=c[1]|0;let n=0;for(let j=-8;j<=8;j+=2)for(let i=-8;i<=8;i+=2){const x=cx+i,y=cy+j;if(x<0||y<0||x>=W||y>=H)continue;n++;const k=y*W+x;if(S.wt[k])wf++;else if(S.nd[k]&&S.nd[k].k==='w')ff++}wf/=n||1;ff/=n||1}
const pal=pl?S.pal|0:0,L=AUD.ly;L.wind.g.gain.setTargetAtTime(pl?(.03+.04*(1-Math.min(1,ff*4)))*(pal===2?1.8:pal===1?1.4:1):0,t,.8);L.wind.fl.frequency.setTargetAtTime(380+160*Math.sin(gt*.27)+(pal===2?120:0),t,.5);L.water.g.gain.setTargetAtTime(pl?Math.min(.07,wf*.25):0,t,.8);L.leaf.g.gain.setTargetAtTime(pl?Math.min(.035,ff*.2):0,t,.8);
if(pl&&ff>.05&&pal!==2&&Math.random()<.05){const c=s2w(CW/2+R1(-CW*.4,CW*.4),CH/2+R1(-CH*.3,CH*.3));sfx('bird',c[0],c[1])}}
const SCS={w:[0,2,3,5,7,9,10],e:[0,2,4,7,9],m:[0,1,4,5,7,8,10]},CSC=['w','w','e','m','m','w','w','w','m','m','e','e','e','m','m','w','w','e','w','e','e','e','m','m','e','m'],PRG=[[0,3,4,0],[0,5,3,4],[0,2,3,4],[0,4,5,3]],MST={peace:{pad:.55,bass:0,arp:.5,drum:0,drone:0,bpm:64},tension:{pad:.6,bass:.45,arp:.2,drum:.3,drone:.45,bpm:82},combat:{pad:.4,bass:.55,arp:0,drum:1,drone:.3,bpm:112}};
function aSt(){if(mode!=='play'||!S)return'peace';if(gt-AUD.lc<6)return'combat';if(S.ping&&S.t-S.ping.t<25)return'tension';return'peace'}
function aMus(){if(AUD.ok<1||AC.state!=='running')return;const ok=snd&&mus&&['play','pause','title','setup','opts','info','obj','tree','remap','camp','brief','slots'].includes(mode),st=ok?aSt():'peace',T=MST[st];AUD.st=st;for(const k in AUD.lv)AUD.lv[k]+=((ok?T[k]:0)-AUD.lv[k])*.12;if(!ok){AUD.nt=0;return}
const now=AC.currentTime;if(!AUD.nt||AUD.nt<now-1)AUD.nt=now+.1;const sd=60/T.bpm/2;while(AUD.nt<now+.3){aStep(AUD.nt,sd,st);AUD.nt+=sd;AUD.sp++}}
function aStep(t,sd,st){const sc=SCS[CSC[civ]||'w'],L=sc.length,sp=AUD.sp,q=sp&15,prog=PRG[(civ>>1)%4],deg=prog[(sp>>4)&3]%L,fq=d=>{const n=((d%L)+L)%L;return 110*Math.pow(2,(sc[n]+12*Math.floor(d/L))/12)},B=AUD.b.mu,lv=AUD.lv;
if(q===0){const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;lp.connect(B);if(lv.pad>.03)for(const d of[deg,deg+2,deg+4])pd(lp,t,sd*16+.6,fq(d)*(1+R1(-.004,.004)),.03*lv.pad);if(lv.drone>.03){const l2=AC.createBiquadFilter();l2.type='lowpass';l2.frequency.value=260;l2.connect(B);pd(l2,t,sd*16+.6,fq(deg)/2,.06*lv.drone);if(st==='combat')pd(l2,t,sd*16+.6,fq(deg)/2*1.06,.04*lv.drone)}}
if(lv.bass>.03&&q%4===0)tn(B,t,sd*3.6,'sine',fq(deg)/2,0,.16*lv.bass,.01);
if(lv.arp>.03&&Math.random()<.55)tn(B,t,sd*2.2,'triangle',fq(deg+[0,2,4,2,5,4,2,1][sp%8])*2,0,.06*lv.arp,.005);
if(lv.drum>.03){if(q===0||q===8||(st==='combat'&&q===6))tn(B,t,.2,'sine',130,45,.4*lv.drum,.003);if(st==='combat'){if(q===4||q===12){nz(B,t,.12,'bandpass',1700,1,.18*lv.drum);tn(B,t,.08,'triangle',190,130,.1*lv.drum)}if(q===2||q===10)tn(B,t,.22,'sine',170,80,.22*lv.drum,.004)}}}
function aTick(){if(!snd||!aInit())return;if(AC.state==='suspended')AC.resume().catch(()=>{});aT++;if(aT%2===0){aVol();aAmb()}aMus()}
