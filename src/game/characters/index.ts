// @ts-nocheck
// 角色資料聚合入口。各職業的數值與技能定義放在 ./classes/<slug>/index.js。
import { getBoss } from '../bosses.js';
import warrior from './classes/warrior/index.ts';
import mage from './classes/mage/index.ts';
import assassin from './classes/assassin/index.ts';
import tank from './classes/tank/index.ts';
import archer from './classes/archer/index.ts';
import healer from './classes/healer/index.ts';
import berserker from './classes/berserker/index.ts';
import ninja from './classes/ninja/index.ts';
import elementalist from './classes/elementalist/index.ts';
import fighter from './classes/fighter/index.ts';
import paladin from './classes/paladin/index.ts';
import hexer from './classes/hexer/index.ts';
import bard from './classes/bard/index.ts';
import samurai from './classes/samurai/index.ts';
import gunner from './classes/gunner/index.ts';
import summoner from './classes/summoner/index.ts';
import necromancer from './classes/necromancer/index.ts';
import chronomancer from './classes/chronomancer/index.ts';

export const CHARACTERS: any[] = [
  warrior,
  mage,
  assassin,
  tank,
  archer,
  healer,
  berserker,
  ninja,
  elementalist,
  fighter,
  paladin,
  hexer,
  bard,
  samurai,
  gunner,
  summoner,
  necromancer,
  chronomancer,
];

export function getCharacter(id: any): any {
  // id >= 100 -> 闖關模式魔王資料，沿用角色 schema 與渲染/傷害管線。
  if (id >= 100) {
    const boss = getBoss(id);
    if (boss) return boss;
  }
  return CHARACTERS[id] || CHARACTERS[0];
}
