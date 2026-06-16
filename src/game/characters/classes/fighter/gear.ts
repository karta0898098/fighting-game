// @ts-nocheck
export function attachSkinGear(ctx) {
  const { THREE, baseColor, spineBone, leftHandBone, hipsBone, leftForeArmBone, rightForeArmBone, ud } = ctx;
  // 格鬥家：雙腕金屬護腕
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
      const leftBrace = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.4, 4, 8), goldMat);
      leftBrace.rotation.x = Math.PI / 2;
      leftBrace.position.set(0, 5, 0);
      leftForeArmBone.add(leftBrace);
  
      const rightBrace = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.4, 4, 8), goldMat);
      rightBrace.rotation.x = Math.PI / 2;
      rightBrace.position.set(0, 5, 0);
      rightForeArmBone.add(rightBrace);
}
