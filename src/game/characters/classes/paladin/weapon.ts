// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildPaladinWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 聖騎士：黃金聖光戰錘
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 46, 8), dark), 3, -6, 0); // 長柄
        add(new THREE.Mesh(new THREE.BoxGeometry(13, 14, 13), steel), 3, 18, 0);          // 錘頭
        add(new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 4.5), gold), 3, 18, 0);         // 金箍十字
        add(new THREE.Mesh(new THREE.BoxGeometry(4.5, 14, 4.5), gold), 3, 18, 0);
        add(new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 0), accent), 3, 18, 0);     // 發光聖光核心
        add(new THREE.Mesh(new THREE.ConeGeometry(2.2, 8, 6), gold), 3, 27.5, 0);         // 頂尖
}
