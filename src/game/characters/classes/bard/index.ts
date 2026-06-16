// @ts-nocheck
import { BaseCharacter } from '../../BaseCharacter.ts';
import { characterSprite } from '../../textureSprite.ts';
import { drawBardTexture } from './texture.ts';
import { modelConfig, buildModel, buildWeapon } from './model.ts';
import './vfx.ts';

const data = {
    id: 12, name: '吟遊詩人', color: '#e91e63', shape: 'circle', sprite: characterSprite('bard', '#e91e63', false, drawBardTexture),
    maxHp: 190, maxMana: 120, speed: 182,
    desc: '以樂曲增幅全隊的進攻型輔助。激昂戰歌賜予友軍增傷與狂熱、不諧和音貫穿暈擊，大招英雄頌歌讓全隊爆發。不提供治療，價值在放大隊友的火力。',
    role: '支援 · 增傷/加速',
    synergy: '增傷型核心：放大隊友 carry 的輸出；人越多越強，配多 carry 陣容滾雪球。',
    talent: { id: 'warsong', name: '戰歌共鳴', desc: '周圍 250 內每多一名友方，自身與友方額外 +5% 傷害（最多 +15%）。', radius: 250, perAlly: 0.05, maxAllies: 3 },
    basic: { name: '音波衝擊', type: 'projectile', dmg: 18, speed: 600, radius: 12, lifetime: 1.3, knockback: 60, cd: 0.5, color: '#ff6fa5', vfx: 'bard_note' },
    skill1: { name: '激昂戰歌', type: 'buff', manaCost: 30, cd: 9, color: '#ff8fb8', vfx: 'bard_anthem', ally: { radius: 300, effect: { kind: 'rage', duration: 6, speed: 1.15, dmg: 1.3 } } },
    skill2: { name: '不諧和音', type: 'projectile', dmg: 40, speed: 720, radius: 13, lifetime: 0.9, pierce: true, knockback: 80, manaCost: 30, cd: 8, color: '#ec407a', effect: { kind: 'stun', duration: 0.5 }, vfx: 'bard_discord' },
    ultimate: { name: '英雄頌歌', type: 'zone', range: 0, radius: 180, dmg: 30, lifetime: 0.6, tick: 0.6, knockback: 60, effect: { kind: 'slow', duration: 1.5, factor: 0.6 }, cd: 12, color: '#ff4081', vfx: 'bard_ultimate', ally: { radius: 340, shield: 160, cleanse: true, effects: [{ kind: 'rage', duration: 7, speed: 1.2, dmg: 1.4 }, { kind: 'haste', duration: 7, factor: 1.3 }] } },
  };

export class BardCharacter extends BaseCharacter {
  constructor() {
    super(data, {
      modelConfig,
      buildModel,
      buildWeapon,
      paintTexture: drawBardTexture,
      loadVfx: () => undefined,
    });
  }
}

export default new BardCharacter();
