// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildSamuraiWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 武士：緋紅太刀
        add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 50, 3.6), accent), 3, 18, 0);   // 刀身(發光刃)
        add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 50, 1.2), steel), 3, 18, 0);    // 刀脊
        add(new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.2, 4), gold), 3, -6, 0, 0, Math.PI / 4, 0); // 鍔(方形護手)
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 12, 8), dark), 3, -12, 0); // 柄
}
