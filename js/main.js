// 進入點：串接 UI / 連線 / 模擬 / 渲染 / 輸入，並管理大廳與遊戲迴圈。

import { createUI } from './ui.js';
import { createRenderer } from './renderer.js';
import { createNetwork, makeRoomCode } from './network.js';
import { createInput, EMPTY_INPUT } from './input.js';
import { createInitialState } from './entities.js';
import { step, applyMovement } from './simulation.js';
import { DT, SNAPSHOT_INTERVAL, INPUT_INTERVAL, MAX_PLAYERS } from './constants.js';

const ui = createUI();
const net = createNetwork();
const input = createInput();
const renderer = createRenderer(document.getElementById('game-canvas'));

let role = null;            // 'host' | 'joiner'
let selfId = null;
let myName = '';
let roomCode = '';
let lobby = [];             // [{ id, name, charId, isHost }]

let gameState = null;       // 房主權威狀態
const inputs = {};          // 房主：playerId -> input

// 加入者用
let lastSnapshot = null;
let view = null;
let localSelf = null;       // 本機自身移動預測

let running = false;
let gameoverSent = false;
let accumulator = 0, snapAcc = 0, inputAcc = 0;
let lastLogic = 0;
let lastRender = 0;
let logicTimer = null;
let rafId = null;

// ---------- 大廳 ----------
function addToLobby(entry) {
  if (!lobby.find((p) => p.id === entry.id)) lobby.push(entry);
}
function removeFromLobby(id) { lobby = lobby.filter((p) => p.id !== id); }
function renderLobby() {
  ui.renderLobby({ players: lobby, selfId, isHost: role === 'host', roomCode });
}
function broadcastLobby() {
  net.broadcast({ t: 'lobby', players: lobby });
  renderLobby();
}

// ---------- 連線回呼 ----------
function setupHost() {
  net.on('onOpen', (id) => {
    selfId = id;
    addToLobby({ id, name: myName, charId: ui.selectedChar, isHost: true });
    ui.buildCharacterGrid();
    ui.setSelectedChar(ui.selectedChar);
    ui.showScreen('lobby');
    renderLobby();
  });
  net.on('onData', (from, data) => {
    if (data.t === 'hello') {
      if (lobby.length >= MAX_PLAYERS) { net.sendTo(from, { t: 'full' }); return; }
      addToLobby({ id: from, name: data.name, charId: data.charId | 0, isHost: false });
      broadcastLobby();
    } else if (data.t === 'select') {
      const p = lobby.find((x) => x.id === from);
      if (p) { p.charId = data.charId | 0; broadcastLobby(); }
    } else if (data.t === 'input') {
      inputs[from] = data.input;
    }
  });
  net.on('onLeave', (id) => {
    removeFromLobby(id);
    if (gameState && gameState.players[id]) { delete gameState.players[id]; delete inputs[id]; }
    if (!running) broadcastLobby(); else renderLobby();
  });
  net.on('onError', (err) => {
    const taken = err && /unavailable|taken|ID/i.test(String(err.type || err.message || err));
    ui.setMenuStatus('連線錯誤：' + (err.type || err.message || err) + (taken ? '（房號被占用，請重試）' : ''), true);
  });
}

function setupJoiner() {
  net.on('onOpen', () => {
    selfId = net.id;
    ui.buildCharacterGrid();
    ui.showScreen('lobby');
    net.sendToHost({ t: 'hello', name: myName, charId: ui.selectedChar });
    ui.setLobbyStatus('已連上房主，等待開始…');
  });
  net.on('onData', (_from, data) => {
    if (data.t === 'lobby') { lobby = data.players; renderLobby(); }
    else if (data.t === 'start') { lobby = data.lobby; startFromSnapshot(data.state); }
    else if (data.t === 'state') { receiveSnapshot(data.snapshot); }
    else if (data.t === 'gameover') { joinerGameover(data); }
    else if (data.t === 'tolobby') { lobby = data.players; stopLoop(); input.disable(); ui.showScreen('lobby'); renderLobby(); }
    else if (data.t === 'full') { alert('房間已滿（上限 ' + MAX_PLAYERS + ' 人）'); window.location.reload(); }
  });
  net.on('onHostClose', () => { alert('與房主的連線已中斷，遊戲結束。'); window.location.reload(); });
  net.on('onError', (err) => {
    ui.setMenuStatus('無法連線到房間：' + (err.type || err.message || err) + '（請確認房號正確）', true);
    ui.showScreen('menu');
  });
}

