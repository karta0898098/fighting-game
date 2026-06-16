// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildGunnerWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 槍手：雙重型手槍
        const gunMat = reg(mat(0x4a4a4a, { metal: 0.85, rough: 0.25 }));
        for (const sz of [-1, 1]) {
          add(new THREE.Mesh(new THREE.BoxGeometry(14, 4, 2.4), gunMat), 6, 0, sz * 3.4);     // 槍管朝前(+X)
          add(new THREE.Mesh(new THREE.BoxGeometry(4, 7, 2.2), dark), 1, -3.5, sz * 3.4);     // 握把
          add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.8), accent), 12.8, 0.4, sz * 3.4); // 槍口發光
          add(new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 2.0, 8), gold), 3, 0.4, sz * 3.4, Math.PI / 2, 0, 0); // 轉輪
        }
}
