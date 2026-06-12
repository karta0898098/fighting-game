// 程序化 3D 角色模型 + 動畫
//
// 每個角色 = 人形基底(頭/軀幹/雙臂/雙腿，肢體有樞紐可擺動) + 依原型的武器 + 頭頂發光識別徽記。
// 模型一律「面向 +X」建立；renderer 以 group.rotation.y = -facing 轉向。
//
// 對外：
//   createCharacterModel(charId) -> THREE.Group (含 userData 動畫資料)
//   animateModel(group, dt, { speed, facing, p, isSelf }) 每幀更新

import * as THREE from 'three';
import { getCharacter } from '../characters.js';
import { WALK_THRESHOLD } from '../constants.js';

// 原型設定：bulk(體型) / weapon(武器) / 顏色由角色資料 color 決定
const ARCHE = {
  0: { bulk: 1.18, weapon: 'sword' },     // 戰士
  1: { bulk: 0.92, weapon: 'staff', robe: true },   // 法師
  2: { bulk: 0.82, weapon: 'daggers' },   // 刺客
  3: { bulk: 1.5, weapon: 'shield' },     // 坦克
  4: { bulk: 0.96, weapon: 'bow' },       // 弓箭手
  5: { bulk: 0.98, weapon: 'orb', robe: true },     // 治療師
  6: { bulk: 1.3, weapon: 'axes' },       // 狂戰士
  7: { bulk: 0.82, weapon: 'kunai' },     // 忍者
  8: { bulk: 1.0, weapon: 'elements', robe: true }, // 元素使
  9: { bulk: 1.05, weapon: 'gloves' },    // 格鬥家
};

function shade(hex, f) {
  const c = new THREE.Color(hex);
  if (f >= 0) c.lerp(new THREE.Color(0xffffff), f);
  else c.lerp(new THREE.Color(0x000000), -f);
  return c;
}

function mat(color, opt = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: opt.rough ?? 0.6, metalness: opt.metal ?? 0.15,
    emissive: opt.emissive ?? 0x000000, emissiveIntensity: opt.ei ?? 1,
    envMapIntensity: opt.env ?? 0.9,
    transparent: true, opacity: 1,
  });
}