// ---------- 開始遊戲 ----------
function hostStart() {
  const arr = lobby.map((p) => ({ id: p.id, name: p.name, charId: p.charId }));
  gameState = createInitialState(arr);
  for (const id of Object.keys(gameState.players)) inputs[id] = { ...EMPTY_INPUT };
  net.broadcast({ t: 'start', state: gameState, lobby });
  beginLoop();
}

function startFromSnapshot(state) {
  lastSnapshot = state;
  view = emptyView();
  const me = state.players[selfId];
  localSelf = me ? { x: me.x, y: me.y, facing: me.facing, kvx: 0, kvy: 0, charId: me.charId } : null;
  beginLoop();
}

function emptyView() {
  return { players: {}, projectiles: [], zones: [], fx: [], phase: 'playing', winner: null, time: 0 };
}

function beginLoop() {
  ui.showScreen('game');
  input.enable();
  running = true;
  gameoverSent = false;
  accumulator = 0; snapAcc = 0; inputAcc = 0;
  lastLogic = performance.now();
  lastRender = 0;
  // 邏輯與網路用 setInterval 驅動：即使視窗失焦/隱藏也會持續運作（rAF 會被暫停），
  // 房主因此不會在切換視窗時讓全場凍結。渲染則交給 requestAnimationFrame。
  if (logicTimer) clearInterval(logicTimer);
  logicTimer = setInterval(logicTick, 1000 / 30);
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(renderLoop);
}

