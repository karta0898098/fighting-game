// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildElementalistWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 元素使：感應浮游砲 (Giant Funnels / Bits)
        // 三個感應浮游裝備
        for (let i = 0; i < 3; i++) {
          const funnel = new THREE.Group();
          // 浮游砲本體 (菱形裝甲)
          const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 12, 3.5), steel);
          body.castShadow = true;
          funnel.add(body);
          // 前端發光粒子射口
          const emitter = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 4), accent);
          emitter.position.y = 7.5;
          funnel.add(emitter);
          // 尾端發光推進噴口
          const thruster = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 3, 6), dark);
          thruster.position.y = -7.5;
          funnel.add(thruster);
          
          const o = add(funnel, 4, 0, 0);
          o.userData.orbit = i;
        }
}
