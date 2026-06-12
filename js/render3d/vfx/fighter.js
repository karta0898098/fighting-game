// 格鬥家：拳腳連段、爆發。連環拳 / 上勾拳擊飛 / 格擋反擊。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, pillar, burst, cone, sphereFlash, addShake, addFlash } from './lib.js';

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
    // 上勾拳：垂直光柱 + 上沖氣流 + 擊飛環
    pillar(ctx, c, { color: '#f9e79f', h: 120, r: 16, taper: 0.4, life: 0.45, alpha: 0.7, grow: 0.3 });
    ring(ctx, c, { color: '#f1c40f', from: 6, to: 64, life: 0.34, y: 3 });
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * 18;
      ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: 2, z: c.z + Math.sin(a) * rr, vx: Math.cos(a) * 40, vy: 220 + Math.random() * 180, vz: Math.sin(a) * 40, gravity: 240, drag: 1.2, life: 0.5, size: 3.5, color: '#f9e79f', fade: true });
    }
    addShake(ctx, 5);
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