export function createCharacterModel(charId) {
  const ch = getCharacter(charId);
  const cfg = ARCHE[charId] || { bulk: 1, weapon: 'sword' };
  const base = ch.color;
  const skinMats = []; // 供隱身淡出
  const reg = (m) => { skinMats.push(m); return m; };

  const group = new THREE.Group();
  const bulk = cfg.bulk;
  const torsoW = 22 * bulk, torsoD = 14 * bulk, torsoH = 20;
  const hipY = 18, shoulderY = hipY + torsoH;

  // 軀幹
  const bodyMat = reg(mat(base, { rough: 0.5, metal: 0.35 }));
  let torsoGeo;
  if (cfg.robe) {
    torsoGeo = new THREE.CylinderGeometry(torsoW * 0.42, torsoW * 0.62, torsoH + 6, 12);
  } else {
    torsoGeo = new THREE.BoxGeometry(torsoW, torsoH, torsoD);
  }
  const torso = new THREE.Mesh(torsoGeo, bodyMat);
  torso.position.y = hipY + torsoH / 2;
  torso.castShadow = true;
  group.add(torso);

  // 胸口亮片 (識別色強化)
  const chest = new THREE.Mesh(
    new THREE.BoxGeometry(torsoW * 0.5, torsoH * 0.4, 2),
    reg(mat(shade(base, 0.35), { metal: 0.4, rough: 0.45, emissive: new THREE.Color(base), ei: 0.22 }))
  );
  chest.position.set(0, hipY + torsoH * 0.6, torsoD * 0.5 + 0.5);
  torso.add(chest);

  // 頭 (依 shape 變化)
  const headMat = reg(mat(shade(base, 0.18), { rough: 0.5 }));
  let headGeo;
  if (ch.shape === 'triangle') headGeo = new THREE.ConeGeometry(8, 15, 4);
  else if (ch.shape === 'square') headGeo = new THREE.BoxGeometry(13, 13, 13);
  else headGeo = new THREE.SphereGeometry(7.5, 16, 12);
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = shoulderY + 8;
  if (ch.shape === 'triangle') head.rotation.y = Math.PI / 4;
  head.castShadow = true;
  group.add(head);
  // 面向標記 (眼/面盔，+X 為前)
  const faceMat = reg(mat(0x0b0f14, { rough: 0.3, metal: 0.5, emissive: new THREE.Color(shade(base, 0.5)), ei: 0.18 }));
  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 9), faceMat);
  visor.position.set(6.5, shoulderY + 8, 0);
  group.add(visor);

  // 手臂 (樞紐在肩)
  const armMat = reg(mat(shade(base, -0.15), { rough: 0.55, metal: 0.35 }));
  const armLen = 16;
  const mkLimb = (px, pz, isArm) => {
    const pivot = new THREE.Group();
    pivot.position.set(px, isArm ? shoulderY - 1 : hipY, pz);
    const len = isArm ? armLen : 17;
    const w = isArm ? 5.2 * bulk : 6.4 * bulk;
    const limb = new THREE.Mesh(new THREE.BoxGeometry(w, len, w), isArm ? armMat : bodyMat);
    limb.position.y = -len / 2;
    limb.castShadow = true;
    pivot.add(limb);
    group.add(pivot);
    return pivot;
  };
  const shoulderX = torsoW * 0.5 + 3;
  const hipX = torsoW * 0.28;
  const armL = mkLimb(0, -shoulderX, true);   // 左 (–Z)
  const armR = mkLimb(0, shoulderX, true);    // 右 (+Z)
  const legL = mkLimb(0, -hipX, false);
  const legR = mkLimb(0, hipX, false);

  // 武器 (掛右手末端)
  const handR = new THREE.Group();
  handR.position.y = -armLen;
  armR.add(handR);
  buildWeapon(handR, cfg.weapon, base, reg);

  // 頭頂發光識別徽記 (收斂發光，仍保留辨識)
  const emMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(base), emissive: new THREE.Color(base), emissiveIntensity: 1.1,
    roughness: 0.35, metalness: 0.1,
  });
  let emGeo;
  if (ch.shape === 'square') emGeo = new THREE.BoxGeometry(5.5, 5.5, 5.5);
  else if (ch.shape === 'triangle') emGeo = new THREE.TetrahedronGeometry(5);
  else emGeo = new THREE.IcosahedronGeometry(4.2, 0);
  const emblem = new THREE.Mesh(emGeo, emMat);
  emblem.position.y = shoulderY + 24;
  group.add(emblem);

  // 腳下接觸陰影圈 (柔和)
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(torsoW * 0.7, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34 })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.6;
  group.add(blob);

  // 護盾環 (p.shield>0 時顯示)
  const shieldRing = new THREE.Mesh(
    new THREE.TorusGeometry(torsoW * 0.95, 1.6, 8, 36),
    new THREE.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x49d0ff, emissiveIntensity: 2.2, transparent: true, opacity: 0.9 })
  );
  shieldRing.rotation.x = -Math.PI / 2;
  shieldRing.position.y = 2;
  shieldRing.visible = false;
  group.add(shieldRing);

  // 血怒環
  const rageRing = new THREE.Mesh(
    new THREE.TorusGeometry(torsoW * 1.05, 2.2, 8, 36),
    new THREE.MeshStandardMaterial({ color: 0xff5a3c, emissive: 0xff2a14, emissiveIntensity: 2.6, transparent: true, opacity: 0.85 })
  );
  rageRing.rotation.x = -Math.PI / 2;
  rageRing.position.y = 2;
  rageRing.visible = false;
  group.add(rageRing);

  // 燃燒環 (p.effects.burn 時顯示，橘紅悶燒)
  const burnRing = new THREE.Mesh(
    new THREE.TorusGeometry(torsoW * 1.0, 1.4, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0xff7a3d, emissive: 0xff5a1f, emissiveIntensity: 2.4, transparent: true, opacity: 0.8 })
  );
  burnRing.rotation.x = -Math.PI / 2;
  burnRing.position.y = 3;
  burnRing.visible = false;
  group.add(burnRing);

  group.userData = {
    parts: { torso, head, armL, armR, legL, legR, emblem, shieldRing, rageRing, burnRing, handR },
    skinMats,
    phase: Math.random() * Math.PI * 2,
    breathe: Math.random() * Math.PI * 2,
    move: 0,
    curFacing: 0,
    baseY: 0,
  };
  return group;
}

function buildWeapon(hand, type, base, reg) {
  const steel = reg(mat(0xb9c4cf, { rough: 0.35, metal: 0.7 }));
  const dark = reg(mat(0x2b3038, { rough: 0.5, metal: 0.5 }));
  const accent = reg(mat(shade(base, 0.2), { emissive: new THREE.Color(base), ei: 0.5 }));
  const add = (m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    m.castShadow = true; m.position.set(x, y, z); m.rotation.set(rx, ry, rz); hand.add(m); return m;
  };
  switch (type) {
    case 'sword':
      add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 30, 5), steel), 4, -6, 0);
      add(new THREE.Mesh(new THREE.BoxGeometry(3, 3, 12), dark), 4, -20, 0);
      break;
    case 'axes':
    case 'axe':
      add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 26, 8), dark), 3, -8, 0);
      add(new THREE.Mesh(new THREE.BoxGeometry(3, 10, 12), steel), 3, 2, 4, 0, 0, 0.2);
      break;
    case 'daggers':
      add(new THREE.Mesh(new THREE.ConeGeometry(2, 14, 4), steel), 3, -2, 0, 0, 0, Math.PI);
      break;
    case 'kunai':
      add(new THREE.Mesh(new THREE.ConeGeometry(2.4, 12, 4), dark), 3, -2, 0, 0, 0, Math.PI);
      add(new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.8, 6, 10), dark), 3, 5, 0, Math.PI / 2);
      break;
    case 'staff':
      add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 40, 8), dark), 3, -4, 0);
      add(new THREE.Mesh(new THREE.IcosahedronGeometry(4.5, 0),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(base), emissive: new THREE.Color(base), emissiveIntensity: 2.6 })), 3, 16, 0);
      break;
    case 'orb':
      add(new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(base), emissiveIntensity: 2.4, transparent: true, opacity: 0.9 })), 6, -2, 0);
      break;
    case 'bow': {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(13, 1.1, 8, 24, Math.PI * 1.3), reg(mat(shade(base, -0.1), { rough: 0.5 })));
      add(torus, 4, -4, 0, 0, Math.PI / 2, 0);
      break;
    }
    case 'shield':
      add(new THREE.Mesh(new THREE.BoxGeometry(3, 26, 22), reg(mat(shade(base, 0.1), { metal: 0.5, rough: 0.4 }))), 5, -4, 0);
      add(new THREE.Mesh(new THREE.SphereGeometry(3.5, 12, 8), accent), 8, -4, 0);
      break;
    case 'gloves':
      add(new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), accent), 3, -2, 0);
      break;
    case 'elements': {
      const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(base), emissive: new THREE.Color(base), emissiveIntensity: 2.2 });
      for (let i = 0; i < 3; i++) {
        const o = add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), m), 4, 0 + i * 4, 0);
        o.userData.orbit = i;
      }
      break;
    }
    default:
      add(new THREE.Mesh(new THREE.BoxGeometry(3, 18, 3), steel), 4, -6, 0);
  }
}