function stopLoop() {
  running = false;
  if (logicTimer) { clearInterval(logicTimer); logicTimer = null; }
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

// ---------- 邏輯/網路迴圈（固定步、不依賴畫面更新）----------
function logicTick() {
  if (!running) return;
  const now = performance.now();
  let dt = (now - lastLogic) / 1000;
  lastLogic = now;
  if (dt > 0.25) dt = 0.25; // 限制追趕，避免長時間背景後一次爆衝

  const inp = input.get();

  if (role === 'host') {
    inputs[selfId] = inp;
    accumulator += dt;
    let guard = 0;
    while (accumulator >= DT && guard < 8) { step(gameState, inputs, DT); accumulator -= DT; guard++; }

    snapAcc += dt;
    if (snapAcc >= SNAPSHOT_INTERVAL) { snapAcc = 0; net.broadcast({ t: 'state', snapshot: gameState }); }

    if (gameState.phase === 'gameover' && !gameoverSent) hostGameover();
  } else {
    inputAcc += dt;
    if (inputAcc >= INPUT_INTERVAL) { inputAcc = 0; net.sendToHost({ t: 'input', input: inp }); }
    predictAndInterpolate(inp, dt);
  }

  // 後備渲染：若 requestAnimationFrame 因分頁被視為隱藏而暫停，
  // 仍以邏輯頻率補畫一幀，避免某些內嵌瀏覽器出現黑畫面。
  if (now - lastRender > 60) draw();
}

function draw() {
  lastRender = performance.now();
  if (role === 'host') { if (gameState) renderer.render(gameState, selfId); }
  else if (view) renderer.render(view, selfId);
}

// ---------- 渲染迴圈 ----------
// 可見時由 rAF 驅動，提供平順的畫面更新；背景時瀏覽器會自動暫停 rAF，
// 此時改由 logicTick 的後備渲染接手。
function renderLoop() {
  if (!running) return;
  draw();
  rafId = requestAnimationFrame(renderLoop);
}

// ---------- 加入者：預測 + 插值 ----------
function receiveSnapshot(snap) {
  lastSnapshot = snap;
  if (localSelf && snap.players[selfId]) {
    const me = snap.players[selfId];
    const blend = me.alive ? 0.2 : 1; // 死亡直接對齊
    localSelf.x += (me.x - localSelf.x) * blend;
    localSelf.y += (me.y - localSelf.y) * blend;
    localSelf.kvx = me.kvx; localSelf.kvy = me.kvy;
  }
}

function predictAndInterpolate(inp, dt) {
  const snap = lastSnapshot;
  if (!snap || !view) return;
  view.phase = snap.phase; view.winner = snap.winner; view.time = snap.time;

  const k = 1 - Math.exp(-14 * dt); // 遠端玩家位置平滑
  const next = {};
  for (const id of Object.keys(snap.players)) {
    const sp = snap.players[id];
    let vp = view.players[id];
    if (!vp) vp = { ...sp };
    Object.assign(vp, {
      id: sp.id, name: sp.name, charId: sp.charId, facing: sp.facing,
      hp: sp.hp, maxHp: sp.maxHp, mana: sp.mana, maxMana: sp.maxMana,
      alive: sp.alive, shield: sp.shield, kills: sp.kills, effects: sp.effects, cd: sp.cd,
    });
    if (id === selfId && localSelf) {
      vp.x = localSelf.x; vp.y = localSelf.y; vp.facing = localSelf.facing;
    } else {
      vp.x += (sp.x - vp.x) * k;
      vp.y += (sp.y - vp.y) * k;
    }
    next[id] = vp;
  }
  view.players = next;
  view.projectiles = snap.projectiles;
  view.zones = snap.zones;
  view.fx = snap.fx;

  // 預測自身移動
  if (localSelf) {
    const me = snap.players[selfId];
    if (me && me.alive) {
      const tmp = { charId: localSelf.charId, x: localSelf.x, y: localSelf.y, vx: 0, vy: 0, kvx: localSelf.kvx, kvy: localSelf.kvy, facing: localSelf.facing, effects: me.effects };
      applyMovement(tmp, inp, dt);
      localSelf.x = tmp.x; localSelf.y = tmp.y; localSelf.facing = tmp.facing;
      localSelf.kvx = tmp.kvx; localSelf.kvy = tmp.kvy;
    } else if (me) {
      localSelf.x = me.x; localSelf.y = me.y;
    }
  }
}

// ---------- 結算 ----------
function hostGameover() {
  gameoverSent = true;
  stopLoop();
  input.disable();
  const winner = gameState.winner ? gameState.players[gameState.winner] : null;
  const winnerName = winner ? winner.name : null;
  const players = Object.values(gameState.players).map((p) => ({ name: p.name, charId: p.charId, kills: p.kills }));
  net.broadcast({ t: 'gameover', winner: winnerName, players });
  ui.showGameover({ winnerName, players, isHost: true });
}

function joinerGameover(data) {
  stopLoop();
  input.disable();
  ui.showGameover({ winnerName: data.winner, players: data.players, isHost: false });
}

// ---------- UI 綁定 ----------
ui.bind({
  onCreate(name) {
    myName = name;
    role = 'host';
    roomCode = makeRoomCode();
    setupHost();
    ui.setMenuStatus('建立房間中…');
    net.host(roomCode);
  },
  onJoin(name, code) {
    if (!code) { ui.setMenuStatus('請輸入房號', true); return; }
    myName = name;
    role = 'joiner';
    roomCode = code;
    setupJoiner();
    ui.setMenuStatus('連線中…');
    net.join(code);
  },
  onStart() { if (role === 'host') hostStart(); },
  onToLobby() {
    if (role !== 'host') return;
    stopLoop();
    gameState = null;
    net.broadcast({ t: 'tolobby', players: lobby });
    ui.showScreen('lobby');
    renderLobby();
  },
  onLeave() { net.destroy(); window.location.reload(); },
  onSelectChar(charId) {
    if (role === 'host') {
      const me = lobby.find((p) => p.id === selfId);
      if (me) { me.charId = charId; broadcastLobby(); }
    } else {
      net.sendToHost({ t: 'select', charId });
    }
  },
});

ui.showScreen('menu');
