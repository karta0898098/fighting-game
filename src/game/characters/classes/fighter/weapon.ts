// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildFighterWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 格鬥家：火箭噴射動力鋼拳 (Heavy Rocket Gauntlets)
        // 巨大鋼拳護套 (覆蓋手部)
        const glove = add(new THREE.Mesh(new THREE.BoxGeometry(11, 11, 11), dark), 3, -1, 0);
        // 火箭噴射口 (手背)
        const nozzle = add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.5, 4, 8), steel), -3.5, -1, 0);
        nozzle.rotation.z = -Math.PI / 2;
        const flame = add(new THREE.Mesh(new THREE.ConeGeometry(1.2, 6, 8), reg(mat(0xff4500, { emissive: 0xff4500, ei: 2.2 }))), -7.5, -1, 0);
        flame.rotation.z = -Math.PI / 2;
        
        // 拳面巨大金色撞擊角
        for (let i = -1; i <= 1; i++) {
          add(new THREE.Mesh(new THREE.ConeGeometry(2.0, 5.5, 4), gold), 9.2, -1, i * 3.2, 0, 0, -Math.PI / 2);
        }
        // 護拳發光能量飾條
        add(new THREE.Mesh(new THREE.BoxGeometry(11.4, 2.6, 11.4), accent), 3, 3, 0);
}
