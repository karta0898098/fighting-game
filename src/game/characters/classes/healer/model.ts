// @ts-nocheck
import * as THREE from 'three';
import { buildHealerWeapon } from './weapon.ts';

export const modelConfig = { bulk: 1.96, weapon: 'orb', robe: true, skinKind: 'cloth', headgear: 'hood' };

export function buildModel(ctx) {
  const {
    base, bulk, reg, mat,
    torsoW, torsoD, torsoH,
    shoulderX, hipX, frontX, bodyTex,
    defaultBodyMat, defaultHeadMat, defaultAccentMat,
    accentHelmMat, faceGroup, helmAddons, mkLimb
  } = ctx;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.45, torsoW * 0.65, torsoH, 12), defaultBodyMat);

  const naniteGen = new THREE.Mesh(new THREE.TorusGeometry(torsoW * 0.5, 1.4, 8, 20), defaultAccentMat);
  naniteGen.position.set(-torsoD * 0.5 - 3, 0, 0); naniteGen.rotation.y = Math.PI / 2; torso.add(naniteGen);

  const head = new THREE.Mesh(new THREE.SphereGeometry(7.5 * bulk, 16, 12), defaultHeadMat);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(8.5 * bulk, 0.9 * bulk, 8, 24), accentHelmMat);
  halo.rotation.x = Math.PI / 2 + 0.15; halo.position.set(-1.2 * bulk, 10.5 * bulk, 0); helmAddons.add(halo);
  const gem = new THREE.Mesh(new THREE.BoxGeometry(1.2 * bulk, 2 * bulk, 1.2 * bulk), accentHelmMat);
  gem.position.set(-1.2 * bulk, 7.5 * bulk, 0); helmAddons.add(gem);

  const visorMat = reg(mat(0xffea00, { metal: 0.9, rough: 0.1, emissive: 0xffea00, ei: 2.4 }));
  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.4, 11 * bulk), visorMat);
  visor.position.set(frontX - 0.5, 1.2, 0); faceGroup.add(visor);

  const whiteArmMat = reg(mat(0xffffff, { rough: 0.6, metal: 0.15, map: bodyTex }));
  const goldBootMat = reg(mat(0xffd700, { metal: 0.85, rough: 0.2 }));
  const armL = mkLimb(0, -shoulderX, true, whiteArmMat, goldBootMat, base);
  const armR = mkLimb(0, shoulderX, true, whiteArmMat, goldBootMat, base);
  const legL = mkLimb(0, -hipX, false, whiteArmMat, goldBootMat, base);
  const legR = mkLimb(0, hipX, false, whiteArmMat, goldBootMat, base);

  return { torso, head, armL, armR, legL, legR };
}

export const buildWeapon = buildHealerWeapon;

export { attachSkinGear } from './gear.ts';
