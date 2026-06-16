// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildArcherWeapon(hand, ctx) {
  const { THREE, hand: weaponHand, base, reg, mat, shade, steel, dark, gold, accent, add } = createWeaponKit(hand, ctx);
  // 弓箭手：脈衝強襲光束巨弓 (Strike Beam Bow)
        const bowGroup = new THREE.Group();
        // 巨大弧形 mecha 弓翼
        const wingL = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.8, 28, 6), steel);
        wingL.position.set(-8, 12, 0);
        wingL.rotation.z = -0.5;
        bowGroup.add(wingL);
        const wingR = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.8, 28, 6), steel);
        wingR.position.set(-8, -12, 0);
        wingR.rotation.z = 0.5;
        bowGroup.add(wingR);
        
        // 金色弓把
        const grip = new THREE.Mesh(new THREE.BoxGeometry(4, 9, 4), gold);
        grip.position.set(-16, 0, 0);
        bowGroup.add(grip);
        
        // 脈衝能量弦
        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 48, 4), accent);
        string.position.set(-4, 0, 0);
        bowGroup.add(string);
        
        // 巨大發光光束箭
        const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 38, 4), accent);
        arrow.rotation.z = Math.PI / 2;
        arrow.position.set(-2, 0, 0);
        bowGroup.add(arrow);
        
        add(bowGroup, 4, -4, 0, 0, Math.PI / 2, 0);
}
