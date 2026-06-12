// 格鬥家：拳腳連段、爆發。連環拳 / 上勾拳擊飛 / 格擋反擊。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, pillar, burst, cone, sphereFlash, addShake, addFlash, ultimateBurst } from './lib.js';

// 大絕招 — 真·昇龍霸：金色衝天氣旋
registerVfx('fighter_ultimate', {
  onCast(ctx, f, c) {
    ultimateBurst(ctx, c, { color: '#ffe27a', radius: 130, pillarH: 280, pillarR: 24, shake: 18, flash: 0.34 });
    for (let k = 0; k < 5; k++) {
      const geo = new THREE.TorusGeometry(1, 0.18, 8, 32);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe27a'), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(c.x, 8, c.z);
      const baseY = 10 + k * 44;
      ctx.addTransient(m, 0.6, (mesh, t) => { mesh.position.y = baseY + t * 60; mesh.scale.setScalar((34 - k * 4) * (0.5 + 0.6 * t)); mesh.material.opacity = (1 - t) * 0.8; });
      m.userData.mat = m.material; m.userData.geo = geo;
    }
    for (let i = 0; i < 44; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * 28;
      ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: 2, z: c.z + Math.sin(a) * rr, vx: Math.cos(a) * 60, vy: 300 + Math.random() * 260, vz: Math.sin(a) * 60, gravity: 240, drag: 1, life: 0.7, size: 4.5, color: '#ffe27a', fade: true });
    }
    pillar(ctx, c, { color: '#fff4c2', h: 300, r: 10, taper: 0.1, life: 0.5, alpha: 0.6, grow: 0.2 });
  },
});

registerVfx('fighter_combo', {
  onCast(ctx, f, c) {
    // 快速拳擊衝擊 pop
    const d = { x: Math.cos(f.facing), z: Math.sin(f.facing) };
    const hit = { x: c.x + d.x * f.range * 0.6, y: c.y, z: c.z + d.z * f.range * 0.6 };
    sphereFlash(ctx, hit, { color: '#f7dc6f', from: 3, to: 22, life: 0.16, alpha: 0.9 });
    cone(ctx, c, f.facing, { color: '#f9e79f', count: 8, speed: 240, spread: 0.3, offset: f.range * 0.5, life: 0.22, size: 2.6 });
  },
});

registerVfx('fighter_uppercut', {
  onCast(ctx, f, c) {
    // 上勾拳 (升龍-tier 重擊)：高聳光柱 + 上沖氣流 + 擊飛環 + 爆閃
    pillar(ctx, c, { color: '#f9e79f', h: 170, r: 20, taper: 0.35, life: 0.5, alpha: 0.75, grow: 0.4 });
    sphereFlash(ctx, c, { color: '#fff4c2', from: 6, to: 50, life: 0.2, alpha: 0.9 });
    ring(ctx, c, { color: '#f1c40f', from: 6, to: 90, life: 0.36, y: 3, ease: true });
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * 22;
      ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: 2, z: c.z + Math.sin(a) * rr, vx: Math.cos(a) * 50, vy: 280 + Math.random() * 240, vz: Math.sin(a) * 50, gravity: 240, drag: 1.2, life: 0.6, size: 4, color: '#f9e79f', fade: true });
    }
    addShake(ctx, 8);
  },
});

registerVfx('fighter_counter', {
  onCast(ctx, f, c) {
    // 格擋架式：金色六角護環 + 火花環 + 閃光
    const color = new THREE.Color('#f4d03f');
    const geo = new THREE.RingGeometry(0.7, 1, 6);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set(c.x, 26, c.z); m.lookAt(c.x, 26, c.z + 1);
    ctx.addTransient(m, 0.5, (mesh, t) => { mesh.scale.setScalar(28 * Math.min(1, t * 5)); mesh.rotation.z += 0.06; mesh.material.opacity = 0.9 * (1 - t); });
    m.userData.mat = m.material; m.userData.geo = geo;
    ring(ctx, c, { color: '#f4d03f', from: 8, to: 56, life: 0.36, y: 3 });
    burst(ctx, c, { color: ['#f4d03f', '#ffffff'], count: 14, speed: 150, up: 50, flat: true, life: 0.4 });
    addFlash(ctx, 0.14, '#f4d03f');
  },
});
