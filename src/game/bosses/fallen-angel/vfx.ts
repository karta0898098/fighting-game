// @ts-nocheck
// R9 審判之翼 技能特效。主題：聖金白光／暗影紫／審判光柱／光暗對撞。
// 效能：一次性走粒子池＋自動回收 transient；zone 只建少量網格。純視覺層。
import * as THREE from 'three';
import { registerVfx } from '../../render3d/vfx/registry.js';
import { slashBlade, cone, burst, ring, column, sphereFlash } from '../../render3d/vfx/lib.js';

const GOLD = '#f5d76e', LIGHT = '#fff2b0', WHITE = '#ffffff', SHADOW = '#b08cff', DARK = '#3a2c50';
const basicAdd = (color, op) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
const addRing = (color, op = 0.7) => new THREE.Mesh(new THREE.RingGeometry(0.84, 1, 48), basicAdd(color, op));
const addCol = (color, op, r1, r2, h) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 14, 1, true), basicAdd(color, op));

export function loadVfx() {
  // 聖劍光弧：雙層金白聖光斬 + 聖光錐
  registerVfx('boss_angel_slash', {
    onCast(ctx, f, c) {
      slashBlade(ctx, c, f.facing, { color: [WHITE, GOLD], len: (f.range || 140) * 1.15, swing: 1.55, life: 0.32, y: 16, sparkCount: 16, alpha: 0.98 });
      slashBlade(ctx, c, f.facing, { color: [LIGHT, '#ffffff'], len: (f.range || 140) * 0.85, swing: 1.35, life: 0.2, y: 18, sparkCount: 8, alpha: 0.85 });
      cone(ctx, c, f.facing, { color: [GOLD, LIGHT, WHITE], count: 16, speed: 240, spread: 0.55, up: 24, life: 0.45, size: 3.6 });
      ctx.sceneMgr.addFlash(0.12, LIGHT);
    },
  });

  // 靈魂綁定：金色束縛法陣（光暗三角符印雙環）＋ 升騰光暗
  registerVfx('boss_angel_bind', {
    onCast(ctx, f, c) {
      const { THREE: T, addTransient } = ctx;
      const sig = new T.Mesh(new T.RingGeometry(0.62, 1, 3, 1), basicAdd(GOLD, 0.8)); sig.rotation.x = -Math.PI / 2; sig.position.set(c.x, 2, c.z);
      addTransient(sig, 0.6, (m, t) => { m.scale.setScalar(70 * (0.4 + 0.6 * t)); m.rotation.z += 0.06; m.material.opacity = 0.8 * (1 - t); });
      const sig2 = new T.Mesh(new T.RingGeometry(0.62, 1, 3, 1), basicAdd(SHADOW, 0.6)); sig2.rotation.x = -Math.PI / 2; sig2.position.set(c.x, 2.4, c.z); sig2.rotation.z = Math.PI / 3;
      addTransient(sig2, 0.65, (m, t) => { m.scale.setScalar(60 * (0.4 + 0.6 * t)); m.rotation.z -= 0.05; m.material.opacity = 0.6 * (1 - t); });
      ring(ctx, c, { color: GOLD, from: 6, to: 80, life: 0.5, y: 2, alpha: 0.8 });
      ring(ctx, c, { color: SHADOW, from: 4, to: 50, life: 0.4, y: 3, alpha: 0.55 });
      sphereFlash(ctx, c, { color: LIGHT, from: 4, to: 44, life: 0.3, alpha: 0.6 });
      for (let i = 0; i < 20; i++) ctx.particles.spawn({ x: c.x + (Math.random() - 0.5) * 36, y: 0, z: c.z + (Math.random() - 0.5) * 36, vx: 0, vy: 100 + Math.random() * 120, vz: 0, gravity: -20, drag: 0.7, life: 0.65, size: 3.2, color: Math.random() < 0.6 ? GOLD : SHADOW, fade: true });
    },
  });

  // 審判光柱：自天而降的聖光柱（外暈＋亮核＋柱內落羽＋擴張衝擊環）
  registerVfx('boss_angel_judgment', {
    zone(ctx, z) {
      const R = z.radius || 110;
      const g = new THREE.Group();
      const halo = addCol(LIGHT, 0, R * 1.05, R * 0.8, 260); halo.position.y = 130; g.add(halo);
      const col = addCol(GOLD, 0, R * 0.75, R * 0.55, 260); col.position.y = 130; g.add(col);
      const coreCol = addCol(WHITE, 0, R * 0.35, R * 0.22, 260); coreCol.position.y = 130; g.add(coreCol);
      const gring = new THREE.Mesh(new THREE.RingGeometry(R * 0.78, R, 36), basicAdd(LIGHT, 0.6)); gring.rotation.x = -Math.PI / 2; gring.position.y = 1.5; g.add(gring);
      const wave = addRing(WHITE, 0.7); wave.position.y = 2; g.add(wave);
      let t = 0, struck = false, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt; const e = Math.min(1, t / 0.18); const fade = 1 - Math.max(0, (t - 0.3) / 0.5);
          halo.material.opacity = Math.max(0, 0.3 * e * fade); col.material.opacity = Math.max(0, 0.55 * e * fade); coreCol.material.opacity = Math.max(0, 0.85 * e * fade);
          gring.material.opacity = Math.max(0, 0.6 * (1 - t));
          wave.scale.setScalar(R * (0.3 + t * 1.6)); wave.material.opacity = Math.max(0, 0.7 * (1 - t * 1.4));
          em -= dt; if (em <= 0 && t < 0.5) { em = 0.03; const a = Math.random() * 6.283, rr = Math.random() * R * 0.6; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 200, z: g.position.z + Math.sin(a) * rr, vx: 0, vy: -260 - Math.random() * 120, vz: 0, gravity: 0, drag: 0.4, life: 0.7, size: 3.4, color: Math.random() < 0.6 ? GOLD : LIGHT, fade: true }); }
          if (!struck && t > 0.04) { struck = true; column(ctx, { x: g.position.x, y: 0, z: g.position.z }, { color: [GOLD, WHITE], count: 26, radius: R * 0.5, speed: 260, life: 0.75, size: 4.5 }); ctx.sceneMgr.addFlash(0.16, LIGHT); ctx.sceneMgr.addShake(8); }
        },
      };
    },
  });

  // 光暗審判：聖光與暗影對撞總爆發（光暗雙柱＋暗影上捲＋交替擴張環＋周圍審判光柱）
  registerVfx('boss_angel_ult', {
    onCast(ctx, f, c) {
      const { THREE: T, addTransient } = ctx;
      sphereFlash(ctx, c, { color: WHITE, from: 10, to: 130, life: 0.46, alpha: 0.98 });
      ring(ctx, c, { color: GOLD, from: 18, to: 280, life: 0.7, y: 5, alpha: 0.92, ease: true });
      ring(ctx, c, { color: SHADOW, from: 12, to: 240, life: 0.8, y: 3, alpha: 0.75, ease: true });
      ring(ctx, c, { color: WHITE, from: 8, to: 160, life: 0.5, y: 6, alpha: 0.8 });
      const pillarG = addCol(GOLD, 0.0, 60, 90, 320); pillarG.position.set(c.x, 160, c.z);
      addTransient(pillarG, 0.9, (m, t) => { const e = Math.min(1, t / 0.18); const fade = 1 - Math.max(0, (t - 0.4) / 0.5); m.material.opacity = Math.max(0, 0.55 * e * fade); m.scale.y = 0.4 + e; m.rotation.y += 0.04; });
      const pillarW = addCol(WHITE, 0.0, 26, 40, 320); pillarW.position.set(c.x, 160, c.z);
      addTransient(pillarW, 0.85, (m, t) => { const e = Math.min(1, t / 0.18); const fade = 1 - Math.max(0, (t - 0.4) / 0.5); m.material.opacity = Math.max(0, 0.85 * e * fade); m.scale.y = 0.4 + e; });
      const shadowSwirl = addCol(SHADOW, 0.0, 90, 60, 200); shadowSwirl.position.set(c.x, 100, c.z);
      addTransient(shadowSwirl, 0.8, (m, t) => { m.material.opacity = Math.max(0, 0.5 * (1 - t)); m.scale.setScalar(1 + t * 0.6); m.rotation.y -= 0.06; });
      burst(ctx, c, { color: [GOLD, WHITE], count: 30, speed: 300, up: 90, life: 0.75, size: 5.2 });
      burst(ctx, c, { color: [SHADOW, DARK], count: 24, speed: 260, up: 60, flat: true, life: 0.75, size: 4.8 });
      column(ctx, c, { color: [WHITE, GOLD], count: 36, radius: 100, speed: 300, life: 1.0, size: 5.2 });
      for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.5, rr = 150; const sp = addCol(GOLD, 0.0, 28, 18, 240); sp.position.set(c.x + Math.cos(a) * rr, 120, c.z + Math.sin(a) * rr); addTransient(sp, 0.7, (m, t) => { const e = Math.min(1, t / 0.15); const fade = 1 - Math.max(0, (t - 0.3) / 0.4); m.material.opacity = Math.max(0, 0.5 * e * fade); m.scale.y = 0.5 + e; }); }
      ctx.sceneMgr.addShake(22); ctx.sceneMgr.addFlash(0.36, LIGHT);
    },
  });

  // 死亡演出：羽翼崩散・聖光昇華 — 光暗總爆、自天而降審判光柱、頭頂光環昇天、光羽碎裂飛散與飄落
  registerVfx('boss_angel_death', {
    onDeath(ctx, f, c) {
      const { THREE: T, addTransient, sceneMgr, particles } = ctx;
      sceneMgr.addShake(24); sceneMgr.addFlash(0.5, LIGHT);
      sphereFlash(ctx, c, { color: '#ffffff', from: 12, to: 140, life: 0.42, alpha: 0.98 });
      sphereFlash(ctx, c, { color: SHADOW, from: 8, to: 80, life: 0.3, alpha: 0.6 });
      ring(ctx, c, { color: GOLD, from: 18, to: 340, life: 0.7, y: 4, alpha: 0.92, ease: true });
      ring(ctx, c, { color: SHADOW, from: 12, to: 260, life: 0.8, y: 3, alpha: 0.7, ease: true });
      ring(ctx, c, { color: WHITE, from: 8, to: 180, life: 0.5, y: 6, alpha: 0.8 });
      // 自天而降的審判光柱（外暈＋金柱＋亮核）
      const halo = addCol(LIGHT, 0, 90, 70, 320); halo.position.set(c.x, 160, c.z);
      addTransient(halo, 1.0, (m, t) => { const e = Math.min(1, t / 0.18), fade = 1 - Math.max(0, (t - 0.5) / 0.5); m.material.opacity = Math.max(0, 0.4 * e * fade); m.scale.y = 0.4 + e; });
      const beam = addCol(GOLD, 0, 50, 36, 320); beam.position.set(c.x, 160, c.z);
      addTransient(beam, 0.95, (m, t) => { const e = Math.min(1, t / 0.16), fade = 1 - Math.max(0, (t - 0.45) / 0.5); m.material.opacity = Math.max(0, 0.6 * e * fade); m.scale.y = 0.4 + e; });
      const beamCore = addCol('#ffffff', 0, 22, 16, 320); beamCore.position.set(c.x, 160, c.z);
      addTransient(beamCore, 0.9, (m, t) => { const e = Math.min(1, t / 0.14), fade = 1 - Math.max(0, (t - 0.4) / 0.5); m.material.opacity = Math.max(0, 0.9 * e * fade); m.scale.y = 0.4 + e; });
      // 頭頂光環擴張昇天
      const halo2 = new T.Mesh(new T.TorusGeometry(40, 5, 8, 40), basicAdd(GOLD, 0.9)); halo2.rotation.x = -Math.PI / 2; halo2.position.set(c.x, 90, c.z);
      addTransient(halo2, 1.1, (m, t) => { m.position.y = 90 + 120 * t; m.scale.setScalar(1 + t * 1.5); m.material.opacity = 0.9 * (1 - t); });
      // 羽翼碎裂：光羽碎片拋物線飛散
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * 6.283 + Math.random() * 0.3;
        const fr = new T.Mesh(new T.TetrahedronGeometry(8), new T.MeshStandardMaterial({ color: new T.Color(LIGHT), emissive: new T.Color(GOLD), emissiveIntensity: 1.4, metalness: 0.3, roughness: 0.2, transparent: true, opacity: 0.95 })); fr.position.set(c.x, c.y + 20, c.z);
        const d = 150 + Math.random() * 120, up = 80 + Math.random() * 120;
        addTransient(fr, 1.1, (m, t) => { m.position.set(c.x + Math.cos(a) * d * t, c.y + 20 + up * t - 140 * t * t, c.z + Math.sin(a) * d * t); m.rotation.x += 0.2; m.rotation.y += 0.24; m.material.opacity = 0.92 * (1 - t * t); });
      }
      column(ctx, c, { color: [WHITE, GOLD], count: 36, radius: 100, speed: 320, life: 1.1, size: 5.5 });
      burst(ctx, c, { color: [GOLD, WHITE, LIGHT], count: 44, speed: 340, up: 110, life: 0.9, size: 5.5 });
      burst(ctx, c, { color: [SHADOW, DARK], count: 24, speed: 240, up: 40, flat: true, life: 0.8, size: 5 });
      // 飄落光羽
      for (let i = 0; i < 44; i++) { const a = Math.random() * 6.283, rr = Math.random() * 180; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 160 + Math.random() * 80, z: c.z + Math.sin(a) * rr, vx: (Math.random() - 0.5) * 24, vy: -30 - Math.random() * 30, vz: (Math.random() - 0.5) * 24, gravity: 10, drag: 1.4, life: 1.4 + Math.random() * 0.7, size: 3.5 + Math.random() * 2.5, color: Math.random() < 0.6 ? LIGHT : GOLD, fade: true }); }
    },
  });
}
