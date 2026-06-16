// @ts-nocheck
export function attachSkinGear(ctx) {
  const { THREE, baseColor, spineBone, leftHandBone, hipsBone, leftForeArmBone, rightForeArmBone, ud } = ctx;
  // 治療師：腰間金色十字架
      const holyGroup = new THREE.Group();
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.15 });
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.8, 0.7), goldMat);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 0.7), goldMat);
      crossH.position.y = 0.8;
      holyGroup.add(crossV);
      holyGroup.add(crossH);
  
      const rubyMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.5 });
      const ruby = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), rubyMat);
      ruby.position.set(0, 0.8, 0.4);
      holyGroup.add(ruby);
  
      hipsBone.add(holyGroup);
      holyGroup.position.set(3, -2, 0.5);
      holyGroup.rotation.set(0, -Math.PI / 4, 0.25);
      holyGroup.scale.setScalar(0.9);
}
