// 坦克：巨大、鈍重、控場。重拳衝擊 / 六角護盾罩 / 震地裂石。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, sphereFlash, burst, cone, addShake, addFlash, ultimateBurst } from './lib.js';

// 大絕招 — 不動堡壘：巨石噴發 + 護盾穹頂
registerVfx('tank_ultimate', {
  onCast(ctx, f, c) {
    const R = f.radius || 230;
    ultimateBurst(ctx, c, { color: '#cfd8dc', radius: R, pillar: false, shake: 24, flash: 0.32 });
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * R;
      ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: 4, z: c.z + Math.sin(a) * rr, vx: (Math.random() - 0.5) * 90, vy: 200 + Math.random() * 280, vz: (Math.random() - 0.5) * 90, gravity: 500, drag: 1, life: 0.7 + Math.random() * 0.6, size: 5 + Math.random() * 6, color: Math.random() < 0.5 ? '#7f8c8d' : '#5a3a1f', fade: false });
    }
    ring(ctx, c, { color: '#a0744a', from: 24, to: R * 1.2, life: 0.55, y: 2, alpha: 0.8, ease: true });
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, wireframe: true }));
    m.position.set(c.x, 34, c.z);
    ctx.addTransient(m, 1.0, (mesh, t) => { mesh.scale.setScalar(88 * Math.min(1, t * 4)); mesh.rotation.y += 0.03; mesh.material.opacity = 0.55 * (1 - t); });
    m.userData.mat = m.material; m.userData.geo = geo;
  },
});

registerVfx('tank_punch', {
  onCast(ctx, f, c) {
    // 沉重前拳：扁平衝擊環 + 塵土 + 碎石
    ring(ctx, c, { color: '#cfd8dc', from: 8, to: f.range * 1.2, life: 0.3, y: 4, alpha: 0.9 });
    cone(ctx, c, f.facing, { color: ['#aab7b8', '#7f8c8d'], count: 14, speed: 220, spread: 0.5, offset: f.range * 0.4, up: 50, gravity: 260, life: 0.45, size: 4 });
    addShake(ctx, 6);
  },
});

registerVfx('tank_shield', {
  onCast(ctx, f, c) {
    // 六角護盾罩成形：放大後短暫停留再淡出
    const color = new THREE.Color('#dfe6e9');
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, wireframe: true,
    }));
    m.position.set(c.x, 26, c.z);
    ctx.addTransient(m, 0.7, (mesh, t) => {
      const s = 44 * Math.min(1, t * 4);
      mesh.scale.setScalar(s);
      mesh.rotation.y += 0.04; mesh.rotation.x += 0.02;
      mesh.material.opacity = 0.5 * (1 - t);
    });
    m.userData.mat = m.material; m.userData.geo = geo;
    ring(ctx, c, { color: '#9fe8ff', from: 10, to: 60, life: 0.4, y: 3 });
    burst(ctx, c, { color: '#dfe6e9', count: 12, speed: 90, up: 70, flat: true, life: 0.5 });
  },
});

// 震地：自身範圍 (無 delay)，自訂 zone 做地裂
registerVfx('tank_quake', {
  zone(ctx, z) {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#a0744a'), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    disc.rotation.x = -Math.PI / 2; disc.position.y = 1; disc.scale.setScalar(z.radius);
    g.add(disc);
    // 放射地裂線
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const crack = new THREE.Mesh(
        new THREE.BoxGeometry(z.radius, 1, 4),
        new THREE.MeshBasicMaterial({ color: new THREE.Color('#5a3a1f'), transparent: true, opacity: 0.85 })
      );
      crack.position.set(Math.cos(a) * z.radius * 0.5, 1.2, Math.sin(a) * z.radius * 0.5);
      crack.rotation.y = -a;
      g.add(crack);
    }
    let fired = false; let age = 0;
    return {
      object3D: g,
      update(dt) {
        age += dt;
        if (!fired) {
          fired = true;
          const c = { x: g.position.x, y: 10, z: g.position.z };
          ring(ctx, c, { color: '#caa472', from: 14, to: z.radius, life: 0.4, y: 4, alpha: 0.9, ease: true });
          // 大量碎石噴起
          for (let i = 0; i < 30; i++) {
            const a = Math.random() * Math.PI * 2, rr = Math.random() * z.radius;
            ctx.particles.spawn({
              x: c.x + Math.cos(a) * rr, y: 4, z: c.z + Math.sin(a) * rr,
              vx: (Math.random() - 0.5) * 80, vy: 160 + Math.random() * 220, vz: (Math.random() - 0.5) * 80,
              gravity: 460, drag: 1, life: 0.6 + Math.random() * 0.5, size: 4 + Math.random() * 4,
              color: Math.random() < 0.5 ? '#7f8c8d' : '#5a3a1f', fade: false,
            });
          }
          addShake(ctx, 18); addFlash(ctx, 0.2, '#a0744a');
        }
        disc.material.opacity = Math.max(0, 0.4 * (1 - age / Math.max(0.2, z.lifetime)));
      },
    };
  },
});
