import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const code=readFileSync(new URL('../js/economy.js',import.meta.url),'utf8');
function market(){
 const notes=[];
 const S={px:[{f:100,w:100,s:100}],res:[{f:200,w:200,s:200,g:500}]};
 const context={S,RN:{f:'Food',w:'Wood',s:'Stone'},note:m=>notes.push(m)};
 vm.runInNewContext(code,context);
 return {S,notes,trade:context.trade};
}
test('market rejects invalid player, resource, action and price without changing resources',()=>{
 const {S,trade}=market(),before=JSON.stringify(S);
 for(const args of [[-1,'f','buy'],[2,'f','buy'],[0,'g','sell'],[0,'f','steal'],[0,'__proto__','buy'],[0,'f',null]])assert.equal(trade(...args),false);
 assert.equal(JSON.stringify(S),before);
 S.px[0].f=NaN;
 assert.equal(trade(0,'f','sell'),false);
});
test('market buying and selling charge exact amounts and adjust price',()=>{
 const {S,trade,notes}=market();
 assert.equal(trade(0,'f','sell'),true);
 assert.equal(S.res[0].f,100);assert.equal(S.res[0].g,570);assert.equal(S.px[0].f,97);
 assert.equal(trade(0,'w','buy'),true);
 assert.equal(S.res[0].w,300);assert.equal(S.res[0].g,440);assert.equal(S.px[0].w,103);
 assert.equal(notes.length,2);
});
test('market cannot trade without enough stock or gold',()=>{
 const {S,trade}=market();
 S.res[0].f=99;assert.equal(trade(0,'f','sell'),false);assert.equal(S.res[0].g,500);
 S.res[0].g=0;assert.equal(trade(0,'f','buy'),false);assert.equal(S.res[0].f,99);
});
