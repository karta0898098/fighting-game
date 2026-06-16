// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildTankWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 坦克：重裝鋼彈巨型防禦盾 (Gundam Mega Shield)
        // 巨大盾牌主體：重型厚裝甲板 (幾乎覆蓋半身)
        add(new THREE.Mesh(new THREE.BoxGeometry(4.5, 42, 28), steel), 5, -2, 0);
        // 盾面裝甲飾條
        add(new THREE.Mesh(new THREE.BoxGeometry(5.0, 44, 3.5), gold), 5, -2, 14);
        add(new THREE.Mesh(new THREE.BoxGeometry(5.0, 44, 3.5), gold), 5, -2, -14);
        add(new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.5, 31), gold), 5, 19, 0);
        add(new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.5, 31), gold), 5, -23, 0);
        // 盾面中央發光的巨型反應堆徽記
        add(new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), accent), 7.2, -2, 0);
}
