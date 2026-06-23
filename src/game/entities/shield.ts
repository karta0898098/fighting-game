import { addFx } from './fx.ts';
import type { GameState, Player } from '../types';

const SHIELD_POPUP_COLOR = '#f7fbff';

export function applyShield(
  state: GameState | null | undefined,
  p: Player,
  amount: number,
  duration = 5,
  opts: { popup?: boolean } = {},
): number {
  if (!p || !p.alive || amount <= 0) return 0;
  const before = p.shield || 0;
  p.shield = Math.max(before, amount);
  p.shieldTime = Math.max(p.shieldTime || 0, duration);
  const gained = Math.max(0, p.shield - before);
  if (state && opts.popup !== false && gained > 0) {
    addFx(state, {
      type: 'popup',
      x: p.x,
      y: p.y,
      color: SHIELD_POPUP_COLOR,
      life: 0.75,
      text: `+${Math.round(gained)}`,
      kind: 'shield',
    });
  }
  return gained;
}
