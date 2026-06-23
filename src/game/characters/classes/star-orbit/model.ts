// @ts-nocheck
import * as THREE from 'three';
import { buildStarOrbitWeapon } from './weapon.ts';

export const modelConfig = { bulk: 1.92, weapon: 'star-orbit', robe: true, skinKind: 'cloth', headgear: 'hood' };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat, shade,
    torsoW, torsoD, torsoH, frontX,
    defaultBodyMat, defaultHeadMat, defaultBootMat, goldMat,
    face, faceGroup, mkLimb, addAccent,
  } = ctx;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.42, torsoW * 0.62, torsoH + 3, 12), defaultBodyMat);
  const coreMat = reg(mat('#f2f7ff', { emissive: new THREE.Color('#5ad7ff'), ei: 1.8, rough: 0.3, metal: 0.2 }));
  const core = new THREE.Mesh(new THREE.SphereGeometry(torsoW * 0.18, 14, 10), coreMat);
  core.position.set(frontX * 0.42, torsoH * 0.08, 0); torso.add(core);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.34, 1.1, 8, 30), goldMat);
  ring.position.copy(core.position); ring.rotation.y = Math.PI / 2; torso.add(ring);

  const backRingMat = reg(mat('#5ad7ff', { emissive: new THREE.Color('#5ad7ff'), ei: 1.35, rough: 0.28, metal: 0.5 }));
  const backRing = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.74, 1.45, 8, 48), backRingMat);
  backRing.position.set(-torsoD * 0.62, torsoH * 0.18, 0);
  backRing.rotation.y = Math.PI / 2;
  addAccent(backRing);
  const backRing2 = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.54, 0.9, 8, 36), goldMat);
  backRing2.position.set(-torsoD * 0.7, torsoH * 0.18, 0);
  backRing2.rotation.y = Math.PI / 2;
  backRing2.rotation.z = 0.55;
  addAccent(backRing2);

  const shardMat = reg(mat('#5ad7ff', { emissive: new THREE.Color('#5ad7ff'), ei: 1.6, rough: 0.25, metal: 0.45 }));
  const orbitCoreMat = reg(new THREE.MeshBasicMaterial({ color: new THREE.Color('#f2f7ff'), transparent: true, opacity: 0.86 }));
  const orbitGlowMat = reg(new THREE.MeshBasicMaterial({ color: new THREE.Color('#5ad7ff'), transparent: true, opacity: 0.58, blending: THREE.AdditiveBlending, depthWrite: false }));
  const orbitGoldMat = reg(new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd166'), transparent: true, opacity: 0.64, blending: THREE.AdditiveBlending, depthWrite: false }));
  const starOrbitShards = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.TorusGeometry(4.0 * bulk, 1.35 * bulk, 5, 5), i === 2 ? goldMat : shardMat);
    shard.position.set(-torsoD * 0.7 - 2, torsoH * 0.18 + Math.cos(a) * torsoW * 0.25, Math.sin(a) * torsoW * 0.72);
    shard.rotation.set(a, 0.4, a * 0.5);
    addAccent(shard);

    const orb = new THREE.Group();
    const orbCore = new THREE.Mesh(new THREE.SphereGeometry(i === 2 ? 7.2 : 6.2, 14, 10), orbitCoreMat);
    const orbShell = new THREE.Mesh(new THREE.IcosahedronGeometry(i === 2 ? 12.5 : 10.5, 1), i === 2 ? orbitGoldMat : orbitGlowMat);
    const orbRingA = new THREE.Mesh(new THREE.TorusGeometry(i === 2 ? 15 : 12, 0.9, 8, 28), i === 2 ? orbitGoldMat : orbitGlowMat);
    const orbRingB = new THREE.Mesh(new THREE.TorusGeometry(i === 2 ? 18 : 14, 0.75, 8, 30), i === 2 ? orbitGoldMat : orbitGlowMat);
    orbRingA.rotation.x = Math.PI / 2.8;
    orbRingB.rotation.z = Math.PI / 2.6;
    orb.add(orbShell, orbCore, orbRingA, orbRingB);
    orb.userData.starOrbitShard = i;
    orb.visible = false;
    addAccent(orb);
    starOrbitShards.push(orb);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.2 * bulk, 16, 12), defaultHeadMat);
  const eyeMat = reg(mat('#f2f7ff', { emissive: new THREE.Color('#5ad7ff'), ei: 2.6 }));
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 2.3), eyeMat);
    eye.position.set(frontX - 0.2, 0.9, sz * 2.3 * bulk); faceGroup.add(eye);
  }

  const robeMat = reg(mat(shade(base, -0.04), { rough: 0.7, metal: 0.1 }));
  const bootMat = reg(mat(shade(base, -0.32), { rough: 0.78, metal: 0.08 }));
  const armL = mkLimb(0, -ctx.shoulderX, true, robeMat, bootMat, base);
  const armR = mkLimb(0, ctx.shoulderX, true, robeMat, bootMat, base);
  const legL = mkLimb(0, -ctx.hipX, false, robeMat, defaultBootMat, base);
  const legR = mkLimb(0, ctx.hipX, false, robeMat, defaultBootMat, base);

  return { torso, head, armL, armR, legL, legR, starOrbitShards };
}

export const buildWeapon = buildStarOrbitWeapon;
