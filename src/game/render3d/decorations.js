// 場景裝飾物體：依 boss theme 在競技場周圍散佈 (不可互動，純視覺)。
// 使用 InstancedMesh 一次 draw call。
// 種類：tree (圓錐+樹幹) / rock (多面石) / crystal (高瘦多面體) / pillar (殘柱) / brazier (火盆)

import * as THREE from 'three';
import { ARENA } from '../constants.js';

// 在場外環形帶散佈座標 (避開戰鬥區)
function scatterPositions(count, opts = {}) {
  const cx = 0, cz = 0;
  const innerR = opts.inner || ARENA.width * 0.45;   // 場內邊到邊距離 / 2 = 480 (W=960)
  const outerR = opts.outer || ARENA.width * 0.95;
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = innerR + Math.random() * (outerR - innerR);
    pts.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, ang: Math.random() * Math.PI * 2, scale: 0.85 + Math.random() * 0.5 });
  }
  return pts;
}

function makeInstanced(geo, mat, positions, baseScale = 1) {
  const im = new THREE.InstancedMesh(geo, mat, positions.length);
  im.castShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    dummy.position.set(p.x, 0, p.z);
    dummy.rotation.y = p.ang;
    dummy.scale.setScalar(baseScale * p.scale);
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  return im;
}

function buildTrees(theme) {
  const cfg = theme.tree || {};
  const positions = scatterPositions(cfg.count || 26, { inner: 540, outer: 1000 });
  const group = new THREE.Group();
  // 樹幹
  const trunkGeo = new THREE.CylinderGeometry(6, 9, 80, 6);
  trunkGeo.translate(0, 40, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: cfg.trunk || 0x5a3a26, roughness: 0.9 });
  group.add(makeInstanced(trunkGeo, trunkMat, positions));
  // 樹冠
  const crownGeo = new THREE.ConeGeometry(36, 90, 8);
  crownGeo.translate(0, 110, 0);
  const crownMat = new THREE.MeshStandardMaterial({ color: cfg.leaf || 0x3d6b32, roughness: 0.95 });
  group.add(makeInstanced(crownGeo, crownMat, positions));
  return group;
}

function buildRocks(theme) {
  const cfg = theme.rock || {};
  const positions = scatterPositions(cfg.count || 22, { inner: 520, outer: 980 });
  const geo = new THREE.DodecahedronGeometry(22, 0);
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color || 0x6b6660, roughness: 0.95, metalness: 0.05 });
  return makeInstanced(geo, mat, positions);
}

function buildCrystals(theme) {
  const cfg = theme.crystal || {};
  const positions = scatterPositions(cfg.count || 18, { inner: 540, outer: 960 });
  const geo = new THREE.OctahedronGeometry(28, 0);
  geo.scale(0.6, 1.5, 0.6);
  geo.translate(0, 36, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color || 0x74e0ff,
    emissive: cfg.glow || 0x49b0d0, emissiveIntensity: cfg.glowInt != null ? cfg.glowInt : 0.6,
    roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85,
  });
  return makeInstanced(geo, mat, positions);
}

function buildPillars(theme) {
  const cfg = theme.pillar || {};
  const positions = scatterPositions(cfg.count || 12, { inner: 560, outer: 960 });
  const geo = new THREE.CylinderGeometry(14, 18, 130, 8);
  geo.translate(0, 65, 0);
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color || 0x8a7060, roughness: 0.9 });
  // 部分頂部塌掉 (隨機 y 位移模擬殘破)
  const im = new THREE.InstancedMesh(geo, mat, positions.length);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    dummy.position.set(p.x, -Math.random() * 30, p.z);
    dummy.rotation.set(Math.random() * 0.15 - 0.07, p.ang, Math.random() * 0.15 - 0.07);
    dummy.scale.setScalar(p.scale);
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
  }
  im.castShadow = true;
  im.instanceMatrix.needsUpdate = true;
  return im;
}

function buildBraziers(theme) {
  const cfg = theme.brazier || {};
  const positions = scatterPositions(cfg.count || 8, { inner: 540, outer: 720 });
  const group = new THREE.Group();
  const baseGeo = new THREE.CylinderGeometry(12, 16, 30, 8);
  baseGeo.translate(0, 15, 0);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 0.9, metalness: 0.4 });
  group.add(makeInstanced(baseGeo, baseMat, positions));
  // 火焰球 (emissive)
  const flameGeo = new THREE.IcosahedronGeometry(10, 1);
  flameGeo.translate(0, 38, 0);
  const flameMat = new THREE.MeshStandardMaterial({
    color: cfg.flame || 0xff7a3d, emissive: cfg.flameGlow || 0xff5a1f, emissiveIntensity: 2.4,
    transparent: true, opacity: 0.95,
  });
  group.add(makeInstanced(flameGeo, flameMat, positions));
  return group;
}

const BUILDERS = {
  tree: buildTrees,
  rock: buildRocks,
  crystal: buildCrystals,
  pillar: buildPillars,
  brazier: buildBraziers,
};

export function applyDecorations(themeGroup, theme) {
  // 清空現有
  for (let i = themeGroup.children.length - 1; i >= 0; i--) {
    const c = themeGroup.children[i];
    if (c.userData.isDecoration) {
      themeGroup.remove(c);
      if (c.geometry) c.geometry.dispose?.();
      if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach((m) => m.dispose?.());
      if (c.isGroup) c.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.());
      });
    }
  }
  const decos = (theme && theme.decorations) || [];
  for (const kind of decos) {
    const builder = BUILDERS[kind];
    if (!builder) continue;
    const obj = builder(theme);
    obj.userData.isDecoration = true;
    themeGroup.add(obj);
  }
}
