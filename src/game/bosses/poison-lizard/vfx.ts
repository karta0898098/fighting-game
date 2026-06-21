// @ts-nocheck
// R2 地面毒沼：刻意做成「濃濁、把地面染暗的毒液」而非發亮霓虹。
// 讀作「危險、別踩」，而不是「漂亮的光圈」。配上 hud.js 站入時的全螢幕警示。
import * as THREE from 'three';
import { registerVfx } from '../../render3d/vfx/registry.js';
import { slashBlade, cone, burst, ring, column, sphereFlash } from '../../render3d/vfx/lib.js';

const TOX = '#7fff00', GREEN = '#9acd32', PURPLE = '#6a3d9a';

export function loadVfx() {
  // 毒爪：快速綠色爪擊弧 + 毒滴噴濺
  registerVfx('boss_lizard_claw', {
    onCast(ctx: any, f: any, c: any) {
      slashBlade(ctx, c, f.facing, { color: [TOX, PURPLE], len: (f.range || 80) * 1.15, swing: 1.2, life: 0.24, y: 14, sparkCount: 8, alpha: 0.9 });
      cone(ctx, c, f.facing, { color: [TOX, GREEN, PURPLE], count: 12, speed: 220, spread: 0.6, up: 20, life: 0.4, size: 3.2 });
    },
  });

  // 腐蝕毒吐：飛行毒球（一路滴毒）+ 命中潑濺
  registerVfx('boss_lizard_spit', {
    projectile(ctx: any, pr: any) {
      const r = (pr.radius || 16) * 1.7; // 視覺放大成大顆華麗毒球（不影響碰撞 hitbox）
      const g = new THREE.Group();
      // 外層毒氣暈
      const aura = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(TOX), transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(aura);
      // 中層毒漿球
      const mid = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshStandardMaterial({ color: new THREE.Color('#5a8f2f'), emissive: new THREE.Color(TOX), emissiveIntensity: 1.6, roughness: 0.5, transparent: true, opacity: 0.9 }));
      g.add(mid);
      // 亮核
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.55, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color('#e6ff8a'), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }));
      g.add(core);
      // 旋轉毒環
      const tring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.3, r * 0.12, 6, 18), new THREE.MeshBasicMaterial({ color: new THREE.Color(PURPLE), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
      tring.rotation.x = Math.PI / 2; g.add(tring);
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt: number) {
          t += dt; mid.rotation.y += dt * 3; mid.rotation.x += dt * 2; tring.rotation.z += dt * 5;
          core.scale.setScalar(1 + 0.14 * Math.sin(t * 18)); aura.scale.setScalar(1 + 0.08 * Math.sin(t * 10));
          em -= dt;
          if (em <= 0) { em = 0.03; ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: (Math.random() - 0.5) * 26, vy: -18 - Math.random() * 28, vz: (Math.random() - 0.5) * 26, gravity: 120, drag: 1.5, life: 0.5, size: 3.5 + Math.random() * 2.5, color: Math.random() < 0.65 ? TOX : PURPLE, fade: true }); }
        },
      };
    },
    onHit(ctx: any, f: any, c: any) {
      sphereFlash(ctx, c, { color: TOX, from: 6, to: 52, life: 0.26, alpha: 0.8 });
      ring(ctx, c, { color: GREEN, from: 8, to: (f.radius || 16) * 3.4, life: 0.42, y: 2, alpha: 0.8, ease: true });
      burst(ctx, c, { color: [TOX, GREEN, PURPLE], count: 26, speed: 220, up: 40, flat: true, life: 0.6, size: 4.5 });
    },
  });

  // 毒沼飛撲：起跳/落地紫綠爆濺（地面毒沼另由 boss_lizard_pool）
  registerVfx('boss_lizard_pounce', {
    onCast(ctx: any, f: any, c: any) {
      burst(ctx, c, { color: [PURPLE, TOX], count: 18, speed: 200, up: 60, life: 0.5, size: 4 });
      ring(ctx, c, { color: PURPLE, from: 8, to: 90, life: 0.4, y: 2, alpha: 0.6 });
    },
    onHit(ctx: any, f: any, c: any) {
      ring(ctx, c, { color: TOX, from: 10, to: (f.radius || 120) * 1.2, life: 0.42, y: 2, alpha: 0.75, ease: true });
      burst(ctx, c, { color: [TOX, GREEN, PURPLE], count: 24, speed: 240, up: 50, flat: true, life: 0.55, size: 4.5 });
      ctx.sceneMgr.addShake(8);
    },
  });

  // 瘴氣風暴：旋轉綠色毒霧領域 + 施放爆發
  registerVfx('boss_lizard_ult', {
    onCast(ctx: any, f: any, c: any) {
      burst(ctx, c, { color: [TOX, PURPLE], count: 30, speed: 220, up: 60, life: 0.6, size: 4.5 });
      ctx.sceneMgr.addShake(12); ctx.sceneMgr.addFlash(0.18, TOX);
    },
    zone(ctx: any, z: any) {
      const R = z.radius || 120;
      const g = new THREE.Group();
      const discs: any[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new THREE.Mesh(new THREE.CircleGeometry(R * (0.6 + i * 0.2), 36), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 2 ? TOX : '#4e7a2f'), transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
        d.rotation.x = -Math.PI / 2; d.position.y = 2 + i; g.add(d); discs.push(d);
      }
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt: number) {
          t += dt;
          for (let i = 0; i < discs.length; i++) { discs[i].rotation.z += dt * (0.6 + i * 0.4) * (i % 2 ? 1 : -1); discs[i].material.opacity = 0.14 + 0.08 * Math.sin(t * 3 + i); }
          em -= dt;
          if (em <= 0) { em = 0.06; const a = Math.random() * 6.283, rr = Math.random() * R * 0.9; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 2, z: g.position.z + Math.sin(a) * rr, vx: 0, vy: 30 + Math.random() * 50, vz: 0, gravity: -12, drag: 1, life: 0.8, size: 4, color: Math.random() < 0.7 ? TOX : PURPLE, fade: true }); }
        },
      };
    },
  });

  registerVfx('boss_lizard_pool', {
    zone(ctx: any, z: any) {
      const { particles } = ctx;
      const g = new THREE.Group();

      const base = new THREE.Mesh(
        new THREE.CircleGeometry(1, 40),
        new THREE.MeshBasicMaterial({ color: new THREE.Color('#20300e'), transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false })
      );
      base.rotation.x = -Math.PI / 2; base.position.y = 0.5; g.add(base);

      const inner = new THREE.Mesh(
        new THREE.CircleGeometry(0.72, 32),
        new THREE.MeshBasicMaterial({ color: new THREE.Color('#3a5a18'), transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
      );
      inner.rotation.x = -Math.PI / 2; inner.position.y = 0.7; g.add(inner);

      const rim = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 1, 48),
        new THREE.MeshBasicMaterial({ color: new THREE.Color('#82ad2c'), transparent: true, opacity: 0.68, side: THREE.DoubleSide, depthWrite: false })
      );
      rim.rotation.x = -Math.PI / 2; rim.position.y = 0.85; g.add(rim);

      let t = 0, bub = 0;
      return {
        object3D: g,
        update(dt: number, zz: any) {
          t += dt;
          const r = zz.radius;
          base.scale.setScalar(r); inner.scale.setScalar(r); rim.scale.setScalar(r);
          inner.rotation.z += dt * 0.25;
          rim.material.opacity = 0.52 + 0.18 * Math.sin(t * 3);
          inner.material.opacity = 0.48 + 0.12 * Math.sin(t * 1.8 + 1);
          bub -= dt;
          if (bub <= 0) {
            bub = 0.12;
            const a = Math.random() * Math.PI * 2, rr = Math.random() * r * 0.8;
            particles.spawn({
              x: g.position.x + Math.cos(a) * rr, y: 1.5, z: g.position.z + Math.sin(a) * rr,
              vx: (Math.random() - 0.5) * 6, vy: 14 + Math.random() * 22, vz: (Math.random() - 0.5) * 6,
              gravity: -8, drag: 1.8, life: 0.6 + Math.random() * 0.6,
              size: 4 + Math.random() * 4, color: Math.random() < 0.8 ? '#7fbf3f' : '#9b6bff', fade: true,
            });
          }
        },
      };
    },
  });

  // 死亡演出：軀體溶解成毒沼 + 巨型毒爆球閃 + 毒液噴泉 + 瘴氣升騰 + 多重毒環
  registerVfx('boss_lizard_death', {
    onDeath(ctx: any, f: any, c: any) {
      const { THREE: T, addTransient, sceneMgr, particles } = ctx;
      sceneMgr.addShake(22); sceneMgr.addFlash(0.4, TOX);
      // 巨型毒爆雙層球閃
      sphereFlash(ctx, c, { color: TOX, from: 10, to: 110, life: 0.4, alpha: 0.9 });
      sphereFlash(ctx, c, { color: PURPLE, from: 6, to: 70, life: 0.32, alpha: 0.6 });
      // 多重毒液擴張環
      ring(ctx, c, { color: TOX, from: 16, to: 320, life: 0.7, y: 3, alpha: 0.85, ease: true });
      ring(ctx, c, { color: GREEN, from: 12, to: 240, life: 0.8, y: 2, alpha: 0.7, ease: true });
      ring(ctx, c, { color: PURPLE, from: 8, to: 160, life: 0.55, y: 4, alpha: 0.6 });
      // 溶解的毒沼：暗綠圓盤擴張後緩退
      const pool = new T.Mesh(new T.CircleGeometry(1, 40), new T.MeshBasicMaterial({ color: new T.Color('#20300e'), transparent: true, opacity: 0.82, side: T.DoubleSide, depthWrite: false }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(c.x, 1, c.z);
      addTransient(pool, 1.6, (m: any, t: number) => { const e = Math.min(1, t / 0.35); m.scale.setScalar(40 + 180 * e); m.material.opacity = 0.82 * (1 - Math.max(0, (t - 0.6) / 0.4)); });
      const poolIn = new T.Mesh(new T.CircleGeometry(1, 36), new T.MeshBasicMaterial({ color: new T.Color('#3a5a18'), transparent: true, opacity: 0.6, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
      poolIn.rotation.x = -Math.PI / 2; poolIn.position.set(c.x, 1.4, c.z);
      addTransient(poolIn, 1.6, (m: any, t: number) => { const e = Math.min(1, t / 0.4); m.scale.setScalar(30 + 130 * e); m.rotation.z += 0.01; m.material.opacity = 0.55 * (1 - Math.max(0, (t - 0.6) / 0.4)); });
      // 毒液噴泉 + 大爆散毒滴
      column(ctx, c, { color: [TOX, GREEN], count: 30, radius: 80, speed: 300, life: 1.0, size: 6 });
      burst(ctx, c, { color: [TOX, GREEN, PURPLE], count: 44, speed: 320, up: 100, flat: true, life: 0.9, size: 6 });
      burst(ctx, c, { color: [TOX, '#e6ff8a'], count: 24, speed: 200, up: 160, life: 1.0, size: 5 });
      // 瘴氣升騰（慢飄綠紫煙）
      for (let i = 0; i < 36; i++) { const a = Math.random() * 6.283, rr = Math.random() * 160; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 2, z: c.z + Math.sin(a) * rr, vx: (Math.random() - 0.5) * 20, vy: 50 + Math.random() * 90, vz: (Math.random() - 0.5) * 20, gravity: -16, drag: 0.8, life: 1.2 + Math.random() * 0.8, size: 5 + Math.random() * 4, color: Math.random() < 0.6 ? TOX : PURPLE, fade: true }); }
      // 酸蝕落滴
      for (let i = 0; i < 24; i++) { const a = Math.random() * 6.283, rr = 30 + Math.random() * 120; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 120 + Math.random() * 60, z: c.z + Math.sin(a) * rr, vx: 0, vy: -60 - Math.random() * 40, vz: 0, gravity: 60, drag: 1.2, life: 0.9, size: 4 + Math.random() * 2, color: Math.random() < 0.5 ? GREEN : TOX, fade: true }); }
    },
  });
}
