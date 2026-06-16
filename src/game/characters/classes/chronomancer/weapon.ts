// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildChronomancerWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 時空術士：時鐘法杖
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 50, 8), reg(mat(0x2b6c78, { metal: 0.6, rough: 0.3 }))), 3, -3, 0); // 杖身
        add(new THREE.Mesh(new THREE.TorusGeometry(7, 1.0, 8, 24), gold), 3, 25, 0, Math.PI / 2, 0, 0);  // 鐘環
        add(new THREE.Mesh(new THREE.CircleGeometry(6, 20), reg(mat(0xeafdff, { emissive: 0x4dd0e1, ei: 1.4 }))), 3.4, 25, 0, 0, -Math.PI / 2, 0); // 鐘面(發光)
        const clkHand = add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 0.4), accent), 3.7, 25, 0);    // 長指針
        add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.4, 0.4), accent), 3.7, 25, 0, 0, 0, Math.PI / 2); // 短指針
        clkHand.userData = { glow: true };
}
