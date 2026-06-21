// @ts-nocheck
// R8 虛空大魔導 技能特效。主題：虛空紫／星雲／符文金／奇點黑洞。
// 效能：一次性走粒子池＋自動回收 transient；zone 只建少量網格。純視覺層。
import * as THREE from 'three';
import { registerVfx } from '../../render3d/vfx/registry.js';
import { burst, ring, sphereFlash } from '../../render3d/vfx/lib.js';

const VOID = '#8e44ad', LILAC = '#c39bff', NEB = '#b14fd8', GOLD = '#ffd86a', DARK = '#1a0a2a';
const basicAdd = (color, op) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });

export function loadVfx() {
  // 虛空彈：多層虛空球（星雲暈＋暗核＋亮心５金色事件視界環）+ 命中潑散
  registerVfx('boss_void_bolt', {
    projectile(ctx, pr) {
      const r = (pr.radius || 14) * 1.5;
      const g = new THREE.Group();
      const aura = new THREE.Mesh(new THREE.SphereGeometry(r * 1.6, 14, 10), basicAdd(NEB, 0.3)); g.add(aura);
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshStandardMaterial({ color: new THREE.Color(DARK), emissive: new THREE.Color(NEB), emissiveIntensity: 1.6, roughness: 0.4, transparent: true, opacity: 0.96 })); g.add(core);
      const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.5, 1), basicAdd(LILAC, 0.9)); g.add(inner);
      const horizon = new THREE.Mesh(new THREE.TorusGeometry(r * 1.35, r * 0.12, 8, 22), basicAdd(GOLD, 0.7)); horizon.rotation.x = Math.PI / 2.4; g.add(horizon);
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt; core.rotation.y += dt * 5; core.rotation.x += dt * 3; core.scale.setScalar(1 + 0.14 * Math.sin(t * 16));
          horizon.rotation.z += dt * 4; aura.scale.setScalar(1 + 0.1 * Math.sin(t * 9));
          em -= dt;
          if (em <= 0) { em = 0.025; const a = Math.random() * 6.283; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * r, y: g.position.y, z: g.position.z + Math.sin(a) * r, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18, vz: (Math.random() - 0.5) * 18, gravity: 0, drag: 2, life: 0.45, size: 2.8 + Math.random() * 1.5, color: Math.random() < 0.5 ? LILAC : NEB, fade: true }); }
        },
      };
    },
    onHit(ctx, f, c) {
      sphereFlash(ctx, c, { color: LILAC, from: 5, to: 46, life: 0.26, alpha: 0.8 });
      ring(ctx, c, { color: LILAC, from: 4, to: (f.radius || 14) * 3.2, life: 0.36, y: 2, alpha: 0.8, ease: true });
      ring(ctx, c, { color: GOLD, from: 3, to: (f.radius || 14) * 1.6, life: 0.26, y: 3, alpha: 0.55 });
      burst(ctx, c, { color: [VOID, LILAC, NEB], count: 20, speed: 200, up: 30, life: 0.5, size: 3.4 });
    },
  });

  // 混沌符咒：大範圍雙層反轉符文 + 細環 + 上升符文星塵
  registerVfx('boss_void_scramble', {
    onCast(ctx, f, c) {
      const { THREE: T, addTransient } = ctx;
      const R = f.radius || 320;
      const sigil = new T.Mesh(new T.RingGeometry(0.66, 1, 6, 1), basicAdd(GOLD, 0.7)); sigil.rotation.x = -Math.PI / 2; sigil.position.set(c.x, 2, c.z);
      addTransient(sigil, 0.7, (m, t) => { m.scale.setScalar(R * (0.2 + 0.8 * t)); m.rotation.z += 0.18; m.material.opacity = 0.7 * (1 - t); });
      const sigil2 = new T.Mesh(new T.RingGeometry(0.5, 1, 6, 1), basicAdd(LILAC, 0.6)); sigil2.rotation.x = -Math.PI / 2; sigil2.position.set(c.x, 2.4, c.z);
      addTransient(sigil2, 0.75, (m, t) => { m.scale.setScalar(R * (0.1 + 0.6 * t)); m.rotation.z -= 0.22; m.material.opacity = 0.6 * (1 - t); });
      const circ = new T.Mesh(new T.RingGeometry(0.92, 1, 48), basicAdd(NEB, 0.55)); circ.rotation.x = -Math.PI / 2; circ.position.set(c.x, 2.8, c.z);
      addTransient(circ, 0.7, (m, t) => { m.scale.setScalar(R * (0.3 + 0.7 * t)); m.material.opacity = 0.55 * (1 - t); });
      ring(ctx, c, { color: NEB, from: 20, to: R, life: 0.6, y: 3, alpha: 0.6, ease: true });
      sphereFlash(ctx, c, { color: LILAC, from: 8, to: 90, life: 0.36, alpha: 0.65 });
      for (let i = 0; i < 24; i++) { const a = Math.random() * 6.283, rr = Math.random() * R * 0.5; ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: 2, z: c.z + Math.sin(a) * rr, vx: 0, vy: 60 + Math.random() * 90, vz: 0, gravity: -12, drag: 0.7, life: 0.7, size: 3, color: Math.random() < 0.5 ? GOLD : LILAC, fade: true }); }
    },
  });

  // 奇點黑洞：暗核 + 金色光子環 + 雙吸積盤 + 螺旋吸入粒子
  registerVfx('boss_void_blackhole', {
    zone(ctx, z) {
      const R = z.radius || 200;
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.18, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(DARK), transparent: true, opacity: 0.95 })); core.position.y = R * 0.2; g.add(core);
      const photon = new THREE.Mesh(new THREE.TorusGeometry(R * 0.2, R * 0.025, 8, 32), basicAdd(GOLD, 0.85)); photon.rotation.x = Math.PI / 2.2; photon.position.y = R * 0.2; g.add(photon);
      const disk = new THREE.Mesh(new THREE.RingGeometry(R * 0.22, R * 0.6, 40), basicAdd(NEB, 0.55)); disk.rotation.x = -Math.PI / 2.2; disk.position.y = R * 0.2; g.add(disk);
      const disk2 = new THREE.Mesh(new THREE.RingGeometry(R * 0.3, R * 0.5, 40), basicAdd(LILAC, 0.4)); disk2.rotation.x = -Math.PI / 2.6; disk2.position.y = R * 0.2; g.add(disk2);
      const rimRing = new THREE.Mesh(new THREE.RingGeometry(R * 0.92, R, 44), basicAdd(VOID, 0.35)); rimRing.rotation.x = -Math.PI / 2; rimRing.position.y = 1; g.add(rimRing);
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt; disk.rotation.z += dt * 2.4; disk2.rotation.z -= dt * 1.6; photon.rotation.z += dt * 3;
          core.scale.setScalar(1 + 0.1 * Math.sin(t * 6)); photon.material.opacity = 0.6 + 0.25 * Math.sin(t * 8);
          rimRing.material.opacity = 0.28 + 0.12 * Math.sin(t * 3);
          em -= dt;
          if (em <= 0) { em = 0.022; const a = Math.random() * 6.283, rr = R * (0.8 + Math.random() * 0.2), inward = 200, tang = 120; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 2 + Math.random() * 36, z: g.position.z + Math.sin(a) * rr, vx: -Math.cos(a) * inward - Math.sin(a) * tang, vy: 18, vz: -Math.sin(a) * inward + Math.cos(a) * tang, gravity: 0, drag: 0.8, life: 0.55, size: 3 + Math.random() * 1.2, color: Math.random() < 0.5 ? LILAC : NEB, fade: true }); }
        },
      };
    },
  });

  // 時光倒流：紫金時空漣漪（多環向內收回 + 收縮鐘盤符文 + 反向螺旋星塵）
  registerVfx('boss_void_ult', {
    onCast(ctx, f, c) {
      const { THREE: T, addTransient } = ctx;
      const R = f.radius || 150;
      for (let k = 0; k < 5; k++) {
        const rp = new T.Mesh(new T.RingGeometry(0.9, 1, 48), basicAdd(k % 2 ? LILAC : NEB, 0.8)); rp.rotation.x = -Math.PI / 2; rp.position.set(c.x, 3 + k, c.z);
        addTransient(rp, 0.75, (m, t) => { const tt = Math.min(1, t / 0.75); m.scale.setScalar(R * (1.1 - 0.95 * tt) + 6); m.material.opacity = 0.8 * (1 - tt * 0.5); });
      }
      const clock = new T.Mesh(new T.RingGeometry(0.6, 1, 12, 1), basicAdd(GOLD, 0.75)); clock.rotation.x = -Math.PI / 2; clock.position.set(c.x, 8, c.z);
      addTransient(clock, 0.8, (m, t) => { m.scale.setScalar(R * (1.0 - 0.8 * t) + 8); m.rotation.z -= 0.3; m.material.opacity = 0.75 * (1 - t * 0.6); });
      sphereFlash(ctx, c, { color: GOLD, from: 6, to: 80, life: 0.4, alpha: 0.75 });
      for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, rr = R * (0.5 + Math.random() * 0.6); ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: 4, z: c.z + Math.sin(a) * rr, vx: -Math.cos(a) * 180 - Math.sin(a) * 90, vy: 30, vz: -Math.sin(a) * 180 + Math.cos(a) * 90, gravity: 0, drag: 1, life: 0.65, size: 3.4, color: Math.random() < 0.5 ? LILAC : GOLD, fade: true }); }
      ctx.sceneMgr.addShake(13); ctx.sceneMgr.addFlash(0.22, NEB);
    },
  });

  // 死亡演出：奇點塌縮 → 虛空炸裂（兩階段）。先暗核成形、星塵向內吸入、符文環內塌；約 0.42s 後虛空總爆發
  registerVfx('boss_void_death', {
    onDeath(ctx, f, c) {
      const { THREE: T, addTransient, sceneMgr, particles } = ctx;
      sceneMgr.addShake(24); sceneMgr.addFlash(0.44, NEB);
      // 階段一：暗核 + 星暈（成形後內爆）
      const core = new T.Mesh(new T.SphereGeometry(8, 16, 12), new T.MeshBasicMaterial({ color: new T.Color(DARK), transparent: true, opacity: 0 })); core.position.set(c.x, 30, c.z);
      addTransient(core, 1.3, (m, t) => { if (t < 0.4) { m.material.opacity = t / 0.4; m.scale.setScalar(1 + t * 2); } else { const k = (t - 0.4) / 0.6; m.material.opacity = 1 - k; m.scale.setScalar(3 * (1 + k * 2)); } });
      const glow = new T.Mesh(new T.SphereGeometry(10, 16, 12), basicAdd(LILAC, 0)); glow.position.set(c.x, 30, c.z);
      addTransient(glow, 1.3, (m, t) => { if (t < 0.4) { m.material.opacity = 0.5 * (t / 0.4); m.scale.setScalar(1 + t * 2.5); } else { const k = (t - 0.4) / 0.6; m.material.opacity = 0.6 * (1 - k); m.scale.setScalar(3.5 * (1 + k * 3)); } });
      // 收縮符文環（向內塌）
      for (let k = 0; k < 3; k++) { const rg = new T.Mesh(new T.RingGeometry(0.84, 1, k === 0 ? 6 : 48), basicAdd(k === 0 ? GOLD : (k % 2 ? LILAC : NEB), 0.8)); rg.rotation.x = -Math.PI / 2; rg.position.set(c.x, 3 + k * 2, c.z); addTransient(rg, 0.42, (m, t) => { m.scale.setScalar((300 - 80 * k) * (1 - 0.85 * t) + 12); m.rotation.z += 0.05 * (k + 1); m.material.opacity = 0.8 * (1 - t * 0.6); }); }
      // 向內吸入的螺旋星塵
      for (let i = 0; i < 46; i++) { const a = Math.random() * 6.283, rr = 120 + Math.random() * 140; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 6 + Math.random() * 50, z: c.z + Math.sin(a) * rr, vx: -Math.cos(a) * 260 - Math.sin(a) * 120, vy: -10, vz: -Math.sin(a) * 260 + Math.cos(a) * 120, gravity: 0, drag: 0.9, life: 0.45, size: 3 + Math.random() * 1.5, color: Math.random() < 0.5 ? LILAC : NEB, fade: true }); }
      // 階段二：延遲觸發的虛空總爆發（用隱形計時器 Object3D）
      const timer = new T.Object3D(); timer.position.set(c.x, 0, c.z); let fired = false;
      addTransient(timer, 0.6, (m, t) => {
        if (fired || t < 0.7) return; fired = true;
        sceneMgr.addShake(20); sceneMgr.addFlash(0.4, GOLD);
        sphereFlash(ctx, c, { color: '#ffffff', from: 14, to: 150, life: 0.4, alpha: 0.98 });
        sphereFlash(ctx, c, { color: NEB, from: 8, to: 90, life: 0.32, alpha: 0.7 });
        ring(ctx, c, { color: GOLD, from: 16, to: 340, life: 0.7, y: 4, alpha: 0.9, ease: true });
        ring(ctx, c, { color: LILAC, from: 12, to: 260, life: 0.8, y: 3, alpha: 0.7, ease: true });
        burst(ctx, c, { color: [VOID, LILAC, NEB, GOLD], count: 56, speed: 380, up: 100, life: 0.9, size: 5.5 });
        for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, rr = Math.random() * 40; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 20, z: c.z + Math.sin(a) * rr, vx: Math.cos(a) * (260 + Math.random() * 220), vy: 60 + Math.random() * 160, vz: Math.sin(a) * (260 + Math.random() * 220), gravity: 40, drag: 0.8, life: 0.9 + Math.random() * 0.5, size: 3.5 + Math.random() * 2.5, color: Math.random() < 0.5 ? LILAC : GOLD, fade: true }); }
      });
    },
  });
}
