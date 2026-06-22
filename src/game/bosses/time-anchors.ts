import { ARENA } from '../constants.js';
import { addFx } from '../entities/fx.ts';

const TEAM_PLAYER = 1;

function livingPlayers(state: any) {
  return Object.values(state.players).filter((p: any) => p.team === TEAM_PLAYER && p.alive) as any[];
}

function assignOccupants(state: any) {
  const anchors = state.timeAnchors || [];
  const players = livingPlayers(state);
  const used = new Set<any>();
  for (const anchor of anchors) {
    anchor.occupiedBy = null;
    let best = null;
    let bestDist = Infinity;
    for (const player of players) {
      if (used.has(player.id)) continue;
      const d = Math.hypot(player.x - anchor.x, player.y - anchor.y);
      if (d <= anchor.radius && d < bestDist) { best = player; bestDist = d; }
    }
    if (best) { anchor.occupiedBy = best.id; used.add(best.id); }
  }
  return used.size;
}

export function prepareTimeAnchorRitual(state: any, boss: any, action: any) {
  const players = livingPlayers(state);
  const count = Math.max(1, Math.min(4, players.length));
  const cx = ARENA.width / 2;
  const cy = ARENA.height / 2;
  const orbit = Math.min(360, ARENA.height * 0.27);
  const offset = -Math.PI / 2;
  state.timeAnchors = Array.from({ length: count }, (_, i) => {
    const angle = offset + (i / count) * Math.PI * 2;
    return {
      id: `time-anchor-${boss.id}-${i}`,
      ownerId: boss.id,
      x: cx + Math.cos(angle) * orbit,
      y: cy + Math.sin(angle) * orbit,
      radius: action.anchorRadius || 95,
      color: i % 2 ? '#d06cff' : '#70e6ff',
      occupiedBy: null,
    };
  });
  state.timeAnchorRitual = {
    ownerId: boss.id,
    total: boss.phaseIdx >= 2 && action.finalPhaseWindup != null ? action.finalPhaseWindup : action.windup,
    fxT: 0,
  };
}

export function resolveTimeAnchorRitual(state: any, boss: any) {
  const alive = livingPlayers(state);
  const occupied = assignOccupants(state);
  const success = alive.length > 0 && occupied >= alive.length;
  if (success) {
    boss.ultLockInvincible = false;
    boss.ultLockInvincibleTimer = 0;
    addFx(state, { type: 'ultimate', x: boss.x, y: boss.y, color: '#70e6ff', life: 0.8, radius: 320 });
    state.banner = { text: '時間鎖定成功！', sub: '奧羅克洛斯陷入 3 秒破綻', life: 1.2, kind: 'phase', color: '#70e6ff' };
  } else {
    for (const player of alive) {
      player.shield = 0;
      player.hp = 0;
      player.alive = false;
      addFx(state, { type: 'death', x: player.x, y: player.y, color: '#ff3c78', life: 0.7, radius: 100 });
    }
    state.banner = { text: '紀元終結', sub: '時間錨點未全部啟動', life: 1.4, kind: 'phase', color: '#ff3c78' };
  }
  state.timeAnchors = [];
  state.timeAnchorRitual = null;
  return success;
}

export function tickTimeAnchors(state: any, dt: number) {
  const ritual = state.timeAnchorRitual;
  if (!ritual || !state.timeAnchors?.length) return;
  const boss = state.players[ritual.ownerId];
  if (!boss || !boss.alive || boss.aiState?.slot !== 'ultimate') {
    state.timeAnchors = [];
    state.timeAnchorRitual = null;
    return;
  }
  const occupied = assignOccupants(state);
  const alive = livingPlayers(state).length;
  ritual.fxT -= dt;
  if (ritual.fxT <= 0) {
    ritual.fxT = 0.12;
    const remaining = Math.max(0, boss.aiState?.windupT || 0);
    const progress = 1 - remaining / Math.max(0.001, ritual.total || 5);
    for (const anchor of state.timeAnchors) {
      addFx(state, {
        type: 'telegraph', x: anchor.x, y: anchor.y,
        color: anchor.occupiedBy ? '#7CFCB2' : anchor.color,
        radius: anchor.radius, shape: 'circle', progress,
        life: 0.2, danger: anchor.occupiedBy ? 'low' : 'lethal',
      });
    }
    state.banner = {
      text: `紀元終結 ${remaining.toFixed(1)}s`,
      sub: `時間錨點 ${occupied}/${alive} — 每人各站一座`,
      life: 0.25, kind: 'phase', color: occupied >= alive ? '#7CFCB2' : '#ff6b9f',
    };
  }
}
