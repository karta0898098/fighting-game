// @ts-nocheck
import * as THREE from 'three';
import { buildAssassinWeapon } from './weapon.ts';

export const modelConfig = { bulk: 1.64, weapon: 'daggers', skinKind: 'leather', headgear: 'hood' };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat,
    torsoW, torsoD, torsoH,
    shoulderX, hipX, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat,
    darkMat, accentHelmMat, darkHelmMat,
    face, faceGroup, helmAddons, mkLimb
  } = ctx;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.85, torsoH, torsoD * 0.8), defaultBodyMat);

  const pack = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.5, torsoH * 0.6, 4), darkMat);
  pack.position.set(-torsoD * 0.4 - 1.8, 0, 0); torso.add(pack);

  const microFireMat = reg(mat(0xe056fd, { emissive: 0xe056fd, ei: 2.2 }));
  for (const sz of [-1, 1]) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 2.5, 8), darkMat);
    nozzle.position.set(-torsoD * 0.4 - 2.8, -torsoH * 0.1, sz * torsoW * 0.18); nozzle.rotation.z = Math.PI / 2 + 0.15; torso.add(nozzle);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.6, 3, 8), microFireMat);
    flame.position.set(-torsoD * 0.4 - 4.8, -torsoH * 0.18, sz * torsoW * 0.18); flame.rotation.z = Math.PI / 2 + 0.15; torso.add(flame);
  }

  const head = new THREE.Mesh(new THREE.ConeGeometry(8.5 * bulk, 15 * bulk, 4), defaultHeadMat);
  head.rotation.y = Math.PI / 4;

  const eyeMat = reg(mat(0xe056fd, { emissive: 0xe056fd, ei: 2.5 }));
  face.eyeL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 2.0), eyeMat); face.eyeL.position.set(frontX - 1.2, 1.0, -2.0 * bulk);
  face.eyeR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 2.0), eyeMat); face.eyeR.position.set(frontX - 1.2, 1.0, 2.0 * bulk);
  faceGroup.add(face.eyeL); faceGroup.add(face.eyeR);

  for (const sz of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(1.4 * bulk, 16 * bulk, 4), darkHelmMat);
    fin.position.set(-5 * bulk, 4 * bulk, sz * 3 * bulk); fin.rotation.set(0.4 * sz, 0, -1.0); helmAddons.add(fin);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.5 * bulk, 12 * bulk, 0.5 * bulk), accentHelmMat);
    edge.position.set(-5.2 * bulk, 4.2 * bulk, sz * 3 * bulk); edge.rotation.set(0.4 * sz, 0, -1.0); helmAddons.add(edge);
  }

  const slimW = 3.6 * bulk;
  const armL = mkLimb(0, -shoulderX * 0.85, true, defaultArmMat, defaultBootMat, base, slimW);
  const armR = mkLimb(0, shoulderX * 0.85, true, defaultArmMat, defaultBootMat, base, slimW);
  const legL = mkLimb(0, -hipX * 0.85, false, defaultBodyMat, defaultBootMat, base, slimW + 0.8);
  const legR = mkLimb(0, hipX * 0.85, false, defaultBodyMat, defaultBootMat, base, slimW + 0.8);

  return { torso, head, armL, armR, legL, legR };
}

export const buildWeapon = buildAssassinWeapon;