const _white = new THREE.Color(0xffffff);

export function animateModel(group, dt, info) {
  const ud = group.userData;
  if (!ud) return;
  const { parts } = ud;
  const moving = info.speed > WALK_THRESHOLD;
  // move 平滑
  ud.move += ((moving ? 1 : 0) - ud.move) * Math.min(1, dt * 12);
  const stride = Math.min(1.7, 0.6 + info.speed / 220);
  if (ud.move > 0.02) ud.phase += dt * 9 * stride;
  ud.breathe += dt * 1.6;

  // 朝向平滑 (group.rotation.y = -facing)
  const target = -info.facing;
  let d = target - ud.curFacing;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  ud.curFacing += d * Math.min(1, dt * 14);
  group.rotation.y = ud.curFacing;

  const sw = Math.sin(ud.phase);
  const amp = 0.7 * ud.move;
  // 腿擺動 (rotation.z 沿 +X 前後)
  parts.legL.rotation.z = sw * amp;
  parts.legR.rotation.z = -sw * amp;
  // 手臂反向擺 + 微張
  parts.armL.rotation.z = -sw * amp * 0.8;
  parts.armR.rotation.z = sw * amp * 0.8;
  parts.armL.rotation.x = -0.12;
  parts.armR.rotation.x = 0.12;

  // 軀幹上下彈跳 + 呼吸
  const bob = ud.move > 0.02 ? Math.abs(Math.sin(ud.phase)) * 3.2 * ud.move : Math.sin(ud.breathe) * 0.8;
  group.position.y = ud.baseY + bob;
  parts.torso.rotation.z = sw * 0.05 * ud.move;

  // 徽記旋轉 + 漂浮
  parts.emblem.rotation.y += dt * 1.5;
  parts.emblem.rotation.x += dt * 0.8;
  parts.emblem.position.y = (parts.head.position.y + 16) + Math.sin(ud.breathe * 1.3) * 1.6;

  // 元素使浮球公轉
  if (parts.handR) {
    for (const o of parts.handR.children) {
      if (o.userData && o.userData.orbit !== undefined) {
        const a = ud.breathe * 2 + o.userData.orbit * (Math.PI * 2 / 3);
        o.position.set(4 + Math.cos(a) * 5, 2, Math.sin(a) * 5);
      }
    }
  }

  // ---- 狀態環 / 隱身淡出 ----
  const p = info.p;
  const shieldOn = p && p.shield > 0;
  parts.shieldRing.visible = shieldOn;
  if (shieldOn) {
    const pulse = 0.8 + 0.2 * Math.sin(ud.breathe * 4);
    parts.shieldRing.scale.setScalar(pulse);
    parts.shieldRing.material.emissiveIntensity = 1.6 + 0.8 * pulse;
  }
  const rageOn = p && p.effects && p.effects.rage;
  parts.rageRing.visible = !!rageOn;
  if (rageOn) {
    const pulse = 0.85 + 0.15 * Math.sin(ud.breathe * 6);
    parts.rageRing.scale.setScalar(pulse);
  }

  const burnOn = p && p.effects && p.effects.burn;
  parts.burnRing.visible = !!burnOn;
  if (burnOn) {
    const pulse = 0.8 + 0.2 * Math.sin(ud.breathe * 9);
    parts.burnRing.scale.setScalar(pulse);
    parts.burnRing.material.emissiveIntensity = 1.8 + 1.0 * pulse;
  }

  // 隱身：淡化所有皮膚材質 (敵人更透明、自己半透明)
  const invis = p && p.effects && p.effects.invis;
  let targetOp = 1;
  if (invis) targetOp = info.isSelf ? 0.42 : 0.12;
  for (const m of ud.skinMats) {
    m.opacity += (targetOp - m.opacity) * Math.min(1, dt * 10);
  }
}
