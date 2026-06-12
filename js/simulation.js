// 權威模擬：僅由房主執行。applyMovement 也供加入者本機預測使用。

import { ARENA, PLAYER_RADIUS, MANA_REGEN, KNOCKBACK_FRICTION, ULT_MAX, ULT_REGEN, ULT_LOCKOUT } from './constants.js';
import { getCharacter } from './characters.js';
import { EMPTY_INPUT } from './input.js';
import {
  clamp, dist, angleDiff, makeProjectile, makeZone,
  dealDamage, applyEffect, addFx,
} from './entities.js';

export function speedOf(p) {
  const c = getCharacter(p.charId);
  let s = c.speed;
  if (p.effects.slow) s *= p.effects.slow.factor;
  if (p.effects.haste) s *= p.effects.haste.factor;
  if (p.effects.rage) s *= p.effects.rage.speed;
  return s;
}

// 移動 + 擊退位移 + 邊界限制 (房主與加入者預測共用)
export function applyMovement(p, input, dt) {
  if (!p.effects.stun) {
    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (dx || dy) {
      const l = Math.hypot(dx, dy);
      dx /= l; dy /= l;
      p.facing = Math.atan2(dy, dx);
      const s = speedOf(p);
      p.vx = dx * s; p.vy = dy * s;
    } else { p.vx = 0; p.vy = 0; }
  } else { p.vx = 0; p.vy = 0; }

  p.x += (p.vx + p.kvx) * dt;
  p.y += (p.vy + p.kvy) * dt;

  const f = Math.exp(-KNOCKBACK_FRICTION * dt);
  p.kvx *= f; p.kvy *= f;

  p.x = clamp(p.x, PLAYER_RADIUS, ARENA.width - PLAYER_RADIUS);
  p.y = clamp(p.y, PLAYER_RADIUS, ARENA.height - PLAYER_RADIUS);
}

function outMult(p, a) {
  let m = 1;
  if (a.lowHpBonus) m *= 1 + (1 - p.hp / p.maxHp);
  if (p.effects.rage) m *= p.effects.rage.dmg;
  return m;
}

function meleeHit(state, p, a, silent) {
  const m = outMult(p, a);
  const full = a.arc >= 6;
  for (const o of Object.values(state.players)) {
    if (o.id === p.id || !o.alive) continue;
    const dx = o.x - p.x, dy = o.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > a.range + PLAYER_RADIUS) continue;
    if (!full) {
      const ang = Math.atan2(dy, dx);
      if (Math.abs(angleDiff(ang, p.facing)) > a.arc / 2) continue;
    }
    dealDamage(state, o, a.dmg * m, p.id);
    if (a.knockback && d > 0) { o.kvx += (dx / d) * a.knockback; o.kvy += (dy / d) * a.knockback; }
    if (a.effect) applyEffect(o, a.effect.kind, a.effect);
  }
  if (!silent) addFx(state, { type: 'melee', x: p.x, y: p.y, facing: p.facing, range: a.range, arc: full ? 7 : a.arc, color: a.color, life: 0.18, vfx: a.vfx });
}

// 對自己施加增益 (供大招 a.self 使用，可搭配任意動作類型)
function applySelfBuff(p, s) {
  if (!s) return;
  if (s.cleanse) applyEffect(p, 'cleanse');
  if (s.heal) applyEffect(p, 'heal', { amount: s.heal });
  if (s.shield) applyEffect(p, 'shield', { amount: s.shield, duration: s.duration || 5 });
  if (s.effect) applyEffect(p, s.effect.kind, s.effect);
}

