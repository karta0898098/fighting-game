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

// 大招通用爆發底：三層擴張環 + 中心爆閃球 + 雙光柱 + 漫天上升光點 + 大震動/閃光。各角色再疊自己的招牌特效。
export function ultimateBurst(ctx, c, opt = {}) {
  const color = opt.color || '#ffffff';
  const R = opt.radius || 150;
  // 三層擴張地環：主色實環 + 白核 + 外擴衝擊波
  ring(ctx, c, { color, from: 16, to: R, life: 0.62, y: 4, alpha: 0.95, ease: true });
  ring(ctx, c, { color: '#ffffff', from: 8, to: R * 0.6, life: 0.46, y: 7, alpha: 0.85 });
  ring(ctx, c, { color, from: R * 0.5, to: R * 1.35, life: 0.72, y: 3, alpha: 0.5, inner: 0.92, ease: true });
  // 中心爆閃球 (亮核 + 彩殼)
  sphereFlash(ctx, c, { color: '#ffffff', from: 6, to: R * 0.34, life: 0.26, alpha: 0.95, detail: 2 });
  sphereFlash(ctx, c, { color, from: 4, to: R * 0.52, life: 0.36, alpha: 0.6 });
  // 衝天光柱 (主柱 + 細白芯)
  if (opt.pillar !== false) {
    pillar(ctx, c, { color, h: opt.pillarH || 160, r: opt.pillarR || 28, taper: 0.35, life: 0.62, alpha: 0.6, grow: 0.6 });
    pillar(ctx, c, { color: '#ffffff', h: (opt.pillarH || 160) * 1.05, r: (opt.pillarR || 28) * 0.42, taper: 0.2, life: 0.5, alpha: 0.5, grow: 0.3 });
  }
  // 漫天上升光點 + 地面放射火星
  column(ctx, c, { color: [color, '#ffffff'], count: opt.count || 40, radius: R * 0.42, speed: 220, life: 0.9, size: 4.5 });
  burst(ctx, c, { color: [color, '#ffffff'], count: 18, speed: 220, up: 40, flat: true, life: 0.5, size: 4 });
  ctx.sceneMgr.addShake(opt.shake ?? 18);
  ctx.sceneMgr.addFlash(opt.flash ?? 0.32, color);
}

function pick(c) {
  if (Array.isArray(c)) return c[(Math.random() * c.length) | 0];
  return c || '#ffffff';
}
