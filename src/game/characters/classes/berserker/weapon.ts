// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildBerserkerWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 狂戰士：雙重熱能巨斧 (Twin Heat Tomahawks)
        // 巨型斧柄
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 52, 8), dark), 3, -10, 0);
        // 巨大雙刃高熱發光斧面
        const bladeL = add(new THREE.Mesh(new THREE.BoxGeometry(11, 24, 1.6), accent), 3, 10, 5.5);
        const bladeR = add(new THREE.Mesh(new THREE.BoxGeometry(11, 24, 1.6), accent), 3, 10, -5.5);
        // 斧頭主體結構 (鋼製)
        add(new THREE.Mesh(new THREE.BoxGeometry(7, 18, 9), steel), 3, 10, 0);
        // 金色金屬箍與頂部發光尖刺
        add(new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 5, 8), gold), 3, 10, 0);
        add(new THREE.Mesh(new THREE.ConeGeometry(2.0, 9, 6), steel), 3, 20, 0);
}
