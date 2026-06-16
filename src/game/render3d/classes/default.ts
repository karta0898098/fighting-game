// @ts-nocheck
import * as THREE from 'three';

export function buildDefault(ctx) {
  const {
    base, bulk, cfg, ch, reg, mat,
    torsoW, torsoD, torsoH,
    shoulderX, hipX, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat,
    darkMat, faceGroup, mkLimb
  } = ctx;

  const torso = new THREE.Mesh(
    cfg.robe
      ? new THREE.CylinderGeometry(torsoW * 0.42, torsoW * 0.65, torsoH + 4, 12)
      : new THREE.BoxGeometry(torsoW, torsoH, torsoD),
    defaultBodyMat
  );

  const coreCol = new THREE.Color(base);
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(torsoW * 0.22, torsoW * 0.22, 3, 12),
    reg(mat(coreCol, { metal: 0.8, emissive: coreCol, ei: 2.2 }))
  );
  core.rotation.x = Math.PI / 2;
  core.position.set(0, torsoH * 0.05, torsoD * 0.5 + 1.2);
  torso.add(core);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.8, torsoH * 0.8, 6), darkMat);
  backpack.position.set(-torsoD * 0.5 - 2.8, 0, 0);
  torso.add(backpack);

  let head;
  if (ch.shape === 'triangle') {
    head = new THREE.Mesh(new THREE.ConeGeometry(8.5 * bulk, 15 * bulk, 4), defaultHeadMat);
  } else if (ch.shape === 'square') {
    head = new THREE.Mesh(new THREE.BoxGeometry(13.5 * bulk, 13.5 * bulk, 13.5 * bulk), defaultHeadMat);
  } else {
    head = new THREE.Mesh(new THREE.SphereGeometry(7.5 * bulk, 16, 12), defaultHeadMat);
  }
  if (ch.shape === 'triangle') head.rotation.y = Math.PI / 4;

  const visorMat = reg(mat(0xffea00, { metal: 0.2, rough: 0.1, emissive: 0xffea00, ei: 2.8 }));
  const visor = new THREE.Mesh(new THREE.BoxGeometry(2, 3.2, 11 * bulk), visorMat);
  visor.position.set(frontX - 0.5, 1.2, 0);
  faceGroup.add(visor);

  const armL = mkLimb(0, -shoulderX, true, defaultArmMat, defaultBootMat, base);
  const armR = mkLimb(0, shoulderX, true, defaultArmMat, defaultBootMat, base);
  const legL = mkLimb(0, -hipX, false, defaultBodyMat, defaultBootMat, base);
  const legR = mkLimb(0, hipX, false, defaultBodyMat, defaultBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}
