// @ts-nocheck
import * as THREE from 'three';
import { buildArcherWeapon } from './weapon.ts';

export const modelConfig = { bulk: 1.92, weapon: 'bow', skinKind: 'leather', headgear: 'hood' };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat,
    torsoW, torsoD, torsoH,
    shoulderX, hipX, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat,
    darkMat, helmMat, accentHelmMat, darkHelmMat,
    faceGroup, helmAddons, mkLimb, addAccent
  } = ctx;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW, torsoH, torsoD), defaultBodyMat);

  const pack = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.6, torsoH * 0.7, 5), darkMat);
  pack.position.set(-torsoD * 0.5 - 2.2, 0, 0); torso.add(pack);

  const wingMat = reg(mat(base, { transparent: true, opacity: 0.85, emissive: base, ei: 2.0 }));
  for (const sz of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 18, 11), wingMat);
    wing.position.set(-torsoD * 0.5 - 4, torsoH * 0.2, sz * (torsoW * 0.55));
    wing.rotation.y = sz * (Math.PI / 4 + 0.2); wing.rotation.x = sz * 0.2; addAccent(wing);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.5 * bulk, 16, 12), defaultHeadMat);

  const scopeJoint = new THREE.Mesh(new THREE.BoxGeometry(3 * bulk, 3 * bulk, 3 * bulk), darkHelmMat);
  scopeJoint.position.set(frontX - 1.5 * bulk, 2.5 * bulk, -2.2 * bulk); faceGroup.add(scopeJoint);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(1.6 * bulk, 1.6 * bulk, 6 * bulk, 8), helmMat);
  scope.rotation.x = Math.PI / 2; scope.position.set(frontX + 0.6 * bulk, 2.5 * bulk, -2.2 * bulk); faceGroup.add(scope);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(1.4 * bulk, 1.4 * bulk, 0.8 * bulk, 8), accentHelmMat);
  lens.rotation.x = Math.PI / 2; lens.position.set(frontX + 2.8 * bulk, 2.5 * bulk, -2.2 * bulk); faceGroup.add(lens);

  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 2.4), reg(mat(0x00ffcc, { emissive: 0x00ffcc, ei: 2.2 })));
  leftEye.position.set(frontX - 0.4, 1.2, 2.4 * bulk); faceGroup.add(leftEye);

  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * bulk, 0.6 * bulk, 16 * bulk, 8), darkHelmMat);
  ant.position.set(-1.5 * bulk, 9.5 * bulk, -3 * bulk); ant.rotation.z = -0.35; helmAddons.add(ant);

  const armL = mkLimb(0, -shoulderX, true, defaultArmMat, defaultBootMat, base);
  const armR = mkLimb(0, shoulderX, true, defaultArmMat, defaultBootMat, base);
  const legL = mkLimb(0, -hipX, false, defaultBodyMat, defaultBootMat, base);
  const legR = mkLimb(0, hipX, false, defaultBodyMat, defaultBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}

export const buildWeapon = buildArcherWeapon;

export { attachSkinGear } from './gear.ts';
