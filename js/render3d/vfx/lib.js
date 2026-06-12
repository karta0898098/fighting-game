// 角色特效共用工具庫 (場景座標)。
// 所有函式吃 ctx = { THREE, scene, particles, sceneMgr, addTransient } 與已轉好的場景座標 c={x,y,z}。
// 透過 ctx.addTransient(mesh, maxLife, update(mesh, t)) 產生短生命期發光網格 (t:0->1)。
// 透過 ctx.particles.spawn({...}) 產生 GPU 粒子。

import * as THREE from 'three';

// 以世界 facing 角度求場景平面前進向量 (X=cos, Z=sin)
export function dirFromFacing(f) { return { x: Math.cos(f), z: Math.sin(f) }; }

// 放射狀粒子爆發
export function burst(ctx, c, opt = {}) {
  const n = opt.count || 20;
  const speed = opt.speed || 160;
  const up = opt.up || 0;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const el = (Math.random() * 0.5 + (opt.flat ? 0 : 0.1));
    const spd = speed * (0.45 + Math.random());
    ctx.particles.spawn({
      x: c.x, y: c.y, z: c.z,
      vx: Math.cos(a) * spd, vy: up + spd * el * (opt.flat ? 0 : 1), vz: Math.sin(a) * spd,
      gravity: opt.gravity ?? 220, drag: opt.drag ?? 2.2,
      life: (opt.life || 0.5) * (0.6 + Math.random() * 0.6),
      size: opt.size || (3 + Math.random() * 3),
      color: pick(opt.color), fade: opt.fade !== false,
    });
  }
}

// 前向錐狀噴發 (近戰/拳擊/火花)
export function cone(ctx, c, facing, opt = {}) {
  const d = dirFromFacing(facing);
  const base = Math.atan2(d.z, d.x);
  const spread = opt.spread ?? 0.7;
  const n = opt.count || 16;
  const speed = opt.speed || 240;
  for (let i = 0; i < n; i++) {
    const a = base + (Math.random() * 2 - 1) * spread;
    const spd = speed * (0.5 + Math.random());
    ctx.particles.spawn({
      x: c.x + d.x * (opt.offset || 0), y: c.y + (opt.rise || 0), z: c.z + d.z * (opt.offset || 0),
      vx: Math.cos(a) * spd, vy: (opt.up || 0) + (Math.random() * 2 - 1) * (opt.vspread || 30),
      vz: Math.sin(a) * spd,
      gravity: opt.gravity ?? 160, drag: opt.drag ?? 2.4,
      life: (opt.life || 0.4) * (0.6 + Math.random() * 0.7),
      size: opt.size || (2.5 + Math.random() * 3), color: pick(opt.color), fade: opt.fade !== false,
    });
  }
}

// 上升柱狀粒子 (治療/血怒/光柱)
export function column(ctx, c, opt = {}) {
  const n = opt.count || 24, r = opt.radius || 26;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.random() * r;
    ctx.particles.spawn({
      x: c.x + Math.cos(a) * rr, y: opt.y0 ?? 0, z: c.z + Math.sin(a) * rr,
      vx: 0, vy: (opt.speed || 130) * (0.6 + Math.random() * 0.8), vz: 0,
      gravity: opt.gravity ?? -20, drag: opt.drag ?? 0.6,
      life: (opt.life || 0.7) * (0.6 + Math.random() * 0.6),
      size: opt.size || 3, color: pick(opt.color), fade: opt.fade !== false,
    });
  }
}

// 平鋪地面的擴張環
export function ring(ctx, c, opt = {}) {
  const color = new THREE.Color(pick(opt.color) || '#ffffff');
  const inner = opt.inner ?? 0.78;
  const geo = new THREE.RingGeometry(inner, 1, opt.seg || 48);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(c.x, opt.y ?? 2, c.z);
  const from = opt.from ?? 8, to = opt.to ?? 80;
  ctx.addTransient(m, opt.life || 0.4, (mesh, t) => {
    const r = from + (to - from) * (opt.ease ? 1 - (1 - t) * (1 - t) : t);
    mesh.scale.setScalar(r);
    mesh.material.opacity = (1 - t) * (opt.alpha ?? 0.9);
  });
  m.userData.mat = m.material; m.userData.geo = geo;
}

// 朝天/垂直的擴張環 (球面衝擊感)，繞 X 軸或面向相機
export function sphereFlash(ctx, c, opt = {}) {
  const color = new THREE.Color(pick(opt.color) || '#ffffff');
  const geo = new THREE.IcosahedronGeometry(1, opt.detail ?? 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: opt.alpha ?? 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  m.position.set(c.x, c.y, c.z);
  const from = opt.from ?? 4, to = opt.to ?? 40;
  ctx.addTransient(m, opt.life || 0.22, (mesh, t) => {
    mesh.scale.setScalar(from + (to - from) * t);
    mesh.material.opacity = (1 - t) * (opt.alpha ?? 0.9);
  });
  m.userData.mat = m.material; m.userData.geo = geo;
}

// 垂直光柱
export function pillar(ctx, c, opt = {}) {
  const color = new THREE.Color(pick(opt.color) || '#ffffff');
  const geo = new THREE.CylinderGeometry(opt.r ?? 14, (opt.r ?? 14) * (opt.taper ?? 0.6), opt.h ?? 120, 16, 1, true);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: opt.alpha ?? 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  m.position.set(c.x, (opt.h ?? 120) / 2, c.z);
  ctx.addTransient(m, opt.life || 0.45, (mesh, t) => {
    mesh.material.opacity = (1 - t) * (opt.alpha ?? 0.7);
    mesh.scale.x = mesh.scale.z = 1 + t * (opt.grow ?? 0.4);
  });
  m.userData.mat = m.material; m.userData.geo = geo;
}

// 細長刀光/斬擊 (盒狀，沿 facing)
export function slashBlade(ctx, c, facing, opt = {}) {
  const color = new THREE.Color(pick(opt.color) || '#ffffff');
  const len = opt.len || 80, w = opt.w || 10, h = opt.h || 4;
  const geo = new THREE.BoxGeometry(len, h, w);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const g = new THREE.Group();
  g.position.set(c.x, c.y ?? 22, c.z);
  g.rotation.y = -facing - (opt.swing || 0) * 0.5;
  g.add(m);
  m.position.x = len * 0.45;
  ctx.addTransient(g, opt.life || 0.2, (grp, t) => {
    grp.rotation.y = -facing - (opt.swing || 0) * 0.5 + (opt.swing || 0) * t;
    m.material.opacity = (1 - t) * 0.95;
    grp.scale.setScalar(0.7 + 0.4 * t);
  });
  g.userData.mat = m.material; g.userData.geo = geo;
}

// 旋轉飛行的薄片 (手裏劍/碟)
export function makeSpinPlate(THREE3, color, r) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xdfe6ec, emissive: new THREE.Color(color), emissiveIntensity: 1.4, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide });
  const star = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.3, 4, 8), mat);
  g.add(star);
  return g;
}

export function addShake(ctx, m) { ctx.sceneMgr.addShake(m); }
export function addFlash(ctx, a, color) { ctx.sceneMgr.addFlash(a, color); }

function pick(c) {
  if (Array.isArray(c)) return c[(Math.random() * c.length) | 0];
  return c || '#ffffff';
}
