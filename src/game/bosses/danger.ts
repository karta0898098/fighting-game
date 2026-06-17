// @ts-nocheck
// 危險等級判定 + 預警色標準化：讓玩家用顏色第一眼判斷威脅。
//
//   low    🟡 #ffd166  打到也只小痛 (基本/輕擊)
//   mid    🟠 #ff9a3c  中等傷害 / 短控
//   high   🔴 #ff5050  重擊 / 大範圍 / 長控
//   lethal 🟣 #c050ff  破壞性大招 / 致命連控 / 場面控制

export type DangerTier = 'low' | 'mid' | 'high' | 'lethal';

export const DANGER_COLOR: Record<DangerTier, string> = {
  low:    '#ffd166',
  mid:    '#ff9a3c',
  high:   '#ff5050',
  lethal: '#c050ff',
};

export function dangerOf(action: any): DangerTier {
  if (!action) return 'low';
  if (action.dangerLevel) return action.dangerLevel;
  const dmg = action.dmg || 0;
  const r = action.radius || action.hitRadius || 0;
  const eff = action.effect || {};
  const stun = eff.kind === 'stun' || action.type === 'time_rewind' || action.type === 'soul_bind' || action.type === 'light_dark' || action.type === 'mirror_players';
  if (dmg >= 80 || r >= 220 || (stun && (eff.duration || 0) >= 0.6) || action.type === 'time_rewind' || action.type === 'light_dark') return 'lethal';
  if (dmg >= 45 || r >= 140 || stun) return 'high';
  if (dmg >= 25 || r >= 90) return 'mid';
  return 'low';
}

export function dangerColor(action: any): string {
  return DANGER_COLOR[dangerOf(action)];
}
