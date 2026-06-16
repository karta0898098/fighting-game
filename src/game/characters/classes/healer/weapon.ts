// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildHealerWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 治療師：奈米修復十字巨杖 (Nanite Cross Staff)
        // 巨型權杖把手
        add(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 52, 8), steel), 3, -6, 0);
        // 頂部巨型十字架裝飾
        const scepterHead = new THREE.Group();
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.5, 14, 1.5), gold);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(9, 1.5, 1.5), gold);
        crossH.position.y = 3.2;
        scepterHead.add(crossV);
        scepterHead.add(crossH);
        // 旋繞十字架的大型奈米發光環
        const ring = new THREE.Mesh(new THREE.TorusGeometry(8, 0.8, 8, 24), accent);
        ring.position.y = 3.2;
        scepterHead.add(ring);
        // 頂部中心神聖水晶
        const holyGem = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), accent);
        holyGem.position.set(0, 3.2, 0);
        scepterHead.add(holyGem);
        add(scepterHead, 3, 25, 0);
}
