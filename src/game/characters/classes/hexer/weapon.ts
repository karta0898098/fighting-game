// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildHexerWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 咒術師：詛咒法杖 (骷髏 + 紫晶)
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 52, 8), dark), 3, -2, 0);
        add(new THREE.Mesh(new THREE.IcosahedronGeometry(4.4, 0), reg(mat(0xe8e2d0, { rough: 0.5 }))), 3, 26, 0); // 骷髏(近似)
        add(new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.8, 6, 18), accent), 3, 26, 0, Math.PI / 2, 0, 0);       // 環繞符環
        const hexGem = add(new THREE.Mesh(new THREE.OctahedronGeometry(3.2, 0), accent), 3, 33.5, 0);
        hexGem.userData = { glow: true };
}
