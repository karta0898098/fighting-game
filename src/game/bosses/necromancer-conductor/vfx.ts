// @ts-nocheck
// R6 死靈樂章 技能特效。主題：幽紫／靈綠靈火／亡靈法陣。
// 效能：一次性走粒子池＋自動回收 transient；zone/projectile 只建少量網格。純視覺層。
import * as THREE from 'three';
import { registerVfx } from '../../render3d/vfx/registry.js';
import { burst, ring, column, sphereFlash } from '../../render3d/vfx/lib.js';

const PURPLE = '#7d5fff', SOUL = '#39ff88', LILAC = '#b39dff';
const basicAdd = (color, op) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
const addRing = (color, op = 0.7) => new THREE.Mesh(new THREE.RingGeometry(0.84, 1, 48), basicAdd(color, op));

export function loadVfx() {
  // 靈魂彈：多層綠靈火彈（紫暈＋亮核＋環繞靈火）+ 命中潑散
  registerVfx('boss_necro_bolt', {
    projectile(ctx, pr) {
      const r = (pr.radius || 12) * 1.5;
      const g = new THREE.Group();
      const aura = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5, 14, 10), basicAdd(PURPLE, 0.3)); g.add(aura);
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshStandardMaterial({ color: new THREE.Color(SOUL), emissive: new THREE.Color(SOUL), emissiveIntensity: 1.8, roughness: 0.4, transparent: true, opacity: 0.95 })); g.add(core);
      const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.5, 1), basicAdd('#d9ffe9', 0.95)); g.add(inner);
      const wisps = [];
      for (let i = 0; i < 2; i++) { const w = new THREE.Mesh(new THREE.SphereGeometry(r * 0.3, 8, 6), basicAdd(i ? LILAC : SOUL, 0.85)); g.add(w); wisps.push(w); }
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt; core.rotation.y += dt * 5; core.scale.setScalar(1 + 0.15 * Math.sin(t * 16)); aura.scale.setScalar(1 + 0.1 * Math.sin(t * 9));
          for (let i = 0; i < wisps.length; i++) { const a = t * 7 + i * Math.PI; wisps[i].position.set(Math.cos(a) * r * 1.4, Math.sin(a * 1.3) * r * 0.8, Math.sin(a) * r * 1.4); }
          em -= dt;
          if (em <= 0) { em = 0.025; ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: (Math.random() - 0.5) * 22, vy: (Math.random() - 0.5) * 22, vz: (Math.random() - 0.5) * 22, gravity: 0, drag: 2, life: 0.45, size: 3 + Math.random() * 1.5, color: Math.random() < 0.55 ? PURPLE : SOUL, fade: true }); }
        },
      };
    },
    onHit(ctx, f, c) {
      sphereFlash(ctx, c, { color: SOUL, from: 5, to: 46, life: 0.26, alpha: 0.8 });
      ring(ctx, c, { color: SOUL, from: 4, to: (f.radius || 12) * 3.2, life: 0.36, y: 2, alpha: 0.8, ease: true });
      ring(ctx, c, { color: PURPLE, from: 3, to: (f.radius || 12) * 1.8, life: 0.28, y: 3, alpha: 0.6 });
      burst(ctx, c, { color: [SOUL, PURPLE, LILAC], count: 20, speed: 200, up: 30, life: 0.5, size: 3.4 });
    },
  });

  // 亡者召集：雙層旋轉亡靈法陣 + 升起綠靈
  registerVfx('boss_necro_summon', {
    onCast(ctx, f, c) {
      const { THREE: T, addTransient } = ctx;
      const circ = new T.Mesh(new T.RingGeometry(0.7, 1, 6, 1), basicAdd(SOUL, 0.85)); circ.rotation.x = -Math.PI / 2; circ.position.set(c.x, 2, c.z);
      addTransient(circ, 0.65, (m, t) => { m.scale.setScalar(40 + 95 * t); m.rotation.z += 0.1; m.material.opacity = 0.85 * (1 - t); });
      const circ2 = new T.Mesh(new T.RingGeometry(0.84, 1, 40), basicAdd(PURPLE, 0.7)); circ2.rotation.x = -Math.PI / 2; circ2.position.set(c.x, 2.4, c.z);
      addTransient(circ2, 0.7, (m, t) => { m.scale.setScalar(30 + 110 * t); m.rotation.z -= 0.12; m.material.opacity = 0.7 * (1 - t); });
      for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283; const gh = new T.Mesh(new T.ConeGeometry(8, 26, 6), basicAdd(SOUL, 0.7)); gh.position.set(c.x + Math.cos(a) * 55, 0, c.z + Math.sin(a) * 55); addTransient(gh, 0.7, (m, t) => { m.position.y = 60 * t; m.scale.y = 1 + t; m.material.opacity = 0.7 * (1 - t); }); }
      sphereFlash(ctx, c, { color: SOUL, from: 6, to: 50, life: 0.3, alpha: 0.6 });
      column(ctx, c, { color: [SOUL, PURPLE], count: 24, radius: 85, speed: 170, life: 0.95, size: 4.5 });
      ring(ctx, c, { color: PURPLE, from: 10, to: 140, life: 0.55, y: 2, alpha: 0.6 });
    },
    onHit(ctx, f, c) {
      burst(ctx, c, { color: [SOUL, LILAC], count: 10, speed: 140, up: 40, life: 0.5, size: 3.2 });
    },
  });

  // 亡靈護壁：靈魂護罩圓頂脈動 + 環繞綠紫靈火上升
  registerVfx('boss_necro_shield', {
    onCast(ctx, f, c) {
      const { THREE: T, addTransient } = ctx;
      const dome = new T.Mesh(new T.SphereGeometry(70, 16, 12), basicAdd(LILAC, 0.24)); dome.position.set(c.x, 30, c.z);
      addTransient(dome, 0.7, (m, t) => { m.scale.setScalar(0.6 + 0.5 * Math.min(1, t * 3)); m.material.opacity = 0.28 * (1 - t) * (0.7 + 0.3 * Math.sin(t * 30)); });
      sphereFlash(ctx, c, { color: LILAC, from: 8, to: 80, life: 0.4, alpha: 0.6 });
      ring(ctx, c, { color: PURPLE, from: 6, to: 100, life: 0.5, y: 2, alpha: 0.65 });
      ring(ctx, c, { color: SOUL, from: 4, to: 70, life: 0.4, y: 3, alpha: 0.5 });
      for (let i = 0; i < 28; i++) { const a = Math.random() * 6.283, rr = 40 + Math.random() * 45; ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: 0, z: c.z + Math.sin(a) * rr, vx: 0, vy: 100 + Math.random() * 130, vz: 0, gravity: -30, drag: 0.6, life: 0.6 + Math.random() * 0.4, size: 3.2, color: Math.random() < 0.6 ? SOUL : LILAC, fade: true }); }
    },
  });

  // 安魂彌撒：跟隨的亡靈領域（雙層反轉法陣 + 邊環 + 升騰靈魂）
  registerVfx('boss_necro_ult', {
    onCast(ctx, f, c) {
      sphereFlash(ctx, c, { color: SOUL, from: 8, to: 100, life: 0.4, alpha: 0.75 });
      ring(ctx, c, { color: LILAC, from: 120, to: 16, life: 0.4, y: 4, alpha: 0.7 });
      burst(ctx, c, { color: [SOUL, PURPLE, LILAC], count: 36, speed: 240, up: 70, life: 0.75, size: 4.8 });
      column(ctx, c, { color: [SOUL, LILAC], count: 30, radius: 90, speed: 240, life: 1.0, size: 5 });
      ctx.sceneMgr.addShake(12); ctx.sceneMgr.addFlash(0.2, PURPLE);
    },
    zone(ctx, z) {
      const R = z.radius || 240;
      const g = new THREE.Group();
      const field = new THREE.Mesh(new THREE.CircleGeometry(R, 40), basicAdd(PURPLE, 0.16)); field.rotation.x = -Math.PI / 2; field.position.y = 1; g.add(field);
      const rune = new THREE.Mesh(new THREE.RingGeometry(R * 0.55, R * 0.62, 6, 1), basicAdd(SOUL, 0.5)); rune.rotation.x = -Math.PI / 2; rune.position.y = 1.5; g.add(rune);
      const rune2 = new THREE.Mesh(new THREE.RingGeometry(R * 0.8, R * 0.86, 6, 1), basicAdd(LILAC, 0.45)); rune2.rotation.x = -Math.PI / 2; rune2.position.y = 1.8; g.add(rune2);
      const rim = addRing(SOUL, 0.5); rim.scale.setScalar(R); rim.position.y = 2.1; g.add(rim);
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt; rune.rotation.z += dt * 0.6; rune2.rotation.z -= dt * 0.4;
          rune.material.opacity = 0.4 + 0.16 * Math.sin(t * 3); rune2.material.opacity = 0.35 + 0.14 * Math.sin(t * 2.4 + 1);
          field.material.opacity = 0.13 + 0.06 * Math.sin(t * 2); rim.material.opacity = 0.4 + 0.15 * Math.sin(t * 3.5);
          em -= dt;
          if (em <= 0) { em = 0.035; const a = Math.random() * 6.283, rr = Math.random() * R; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 2, z: g.position.z + Math.sin(a) * rr, vx: 0, vy: 60 + Math.random() * 80, vz: 0, gravity: -16, drag: 0.7, life: 1.0, size: 3.5, color: Math.random() < 0.6 ? SOUL : LILAC, fade: true }); }
        },
      };
    },
  });

  // 死亡演出：亡靈法陣崩解、群魂解放昇天 — 靈爆球閃、六角法陣擴張後收縮、升騰亡靈、靈魂噴泉與昇天粒子
  registerVfx('boss_necro_death', {
    onDeath(ctx, f, c) {
      const { THREE: T, addTransient, sceneMgr, particles } = ctx;
      sceneMgr.addShake(20); sceneMgr.addFlash(0.4, SOUL);
      sphereFlash(ctx, c, { color: SOUL, from: 10, to: 110, life: 0.4, alpha: 0.9 });
      sphereFlash(ctx, c, { color: PURPLE, from: 6, to: 70, life: 0.32, alpha: 0.6 });
      ring(ctx, c, { color: SOUL, from: 16, to: 320, life: 0.7, y: 3, alpha: 0.85, ease: true });
      ring(ctx, c, { color: LILAC, from: 12, to: 240, life: 0.8, y: 2, alpha: 0.65, ease: true });
      // 亡靈法陣崩解：六角法陣先擴張閃光、再收縮淡出
      const sigil = new T.Mesh(new T.RingGeometry(0.55, 1, 6, 1), basicAdd(SOUL, 0.85)); sigil.rotation.x = -Math.PI / 2; sigil.position.set(c.x, 2, c.z);
      addTransient(sigil, 0.9, (m, t) => { const e = t < 0.4 ? t / 0.4 : 1, k = Math.max(0, (t - 0.4) / 0.6); m.scale.setScalar(60 + 150 * e - 120 * k); m.rotation.z += 0.06; m.material.opacity = 0.85 * (1 - k); });
      const sigil2 = new T.Mesh(new T.RingGeometry(0.8, 1, 48), basicAdd(PURPLE, 0.6)); sigil2.rotation.x = -Math.PI / 2; sigil2.position.set(c.x, 2.4, c.z);
      addTransient(sigil2, 1.0, (m, t) => { m.scale.setScalar(40 + 220 * Math.min(1, t / 0.5)); m.material.opacity = 0.6 * (1 - t); });
      // 升騰亡靈（多縷綠紫靈火昇天淡出）
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.283; const gh = new T.Mesh(new T.ConeGeometry(9, 30, 6), basicAdd(i % 2 ? SOUL : LILAC, 0.8)); gh.position.set(c.x + Math.cos(a) * 40, 0, c.z + Math.sin(a) * 40);
        addTransient(gh, 1.1, (m, t) => { m.position.set(c.x + Math.cos(a) * (40 + 30 * t), 10 + 180 * t, c.z + Math.sin(a) * (40 + 30 * t)); m.scale.setScalar(1 + 0.6 * Math.sin(t * 6)); m.material.opacity = 0.8 * (1 - t); });
      }
      column(ctx, c, { color: [SOUL, LILAC], count: 32, radius: 80, speed: 300, life: 1.1, size: 5.5 });
      burst(ctx, c, { color: [SOUL, PURPLE, LILAC], count: 42, speed: 300, up: 100, life: 0.85, size: 5 });
      // 群魂昇天（大量綠紫粒子向上飄散）
      for (let i = 0; i < 54; i++) { const a = Math.random() * 6.283, rr = Math.random() * 160; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 4, z: c.z + Math.sin(a) * rr, vx: (Math.random() - 0.5) * 30, vy: 80 + Math.random() * 150, vz: (Math.random() - 0.5) * 30, gravity: -18, drag: 0.6, life: 1.3 + Math.random() * 0.7, size: 3.5 + Math.random() * 2.5, color: Math.random() < 0.6 ? SOUL : LILAC, fade: true }); }
    },
  });
}
