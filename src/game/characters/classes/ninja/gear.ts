// @ts-nocheck
export function attachSkinGear(ctx) {
  const { THREE, baseColor, spineBone, leftHandBone, hipsBone, leftForeArmBone, rightForeArmBone, ud } = ctx;
  // 忍者：腰後忍卷
      const scrollGroup = new THREE.Group();
      const paperMat = new THREE.MeshStandardMaterial({ color: 0xfdf6e3, roughness: 0.9 });
      const paperMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 11, 8), paperMat);
      paperMesh.rotation.z = Math.PI / 2;
      paperMesh.castShadow = true;
      scrollGroup.add(paperMesh);
  
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, metalness: 0.1, roughness: 0.6 });
      const capGeom = new THREE.CylinderGeometry(1.9, 1.9, 1.5, 8);
      for (const side of [-1, 1]) {
        const cap = new THREE.Mesh(capGeom, woodMat);
        cap.rotation.z = Math.PI / 2;
        cap.position.x = side * 6;
        scrollGroup.add(cap);
      }
  
      const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
      const ribbon = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.2, 6, 12), ribbonMat);
      scrollGroup.add(ribbon);
  
      spineBone.add(scrollGroup);
      scrollGroup.position.set(0, -4, -2.4);
      scrollGroup.scale.setScalar(0.85);
}
