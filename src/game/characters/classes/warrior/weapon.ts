// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildWarriorWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 戰士：巨型光束大劍 (Giant Beam Saber)
        // 巨大發光光束刃
        const blade = add(new THREE.Mesh(new THREE.BoxGeometry(4.5, 48, 1.6), accent), 4, 12, 0);
        // 劍身側翼裝甲 (鋼製)
        add(new THREE.Mesh(new THREE.BoxGeometry(5.2, 10, 0.8), steel), 4, 2, 0);
        // 金色裝甲護手
        add(new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 10), gold), 4, -12.5, 0);
        // 重型劍柄
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 16, 8), dark), 4, -22.5, 0);
        // 劍柄配重發光核心
        add(new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), accent), 4, -31, 0);
}
