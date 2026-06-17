// 場景裝飾物體：依 boss theme 在競技場「外圍」散佈 (不可互動，純視覺)。
// 使用 InstancedMesh 一次 draw call；每個 instance 有獨立 alpha (aFade)，
// 阻擋玩家視線時自動半透明。
//
// 種類：tree (圓錐+樹幹) / rock (多面石) / crystal (高瘦多面體) / pillar (殘柱) / brazier (火盆)

import * as THREE from 'three';
import { ARENA } from '../constants.js';

// 在競技場「外環」散佈：保證 inner > arena 邊界，避免遮擋玩家
function scatterPositions(count, opts = {}) {
  const halfW = ARENA.width / 2;
  const halfH = ARENA.height / 2;
  const innerR = opts.inner || Math.max(halfW, halfH) * 1.05;
  const outerR = opts.outer || Math.max(halfW, halfH) * 1.7;
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = innerR + Math.random() * (outerR - innerR);
    pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, ang: Math.random() * Math.PI * 2, scale: 0.85 + Math.random() * 0.5 });
  }
  return pts;
}

// 為 InstancedMesh 注入 aFade attribute + shader 修改：實現 per-instance 透明度
function attachFade(im, mat, count) {
  const fadeArr = new Float32Array(count);
  for (let i = 0; i < count; i++) fadeArr[i] = 1;
  const fadeAttr = new THREE.InstancedBufferAttribute(fadeArr, 1);
  im.geometry.setAttribute('aFade', fadeAttr);
  mat.transparent = true;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = 'attribute float aFade;\nvarying float vFade;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvFade = aFade;'
    );
    shader.fragmentShader = 'varying float vFade;\n' + shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      'diffuseColor.a *= vFade;\n#include <opaque_fragment>'
    );
  };
  mat.needsUpdate = true;
  im.userData.fadeAttr = fadeAttr;
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
  attachFade(im, mat, positions.length);
  im.userData.positions = positions;
  return im;
}

function buildTrees(theme) {
  const cfg = theme.tree || {};
  const positions = scatterPositions(cfg.count || 26);
  const group = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(6, 9, 80, 6);
  trunkGeo.translate(0, 40, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: cfg.trunk || 0x5a3a26, roughness: 0.9 });
  group.add(makeInstanced(trunkGeo, trunkMat, positions));
  const crownGeo = new THREE.ConeGeometry(36, 90, 8);
  crownGeo.translate(0, 110, 0);
  const crownMat = new THREE.MeshStandardMaterial({ color: cfg.leaf || 0x3d6b32, roughness: 0.95 });
  group.add(makeInstanced(crownGeo, crownMat, positions));
  group.userData.positions = positions;
  return group;
}

function buildRocks(theme) {
  const cfg = theme.rock || {};
  const positions = scatterPositions(cfg.count || 22);
  const geo = new THREE.DodecahedronGeometry(22, 0);
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color || 0x6b6660, roughness: 0.95, metalness: 0.05 });
  return makeInstanced(geo, mat, positions);
}

function buildCrystals(theme) {
  const cfg = theme.crystal || {};
  const positions = scatterPositions(cfg.count || 18);
  const geo = new THREE.OctahedronGeometry(28, 0);
  geo.scale(0.6, 1.5, 0.6);
  geo.translate(0, 36, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color || 0x74e0ff,
    emissive: cfg.glow || 0x49b0d0, emissiveIntensity: cfg.glowInt != null ? cfg.glowInt : 0.6,
    roughness: 0.2, metalness: 0.1, opacity: 0.85,
  });
  return makeInstanced(geo, mat, positions);
}

function buildPillars(theme) {
  const cfg = theme.pillar || {};
  const positions = scatterPositions(cfg.count || 12);
  const geo = new THREE.CylinderGeometry(14, 18, 130, 8);
  geo.translate(0, 65, 0);
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color || 0x8a7060, roughness: 0.9 });
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
  attachFade(im, mat, positions.length);
  im.userData.positions = positions;
  return im;
}

function buildBraziers(theme) {
  const cfg = theme.brazier || {};
  const positions = scatterPositions(cfg.count || 8, { inner: Math.max(ARENA.width, ARENA.height) / 2 * 1.06, outer: Math.max(ARENA.width, ARENA.height) / 2 * 1.3 });
  const group = new THREE.Group();
  const baseGeo = new THREE.CylinderGeometry(12, 16, 30, 8);
  baseGeo.translate(0, 15, 0);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 0.9, metalness: 0.4 });
  group.add(makeInstanced(baseGeo, baseMat, positions));
  const flameGeo = new THREE.IcosahedronGeometry(10, 1);
  flameGeo.translate(0, 38, 0);
  const flameMat = new THREE.MeshStandardMaterial({
    color: cfg.flame || 0xff7a3d, emissive: cfg.flameGlow || 0xff5a1f, emissiveIntensity: 2.4,
    opacity: 0.95,
  });
  group.add(makeInstanced(flameGeo, flameMat, positions));
  group.userData.positions = positions;
  return group;
}

const BUILDERS = {
  tree: buildTrees,
  rock: buildRocks,
  crystal: buildCrystals,
  pillar: buildPillars,
  brazier: buildBraziers,
};

