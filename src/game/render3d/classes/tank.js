import * as THREE from 'three';

export function buildTank(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, shoulderY,
    shoulderX, hipX, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat,
    darkMat, helmMat, darkHelmMat,
    faceGroup, helmAddons, mkLimb, addAccent
  } = ctx;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 1.25, torsoH, torsoD * 1.2), defaultBodyMat);

  const core = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.28, torsoW * 0.28, 3, 12), reg(mat(0xffffff, { emissive: 0xffffff, ei: 2.5 })));
  core.rotation.x = Math.PI / 2; core.position.set(0, torsoH * 0.05, torsoD * 0.6 + 1.2); torso.add(core);

  const heavyEngine = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.7, torsoH * 0.7, 10), darkMat);
  heavyEngine.position.set(-torsoD * 0.6 - 4.5, 0, 0); torso.add(heavyEngine);
  const bigNozzle = new THREE.Mesh(new THREE.CylinderGeometry(3, 4.5, 6, 12), reg(mat(0x7f8c8d, { metal: 0.9, rough: 0.1 })));
  bigNozzle.position.set(-torsoD * 0.6 - 5.5, -torsoH * 0.2, 0); bigNozzle.rotation.z = Math.PI / 2 + 0.15; torso.add(bigNozzle);
  const bigFlame = new THREE.Mesh(new THREE.ConeGeometry(2.5, 9, 8), reg(mat(0xff3f00, { emissive: 0xff3f00, ei: 3.0 })));
  bigFlame.position.set(-torsoD * 0.6 - 9.5, -torsoH * 0.35, 0); bigFlame.rotation.z = Math.PI / 2 + 0.15; torso.add(bigFlame);

  const head = new THREE.Mesh(new THREE.BoxGeometry(13.5 * bulk, 13.5 * bulk, 13.5 * bulk), defaultHeadMat);

  const maskMat = reg(mat(shade(base, -0.25), { metal: 0.8, rough: 0.3 }));
  const mask = new THREE.Mesh(new THREE.BoxGeometry(3.5, 9.5 * bulk, 12 * bulk), maskMat);
  mask.position.set(frontX - 1.0, -1.0, 0); faceGroup.add(mask);

  const visorMat = reg(mat(0xff3f00, { emissive: 0xff3f00, ei: 2.8 }));
  const visor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 10 * bulk), visorMat);
  visor.position.set(frontX + 1.0, 1.2, 0); faceGroup.add(visor);

  const topCrest = new THREE.Mesh(new THREE.BoxGeometry(4 * bulk, 8 * bulk, 11 * bulk), helmMat);
  topCrest.position.set(0, 7.5 * bulk, 0); helmAddons.add(topCrest);

  for (const sz of [-1, 1]) {
    const sideShield = new THREE.Mesh(new THREE.BoxGeometry(6 * bulk, 12 * bulk, 3 * bulk), darkHelmMat);
    sideShield.position.set(-1.2 * bulk, 1 * bulk, sz * (8.5 * bulk + 1.0)); helmAddons.add(sideShield);
  }

  const thickW = 6.8 * bulk;
  const armL = mkLimb(0, -shoulderX * 1.2, true, defaultArmMat, defaultBootMat, base, thickW);
  const armR = mkLimb(0, shoulderX * 1.2, true, defaultArmMat, defaultBootMat, base, thickW);
  const legL = mkLimb(0, -hipX * 1.2, false, defaultBodyMat, defaultBootMat, base, thickW + 1.0);
  const legR = mkLimb(0, hipX * 1.2, false, defaultBodyMat, defaultBootMat, base, thickW + 1.0);

  const pSize = torsoW * 0.52;
  const pg = new THREE.BoxGeometry(pSize, pSize * 1.3, pSize * 0.4);
  for (const sz of [-1, 1]) {
    const m = new THREE.Mesh(pg, reg(mat(shade(base, 0.1), { metal: 0.85, rough: 0.2 })));
    m.position.set(0, shoulderY + 1.5, sz * (torsoW * 0.65 + 3.2)); addAccent(m);
  }

  return { torso, head, armL, armR, legL, legR };
}
