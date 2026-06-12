// 忍者：隱密、煙霧、幻影。旋轉手裏劍 / 煙霧雲 / 影分身瞬移。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, burst, column } from './lib.js';

// 大絕招 — 影分身亂舞：濃煙湧現 + 環身殘影
registerVfx('ninja_ultimate', {
  onCast(ctx, f, c) {
    for (let i = 0; i < 64; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * 80;
      ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: Math.random() * 48, z: c.z + Math.sin(a) * rr, vx: Math.cos(a) * (50 + Math.random() * 70), vy: 20 + Math.random() * 50, vz: Math.sin(a) * (50 + Math.random() * 70), gravity: -8, drag: 1.4, life: 0.8 + Math.random() * 0.6, size: 9 + Math.random() * 9, color: Math.random() < 0.5 ? '#4b5358' : '#2c3e50', fade: false });
    }
    ring(ctx, c, { color: '#b0bec5', from: 12, to: 120, life: 0.5, y: 4, alpha: 0.85 });
    ring(ctx, c, { color: '#eceff1', from: 8, to: 80, life: 0.4, y: 7, alpha: 0.6 });
    burst(ctx, c, { color: ['#cfd8dc', '#90a4ae'], count: 28, speed: 280, up: 20, flat: true, life: 0.5, size: 4 });
    ctx.sceneMgr.addShake(12);
    ctx.sceneMgr.addFlash(0.18, '#cfd8dc');
  },
});

registerVfx('ninja_shuriken', {
  projectile(ctx, pr) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xced6dc, emissive: new THREE.Color('#95a5a6'), emissiveIntensity: 0.8, metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide });
    // 四角星：兩個交叉薄盒
    const r = pr.radius * 2.2;
    const a = new THREE.Mesh(new THREE.BoxGeometry(r * 2, 0.8, r * 0.5), mat);
    const b = new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, 0.8, r * 2), mat);
    g.add(a); g.add(b);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.3, r * 0.3, 1.2, 8), mat);
    g.add(hub);
    return {
      object3D: g,
      update(dt) {
        g.rotation.y += dt * 30; // 高速旋轉 (繞垂直軸，平躺旋轉感)
        if (Math.random() < 0.5) ctx.particles.spawn({ x: g.position.x, y: g.position.y, z: g.position.z, vx: 0, vy: 0, vz: 0, drag: 6, life: 0.16, size: pr.radius, color: '#c8d0d6', fade: true });
      },
    };
  },
  onHit(ctx, f, c) {
    ring(ctx, c, { color: '#bdc3c7', from: 3, to: (f.radius || 14) * 2, life: 0.22, y: 8 });
    burst(ctx, c, { color: '#dfe6e9', count: 8, speed: 180, life: 0.28, size: 2.2 });
  },
});

registerVfx('ninja_smoke', {
  onCast(ctx, f, c) {
    // 大片煙霧雲：緩慢膨脹的灰色濃煙 + 低矮環
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * 40;
      ctx.particles.spawn({
        x: c.x + Math.cos(a) * rr, y: Math.random() * 30, z: c.z + Math.sin(a) * rr,
        vx: Math.cos(a) * (30 + Math.random() * 50), vy: 20 + Math.random() * 40, vz: Math.sin(a) * (30 + Math.random() * 50),
        gravity: -8, drag: 1.5, life: 0.8 + Math.random() * 0.7, size: 8 + Math.random() * 8,
        color: Math.random() < 0.5 ? '#4b5358' : '#2c3e50', fade: false,
      });
    }
    ring(ctx, c, { color: '#636e72', from: 10, to: 80, life: 0.5, y: 2, alpha: 0.6 });
  },
});

registerVfx('ninja_shadowblink', {
  onCast(ctx, f, c) {
    // 影分身瞬移：墨黑煙 + 上升暗影殘像 + 環
    ring(ctx, c, { color: '#636e72', from: 4, to: 56, life: 0.32, y: 6, alpha: 0.8 });
    burst(ctx, c, { color: ['#2c3e50', '#1a242f', '#636e72'], count: 24, speed: 150, up: 30, gravity: -15, drag: 1.4, life: 0.6, size: 6, fade: false });
    column(ctx, c, { color: '#2c3e50', count: 12, radius: 14, speed: 130, life: 0.45, size: 5, fade: false });
  },
});
