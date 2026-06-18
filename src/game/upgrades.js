// 闖關「關間強化」目錄 (Roguelike draft)
// 每打完一關,每位玩家從 3 個隨機強化中三選一,效果在本輪永久疊加。
// apply() 由房主在權威端套用 (寫入玩家旗標欄位);icon/name/desc 供 HUD 顯示。
// 旗標欄位 (皆以「不存在 = 預設值」讀取,毋須在工廠初始化):
//   dmgMult (×傷害)、cdMult (×冷卻恢復速率)、moveSpeedMult (×移速)、
//   runLifesteal (+命中回血比例)、ultGainMult (×終極能量獲取)、maxHp/maxMana (直接加成)
// 這些欄位都能撐過 reviveAndHealAll (它只重置 hp=maxHp,故 maxHp 加成保留)。

export const UPGRADES = [
  { id: 'power',    icon: '⚔️', name: '力量',   desc: '造成傷害 +15%',
    apply: (p) => { p.dmgMult = (p.dmgMult || 1) * 1.15; } },
  { id: 'vamp',     icon: '🩸', name: '吸血',   desc: '命中回復 10% 傷害',
    apply: (p) => { p.runLifesteal = (p.runLifesteal || 0) + 0.10; } },
  { id: 'vitality', icon: '❤️', name: '堅韌',   desc: '最大生命 +20% (立即補滿)',
    apply: (p) => { const add = p.maxHp * 0.20; p.maxHp += add; p.hp = Math.min(p.maxHp, p.hp + add); } },
  { id: 'swift',    icon: '💨', name: '迅捷',   desc: '移動速度 +12%',
    apply: (p) => { p.moveSpeedMult = (p.moveSpeedMult || 1) * 1.12; } },
  { id: 'haste',    icon: '⏱️', name: '急速',   desc: '技能冷卻 -13%',
    apply: (p) => { p.cdMult = (p.cdMult || 1) * 1.15; } },
  { id: 'charge',   icon: '⚡', name: '蓄能',   desc: '終極能量獲取 +30%',
    apply: (p) => { p.ultGainMult = (p.ultGainMult || 1) * 1.30; } },
  { id: 'mana',     icon: '🔵', name: '法力',   desc: '最大魔力 +25% (立即補滿)',
    apply: (p) => { const add = p.maxMana * 0.25; p.maxMana += add; p.mana = Math.min(p.maxMana, p.mana + add); } },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export function applyUpgrade(p, id) {
  const u = UPGRADE_BY_ID[id];
  if (u) u.apply(p);
}

// 隨機抽 n 個不重複的強化 id (可重複擁有 → 不排除已擁有)
export function rollUpgradeOptions(n = 3) {
  const pool = UPGRADES.map((u) => u.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}
