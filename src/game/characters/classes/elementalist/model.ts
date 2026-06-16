// @ts-nocheck
import * as THREE from 'three';
import { buildElementalistWeapon } from './weapon.ts';

export const modelConfig = { bulk: 2.0, weapon: 'elements', robe: true, skinKind: 'cloth', headgear: 'hood' };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat,
    torsoW, torsoD, torsoH,
    shoulderX, hipX, frontX,
    defaultBodyMat, defaultHeadMat, defaultArmMat, defaultBootMat, defaultAccentMat,
    accentHelmMat, face, faceGroup, helmAddons, mkLimb, addAccent
  } = ctx;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.45, torsoW * 0.65, torsoH, 12), defaultBodyMat);

  const elementArray = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.55, 1.5, 8, 20), defaultAccentMat);
  elementArray.position.set(-torsoD * 0.5 - 4, torsoH * 0.15, 0); elementArray.rotation.y = Math.PI / 2; torso.add(elementArray);

  const wingMat = reg(mat(base, { transparent: true, opacity: 0.85, emissive: base, ei: 2.0 }));
  for (const sz of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 18, 11), wingMat);
    wing.position.set(-torsoD * 0.5 - 4, torsoH * 0.2, sz * (torsoW * 0.55));
    wing.rotation.y = sz * (Math.PI / 4 + 0.2); wing.rotation.x = sz * 0.2; addAccent(wing);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.5 * bulk, 16, 12), defaultHeadMat);

  const crownBase = new THREE.Mesh(new THREE.TorusGeometry(9.5 * bulk, 0.8 * bulk, 8, 20, Math.PI), accentHelmMat);
  crownBase.position.set(-3 * bulk, 3.2 * bulk, 0); crownBase.rotation.y = Math.PI / 2; helmAddons.add(crownBase);
  for (let i = 0; i < 3; i++) {
    const angle = -Math.PI / 4 + (i * Math.PI / 4);
    const star = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 * bulk, 0), accentHelmMat);
    star.position.set(-3.2 * bulk, 3.2 * bulk + Math.sin(angle) * 7.5 * bulk, Math.cos(angle) * 7.5 * bulk); helmAddons.add(star);
  }

  const eyeMat = reg(mat(0xffd700, { emissive: 0xffd700, ei: 2.4 }));
  face.eyeL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 2.2), eyeMat); face.eyeL.position.set(frontX - 0.4, 1.2, -2.2 * bulk);
  face.eyeR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 2.2), eyeMat); face.eyeR.position.set(frontX - 0.4, 1.2, 2.2 * bulk);
  faceGroup.add(face.eyeL); faceGroup.add(face.eyeR);

  const armL = mkLimb(0, -shoulderX, true, defaultArmMat, defaultBootMat, base);
  const armR = mkLimb(0, shoulderX, true, defaultArmMat, defaultBootMat, base);
  const legL = mkLimb(0, -hipX, false, defaultBodyMat, defaultBootMat, base);
  const legR = mkLimb(0, hipX, false, defaultBodyMat, defaultBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}

export const buildWeapon = buildElementalistWeapon;
