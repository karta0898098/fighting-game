import { describe, expect, it, vi } from 'vitest';
import { createInitialState, makeBoss, makePlayer } from '../src/game/entities/factories.ts';
import { dealDamage } from '../src/game/entities/damage.ts';
import { prepareTimeAnchorRitual, resolveTimeAnchorRitual } from '../src/game/bosses/time-anchors.ts';
import { maybeScheduleTemporalEcho, tickTemporalEchoes } from '../src/game/bosses/echoes.ts';

function setup(playerCount = 2) {
  const state: any = createInitialState([], {}, { mode: 'boss' });
  state.roundPhase = 'fighting';
  const boss: any = makeBoss('boss-11', 110, 1200, 450, 2, { isBoss: true, aiId: 'time_devourer' });
  state.players[boss.id] = boss;
  for (let i = 0; i < playerCount; i++) {
    const p: any = makePlayer(`p${i}`, `P${i}`, 0, 300 + i * 100, 900, 1);
    state.players[p.id] = p;
  }
  return { state, boss };
}

describe('Round 11 time anchors', () => {
  it('creates one anchor per living player and succeeds when all occupy one', () => {
    const { state, boss } = setup(3);
    prepareTimeAnchorRitual(state, boss, { windup: 5, finalPhaseWindup: 3.8, anchorRadius: 95 });
    expect(state.timeAnchors).toHaveLength(3);
    const players: any[] = Object.values(state.players).filter((p: any) => p.team === 1) as any[];
    players.forEach((p, i) => { p.x = state.timeAnchors[i].x; p.y = state.timeAnchors[i].y; });
    expect(resolveTimeAnchorRitual(state, boss)).toBe(true);
    expect(players.every((p) => p.alive)).toBe(true);
  });

  it('kills the living team when any required anchor is empty', () => {
    const { state, boss } = setup(2);
    prepareTimeAnchorRitual(state, boss, { windup: 5, anchorRadius: 95 });
    const players: any[] = Object.values(state.players).filter((p: any) => p.team === 1) as any[];
    players[0].x = state.timeAnchors[0].x; players[0].y = state.timeAnchors[0].y;
    players[1].x = players[0].x; players[1].y = players[0].y;
    expect(resolveTimeAnchorRitual(state, boss)).toBe(false);
    expect(players.every((p) => !p.alive && p.hp === 0)).toBe(true);
  });

  it('prepares anchors when the global 20% lock forces the ultimate', () => {
    const { state, boss } = setup(2);
    boss.hp = boss.maxHp * 0.21;
    dealDamage(state, boss, boss.maxHp * 0.05, state.players.p0.id);
    expect(boss.desperation).toBe(true);
    expect(boss.aiState.slot).toBe('ultimate');
    expect(state.timeAnchors).toHaveLength(2);
  });
});

describe('Round 11 temporal echoes', () => {
  it('replays eligible attacks at 60% damage', () => {
    const { state, boss } = setup(1);
    boss.phaseIdx = 1;
    maybeScheduleTemporalEcho(state, boss, { type: 'melee', dmg: 50, range: 100, telegraph: 'arc' });
    expect(state.temporalEchoes[0].action.dmg).toBe(30);
    const execute = vi.fn();
    tickTemporalEchoes(state, 1.6, execute);
    expect(execute).toHaveBeenCalledOnce();
    expect(state.temporalEchoes).toEqual([]);
  });
});
