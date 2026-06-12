// 引擎內 HUD：CSS2DRenderer 畫頭頂名牌(名稱+血/魔條)；螢幕角落用 DOM 面板(自身狀態/技能冷卻/計分板)。
// 數值邏輯沿用舊版 drawHUD/drawBars。

import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { getCharacter } from '../characters.js';
import { ULT_MAX } from '../constants.js';
import { sceneX, sceneZ } from './coords.js';

const HEAD_Y = 62;

export function createHud({ stage, scene, camera }) {
  const css2d = new CSS2DRenderer();
  css2d.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:8;';
  stage.appendChild(css2d.domElement);

  // ---- 螢幕面板 ----
  const layer = document.createElement('div');
  layer.className = 'hud-layer';
  stage.appendChild(layer);

  // 自身狀態 (左下)
  const self = el('div', 'hud-self', layer);
  const selfName = el('div', 'hud-self-name', self);
  const selfTalent = el('div', 'hud-self-talent', self);
  const hpWrap = el('div', 'hud-bar hp', self);
  const hpFill = el('i', '', hpWrap);
  const hpTxt = el('span', '', hpWrap);
  const mpWrap = el('div', 'hud-bar mp', self);
  const mpFill = el('i', '', mpWrap);
  const mpTxt = el('span', '', mpWrap);
  const ultWrap = el('div', 'hud-bar ult', self);
  const ultFill = el('i', '', ultWrap);
  const ultTxt = el('span', '', ultWrap);
  const skills = el('div', 'hud-skills', self);
  const chip = {
    basic: skillChip('J', skills), skill1: skillChip('K', skills), skill2: skillChip('L', skills), ultimate: skillChip(';', skills),
  };

  // 計分板 (右上)
  const board = el('div', 'hud-board', layer);
  const boardTitle = el('div', 'hud-board-title', board);
  const boardList = el('div', 'hud-board-list', board);

  // 頭頂名牌
  const plates = new Map(); // pid -> { obj, name, hp, mp, root }

  function ensurePlate(pid) {
    let pl = plates.get(pid);
    if (!pl) {
      const root = document.createElement('div');
      root.className = 'nplate';
      const name = el('div', 'nname', root);
      const hpw = el('div', 'nbar', root); const hp = el('i', '', hpw);
      const mpw = el('div', 'nbar mana', root); const mp = el('i', '', mpw);
      const obj = new CSS2DObject(root);
      scene.add(obj);
      pl = { obj, name, hp, mp, root };
      plates.set(pid, pl);
    }
    return pl;
  }

  function update(state, selfId) {
    const players = Object.values(state.players);
    // 頭頂名牌
    const seen = new Set();
    for (const p of players) {
      const isSelf = p.id === selfId;
      const invisEnemy = p.effects && p.effects.invis && !isSelf;
      if (!p.alive || invisEnemy) continue;
      seen.add(p.id);
      const pl = ensurePlate(p.id);
      pl.obj.position.set(sceneX(p.x), HEAD_Y, sceneZ(p.y));
      pl.name.textContent = p.name;
      pl.hp.style.width = pct(p.hp / p.maxHp);
      pl.mp.style.width = pct(p.mana / p.maxMana);
      pl.root.style.display = '';
    }
    for (const [pid, pl] of plates) if (!seen.has(pid)) pl.root.style.display = 'none';

    // 自身面板
    const me = state.players[selfId];
    if (me) {
      self.style.display = '';
      const c = getCharacter(me.charId);
      selfName.textContent = `${me.name}　(${c.name})${me.alive ? '' : '　— 淘汰'}`;
      selfName.style.color = me.alive ? '#fff' : '#ff7675';
      selfTalent.textContent = c.talent ? `天賦 ${c.talent.name}` : '';
      hpFill.style.width = pct(me.hp / me.maxHp);
      hpTxt.textContent = `${Math.ceil(me.hp)}/${me.maxHp}`;
      mpFill.style.width = pct(me.mana / me.maxMana);
      mpTxt.textContent = `${Math.ceil(me.mana)}/${me.maxMana}`;
      const ultR = Math.min(1, (me.ult || 0) / ULT_MAX);
      const ultReady = ultR >= 1 && me.cd.ultimate <= 0;
      ultFill.style.width = pct(ultR);
      ultWrap.classList.toggle('ready', ultReady);
      ultTxt.textContent = ultReady ? '終極 就緒！' : `終極 ${Math.floor(ultR * 100)}%`;
      setChip(chip.basic, c.basic, me.cd.basic);
      setChip(chip.skill1, c.skill1, me.cd.skill1);
      setChip(chip.skill2, c.skill2, me.cd.skill2);
      setUltChip(chip.ultimate, c.ultimate, me.ult || 0, me.cd.ultimate);
    } else {
      self.style.display = 'none';
    }

    // 計分板
    const sorted = players.slice().sort((a, b) => b.kills - a.kills);
    const aliveN = players.filter((p) => p.alive).length;
    boardTitle.textContent = `存活 ${aliveN} 人`;
    let html = '';
    for (const p of sorted) {
      const cls = p.id === selfId ? 'me' : p.alive ? '' : 'dead';
      const tag = p.alive ? '' : ' ✕';
      html += `<div class="row ${cls}">${esc(getCharacter(p.charId).name)} ${esc(p.name)}　K:${p.kills}${tag}</div>`;
    }
    boardList.innerHTML = html;
  }

  function setChip(c, action, cd) {
    c.label.textContent = `${c.key} ${action.name}`;
    const ready = cd <= 0;
    c.root.classList.toggle('ready', ready);
    c.cool.style.height = ready ? '0%' : '100%';
  }

  // 大招 chip：以能量充能度顯示填充；滿且無連發冷卻 = 就緒發光
  function setUltChip(c, action, ult, cd) {
    if (!action) { c.root.style.display = 'none'; return; }
    c.root.style.display = '';
    c.label.textContent = `${c.key} ${action.name}`;
    const r = Math.min(1, (ult || 0) / ULT_MAX);
    const ready = r >= 1 && cd <= 0;
    c.root.classList.toggle('ready', ready);
    c.root.classList.toggle('ult', true);
    c.cool.style.height = `${(1 - r) * 100}%`;
  }

  function render() { css2d.render(scene, camera); }
  function resize() {
    const w = Math.max(1, stage.clientWidth | 0), h = Math.max(1, stage.clientHeight | 0);
    css2d.setSize(w, h);
  }
  function clear() {
    for (const pl of plates.values()) scene.remove(pl.obj);
    plates.clear();
  }

  return { update, render, resize, clear };
}

function skillChip(key, parent) {
  const root = el('div', 'chip', parent);
  const cool = el('i', 'cool', root);
  const label = el('span', '', root);
  return { root, label, cool, key };
}

function el(tag, cls, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.appendChild(e);
  return e;
}
function pct(r) { return `${Math.max(0, Math.min(1, r)) * 100}%`; }
function esc(s) { return String(s).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }
