// @ts-nocheck
// 足球 / 推球派對模式：兩隊把球推進對方球門,先得 SCORE_LIMIT 分者勝。
// 權威端 (房主) 在固定步 step() 內呼叫 soccerTick();球的物理、進球判定、開球/慶祝
// 階段機、陣亡重生都在這裡。戰鬥照常 (隊友不互傷),陣亡後數秒於己方半場重生。

import { ARENA, PLAYER_RADIUS } from '../constants.js';
import { addFx } from '../entities/fx.ts';

export const TEAM_COLORS = { 1: '#3aa0ff', 2: '#ff5a5a' };
export const TEAM_NAMES = { 1: '藍隊', 2: '紅隊' };

const BALL_R = 36;
const BALL_FRICTION = 0.55;     // 滾動阻尼 (每秒指數衰減)
const WALL_REST = 0.72;         // 撞牆反彈係數
const BASE_KICK = 260;          // 碰球基礎推力
const SPEED_KICK = 0.9;         // 帶入玩家速度的比例 (衝刺/位移技推更遠)
const MAX_BALL_SPEED = 1500;
const BALL_KB_MULT = 1.5;       // 技能擊退換算成球速的倍率 (讓大招/擊飛技把球轟得夠遠)
const PROJ_KICK_BASE = 170;     // 投射物命中球的基礎射門力
const GOAL_HALF = 260;          // 球門半高 (沿 y 軸)
const GOAL_DEPTH = 70;          // 越過此深度即進球
const RESPAWN_TIME = 4;
const KICKOFF_TIME = 2.6;
const GOAL_CELEBRATE = 2.8;
const SCORE_LIMIT = 5;

// 建立足球場:分隊、球、球門、比分、開球階段
export function setupSoccer(state) {
  const cy = ARENA.height / 2;
  state.score = { 1: 0, 2: 0 };
  state.scoreLimit = SCORE_LIMIT;
  state.goals = [
    { team: 1, x: 0, y: cy, half: GOAL_HALF },              // 藍隊球門 (左);紅隊射這邊得分
    { team: 2, x: ARENA.width, y: cy, half: GOAL_HALF },    // 紅隊球門 (右);藍隊射這邊得分
  ];
  state.ball = { x: ARENA.width / 2, y: cy, vx: 0, vy: 0, r: BALL_R };
  resetKickoff(state, null);
  return state;
}

// 重置開球:球回中央、全員復活並排回己方半場、進入 kickoff 倒數
function resetKickoff(state, scoredBanner) {
  const cy = ARENA.height / 2;
  state.ball.x = ARENA.width / 2; state.ball.y = cy;
  state.ball.vx = 0; state.ball.vy = 0;
  // 依隊伍把玩家排回半場
  const byTeam = { 1: [], 2: [] };
  for (const p of Object.values(state.players)) {
    if (p.ownerId || p.isBoss || p.isSummon) continue;
    if (p.team === 1 || p.team === 2) byTeam[p.team].push(p);
  }
  for (const team of [1, 2]) {
    const list = byTeam[team];
    const n = list.length;
    list.forEach((p, i) => {
      const fy = n > 1 ? (i / (n - 1)) : 0.5;            // 0..1 沿球門高度分散
      p.x = team === 1 ? ARENA.width * 0.22 : ARENA.width * 0.78;
      p.y = cy + (fy - 0.5) * Math.min(ARENA.height * 0.6, GOAL_HALF * 2.2);
      p.facing = team === 1 ? 0 : Math.PI;
      p.alive = true; p.hp = p.maxHp; p.mana = p.maxMana;
      p.shield = 0; p.shieldTime = 0; p.effects = {};
      p.vx = 0; p.vy = 0; p.kvx = 0; p.kvy = 0;
      p.charge = null; p.leap = null; p.channel = null; p.trail = null; p.chargeState = null;
      p.respawn = null;
    });
  }
  state.soccerPhase = 'kickoff';
  state.soccerTimer = KICKOFF_TIME;
  state.banner = scoredBanner || { text: '準備開球！', sub: '把球推進對方球門', life: KICKOFF_TIME };
}

export function soccerTick(state, dt) {
  if (state.phase !== 'playing') return;

  if (state.soccerPhase === 'kickoff') {
    if (state.banner) state.banner.life -= dt;
    state.soccerTimer -= dt;
    if (state.soccerTimer <= 0) { state.soccerPhase = 'play'; state.banner = null; }
    return;
  }

  if (state.soccerPhase === 'goal') {
    if (state.banner) state.banner.life -= dt;
    state.soccerTimer -= dt;
    if (state.soccerTimer <= 0) {
      const winner = state.score[1] >= state.scoreLimit ? 1 : state.score[2] >= state.scoreLimit ? 2 : 0;
      if (winner) {
        state.soccerPhase = 'over';
        state.phase = 'gameover';
        state.winner = null;
        state.winnerTeam = winner;
      } else {
        resetKickoff(state, null);
      }
    }
    return;
  }

  if (state.soccerPhase !== 'play') return;

  tickRespawns(state, dt);
  tickBall(state, dt);
}

function tickRespawns(state, dt) {
  const cy = ARENA.height / 2;
  for (const p of Object.values(state.players)) {
    if (p.ownerId || p.isBoss || p.isSummon) continue;
    if (p.team !== 1 && p.team !== 2) continue;
    if (p.alive) { p.respawn = null; continue; }
    if (p.respawn == null) p.respawn = RESPAWN_TIME;
    else {
      p.respawn -= dt;
      if (p.respawn <= 0) {
        p.alive = true; p.hp = p.maxHp; p.mana = p.maxMana; p.ult = 0;
        p.shield = 0; p.shieldTime = 0; p.effects = {};
        p.vx = 0; p.vy = 0; p.kvx = 0; p.kvy = 0; p.respawn = null;
        p.x = p.team === 1 ? ARENA.width * 0.15 : ARENA.width * 0.85;
        p.y = cy;
        p.facing = p.team === 1 ? 0 : Math.PI;
        addFx(state, { type: 'blink', x: p.x, y: p.y, color: TEAM_COLORS[p.team], life: 0.4, radius: 40 });
      }
    }
  }
}

// 技能 / 擊退把球轟飛 (近戰揮擊、爆炸 AOE 等由 combat 呼叫)。
// dir 為推球方向 (例:揮擊朝 facing、爆炸由爆心朝外);force 用擊退值換算球速。
export function pushBall(state, x, y, dirx, diry, force, radius) {
  const b = state.ball;
  if (!b || state.soccerPhase !== 'play' || !force) return;
  const dx = b.x - x, dy = b.y - y;
  const d = Math.hypot(dx, dy);
  if (d > (radius || 0) + b.r) return;
  let nx = dirx || 0, ny = diry || 0;
  const nl = Math.hypot(nx, ny);
  if (nl > 0.01) { nx /= nl; ny /= nl; }
  else if (d > 0) { nx = dx / d; ny = dy / d; }       // 無方向 → 由來源朝球外推
  else { nx = 1; ny = 0; }
  const kick = force * BALL_KB_MULT;
  b.vx += nx * kick; b.vy += ny * kick;
  addFx(state, { type: 'hit', x: b.x, y: b.y, color: '#ffffff', life: 0.22, radius: 30 });
}

function tickBall(state, dt) {
  const b = state.ball;
  const cy = ARENA.height / 2;

  // 投射物射門:任何投射物碰到球 → 沿其飛行方向把球踢出 (帶入投射物速度;每顆只觸發一次)
  if (state.projectiles) {
    for (const pr of state.projectiles) {
      if (pr.hitBall) continue;
      const dx = b.x - pr.x, dy = b.y - pr.y;
      if (Math.hypot(dx, dy) > b.r + (pr.radius || 10)) continue;
      pr.hitBall = true;
      const sp = Math.hypot(pr.vx, pr.vy) || 1;
      const kick = PROJ_KICK_BASE + (pr.knockback || 0) * BALL_KB_MULT + sp * 0.22;
      const nx = pr.vx / sp, ny = pr.vy / sp;
      const along = b.vx * nx + b.vy * ny;
      if (kick > along) { const add = kick - along; b.vx += add * nx; b.vy += add * ny; }
      addFx(state, { type: 'hit', x: b.x, y: b.y, color: pr.color || '#ffffff', life: 0.24, radius: 36 });
    }
  }

  // 玩家碰撞 → 推球 (帶入玩家速度,衝刺推更遠)
  for (const p of Object.values(state.players)) {
    if (!p.alive || p.ownerId || p.isBoss || p.isSummon) continue;
    const dx = b.x - p.x, dy = b.y - p.y;
    const d = Math.hypot(dx, dy);
    const minD = b.r + (p.hitR || PLAYER_RADIUS);
    if (d > 0 && d < minD) {
      const nx = dx / d, ny = dy / d;
      b.x = p.x + nx * minD; b.y = p.y + ny * minD;        // 解除重疊
      const pv = (p.vx + p.kvx) * nx + (p.vy + p.kvy) * ny; // 玩家朝球的速度分量
      const kick = BASE_KICK + Math.max(0, pv) * SPEED_KICK;
      const along = b.vx * nx + b.vy * ny;
      if (kick > along) { const add = kick - along; b.vx += add * nx; b.vy += add * ny; }
    }
  }

  // 阻尼 + 積分
  const fr = Math.exp(-BALL_FRICTION * dt);
  b.vx *= fr; b.vy *= fr;
  const sp = Math.hypot(b.vx, b.vy);
  if (sp > MAX_BALL_SPEED) { const s = MAX_BALL_SPEED / sp; b.vx *= s; b.vy *= s; }
  b.x += b.vx * dt; b.y += b.vy * dt;

  // 上下牆反彈
  if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * WALL_REST; }
  else if (b.y > ARENA.height - b.r) { b.y = ARENA.height - b.r; b.vy = -Math.abs(b.vy) * WALL_REST; }

  const inMouth = Math.abs(b.y - cy) < GOAL_HALF;
  // 左牆:球門內放行 (供進球),否則反彈
  if (b.x < b.r) {
    if (inMouth && b.x < GOAL_DEPTH) { scoreGoal(state, 2); return; } // 進藍隊門 → 紅隊得分
    if (!inMouth) { b.x = b.r; b.vx = Math.abs(b.vx) * WALL_REST; }
  }
  // 右牆
  if (b.x > ARENA.width - b.r) {
    if (inMouth && b.x > ARENA.width - GOAL_DEPTH) { scoreGoal(state, 1); return; } // 進紅隊門 → 藍隊得分
    if (!inMouth) { b.x = ARENA.width - b.r; b.vx = -Math.abs(b.vx) * WALL_REST; }
  }
}

function scoreGoal(state, team) {
  state.score[team] = (state.score[team] || 0) + 1;
  const reached = state.score[team] >= state.scoreLimit;
  addFx(state, { type: 'ultimate', x: state.ball.x, y: state.ball.y, color: TEAM_COLORS[team], life: 1.0, radius: 300 });
  addFx(state, { type: 'ultimate', x: state.ball.x, y: state.ball.y, color: '#ffffff', life: 0.6, radius: 160 });
  state.timeFreeze = { scale: 0.4, remaining: 0.7 }; // 進球瞬間全場慢動作
  state.ball.vx = 0; state.ball.vy = 0;
  state.soccerPhase = 'goal';
  state.soccerTimer = GOAL_CELEBRATE;
  state.banner = {
    text: `⚽ ${TEAM_NAMES[team]} 得分！`,
    sub: reached ? `${TEAM_NAMES[team]} 獲勝！` : `${state.score[1]} - ${state.score[2]}`,
    life: GOAL_CELEBRATE, kind: 'phase', color: TEAM_COLORS[team],
  };
}