function executeAction(state, p, a, opts = {}) {
  const silent = !!opts.silent; // 大招以單一 'ultimate' fx 取代動作自身的施放 fx，避免重複觸發
  const cos = Math.cos(p.facing), sin = Math.sin(p.facing);
  switch (a.type) {
    case 'projectile': {
      const m = outMult(p, a);
      const n = a.count || 1;
      for (let i = 0; i < n; i++) {
        const ang = p.facing + (i - (n - 1) / 2) * (a.spread || 0);
        const c = Math.cos(ang), s = Math.sin(ang);
        state.projectiles.push(makeProjectile(
          p.id, p.x + c * PLAYER_RADIUS, p.y + s * PLAYER_RADIUS,
          c * a.speed, s * a.speed,
          { dmg: a.dmg * m, radius: a.radius, lifetime: a.lifetime, color: a.color, knockback: a.knockback, pierce: a.pierce, effect: a.effect, vfx: a.vfx }
        ));
      }
      break;
    }
    case 'melee':
      meleeHit(state, p, a, silent);
      break;
    case 'dash':
      p.kvx += cos * a.impulse; p.kvy += sin * a.impulse;
      if (a.dmg) meleeHit(state, p, a, true);
      if (!silent) addFx(state, { type: 'dash', x: p.x, y: p.y, facing: p.facing, color: a.color, life: 0.25, vfx: a.vfx });
      break;
    case 'blink':
      p.x = clamp(p.x + cos * a.range, PLAYER_RADIUS, ARENA.width - PLAYER_RADIUS);
      p.y = clamp(p.y + sin * a.range, PLAYER_RADIUS, ARENA.height - PLAYER_RADIUS);
      if (!silent) addFx(state, { type: 'blink', x: p.x, y: p.y, color: a.color, life: 0.3, radius: PLAYER_RADIUS * 1.6, vfx: a.vfx });
      break;
    case 'buff':
      if (a.cleanse) applyEffect(p, 'cleanse');
      if (a.heal) applyEffect(p, 'heal', { amount: a.heal });
      if (a.shield) applyEffect(p, 'shield', { amount: a.shield, duration: a.duration });
      if (a.effect) applyEffect(p, a.effect.kind, a.effect);
      if (!silent) addFx(state, { type: 'buff', x: p.x, y: p.y, color: a.color, life: 0.4, radius: PLAYER_RADIUS * 2.2, vfx: a.vfx });
      break;
    case 'zone': {
      const baseX = clamp(p.x + cos * (a.range || 0), PLAYER_RADIUS, ARENA.width - PLAYER_RADIUS);
      const baseY = clamp(p.y + sin * (a.range || 0), PLAYER_RADIUS, ARENA.height - PLAYER_RADIUS);
      const n = a.count || 1;
      if (n <= 1) {
        state.zones.push(makeZone(p.id, baseX, baseY, a));
      } else {
        // 散射多個範圍區 (隱石風暴/箭雨)；第一個落在瞑準中心，其餘於 scatter 半徑內
        const scatter = a.scatter || 120;
        for (let i = 0; i < n; i++) {
          let zx = baseX, zy = baseY;
          if (i > 0) {
            const ang = Math.random() * Math.PI * 2;
            const rr = Math.sqrt(Math.random()) * scatter;
            zx = clamp(baseX + Math.cos(ang) * rr, PLAYER_RADIUS, ARENA.width - PLAYER_RADIUS);
            zy = clamp(baseY + Math.sin(ang) * rr, PLAYER_RADIUS, ARENA.height - PLAYER_RADIUS);
          }
          const z = makeZone(p.id, zx, zy, a);
          if (a.delay) z.delay += i * (a.stagger || 0.16); // 錯開落點，連續轟炸
          state.zones.push(z);
        }
      }
      if (a.recoil) { p.kvx -= cos * a.recoil; p.kvy -= sin * a.recoil; }
      break;
    }
  }
  if (a.self) applySelfBuff(p, a.self);
}

function tryAction(state, p, slot) {
  const c = getCharacter(p.charId);
  const a = c[slot];
  if (!a || p.cd[slot] > 0) return;
  if (a.manaCost && p.mana < a.manaCost) return;
  if (a.hpCost && p.hp <= a.hpCost) return;
  if (a.manaCost) p.mana -= a.manaCost;
  if (a.hpCost) p.hp -= a.hpCost;
  p.cd[slot] = a.cd;
  executeAction(state, p, a);
}

// 大絕招：需能量槽滿槽。不耗 mana/hp，改消耗能量。
function tryUltimate(state, p) {
  const c = getCharacter(p.charId);
  const a = c.ultimate;
  if (!a) return;
  if (p.cd.ultimate > 0) return;
  if ((p.ult || 0) < ULT_MAX) return;
  p.ult = 0;
  p.cd.ultimate = a.cd || ULT_LOCKOUT;
  executeAction(state, p, a, { silent: true });
  // 單一大招施放特效 (螢幕級華麗表現由 vfx onCast 處理)
  addFx(state, { type: 'ultimate', x: p.x, y: p.y, facing: p.facing, color: a.color, life: 0.7, radius: a.radius || 140, vfx: a.vfx });
}

