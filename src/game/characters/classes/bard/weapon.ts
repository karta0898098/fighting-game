// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildBardWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 吟遊詩人：魯特琴
        const woodMat = reg(mat(0x8a5a2b, { rough: 0.6, metal: 0.1 }));
        add(new THREE.Mesh(new THREE.SphereGeometry(7, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), woodMat), 3, 0, 0, Math.PI, 0, 0); // 琴身(半球)
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 22, 8), woodMat), 3, 13, 0);  // 琴頸
        add(new THREE.Mesh(new THREE.BoxGeometry(3, 4, 2.2), dark), 3, 25, 0);                 // 琴頭
        add(new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.4, 6, 16), gold), 4.4, 1, 0, Math.PI / 2, 0, 0); // 音孔
        for (let i = -1; i <= 1; i++) add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 22, 4), accent), 4.2, 13, i * 1.2); // 琴弦發光
}
