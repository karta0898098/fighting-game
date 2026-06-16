// @ts-nocheck
import * as THREE from 'three';
import { buildNinjaWeapon } from './weapon.ts';

export const modelConfig = { bulk: 1.64, weapon: 'kunai', skinKind: 'leather', headgear: 'mask' };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat,
    torsoW, torsoD, torsoH,
    shoulderX, hipX, frontX,
    defaultBodyMat, defaultHeadMat, defaultBootMat,
    accentHelmMat, darkHelmMat,
    faceGroup, helmAddons, mkLimb
  } = ctx;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.8, torsoH, torsoD * 0.75), defaultBodyMat);

  const scroll = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, torsoW * 0.8, 8), reg(mat(0xff0000, { rough: 0.8 })));
  scroll.rotation.z = Math.PI / 4; scroll.position.set(-torsoD * 0.5 - 2, 0, 0); torso.add(scroll);

  const head = new THREE.Mesh(new THREE.ConeGeometry(8.5 * bulk, 15 * bulk, 4), defaultHeadMat);
  head.rotation.y = Math.PI / 4;

  const plate = new THREE.Mesh(new THREE.BoxGeometry(2 * bulk, 3.2 * bulk, 9 * bulk), darkHelmMat);
  plate.position.set(frontX - 0.8 * bulk, 3 * bulk, 0); helmAddons.add(plate);
  const plateGlow = new THREE.Mesh(new THREE.BoxGeometry(0.4 * bulk, 1.8 * bulk, 5 * bulk), accentHelmMat);
  plateGlow.position.set(frontX - 0.6 * bulk, 3 * bulk, 0); helmAddons.add(plateGlow);
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(14 * bulk, 1.6 * bulk, 0.4 * bulk), reg(mat(0xff0000, { rough: 0.8 })));
  ribbon.position.set(-frontX - 2.5 * bulk, 1.2 * bulk, 0); ribbon.rotation.z = -0.3; helmAddons.add(ribbon);

  const visorMat = reg(mat(0xff0033, { emissive: 0xff0033, ei: 2.6 }));
  const visor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 10 * bulk), visorMat);
  visor.position.set(frontX - 0.6, 1.0, 0); faceGroup.add(visor);

  const slimW = 3.8 * bulk;
  const blackLimbMat = reg(mat(0x1e272e, { rough: 0.7, metal: 0.25 }));
  const armL = mkLimb(0, -shoulderX * 0.8, true, blackLimbMat, defaultBootMat, base, slimW);
  const armR = mkLimb(0, shoulderX * 0.8, true, blackLimbMat, defaultBootMat, base, slimW);
  const legL = mkLimb(0, -hipX * 0.8, false, blackLimbMat, defaultBootMat, base, slimW + 0.6);
  const legR = mkLimb(0, hipX * 0.8, false, blackLimbMat, defaultBootMat, base, slimW + 0.6);

  return { torso, head, armL, armR, legL, legR };
}

export const buildWeapon = buildNinjaWeapon;

export { attachSkinGear } from './gear.ts';
