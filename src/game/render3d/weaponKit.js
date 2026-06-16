import * as THREE from 'three';

export function createWeaponKit(hand, ctx) {
  const { base, reg, mat, shade } = ctx;
  const steel = reg(mat(0xb9c4cf, { rough: 0.2, metal: 0.9 }));
  const dark = reg(mat(0x2d3436, { rough: 0.6, metal: 0.5 }));
  const gold = reg(mat(0xffd700, { rough: 0.15, metal: 0.9 }));
  const accent = reg(mat(shade(base, 0.25), { emissive: new THREE.Color(base), ei: 2.8 }));
  const add = (m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    m.castShadow = true;
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    hand.add(m);
    return m;
  };
  return { THREE, hand, base, reg, mat, shade, steel, dark, gold, accent, add };
}
