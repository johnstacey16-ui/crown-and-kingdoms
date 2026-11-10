import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../docs/game-ui-tokens.json', import.meta.url), 'utf8'));
const property = key => '--ck-' + key.replaceAll('/', '-');

test('Figma colour and measurement snapshot remains mapped to CSS variables', () => {
  assert.equal(Object.keys(data.colors).length, 20);
  assert.equal(Object.keys(data.layoutPx).length, 12);
  for (const [name, value] of Object.entries(data.colors)) {
    assert.ok(css.includes(property(name) + ': ' + value + ';'), 'missing colour: ' + name);
  }
  for (const [name, value] of Object.entries(data.layoutPx)) {
    assert.ok(css.includes(property(name) + ': ' + value + 'px;'), 'missing measurement: ' + name);
  }
});

test('Browser chrome and focus use the declared design palette without changing controller logic', () => {
  assert.ok(css.includes('background: var(--ck-surface-deep);'));
  assert.ok(css.includes('outline: 2px solid var(--ck-brand-gold);'));
  assert.ok(css.includes('border-left: 4px solid var(--ck-status-information);'));
});

test('controller menu palette tracks the Figma colour contract', () => {
  const ui = readFileSync(new URL('../js/ui-screens.js', import.meta.url), 'utf8');
  for (const [name, token] of [
    ['focus', 'brand/gold'], ['selected', 'surface/selected'], ['text', 'text/primary'],
    ['muted', 'text/secondary'], ['gold', 'brand/cream'], ['success', 'status/success'],
    ['panel', 'surface/panel']
  ]) {
    assert.ok(ui.includes(name + ":'" + data.colors[token] + "'"),
      'canvas UI palette must match the Figma token ' + token);
  }
});

test('long controller menus scroll rather than draw the selected option off-screen', async () => {
  const vm = await import('node:vm');
  const source = readFileSync(new URL('../js/ui-screens.js', import.meta.url), 'utf8');
  const start = source.indexOf('const CK_MENU_UI=');
  const end = source.indexOf('/* Reusable framed panels', start);
  assert.ok(start > 0 && end > start);
  const texts=[], rects=[];
  const x = {
    fillRect:(...args)=>rects.push(args),
    strokeRect(){},
    createLinearGradient:()=>({addColorStop(){}}),
    measureText:s=>({width:s.length*9})
  };
  const context=vm.createContext({
    X:x,CW:1280,CH:720,
    panel:(...args)=>rects.push(['panel',...args]),
    tx:(s,...args)=>texts.push([String(s),...args])
  });
  vm.runInContext(source.slice(start,end),context);
  for (const [count,selected,height] of [[25,0,720],[25,12,720],[25,24,720],[25,24,480],[1,0,720],[0,0,720]]) {
    const l=context.menuListLayout(count,selected,1280,height);
    assert.ok(l.visible <= Math.max(count,0));
    assert.ok(l.y+l.h <= height,'menu panel fits on a '+height+'px display');
    if(count){
      assert.ok(selected >= l.start && selected < l.start+l.visible,
        'selected option must remain visible at '+height+'px');
    }
  }
  const items=Array.from({length:25},(_,i)=>({
    n:'Setting '+i,a(){},v:()=>i+' long value',d:()=> 'A long description about controller navigation and this setting that should not cover the footer text when focused.'
  }));
  context.drawList('NEW GAME',items,24,'D-pad choose · A select · B back');
  assert.ok(texts.some(x=>x[0]==='Setting 24'),'selected last option is painted');
  assert.ok(!texts.some(x=>x[0]==='Setting 0'),'off-screen entries are not painted');
  assert.ok(texts.some(x=>x[0].includes('25 / 25')),'scroll position is announced');
  assert.ok(texts.every(x=>typeof x[0]==='string'));
  const panel=rects.find(x=>x[0]==='panel');
  assert.ok(panel && panel[2]+panel[4] <= 720,'panel remains inside 720p game viewport');
});