function resolveCollisions(state) {
  const arr = Object.values(state.players).filter((p) => p.alive);
  const minD = PLAYER_RADIUS * 2;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], b = arr[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      if (d > 0 && d < minD) {
        const push = (minD - d) / 2;
        const nx = dx / d, ny = dy / d;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
      }
    }
  }
}

function updateProjectiles(state, dt) {
  const keep = [];
  for (const pr of state.projectiles) {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    pr.lifetime -= dt;
    if (pr.lifetime <= 0 || pr.x < 0 || pr.y < 0 || pr.x > ARENA.width || pr.y > ARENA.height) continue;
    let dead = false;
    for (const o of Object.values(state.players)) {
      if (o.id === pr.owner || !o.alive || pr.hit[o.id]) continue;
      if (dist(pr.x, pr.y, o.x, o.y) <= pr.radius + PLAYER_RADIUS) {
        dealDamage(state, o, pr.dmg, pr.owner);
        if (pr.knockback) {
          const l = Math.hypot(pr.vx, pr.vy) || 1;
          o.kvx += (pr.vx / l) * pr.knockback; o.kvy += (pr.vy / l) * pr.knockback;
        }
        if (pr.effect) applyEffect(o, pr.effect.kind, pr.effect);
        addFx(state, { type: 'hit', x: pr.x, y: pr.y, color: pr.color, life: 0.2, radius: pr.radius * 2, vfx: pr.vfx });
        pr.hit[o.id] = true;
        if (!pr.pierce) { dead = true; break; }
      }
    }
    if (!dead) keep.push(pr);
  }
  state.projectiles = keep;
}

function updateZones(state, dt) {
  const keep = [];
  for (const z of state.zones) {
    if (z.delay > 0) {
      z.delay -= dt;
      if (z.delay > 0) { keep.push(z); continue; }
      addFx(state, { type: 'hit', x: z.x, y: z.y, color: z.color, life: 0.3, radius: z.radius, vfx: z.vfx });
    }
    z.lifetime -= dt;
    z.tickTimer -= dt;
    if (z.tickTimer <= 0) {
      z.tickTimer += z.tick;
      for (const o of Object.values(state.players)) {
        if (o.id === z.owner || !o.alive) continue;
        if (dist(z.x, z.y, o.x, o.y) <= z.radius + PLAYER_RADIUS) {
          dealDamage(state, o, z.dmg, z.owner);
          if (z.effect) applyEffect(o, z.effect.kind, z.effect);
        }
      }
    }
    if (z.lifetime > 0) keep.push(z);
  }
  state.zones = keep;
}

function updateFx(state, dt) {
  for (const f of state.fx) f.life -= dt;
  state.fx = state.fx.filter((f) => f.life > 0);
}

function checkWin(state) {
  if (state.phase !== 'playing') return;
  const alive = Object.values(state.players).filter((p) => p.alive);
  if (state.startCount >= 2 && alive.length <= 1) {
    state.phase = 'gameover';
    state.winner = alive.length === 1 ? alive[0].id : null;
  }
}

// 一個固定步的權威模擬
export function step(state, inputs, dt) {
  if (state.phase !== 'playing') return;
  state.time += dt;

  for (const p of Object.values(state.players)) {
    if (!p.alive) continue;
    const input = inputs[p.id] || EMPTY_INPUT;

    for (const k of ['basic', 'skill1', 'skill2', 'ultimate']) p.cd[k] = Math.max(0, p.cd[k] - dt);
    for (const kind of Object.keys(p.effects)) {
      p.effects[kind].remaining -= dt;
      if (p.effects[kind].remaining <= 0) delete p.effects[kind];
    }
    if (p.shieldTime > 0) { p.shieldTime -= dt; if (p.shieldTime <= 0) p.shield = 0; }

    p.mana = Math.min(p.maxMana, p.mana + MANA_REGEN * dt);
    p.ult = Math.min(ULT_MAX, (p.ult || 0) + ULT_REGEN * dt); // 被動充能

    applyMovement(p, input, dt);

    if (!p.effects.stun) {
      if (input.basic) tryAction(state, p, 'basic');
      if (input.skill1) tryAction(state, p, 'skill1');
      if (input.skill2) tryAction(state, p, 'skill2');
      if (input.ultimate) tryUltimate(state, p);
    }
  }

  resolveCollisions(state);
  updateProjectiles(state, dt);
  updateZones(state, dt);
  updateFx(state, dt);
  checkWin(state);
}
