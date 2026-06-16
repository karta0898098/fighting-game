// @ts-nocheck
export function attachSkinGear(ctx) {
  const { THREE, baseColor, spineBone, leftHandBone, hipsBone, leftForeArmBone, rightForeArmBone, ud } = ctx;
  // 弓箭手：背後箭筒
      const quiverGroup = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
      const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 1.5, 12, 8), bodyMat);
      bodyMesh.castShadow = true;
      quiverGroup.add(bodyMesh);
  
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
      const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(2, 0.4, 8, 12), goldMat);
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.y = 6;
      quiverGroup.add(rimMesh);
  
      const arrowMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.5 });
      const featherMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.5 });
      for (let i = -1; i <= 1; i++) {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 4), arrowMat);
        shaft.position.set(i * 0.8, 8, 0);
        shaft.rotation.z = i * 0.15;
        quiverGroup.add(shaft);
  
        const feather = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.2), featherMat);
        feather.position.set(i * 0.8, 11, 0);
        quiverGroup.add(feather);
      }
      spineBone.add(quiverGroup);
      quiverGroup.position.set(0, 0, -3.2);
      quiverGroup.rotation.set(0, Math.PI, -0.4);
      quiverGroup.scale.setScalar(0.75);
}
