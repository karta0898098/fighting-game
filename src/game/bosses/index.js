// 闖關模式魔王資料聚合入口。各魔王定義放在 ./<slug>/index.js。
import golem from './golem/index.js';
import poisonLizard from './poison-lizard/index.js';
import lavaJuggernaut from './lava-juggernaut/index.js';
import frostAssassin from './frost-assassin/index.js';
import ancientTitan from './ancient-titan/index.js';
import necromancerConductor from './necromancer-conductor/index.js';
import stormWolf from './storm-wolf/index.js';
import voidMage from './void-mage/index.js';
import fallenAngel from './fallen-angel/index.js';
import doppelganger from './doppelganger/index.js';

export const BOSSES = [
  golem,
  poisonLizard,
  lavaJuggernaut,
  frostAssassin,
  ancientTitan,
  necromancerConductor,
  stormWolf,
  voidMage,
  fallenAngel,
  doppelganger,
];

const BY_ID = new Map(BOSSES.map((b) => [b.id, b]));

export function getBoss(id) { return BY_ID.get(id) || null; }
export function isBossId(id) { return id >= 100 && BY_ID.has(id); }

export function getBossForRound(round) {
  return BOSSES.find((b) => b.round === round) || null;
}

export const BOSS_COUNT = BOSSES.length;
