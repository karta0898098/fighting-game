// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildNecromancerWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 死靈法師：死神鐮刀
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 56, 8), dark), 3, -2, 0);  // 長桿
        add(new THREE.Mesh(new THREE.TorusGeometry(13, 1.5, 6, 20, Math.PI * 0.9), accent), 3, 26, 0, 0, 0, Math.PI * 0.1); // 彎曲鐮刃(發光)
        add(new THREE.Mesh(new THREE.TorusGeometry(13, 0.6, 6, 20, Math.PI * 0.9), steel), 3.4, 26, 0, 0, 0, Math.PI * 0.1);
        add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), accent), 3, 27, 0);      // 連接處幽綠寶石
}
