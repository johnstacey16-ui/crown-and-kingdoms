/* Team-relative multiplayer map painter: terrain, atlas and entity visuals.
 * Rendering is presentation-only; no command authority or simulation writes.
 * Owns the original drawing routines, supplied with the current local UI view.
 */
(function(root){
  'use strict';
  function create({context,terrainMemory,getView,getSelection,viewport}){
    function drawTerrain(sx,sy){
      const view=getView(),selection=getSelection();
      const field=view.battlefield,visible=new Set(field.visible),v=viewport();
      const resolution=terrainBlendResolution(Math.max(sx,sy)*v.zoom);
      const left=Math.floor(v.x)-4,right=Math.ceil(v.x+v.width)+4,top=Math.floor(v.y)-4,bottom=Math.ceil(v.y+v.height)+4;
      // Only tiles previously seen by this player enter this local art cache.
      // It contains terrain/resources, never remembered enemy positions.
      const rememberedKind=(x,y)=>{
        const tile=terrainMemory.get(y*view.width+x);if(!tile)return -1;
        if(tile.water)return tile.water===1?2:3;
        const coastal=(x>0&&terrainMemory.get(tile.index-1)?.water===1)||(x<view.width-1&&terrainMemory.get(tile.index+1)?.water===1)||(y>0&&terrainMemory.get(tile.index-view.width)?.water===1)||(y<view.height-1&&terrainMemory.get(tile.index+view.width)?.water===1);
        return coastal?3:hsh(x>>2,y>>2)<.1?1:0;
      };
      for(const tile of terrainMemory.values()){
        const x=tile.index%view.width,y=Math.floor(tile.index/view.width),px=x*sx,py=y*sy;
        if(x<left||x>right||y<top||y>bottom)continue;
        const grain=((tile.index*2654435761)>>>28)%3;
        context.fillStyle=tile.water===1?['#234f65','#28596b','#2b5c70'][grain]:
          tile.water===2?'#719b91':['#526b3d','#586f42','#5d7446'][grain];
        if(!paintTerrain(context,rememberedKind(x,y),x,y,px,py,sx+.3,sy+.3,false,terrainNeighborKinds(x,y,rememberedKind,view.width,view.height),resolution))context.fillRect(px,py,sx+.3,sy+.3);
        if(tile.elevation){
          context.fillStyle='rgba(239,208,134,.10)';context.fillRect(px,py,sx+.3,sy+.3);
          context.strokeStyle='rgba(243,208,132,.6)';context.lineWidth=Math.max(.65,Math.min(1.6,sx*.08));
          context.beginPath();
          if(!terrainMemory.get(tile.index-1)?.elevation){context.moveTo(px,py);context.lineTo(px,py+sy)}
          if(!terrainMemory.get(tile.index+1)?.elevation){context.moveTo(px+sx,py);context.lineTo(px+sx,py+sy)}
          if(!terrainMemory.get(tile.index-view.width)?.elevation){context.moveTo(px,py);context.lineTo(px+sx,py)}
          if(!terrainMemory.get(tile.index+view.width)?.elevation){context.moveTo(px,py+sy);context.lineTo(px+sx,py+sy)}
          context.stroke();
        }
        if(tile.water&&sx>=5){
          context.strokeStyle=tile.water===2?'rgba(230,226,177,.3)':'rgba(163,221,227,.22)';
          const ripple=tile.water===1?Math.sin(field.time*.8+x*.7+y)*sy*.08:0;
          context.lineWidth=.7;context.beginPath();context.moveTo(px+sx*.2,py+sy*.55+ripple);
          context.lineTo(px+sx*.7,py+sy*.55+ripple);context.stroke();
        }
        const n=tile.node;
        if(n&&sx>=3){
          const environmentArt=typeof paintedEnvironmentFrame==='function'?paintedEnvironmentFrame({k:n.kind,x,y,an:n.animal,fi:n.fish,fm:n.farm,trap:n.trap},field.time):null;
          const resourceArt=environmentArt||(typeof paintedResourceFrame==='function'?paintedResourceFrame(n.kind,x,y,n.animal||n.fish||n.farm||n.trap,n.amount):null);
          if(resourceArt){const f=resourceArt.f,width=Math.min(Math.max(10,sx*(n.kind==='w'?1.9:1.25)),(n.kind==='w'?Math.max(20,sy*3):Infinity)*f.w/f.h),sc=width/(resourceArt.referenceWidth||f.w),cached=paintedNodeTexture(resourceArt,54);
            if(cached)context.drawImage(cached,px+sx/2-f.ax*sc,py+sy-f.ay*sc,f.w*sc,f.h*sc);
            else context.drawImage(resourceArt.img,f.x,f.y,f.w,f.h,px+sx/2-f.ax*sc,py+sy-f.ay*sc,f.w*sc,f.h*sc);
          }else if(n.kind==='w'&&typeof ASSET!=='undefined'&&ASSET.n&&assetFrame('node_tree',0,0,0,0)){const art=assetFrame('node_tree',0,0,0,0),f=art.f,sc=Math.max(15,sx*2)/f.w;context.drawImage(art.img,f.x,f.y,f.w,f.h,px+sx/2-f.ax*sc,py+sy-f.ay*sc,f.w*sc,f.h*sc);}else if(n.kind==='w'){
            context.fillStyle='#392f22';context.fillRect(px+sx*.45,py+sy*.4,Math.max(1,sx*.13),sy*.6);
            context.fillStyle=grain?'#254b32':'#31583a';context.beginPath();
            context.arc(px+sx*.5,py+sy*.3,Math.max(2,sx*.48),0,Math.PI*2);context.fill();
            context.fillStyle='#49764a';context.beginPath();context.arc(px+sx*.32,py+sy*.16,Math.max(1,sx*.22),0,Math.PI*2);context.fill();
          }else if(n.farm){
            context.fillStyle='#9a7844';context.fillRect(px,py,sx,sy);
            context.strokeStyle='#c6ac67';context.lineWidth=.8;
            for(let row=1;row<4;row++){context.beginPath();context.moveTo(px+sx*.1,py+sy*row/4);context.lineTo(px+sx*.9,py+sy*row/4);context.stroke();}
          }else if(n.fish){
            context.strokeStyle='#a8d8d3';context.lineWidth=1;context.beginPath();
            context.moveTo(px+sx*.2,py+sy*.6);context.lineTo(px+sx*.65,py+sy*.35);context.stroke();
          }else{
            context.fillStyle=n.kind==='g'?'#d4b762':n.kind==='s'?'#a2aaa0':'#b36554';
            context.beginPath();context.moveTo(px+sx*.1,py+sy*.8);context.lineTo(px+sx*.35,py+sy*.15);
            context.lineTo(px+sx*.7,py+sy*.3);context.lineTo(px+sx*.95,py+sy*.75);context.closePath();context.fill();
          }
        }
        if(!visible.has(tile.index)){context.fillStyle='rgba(5,12,15,.65)';context.fillRect(px,py,sx+.4,sy+.4);}
      }
      for(const p of field.projectiles||[]){
        if(typeof drawProjectileArtwork==='function'){const heading=p.heading??0;drawProjectileArtwork(context,p.x*sx,p.y*sy-5,Math.atan2(Math.sin(heading)*sy,Math.cos(heading)*sx),p.style,field.time,Math.max(.6,Math.min(1.25,sx/9)));}
        else{context.fillStyle='#ffe6a4';context.beginPath();context.arc(p.x*sx,p.y*sy,2,0,Math.PI*2);context.fill();}
      }
      for(const id of selection){
        const point=field.paths?.[id],u=view.units.find(u=>u.id===id);
        if(point&&u){context.strokeStyle='rgba(255,233,169,.55)';context.lineWidth=1;
          context.setLineDash([3,5]);context.beginPath();context.moveTo(u.x*sx,u.y*sy);context.lineTo(point.x*sx,point.y*sy);context.stroke();context.setLineDash([]);}
      }
    }
    function drawAtlas(e,x,y,sx,sy){
      const view=getView();
      if(typeof assetFrame!=='function')return false;
      const size=e.size||0,time=view.battlefield?.time||0;
      // Preserve the actual kingdom palette for each player; relation rings
      // identify ownership without repainting the other kingdom's artwork.
      const sprite=size&&typeof paintedBuildingFrame==='function'?paintedBuildingFrame(e.kind,e.team,time,e.architectureAge):
        !size&&typeof unitAssetFrame==='function'?unitAssetFrame(e.kind,e.team,e.pose||{state:0,time},!!e.pose?.elite):
        assetFrame(size?'bld_'+e.kind:e.kind,e.team,size?3:e.pose?.state||0,0,e.pose?.time??time,e.pose?.heading||0,e.pose?.phase);
      if(!sprite)return false;
      const f=sprite.f,height=size?Math.max(size*sx,size*sy)*1.7:Math.max(22,Math.min(40,sx*3.4));
      const scale=height/(sprite.referenceHeight||f.h)*(sprite.painted?1:sprite.sc||1),footX=x+size*sx/2,footY=y+(size?size*sy:2);
      context.save();
      if(size&&e.complete===false&&!sprite.painted)context.globalAlpha=.4+.45*(e.progress||0);
      try{if(sprite.painted&&!size)drawPaintedTroop(context,sprite,footX,footY,scale,e.pose?.state||0,e.pose?.time??time,Math.cos(e.pose?.heading||0)<0,e.kind,e.pose?.phase);else if(size&&typeof drawBuildingArtwork==='function')drawBuildingArtwork(context,sprite,footX,footY,scale,e.complete!==false,e.progress,false,typeof buildingDamageStage==='function'?buildingDamageStage(e.complete!==false,e.hp,e.maxHp):0,time);else context.drawImage(sprite.img,f.x,f.y,f.w,f.h,footX-f.ax*scale,footY-f.ay*scale,f.w*scale,f.h*scale);if(!size&&typeof drawNavalClassMark==='function')drawNavalClassMark(context,e.kind,footX,footY,scale,e.pose?.time??time);}
      catch(_){context.restore();return false;}
      context.restore();return size&&sprite.painted?'painted-building':true;
    }
    function drawEntity(e,sx,sy,color,chosen){
      const view=getView();
      const x=e.x*sx,y=e.y*sy,size=e.size||0,unitRadius=Math.max(2.5,Math.min(5,sx*.45));
      context.fillStyle='rgba(0,0,0,.35)';
      const atlas=drawAtlas(e,x,y,sx,sy);
      if(size&&!atlas){
        const w=size*sx,h=size*sy;context.fillRect(x+2,y+3,w,h);
        context.fillStyle='#b39a70';context.fillRect(x,y,w,h);
        context.fillStyle=color;context.fillRect(x+1,y+1,Math.max(1,w-2),Math.max(1,h*.5));
        context.strokeStyle='#352d27';context.lineWidth=1;context.strokeRect(x,y,w,h);
        if(w>15){context.fillStyle='#fff1c7';context.font='bold '+Math.max(8,Math.min(12,w*.28))+'px system-ui';context.textAlign='center';context.fillText(e.kind==='tc'?'TC':e.kind.slice(0,3).toUpperCase(),x+w/2,y+h*.7);}
      }else if(!atlas){
        context.beginPath();context.ellipse(x+1,y+2,unitRadius+1,unitRadius*.65,0,0,Math.PI*2);context.fill();
        context.fillStyle=color;context.strokeStyle='#172429';context.lineWidth=1;
        if(['gal','fire','demo','cgal','fish','trn','cog'].includes(e.kind)){
          context.beginPath();context.moveTo(x-unitRadius,y-unitRadius*.6);context.lineTo(x+unitRadius,y-unitRadius*.6);
          context.lineTo(x+unitRadius*.65,y+unitRadius);context.lineTo(x-unitRadius*.6,y+unitRadius);context.closePath();context.fill();context.stroke();
          context.strokeStyle='#eee0ba';context.beginPath();context.moveTo(x,y+unitRadius*.5);context.lineTo(x,y-unitRadius*1.5);context.stroke();
        }else{
          context.beginPath();context.arc(x,y,unitRadius,0,Math.PI*2);context.fill();context.stroke();
          context.fillStyle=e.kind==='vil'?'#c9ae77':e.kind==='mon'?'#f3d5fa':'#edf1e5';
          context.beginPath();context.arc(x,y-unitRadius*.7,unitRadius*.43,0,Math.PI*2);context.fill();
        }
      }
      // Relation markers remain legible at strategic scale and for absent art.
      context.fillStyle=color;context.strokeStyle='#15212b';context.lineWidth=1;
      context.beginPath();context.ellipse(x+size*sx/2,y+(size?size*sy:3),Math.max(2,size?size*sx*.24:unitRadius*.7),2,0,0,Math.PI*2);context.fill();context.stroke();
      if(size&&e.complete===false){
        const w=Math.max(12,size*sx),progress=Math.max(0,Math.min(1,e.progress||0));
        context.strokeStyle='#d0ad71';context.lineWidth=1.5;context.beginPath();
        context.moveTo(x,y+size*sy);context.lineTo(x,y);context.lineTo(x+size*sx,y);context.lineTo(x+size*sx,y+size*sy);context.stroke();
        context.fillStyle='#302d27';context.fillRect(x,y+size*sy+5,w,3);
        context.fillStyle='#e5be77';context.fillRect(x,y+size*sy+5,w*progress,3);
      }
      if(size&&atlas!=='painted-building'&&e.complete!==false&&e.maxHp>0&&e.hp/e.maxHp<.5){
        const phase=view.battlefield?.time||0;
        context.fillStyle='rgba(31,32,29,.5)';
        for(let i=0;i<2;i++){context.beginPath();context.arc(x+size*sx*.6+Math.sin(phase+i)*2,y-3-i*5-(phase%1)*3,2+i,0,Math.PI*2);context.fill();}
      }
      if(e.passengers>0){
        context.fillStyle='#14202d';context.fillRect(x-9,y+7,26,17);
        context.fillStyle='#ffe6a0';context.font='12px system-ui';context.textAlign='center';
        context.fillText(String(e.passengers),x+4,y+20);
      }
      if(chosen){context.strokeStyle='#ffe9a8';context.lineWidth=1.5;context.beginPath();context.ellipse(x+(size?size*sx/2:0),y+(size?size*sy/2:1),size?size*sx*.65:unitRadius+3,size?size*sy*.65:unitRadius+2,0,0,Math.PI*2);context.stroke();}
      if(Number.isFinite(e.hp)&&Number.isFinite(e.maxHp)&&e.maxHp>0&&(chosen||e.hp<e.maxHp)){
        const w=Math.max(10,size?size*sx:unitRadius*3),left=x+(size?size*sx/2:0)-w/2,top=y-(size?5:unitRadius+6);
        context.fillStyle='#172126';context.fillRect(left,top,w,3);
        context.fillStyle=e.hp/e.maxHp<.3?'#ed8b6b':'#a8d17c';context.fillRect(left,top,w*Math.max(0,Math.min(1,e.hp/e.maxHp)),3);
      }
    }
    return Object.freeze({drawTerrain,drawEntity});
  }
  root.CK_NETWORK_MAP_RENDER=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
