// @ts-nocheck
import { createWeaponKit } from '../../../render3d/weaponKit.js';

export function buildStarOrbitWeapon(hand, ctx) {
  const { THREE, reg, mat, gold, add } = createWeaponKit(hand, ctx);
  const blue = reg(mat('#5ad7ff', { emissive: '#5ad7ff', ei: 1.7, rough: 0.25, metal: 0.45 }));
  const white = reg(mat('#f2f7ff', { emissive: '#5ad7ff', ei: 1.2, rough: 0.3, metal: 0.25 }));
  const dark = reg(mat('#16202f', { emissive: '#0b1d2a', ei: 0.3, rough: 0.42, metal: 0.65 }));
  add(new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.4, 24, 12), dark), 8, 8, 0, 0, 0, Math.PI / 2);
  add(new THREE.Mesh(new THREE.CylinderGeometry(4.6, 3.0, 9, 16), blue), 20, 8, 0, 0, 0, Math.PI / 2);
  add(new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.95, 8, 30), gold), 16, 8, 0, Math.PI / 2, 0, 0);
  add(new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.75, 5, 5), white), 22.8, 8, 0, Math.PI / 2, 0.2, 0);
  add(new THREE.Mesh(new THREE.SphereGeometry(3.6, 12, 10), white), 24, 8, 0);
}
