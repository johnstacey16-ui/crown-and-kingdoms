/* Crown & Kingdoms — world entity factories. Loaded after shared state and kingdom helpers. */
'use strict';
function addN(k,x,y,amt,fm){x|=0;y|=0;if(x<1||y<1||x>=W-1||y>=H-1||S.g[y*W+x]||S.wt[y*W+x])return null;const n={k,x,y,s:1,amt,fm};S.nodes.push(n);S.nd[y*W+x]=n;S.g[y*W+x]=1;return n}
function addB(t,k,x,y,done){const d=B[k],mh0=Math.round(d.hp*(S.tech[t].mas?1.4:1)*(S.tech[t].bz?1.15:1)*(S.tech[t].fw&&(k==='wall'||k==='gate')?1.8:1)),b={t,k,x,y,s:d.s,hp:done?mh0:1,mh:mh0,pr:done?d.bt:0,done:!!done,q:[]};S.bs.push(b);for(let j=0;j<b.s;j++)for(let i=0;i<b.s;i++)S.g[(y+j)*W+x+i]=1;if(k==='gate')S.gt[y*W+x]=t+1;return b}
function addU(t,k,x,y){const u={t,k,x,y,hp:U[k].hp+(S.tech[t].hpb&&S.tech[t].hpb[k]||0),sh:U[k].sh,cg:U[k].cap?[]:undefined,o:'i',p:[],cd:0,rp:Math.random()*.5,car:0,ct:null,tg:null,ret:0,autoWorker:0};S.us.push(u);if(k==='vil'&&t===0&&S.vp&&S.vp.enabled)assignAutoVillager(u);return u}
