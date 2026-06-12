// 投射物與地面範圍區的 3D 物件 (依 id 與 state 同步、簡易池化)
//
// 投射物：一般 = 發光球 + 光暈 (+ 拖尾粒子)；穿透 = 沿速度拉長的亮閃電棒。
// 範圍區：地面發光圓盤 + 外環；delay>0 顯示預警環(填充指示)。
// 座標經 coords 轉場景座標；高度用 PROJECTILE_Y。

import * as THREE from 'three';
import { setVecFromWorld, PROJECTILE_Y } from './coords.js';
import { getVfx } from './vfx/index.js';

export function createEntityLayer(scene, particles, opts = {}) {
  const group = new THREE.Group();
  scene.add(group);
  const addTransient = opts.addTransient || (() => {});
  const sceneMgr = opts.sceneMgr || { addShake() {}, addFlash() {} };

  // 給角色專屬 hook 用的完整 ctx 建構器
  function hookCtx(colorHex) {
    return { THREE, scene, particles, sceneMgr, addTransient, color: new THREE.Color(colorHex) };
  }

  // 共用幾何體
  const sphereGeo = new THREE.IcosahedronGeometry(1, 2);
  const coreGeo = new THREE.IcosahedronGeometry(1, 1);
  const boltGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
  const discGeo = new THREE.CircleGeometry(1, 48);
  const ringGeo = new THREE.RingGeometry(0.84, 1, 48);

  const projMap = new Map(); // id -> { group, core, halo, kind }
  const zoneMap = new Map(); // id -> { group, disc, ring, totalDelay }
  const _v = new THREE.Vector3();

  function syncProjectiles(list, dt) {
    const seen = new Set();
    for (const pr of list) {
      seen.add(pr.id);
      let e = projMap.get(pr.id);
      const vdef = getVfx(pr.vfx);
      const kind = vdef && vdef.projectile ? 'custom:' + pr.vfx : (pr.pierce ? 'bolt' : 'orb');
      if (!e || e.kind !== kind) {
        if (e) disposeProj(e);
        e = makeProj(pr, kind, vdef);
        projMap.set(pr.id, e);
      }
      setVecFromWorld(_v, pr.x, pr.y, PROJECTILE_Y);
      e.group.position.copy(_v);
      if (e.kind.startsWith('custom:')) {
        e.group.rotation.y = -Math.atan2(pr.vy, pr.vx);
        if (e.update) e.update(dt, pr);
      } else if (kind === 'bolt') {
        e.group.rotation.y = -Math.atan2(pr.vy, pr.vx);
        e.core.rotation.x += dt * 30; // 微閃爍
      } else {
        const pulse = 0.85 + 0.15 * Math.sin(performance.now() / 60 + (pr.id % 10));
        e.core.scale.setScalar(pr.radius * pulse);
        e.halo.scale.setScalar(pr.radius * 2.6 * pulse);
        e.core.rotation.y += dt * 4;
        // 拖尾粒子
        particles.spawn({
          x: _v.x, y: _v.y, z: _v.z,
          vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12, vz: (Math.random() - 0.5) * 12,
          life: 0.28 + Math.random() * 0.18, size: pr.radius * 1.5, color: pr.color, drag: 3, fade: true,
        });
      }
    }
    for (const [id, e] of projMap) if (!seen.has(id)) { disposeProj(e); projMap.delete(id); }
  }

  function makeProj(pr, kind, vdef) {
    const color = new THREE.Color(pr.color);
    if (kind.startsWith('custom:')) {
      const obj = vdef.projectile(hookCtx(pr.color), pr);
      const node = obj.object3D || obj;
      group.add(node);
      return { group: node, kind, update: obj.update || node.userData?.update || null, custom: true };
    }
    const g = new THREE.Group();
    if (kind === 'bolt') {
      // 沿 +X 拉長的亮棒
      const len = Math.max(40, pr.radius * 9);
      const mat = new THREE.MeshStandardMaterial({ color: 0xeaffff, emissive: color, emissiveIntensity: 3.2, roughness: 0.3 });
      const core = new THREE.Mesh(boltGeo, mat);
      core.scale.set(pr.radius * 0.9, len, pr.radius * 0.9);
      core.rotation.z = Math.PI / 2; // 圓柱 +Y -> +X
      g.add(core);
      const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
      const halo = new THREE.Mesh(boltGeo, haloMat);
      halo.scale.set(pr.radius * 2.4, len * 0.96, pr.radius * 2.4);
      halo.rotation.z = Math.PI / 2;
      g.add(halo);
      group.add(g);
      return { group: g, core, halo, kind };
    }
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 2.8, roughness: 0.25 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.scale.setScalar(pr.radius);
    g.add(core);
    const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    const halo = new THREE.Mesh(sphereGeo, haloMat);
    halo.scale.setScalar(pr.radius * 2.6);
    g.add(halo);
    group.add(g);
    return { group: g, core, halo, kind };
  }

  function disposeProj(e) {
    group.remove(e.group);
    e.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { Array.isArray(o.material) ? o.material.forEach((m) => m.dispose()) : o.material.dispose(); }
    });
  }

  function syncZones(list, dt) {
    const seen = new Set();
    for (const z of list) {
      seen.add(z.id);
      let e = zoneMap.get(z.id);
      const vdef = getVfx(z.vfx);
      const wantCustom = !!(vdef && vdef.zone);
      const kind = wantCustom ? 'custom:' + z.vfx : 'std';
      if (!e || e.kind !== kind) { if (e) disposeZone(e); e = makeZone(z, kind, vdef); zoneMap.set(z.id, e); }
      setVecFromWorld(_v, z.x, z.y, 1.2);
      e.group.position.copy(_v);
      if (e.custom) {
        if (e.update) e.update(dt, z);
        continue;
      }
      const t = performance.now() / 1000;
      if (z.delay > 0) {
        // 預警：外環依倒數填充 + 警示脈動，圓盤隱藏
        const fill = 1 - z.delay / e.totalDelay;
        e.disc.visible = true;
        e.disc.scale.setScalar(z.radius * (0.4 + 0.6 * fill));
        e.disc.material.opacity = 0.12 + 0.12 * Math.sin(t * 14);
        e.ring.visible = true;
        e.ring.scale.setScalar(z.radius);
        e.ring.material.opacity = 0.5 + 0.4 * Math.sin(t * 14);
      } else {
        e.disc.visible = true;
        e.disc.scale.setScalar(z.radius);
        e.disc.material.opacity = 0.28 + 0.12 * Math.sin(t * 8 + z.id);
        e.ring.visible = true;
        e.ring.scale.setScalar(z.radius * (0.96 + 0.04 * Math.sin(t * 6)));
        e.ring.material.opacity = 0.7;
      }
    }
    for (const [id, e] of zoneMap) if (!seen.has(id)) { disposeZone(e); zoneMap.delete(id); }
  }

  function makeZone(z, kind, vdef) {
    if (kind && kind.startsWith('custom:')) {
      const obj = vdef.zone(hookCtx(z.color), z);
      const node = obj.object3D || obj;
      group.add(node);
      return { group: node, kind, custom: true, update: obj.update || node.userData?.update || null, totalDelay: Math.max(0.0001, z.delay || 0) };
    }
    const g = new THREE.Group();
    const color = new THREE.Color(z.color);
    const discMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    g.add(disc);
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.4;
    g.add(ring);
    group.add(g);
    return { group: g, kind: 'std', disc, ring, totalDelay: Math.max(0.0001, z.delay || 0) };
  }

  function disposeZone(e) {
    group.remove(e.group);
    if (e.custom) {
      e.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { Array.isArray(o.material) ? o.material.forEach((m) => m.dispose()) : o.material.dispose(); }
      });
      return;
    }
    e.disc.material.dispose();
    e.ring.material.dispose();
  }

  function clear() {
    for (const e of projMap.values()) disposeProj(e);
    for (const e of zoneMap.values()) disposeZone(e);
    projMap.clear(); zoneMap.clear();
  }

  return { syncProjectiles, syncZones, clear };
}
