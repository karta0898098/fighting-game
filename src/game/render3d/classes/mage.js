import * as THREE from 'three';

export function buildMage(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, hipY, shoulderY, headY,
    shoulderX, hipX, frontX, bodyTex,
    defaultBodyMat, defaultHeadMat, defaultAccentMat,
    goldMat, helmMat, accentHelmMat, darkHelmMat,
    faceGroup, helmAddons, mkLimb, addAccent
  } = ctx;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.45, torsoW * 0.65, torsoH, 12), defaultBodyMat);
  
  const belt = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.55, 1.6, 8, 16), goldMat);
  belt.position.set(0, -torsoH * 0.2, 0); belt.rotation.x = Math.PI / 2; torso.add(belt);

  const arcaneCircle = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.58, 1.2, 8, 24), defaultAccentMat);
  arcaneCircle.position.set(-torsoD * 0.5 - 4, torsoH * 0.1, 0); arcaneCircle.rotation.y = Math.PI / 2; torso.add(arcaneCircle);

  const wingMat = reg(mat(base, { transparent: true, opacity: 0.85, emissive: base, ei: 2.0 }));
  for (const sz of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 18, 11), wingMat);
    wing.position.set(-torsoD * 0.5 - 4, torsoH * 0.2, sz * (torsoW * 0.55));
    wing.rotation.y = sz * (Math.PI / 4 + 0.2); wing.rotation.x = sz * 0.2; addAccent(wing);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.5 * bulk, 16, 12), defaultHeadMat);
  
  const hatCrest = new THREE.Mesh(new THREE.ConeGeometry(7 * bulk, 18 * bulk, 8), darkHelmMat);
  hatCrest.position.set(-1.5 * bulk, 9 * bulk, 0); hatCrest.rotation.x = -0.25; helmAddons.add(hatCrest);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(11.5 * bulk, 1.6 * bulk, 8, 20), helmMat);
  brim.rotation.x = Math.PI / 2; brim.position.set(0, 4 * bulk, 0); helmAddons.add(brim);
  const hatTip = new THREE.Mesh(new THREE.SphereGeometry(2 * bulk, 8, 8), accentHelmMat);
  hatTip.position.set(-3 * bulk, 15 * bulk, 0); helmAddons.add(hatTip);

  const visorMat = reg(mat(0x00ffcc, { emissive: 0x00ffcc, ei: 2.8 }));
  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 11 * bulk), visorMat);
  visor.position.set(frontX - 0.5, 1.2, 0); faceGroup.add(visor);

  const clothArmMat = reg(mat(shade(base, -0.1), { rough: 0.7, metal: 0.1, map: bodyTex }));
  const clothBootMat = reg(mat(shade(base, -0.3), { rough: 0.8, metal: 0.05 }));
  const armL = mkLimb(0, -shoulderX, true, clothArmMat, clothBootMat, base);
  const armR = mkLimb(0, shoulderX, true, clothArmMat, clothBootMat, base);
  const legL = mkLimb(0, -hipX, false, clothArmMat, clothBootMat, base);
  const legR = mkLimb(0, hipX, false, clothArmMat, clothBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}
