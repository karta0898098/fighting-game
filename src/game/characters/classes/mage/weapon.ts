// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildMageWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 法師：粒子光束巨砲杖 (Megacannon Staff)
        // 巨型槍炮杖身
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 56, 8), dark), 3, -4, 0);
        // 金色巨砲發射器支架
        add(new THREE.Mesh(new THREE.TorusGeometry(7.2, 1.6, 8, 20), gold), 3, 26, 0);
        add(new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.8, 12, 8), steel), 3, 26, 0);
        // 大型懸浮粒子發光水晶核心
        const crystal = add(new THREE.Mesh(new THREE.IcosahedronGeometry(5.2, 0), accent), 3, 26, 0);
        crystal.userData = { glow: true };
}
