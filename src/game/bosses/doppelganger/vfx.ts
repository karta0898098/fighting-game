// @ts-nocheck
// R10 另一個自己 技能特效。主題：虛空黑／星光白／終焉靛光／鏡面碎裂。
// 效能：一次性走粒子池＋自動回收 transient；zone 只建少量網格。純視覺層。
import * as THREE from 'three';
import { registerVfx } from '../../render3d/vfx/registry.js';
import { slashBlade, cone, burst, ring, column, sphereFlash } from '../../render3d/vfx/lib.js';

const STAR = '#e8e8f0', AURA = '#c9c0ff', WHITE = '#ffffff', VOID = '#1a0a2a';
const basicAdd = (color, op) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
const addRing = (color, op = 0.6) => new THREE.Mesh(new THREE.RingGeometry(0.84, 1, 48), basicAdd(color, op));

export function loadVfx() {
  // 虛空裂斬：雙層星光白裂斬（外白內虛空）+ 星光錐
  registerVfx('boss_doppel_slash', {
    onCast(ctx, f, c) {
      slashBlade(ctx, c, f.facing, { color: [WHITE, AURA], len: (f.range || 150) * 1.15, swing: 1.45, life: 0.3, y: 16, sparkCount: 16, alpha: 0.98 });
      slashBlade(ctx, c, f.facing, { color: [STAR, VOID], len: (f.range || 150) * 0.85, swing: 1.3, life: 0.2, y: 18, sparkCount: 8, alpha: 0.85 });
      cone(ctx, c, f.facing, { color: [STAR, AURA, WHITE], count: 16, speed: 260, spread: 0.55, up: 22, life: 0.42, size: 3.6 });
      burst(ctx, c, { color: [STAR, AURA], count: 14, speed: 230, up: 30, life: 0.45, size: 3.4 });
    },
  });

  // 鏡像複製：鏡面碎裂（玻璃漣漪 + 飛散白色碎片 + 強閃）
  registerVfx('boss_doppel_mirror', {
    onCast(ctx, f, c) {
      const { THREE: T, addTransient } = ctx;
      sphereFlash(ctx, c, { color: WHITE, from: 6, to: 64, life: 0.26, alpha: 0.95 });
      ring(ctx, c, { color: STAR, from: 8, to: 150, life: 0.45, y: 2, alpha: 0.8, ease: true });
      ring(ctx, c, { color: AURA, from: 6, to: 100, life: 0.34, y: 3, alpha: 0.6 });
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * 6.283;
        const shard = new T.Mesh(new T.TetrahedronGeometry(9), new T.MeshStandardMaterial({ color: new T.Color(STAR), emissive: new T.Color(AURA), emissiveIntensity: 1.5, metalness: 0.6, roughness: 0.15, transparent: true, opacity: 0.95 }));
        shard.position.set(c.x, c.y, c.z);
        addTransient(shard, 0.55, (m, t) => { const d = 130 * t; m.position.set(c.x + Math.cos(a) * d, c.y + 14 * Math.sin(t * 3), c.z + Math.sin(a) * d); m.rotation.x += 0.24; m.rotation.y += 0.22; m.material.opacity = 0.92 * (1 - t); });
      }
      ctx.sceneMgr.addFlash(0.2, AURA);
    },
  });

  // 竊取絕技：螺旋向內虹吸 + 收縮符印 + 白光脈衝
  registerVfx('boss_doppel_steal', {
    onCast(ctx, f, c) {
      const { THREE: T, addTransient } = ctx;
      sphereFlash(ctx, c, { color: AURA, from: 8, to: 80, life: 0.4, alpha: 0.7 });
      for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, rr = 70 + Math.random() * 110; ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: 6 + Math.random() * 40, z: c.z + Math.sin(a) * rr, vx: -Math.cos(a) * 200 - Math.sin(a) * 110, vy: 6, vz: -Math.sin(a) * 200 + Math.cos(a) * 110, gravity: 0, drag: 1, life: 0.6, size: 3.2, color: Math.random() < 0.5 ? STAR : AURA, fade: true }); }
      const glyph = new T.Mesh(new T.RingGeometry(0.6, 1, 6, 1), basicAdd(STAR, 0.8)); glyph.rotation.x = -Math.PI / 2; glyph.position.set(c.x, 4, c.z);
      addTransient(glyph, 0.5, (m, t) => { m.scale.setScalar(130 * (1 - 0.8 * t) + 10); m.rotation.z += 0.2; m.material.opacity = 0.8 * (1 - t); });
      ring(ctx, c, { color: AURA, from: 130, to: 14, life: 0.42, y: 2, alpha: 0.75 });
      ctx.sceneMgr.addFlash(0.16, AURA);
    },
  });

  // 終焉之刻：虛空＋星光的終末總爆發領域（奇點核＋雙層反轉星環＋週期衝擊波）
  registerVfx('boss_doppel_ult', {
    onCast(ctx, f, c) {
      sphereFlash(ctx, c, { color: WHITE, from: 10, to: 140, life: 0.48, alpha: 0.99 });
      ring(ctx, c, { color: STAR, from: 18, to: 340, life: 0.75, y: 4, alpha: 0.92, ease: true });
      ring(ctx, c, { color: AURA, from: 12, to: 280, life: 0.85, y: 3, alpha: 0.72, ease: true });
      ring(ctx, c, { color: WHITE, from: 8, to: 180, life: 0.55, y: 6, alpha: 0.8 });
      column(ctx, c, { color: [WHITE, AURA], count: 44, radius: 120, speed: 340, life: 1.15, size: 5.2 });
      burst(ctx, c, { color: [STAR, AURA, WHITE], count: 40, speed: 320, up: 90, life: 0.85, size: 5.2 });
      ctx.sceneMgr.addShake(26); ctx.sceneMgr.addFlash(0.42, AURA);
    },
    zone(ctx, z) {
      const R = z.radius || 320;
      const g = new THREE.Group();
      const field = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(VOID), transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false })); field.rotation.x = -Math.PI / 2; field.position.y = 0.6; g.add(field);
      const core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.1, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(VOID), transparent: true, opacity: 0.92 })); core.position.y = R * 0.12; g.add(core);
      const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(R * 0.16, 16, 12), basicAdd(AURA, 0.4)); coreGlow.position.y = R * 0.12; g.add(coreGlow);
      const star = new THREE.Mesh(new THREE.RingGeometry(R * 0.5, R * 0.56, 6, 1), basicAdd(AURA, 0.6)); star.rotation.x = -Math.PI / 2; star.position.y = 1.2; g.add(star);
      const star2 = new THREE.Mesh(new THREE.RingGeometry(R * 0.66, R * 0.72, 6, 1), basicAdd(STAR, 0.5)); star2.rotation.x = -Math.PI / 2; star2.position.y = 1.5; g.add(star2);
      const rimRing = new THREE.Mesh(new THREE.RingGeometry(R * 0.9, R, 56), basicAdd(STAR, 0.55)); rimRing.rotation.x = -Math.PI / 2; rimRing.position.y = 1.8; g.add(rimRing);
      const wave = addRing(AURA, 0.6); wave.position.y = 2.1; g.add(wave);
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt; star.rotation.z += dt * 1.2; star2.rotation.z -= dt * 0.9; rimRing.material.opacity = 0.4 + 0.18 * Math.sin(t * 4);
          field.material.opacity = 0.32 + 0.12 * Math.sin(t * 2); coreGlow.scale.setScalar(1 + 0.15 * Math.sin(t * 5)); core.scale.setScalar(1 + 0.08 * Math.sin(t * 7));
          const cyc = t % 1.2; wave.scale.setScalar(R * (0.3 + cyc * 0.9)); wave.material.opacity = Math.max(0, 0.5 * (1 - cyc / 1.2));
          em -= dt;
          if (em <= 0) { em = 0.03; const a = Math.random() * 6.283, rr = Math.random() * R; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 2, z: g.position.z + Math.sin(a) * rr, vx: 0, vy: 60 + Math.random() * 100, vz: 0, gravity: -14, drag: 0.6, life: 1.0, size: 3.5, color: Math.random() < 0.5 ? STAR : AURA, fade: true }); }
        },
      };
    },
  });

  // 死亡演出：終焉之神三階段湮滅 — ① 鏡面碎裂 → ② 奇點塌縮 → ③ 終焉總爆發（星光湮滅）
  registerVfx('boss_doppel_death', {
    onDeath(ctx, f, c) {
      const { THREE: T, addTransient, sceneMgr, particles } = ctx;
      // ── 階段 0：鏡面碎裂（即時） ──
      sceneMgr.addShake(20); sceneMgr.addFlash(0.4, WHITE);
      sphereFlash(ctx, c, { color: WHITE, from: 10, to: 90, life: 0.3, alpha: 0.95 });
      ring(ctx, c, { color: STAR, from: 10, to: 180, life: 0.45, y: 3, alpha: 0.8, ease: true });
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 6.283; const sh = new T.Mesh(new T.TetrahedronGeometry(10), new T.MeshStandardMaterial({ color: new T.Color(STAR), emissive: new T.Color(AURA), emissiveIntensity: 1.5, metalness: 0.6, roughness: 0.15, transparent: true, opacity: 0.95 })); sh.position.set(c.x, c.y + 16, c.z);
        const d = 120 + Math.random() * 100; addTransient(sh, 0.6, (m, t) => { m.position.set(c.x + Math.cos(a) * d * t, c.y + 16 + 40 * Math.sin(t * 3), c.z + Math.sin(a) * d * t); m.rotation.x += 0.3; m.rotation.y += 0.26; m.material.opacity = 0.92 * (1 - t); });
      }
      // ── 階段 1：奇點塌縮（~0.49s 後） ──
      const t1 = new T.Object3D(); t1.position.set(c.x, 0, c.z); let f1 = false;
      addTransient(t1, 0.7, (m, t) => {
        if (f1 || t < 0.7) return; f1 = true; sceneMgr.addShake(14);
        const core = new T.Mesh(new T.SphereGeometry(10, 16, 12), new T.MeshBasicMaterial({ color: new T.Color(VOID), transparent: true, opacity: 0 })); core.position.set(c.x, 34, c.z);
        addTransient(core, 0.7, (mm, tt) => { mm.material.opacity = tt < 0.5 ? tt / 0.5 : 1 - (tt - 0.5) / 0.5; mm.scale.setScalar(1 + tt * 2.5); });
        const cg = new T.Mesh(new T.SphereGeometry(14, 16, 12), basicAdd(AURA, 0)); cg.position.set(c.x, 34, c.z);
        addTransient(cg, 0.7, (mm, tt) => { mm.material.opacity = (tt < 0.5 ? tt / 0.5 : 1 - (tt - 0.5) / 0.5) * 0.55; mm.scale.setScalar(1 + tt * 3); });
        for (let k = 0; k < 3; k++) { const rg = new T.Mesh(new T.RingGeometry(0.84, 1, k === 0 ? 6 : 48), basicAdd(k % 2 ? AURA : STAR, 0.8)); rg.rotation.x = -Math.PI / 2; rg.position.set(c.x, 3 + k * 2, c.z); addTransient(rg, 0.5, (mm, tt) => { mm.scale.setScalar((320 - 70 * k) * (1 - 0.85 * tt) + 12); mm.rotation.z += 0.05 * (k + 1); mm.material.opacity = 0.8 * (1 - tt * 0.6); }); }
        for (let i = 0; i < 50; i++) { const a = Math.random() * 6.283, rr = 130 + Math.random() * 150; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 6 + Math.random() * 60, z: c.z + Math.sin(a) * rr, vx: -Math.cos(a) * 300 - Math.sin(a) * 140, vy: -8, vz: -Math.sin(a) * 300 + Math.cos(a) * 140, gravity: 0, drag: 0.9, life: 0.5, size: 3 + Math.random() * 1.6, color: Math.random() < 0.5 ? STAR : AURA, fade: true }); }
      });
      // ── 階段 2：終焉總爆發（~1.1s 後） ──
      const t2 = new T.Object3D(); t2.position.set(c.x, 0, c.z); let f2 = false;
      addTransient(t2, 1.3, (m, t) => {
        if (f2 || t < 0.85) return; f2 = true; sceneMgr.addShake(30); sceneMgr.addFlash(0.6, WHITE);
        sphereFlash(ctx, c, { color: '#ffffff', from: 16, to: 200, life: 0.5, alpha: 1.0 });
        sphereFlash(ctx, c, { color: AURA, from: 10, to: 120, life: 0.36, alpha: 0.75 });
        ring(ctx, c, { color: STAR, from: 20, to: 420, life: 0.85, y: 4, alpha: 0.95, ease: true });
        ring(ctx, c, { color: AURA, from: 14, to: 320, life: 0.95, y: 3, alpha: 0.75, ease: true });
        ring(ctx, c, { color: WHITE, from: 10, to: 220, life: 0.6, y: 6, alpha: 0.85 });
        const pil = new T.Mesh(new T.CylinderGeometry(40, 64, 400, 16, 1, true), basicAdd(AURA, 0)); pil.position.set(c.x, 200, c.z);
        addTransient(pil, 1.0, (mm, tt) => { const e = Math.min(1, tt / 0.18), fade = 1 - Math.max(0, (tt - 0.5) / 0.5); mm.material.opacity = Math.max(0, 0.6 * e * fade); mm.scale.y = 0.4 + e; mm.rotation.y += 0.04; });
        const pilC = new T.Mesh(new T.CylinderGeometry(16, 26, 400, 12, 1, true), basicAdd('#ffffff', 0)); pilC.position.set(c.x, 200, c.z);
        addTransient(pilC, 0.95, (mm, tt) => { const e = Math.min(1, tt / 0.16), fade = 1 - Math.max(0, (tt - 0.45) / 0.5); mm.material.opacity = Math.max(0, 0.95 * e * fade); mm.scale.y = 0.4 + e; });
        column(ctx, c, { color: [WHITE, AURA], count: 50, radius: 130, speed: 380, life: 1.2, size: 6 });
        burst(ctx, c, { color: [STAR, AURA, WHITE], count: 60, speed: 420, up: 120, life: 1.0, size: 6 });
        for (let i = 0; i < 60; i++) { const a = Math.random() * 6.283, rr = Math.random() * 220; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 4, z: c.z + Math.sin(a) * rr, vx: (Math.random() - 0.5) * 30, vy: 70 + Math.random() * 150, vz: (Math.random() - 0.5) * 30, gravity: -12, drag: 0.6, life: 1.5 + Math.random() * 0.8, size: 3 + Math.random() * 2.5, color: Math.random() < 0.5 ? STAR : AURA, fade: true }); }
      });
    },
  });
}
