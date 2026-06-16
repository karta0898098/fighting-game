// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildNinjaWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 忍者：量子雷射巨型苦無 (Giant Quantum Kunai)
        // 巨型苦無刀身
        add(new THREE.Mesh(new THREE.ConeGeometry(4.5, 26, 4), accent), 3, 10, 0, 0, 0, Math.PI);
        // 苦無柄
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 12, 8), steel), 3, 20, 0);
        // 尾端金色量子鐵環
        add(new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.8, 6, 10), gold), 3, 26, 0, Math.PI / 2, 0, 0);
}
