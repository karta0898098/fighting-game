// 治療師：神聖、柔和。聖光彈光環 / 治療十字光柱 / 淨化放射。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, sphereFlash, column, pillar, burst, slashBlade, addFlash, ultimateBurst } from './lib.js';

// 大絕招 — 聖域：神聖光柱 + 漫天光點
registerVfx('healer_ultimate', {
  onCast(ctx, f, c) {
    const R = f.radius || 260;
    ultimateBurst(ctx, c, { color: '#aaffcc', radius: R, pillarH: 230, pillarR: 42, shake: 9, flash: 0.28 });
    pillar(ctx, c, { color: '#ffffff', h: 250, r: 28, life: 0.75, alpha: 0.55 });
    column(ctx, c, { color: ['#aaffcc', '#ffffff', '#f1c40f'], count: 60, radius: R * 0.5, speed: 210, life: 1.0, size: 4.5 });
    for (let k = 0; k < 2; k++) slashBlade(ctx, c, k * Math.PI / 2, { color: '#fff6cf', len: R * 1.1, w: 14, swing: 0, life: 0.5, y: 40 }); // 神聖十字光芒
    ring(ctx, c, { color: '#fff0b0', from: 20, to: R, life: 0.6, y: 5, alpha: 0.7, ease: true });
  },
});

registerVfx('healer_holybolt', {
  projectile(ctx, pr) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(pr.radius, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color('#fff2b0'), emissiveIntensity: 2.6 })
    );
    g.add(core);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(pr.radius * 1.4, pr.radius * 1.8, 24),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe680'), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    g.add(halo);
    return {
      object3D: g,
      update(dt) {
        halo.rotation.z += dt * 2; halo.lookAt(0, 400, 0);
        ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: 0, vy: 30, vz: 0, drag: 2, life: 0.4, size: pr.radius, color: '#fff2b0', fade: true });
      },
    };
  },
  onHit(ctx, f, c) {
    sphereFlash(ctx, c, { color: '#fff2b0', from: 4, to: (f.radius || 28), life: 0.26, alpha: 0.9 });
    ring(ctx, c, { color: '#ffe680', from: 4, to: (f.radius || 24) * 1.8, life: 0.34, y: 8 });
    // 十字閃爍
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      ctx.particles.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 120, vy: 0, vz: Math.sin(a) * 120, drag: 3, life: 0.35, size: 4, color: '#ffffff', fade: true });
    }
  },
});

registerVfx('healer_heal', {
  onCast(ctx, f, c) {
    // 溫暖光柱 + 上升十字/花瓣
    pillar(ctx, c, { color: '#7CFFA0', h: 110, r: 22, life: 0.6, alpha: 0.5 });
    ring(ctx, c, { color: '#2ecc71', from: 8, to: 70, life: 0.5, y: 3, ease: true });
    column(ctx, c, { color: ['#7CFFA0', '#ffffff'], count: 28, radius: 26, speed: 140, life: 0.8, size: 3.5 });
    addFlash(ctx, 0.1, '#7CFFA0');
  },
});

registerVfx('healer_cleanse', {
  onCast(ctx, f, c) {
    // 放射淨化光：雙環 + 上升光點 + 閃光
    sphereFlash(ctx, c, { color: '#ffffff', from: 6, to: 60, life: 0.24, alpha: 0.85 });
    ring(ctx, c, { color: '#55efc4', from: 10, to: 100, life: 0.5, y: 3, ease: true });
    ring(ctx, c, { color: '#ffffff', from: 6, to: 64, life: 0.36, y: 6 });
    column(ctx, c, { color: ['#55efc4', '#ffffff'], count: 24, radius: 30, speed: 170, life: 0.7 });
    addFlash(ctx, 0.16, '#ffffff');
  },
});
