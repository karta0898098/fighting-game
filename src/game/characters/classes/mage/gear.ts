// @ts-nocheck
export function attachSkinGear(ctx) {
  const { THREE, baseColor, spineBone, leftHandBone, hipsBone, leftForeArmBone, rightForeArmBone, ud } = ctx;
  // 法師：左手浮空法術書
      const bookGroup = new THREE.Group();
      const coverMat = new THREE.MeshStandardMaterial({ color: 0x4a148c, roughness: 0.6 });
      const cover = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.4, 5.8), coverMat);
      cover.castShadow = true;
      bookGroup.add(cover);
  
      const pagesMat = new THREE.MeshStandardMaterial({ color: 0xfffdd0, roughness: 0.9 });
      const pages = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 5.4), pagesMat);
      pages.position.y = 0.05;
      pages.position.x = 0.15;
      bookGroup.add(pages);
  
      const magicMat = new THREE.MeshStandardMaterial({ color: baseColor, emissive: baseColor, emissiveIntensity: 2.2 });
      const magicOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), magicMat);
      magicOrb.position.set(0, 1.2, 0);
      bookGroup.add(magicOrb);
  
      leftHandBone.add(bookGroup);
      bookGroup.position.set(-3.2, 2.5, 1);
      bookGroup.rotation.set(0.4, -0.2, 0.4);
      bookGroup.scale.setScalar(0.8);
      ud.skin.floatingItem = bookGroup;
}
