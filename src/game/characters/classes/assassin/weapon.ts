// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildAssassinWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 刺客：等離子巨刃爪 (Giant Plasma Blades)
        // 手部大型腕部掛載座 (Katar 樣式)
        add(new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), dark), 3, 1, 0);
        // 兩片巨大向外斜的光束利刃
        const bladeL = add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 28, 0.6), accent), 3, 15, -2.5);
        bladeL.rotation.z = 0.08;
        const bladeR = add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 28, 0.6), accent), 3, 15, 2.5);
        bladeR.rotation.z = -0.08;
        // 金屬連接裝甲
        add(new THREE.Mesh(new THREE.BoxGeometry(9, 6, 2.2), steel), 3, 2, 0);
}