// ---- 地面圖案：每隻 Boss 不同 (打破方形單調感) ----
//   kinds: 'arcane' 法陣 / 'cracks' 裂縫 / 'hex' 六角網格 / 'rings' 同心圓 / 'flame' 火紋 / 'snowflake' 雪花
function makeFloorPattern(kind, color, scale = 1) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  x.clearRect(0, 0, S, S);
  x.strokeStyle = color || '#ffffff';
  x.fillStyle = color || '#ffffff';
  x.lineCap = 'round';
  const cx = S / 2, cy = S / 2;

  if (kind === 'arcane') {
    x.lineWidth = 6;
    // 三重同心法陣 + 內部六角星
    for (const r of [320, 240, 160]) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke(); }
    x.beginPath();
    for (let i = 0; i < 6; i++) {
      const a1 = i * Math.PI / 3, a2 = (i + 2) * Math.PI / 3;
      x.moveTo(cx + Math.cos(a1) * 200, cy + Math.sin(a1) * 200);
      x.lineTo(cx + Math.cos(a2) * 200, cy + Math.sin(a2) * 200);
    }
    x.stroke();
  } else if (kind === 'cracks') {
    x.lineWidth = 5;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r1 = 80 + Math.random() * 60;
      const r2 = 360 + Math.random() * 80;
      x.beginPath();
      let prev = { x: cx + Math.cos(a) * r1, y: cy + Math.sin(a) * r1 };
      x.moveTo(prev.x, prev.y);
      const segs = 6;
      for (let s = 1; s <= segs; s++) {
        const f = s / segs;
        const ang = a + (Math.random() - 0.5) * 0.35;
        const rr = r1 + (r2 - r1) * f;
        const nx = cx + Math.cos(ang) * rr;
        const ny = cy + Math.sin(ang) * rr;
        x.lineTo(nx, ny); prev = { x: nx, y: ny };
      }
      x.stroke();
    }
  } else if (kind === 'hex') {
    x.lineWidth = 4;
    const step = 80;
    for (let row = -8; row <= 8; row++) {
      for (let col = -8; col <= 8; col++) {
        const ox = cx + col * step + (row % 2 ? step / 2 : 0);
        const oy = cy + row * step * 0.866;
        x.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          const px = ox + Math.cos(a) * 36;
          const py = oy + Math.sin(a) * 36;
          if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
        }
        x.closePath(); x.stroke();
      }
    }
  } else if (kind === 'rings') {
    x.lineWidth = 6;
    for (let i = 0; i < 5; i++) {
      const r = 100 + i * 80;
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
    }
  } else if (kind === 'flame') {
    x.lineWidth = 5;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120);
      const ctrlX = cx + Math.cos(a + 0.3) * 280;
      const ctrlY = cy + Math.sin(a + 0.3) * 280;
      const endX = cx + Math.cos(a) * 380;
      const endY = cy + Math.sin(a) * 380;
      x.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
      x.stroke();
    }
  } else if (kind === 'snowflake') {
    x.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      x.save();
      x.translate(cx, cy); x.rotate(a);
      x.beginPath(); x.moveTo(0, 0); x.lineTo(380, 0); x.stroke();
      for (const offset of [120, 200, 280]) {
        x.beginPath();
        x.moveTo(offset, 0);
        x.lineTo(offset - 30, -30);
        x.moveTo(offset, 0);
        x.lineTo(offset - 30, 30);
        x.stroke();
      }
      x.restore();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildFloorDecal(theme) {
  const dc = theme.floorDecal;
  if (!dc) return null;
  const tex = makeFloorPattern(dc.kind, dc.color, dc.scale);
  const size = Math.max(ARENA.width, ARENA.height) * 0.55;
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, opacity: dc.opacity != null ? dc.opacity : 0.45,
    roughness: 1.0, metalness: 0.0,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.4;
  m.userData.isDecoration = true;
  return m;
}

export function applyDecorations(themeGroup, theme) {
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
  const decoMeshes = [];
  const decos = (theme && theme.decorations) || [];
  for (const kind of decos) {
    const builder = BUILDERS[kind];
    if (!builder) continue;
    const obj = builder(theme);
    obj.userData.isDecoration = true;
    themeGroup.add(obj);
    decoMeshes.push(obj);
  }
  // 地面圖案
  const decal = buildFloorDecal(theme || {});
  if (decal) themeGroup.add(decal);
  themeGroup.userData.decoMeshes = decoMeshes;
}

// 每幀更新所有裝飾的 instance 透明度：阻擋玩家視線時平滑 fade
export function updateDecorationFade(themeGroup, focus, dt) {
  const meshes = themeGroup.userData.decoMeshes;
  if (!meshes || !focus) return;
  const lerpK = Math.min(1, dt * 8);
  for (const node of meshes) {
    const targets = node.isGroup ? node.children : [node];
    for (const im of targets) {
      const positions = im.userData?.positions || node.userData?.positions;
      const fadeAttr = im.userData?.fadeAttr;
      if (!positions || !fadeAttr) continue;
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        // 物件在玩家「鏡頭側」的小區域內 (xz 接近、z 略大代表更靠相機)
        const dx = p.x - focus.x, dz = p.z - focus.z;
        const dist = Math.hypot(dx, dz);
        const inFront = dz > -20;            // 物件在玩家或更靠近相機那一側
        const blocked = inFront && dist < 100;
        const target = blocked ? 0.18 : 1.0;
        const cur = fadeAttr.getX(i);
        fadeAttr.setX(i, cur + (target - cur) * lerpK);
      }
      fadeAttr.needsUpdate = true;
    }
  }
}
