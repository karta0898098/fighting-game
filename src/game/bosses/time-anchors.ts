import { ARENA, PLAYER_RADIUS } from '../constants.js';
import { addFx } from '../entities/fx.ts';

const TEAM_PLAYER = 1;

function livingPlayers(state: any) {
  return Object.values(state.players).filter((p: any) => p.team === TEAM_PLAYER && p.alive) as any[];
}

const OCCUPANCY_GRACE = 0.25;

function assignOccupants(state: any, dt = 0) {
  const anchors = state.timeAnchors || [];
  const players = livingPlayers(state);
  const byId = new Map(players.map((p: any) => [p.id, p]));
  const used = new Set<any>();
  for (const anchor of anchors) {
    const previous = anchor.occupiedBy;
    let best = null;
    let bestDist = Infinity;
    for (const player of players) {
      if (used.has(player.id)) continue;
      const d = Math.hypot(player.x - anchor.x, player.y - anchor.y);
      if (d <= anchor.captureRadius && d < bestDist) { best = player; bestDist = d; }
    }
    if (best) {
      anchor.occupiedBy = best.id;
      anchor.occupancyGrace = OCCUPANCY_GRACE;
      used.add(best.id);
    } else if (previous != null && byId.has(previous) && !used.has(previous) && (anchor.occupancyGrace || 0) > 0) {
      anchor.occupiedBy = previous;
      anchor.occupancyGrace = Math.max(0, anchor.occupancyGrace - dt);
      used.add(previous);
    } else {
      anchor.occupiedBy = null;
      anchor.occupancyGrace = 0;
    }
  }
  return used.size;
}

export function prepareTimeAnchorRitual(state: any, boss: any, action: any) {
  const players = livingPlayers(state);
  const count = Math.max(1, Math.min(4, players.length));
  const cx = ARENA.width / 2;
  const cy = ARENA.height / 2;
  const orbit = Math.min(360, ARENA.height * 0.27);
  // Keep every anchor on the players' half of the arena. The old single-player
  // position was directly beside the boss spawn, whose collision body pushed
  // the player outside the capture radius just before resolution.
  const angles = count === 1
    ? [Math.PI / 2]
    : Array.from({ length: count }, (_, i) => Math.PI * (0.1 + (0.8 * i) / (count - 1)));
  state.timeAnchors = Array.from({ length: count }, (_, i) => {
    const angle = angles[i];
    return {
      id: `time-anchor-${boss.id}-${i}`,
      ownerId: boss.id,
      x: cx + Math.cos(angle) * orbit,
      y: cy + Math.sin(angle) * orbit,
      radius: action.anchorRadius || 95,
      captureRadius: (action.anchorRadius || 95) + PLAYER_RADIUS + 10,
      color: '#70e6ff',
      occupiedBy: null,
      occupancyGrace: 0,
      progress: 0,
    };
  });
  state.timeAnchorRitual = {
    ownerId: boss.id,
    total: boss.phaseIdx >= 2 && action.finalPhaseWindup != null ? action.finalPhaseWindup : action.windup,
    remaining: boss.phaseIdx >= 2 && action.finalPhaseWindup != null ? action.finalPhaseWindup : action.windup,
    progress: 0,
    occupied: 0,
    required: count,
  };
}

export function resolveTimeAnchorRitual(state: any, boss: any) {
  const alive = livingPlayers(state);
  const occupied = assignOccupants(state, 0);
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
  const occupied = assignOccupants(state, dt);
  const alive = livingPlayers(state).length;
  const remaining = Math.max(0, boss.aiState?.windupT || 0);
  ritual.remaining = remaining;
  ritual.progress = 1 - remaining / Math.max(0.001, ritual.total || 5);
  ritual.occupied = occupied;
  ritual.required = alive;
  for (const anchor of state.timeAnchors) anchor.progress = ritual.progress;
  state.banner = {
    text: `紀元終結 ${remaining.toFixed(1)}s`,
    sub: `時間錨點 ${occupied}/${alive} — 青色圈可站，變綠打勾才算成功`,
    life: 0.25, kind: 'phase', color: occupied >= alive ? '#7CFCB2' : '#70e6ff',
  };
}
