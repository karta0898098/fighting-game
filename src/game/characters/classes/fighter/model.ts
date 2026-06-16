// @ts-nocheck
import * as THREE from 'three';
import { buildFighterWeapon } from './weapon.ts';

export const modelConfig = { bulk: 2.1, weapon: 'gloves', skinKind: 'skin', headgear: 'band' };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat,
    torsoW, torsoD, torsoH,
    shoulderX, hipX, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat, defaultAccentMat,
    darkHelmMat, helmMat, face, faceGroup, helmAddons, mkLimb
  } = ctx;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.95, torsoH, torsoD * 0.9), defaultBodyMat);

  const sunRing = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.52, 1.8, 8, 24), defaultAccentMat);
  sunRing.position.set(-torsoD * 0.5 - 2.2, torsoH * 0.1, 0); sunRing.rotation.y = Math.PI / 2; torso.add(sunRing);

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.5 * bulk, 16, 12), defaultHeadMat);

  const band = new THREE.Mesh(new THREE.TorusGeometry(11.5 * bulk, 1.4 * bulk, 6, 24), darkHelmMat);
  band.rotation.x = Math.PI / 2; band.position.set(0, 3 * bulk, 0); helmAddons.add(band);
  for (const sz of [-1, 1]) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.9 * bulk, 0.9 * bulk, 10 * bulk, 8), helmMat);
    tube.position.set(-2.5 * bulk, 0.6 * bulk, sz * 6 * bulk); tube.rotation.set(0, 0, -0.6); helmAddons.add(tube);
  }

  const eyeMat = reg(mat(0x00ffcc, { emissive: 0x00ffcc, ei: 2.2 }));
  face.eyeL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 2.4), eyeMat); face.eyeL.position.set(frontX - 0.4, 1.2, -2.4 * bulk); face.eyeL.rotation.z = -0.22;
  face.eyeR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 2.4), eyeMat); face.eyeR.position.set(frontX - 0.4, 1.2, 2.4 * bulk); face.eyeR.rotation.z = -0.22;
  faceGroup.add(face.eyeL); faceGroup.add(face.eyeR);

  const armL = mkLimb(0, -shoulderX, true, defaultArmMat, defaultBootMat, base);
  const armR = mkLimb(0, shoulderX, true, defaultArmMat, defaultBootMat, base);
  const legL = mkLimb(0, -hipX, false, defaultBodyMat, defaultBootMat, base);
  const legR = mkLimb(0, hipX, false, defaultBodyMat, defaultBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}

export const buildWeapon = buildFighterWeapon;

export { attachSkinGear } from './gear.ts';
