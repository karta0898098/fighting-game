// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildSummonerWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 召喚師：浮空魔導書 + 環繞靈球
        const bookMat = reg(mat(0x0e6b5a, { rough: 0.5, metal: 0.2 }));
        add(new THREE.Mesh(new THREE.BoxGeometry(3, 9, 11), bookMat), 4, 2, 0);             // 書本
        add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 8, 9.6), reg(mat(0xeafff8, { emissive: 0x4fe0c0, ei: 1.2 }))), 5, 2, 0); // 書頁發光
        for (let i = 0; i < 3; i++) { // 三顆環繞靈球 (animateModel 依 orbit 公轉)
          const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 0), accent);
          orb.castShadow = true; orb.position.set(4, 2, 0); hand.add(orb);
          orb.userData.orbit = i;
        }
}
