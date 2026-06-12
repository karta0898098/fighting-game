// 元素使：範圍壓制、前搖明顯。火花扇 / 火焰地帶 / 隕石天降。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, sphereFlash, burst, cone, addShake, addFlash } from './lib.js';

// 大絕招 — 天地崩裂：多顆隕石天降 (zone count 5)。onCast 起手天裂閃光，zone hook 渲染每顆落石。
registerVfx('elem_ultimate', {
  onCast(ctx, f, c) {
    ctx.sceneMgr.addFlash(0.3, '#ff5a1f');
    ctx.sceneMgr.addShake(10);
    ring(ctx, c, { color: '#ff5a1f', from: 20, to: 240, life: 0.55, y: 4, ease: true });
    ring(ctx, c, { color: '#ffd166', from: 12, to: 160, life: 0.45, y: 6, alpha: 0.7 });
  },
  zone(ctx, z) {
    const g = new THREE.Group();
    const col = new THREE.Color('#ff5a1f');
    const warn = new THREE.Mesh(
      new THREE.RingGeometry(0.86, 1, 40),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    warn.rotation.x = -Math.PI / 2; warn.position.y = 1.5; warn.scale.setScalar(z.radius); g.add(warn);
    const meteor = new THREE.Mesh(
      new THREE.IcosahedronGeometry(z.radius * 0.4, 1),
      new THREE.MeshStandardMaterial({ color: 0x4a1008, emissive: col, emissiveIntensity: 2.6, roughness: 0.6 })
    );
    g.add(meteor);
    const totalDelay = Math.max(0.0001, z.delay || 1.0);
    let exploded = false;
    return {
      object3D: g,
      update(dt, zz) {
        if (zz.delay > 0) {
          meteor.visible = true;
          meteor.position.y = 1000 * (zz.delay / totalDelay) + z.radius * 0.4;
          meteor.rotation.x += dt * 6; meteor.rotation.y += dt * 5;
          ctx.particles.spawn({ x: g.position.x + (Math.random() - 0.5) * 12, y: meteor.position.y, z: g.position.z + (Math.random() - 0.5) * 12, vx: (Math.random() - 0.5) * 20, vy: 40, vz: (Math.random() - 0.5) * 20, drag: 1.5, life: 0.5, size: 10, color: Math.random() < 0.5 ? '#ff7043' : '#ffd166', fade: true });
          warn.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin((1 - zz.delay / totalDelay) * Math.PI * 6));
        } else {
          meteor.visible = false;
          if (!exploded) {
            exploded = true;
            const cc = { x: g.position.x, y: 16, z: g.position.z };
            ctx.sceneMgr.addShake(22); ctx.sceneMgr.addFlash(0.32, '#ff5a1f');
            ring(ctx, cc, { color: '#ff7043', from: 20, to: z.radius * 1.6, life: 0.5, y: 3, alpha: 0.85, ease: true });
            for (let i = 0; i < 64; i++) {
              const a = Math.random() * Math.PI * 2, spd = 240 + Math.random() * 380;
              ctx.particles.spawn({ x: cc.x, y: 6, z: cc.z, vx: Math.cos(a) * spd, vy: 140 + Math.random() * 300, vz: Math.sin(a) * spd, gravity: 500, drag: 1, life: 0.6 + Math.random() * 0.7, size: 5 + Math.random() * 6, color: Math.random() < 0.5 ? '#ff7043' : '#4a1008', fade: false });
            }
          }
          warn.material.opacity = Math.max(0, warn.material.opacity - dt * 2);
        }
      },
    };
  },
});

registerVfx('elem_spark', {
  onCast(ctx, f, c) {
    // 前向火焰舌
    cone(ctx, c, f.facing, { color: ['#f39c12', '#ff7043', '#ffd166'], count: 20, speed: 300, spread: 0.45, offset: 10, up: 20, gravity: -10, drag: 2, life: 0.4, size: 4 });
    ring(ctx, c, { color: '#f39c12', from: 4, to: 30, life: 0.2, y: 4 });
  },
});

// 火焰地帶：持續 4s 燃燒
registerVfx('elem_firezone', {
  zone(ctx, z) {
    const g = new THREE.Group();
    const col = new THREE.Color('#e74c3c');
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    disc.rotation.x = -Math.PI / 2; disc.position.y = 1; disc.scale.setScalar(z.radius); g.add(disc);
    let acc = 0; let age = 0;
    return {
      object3D: g,
      update(dt) {
        age += dt;
        disc.material.opacity = 0.22 + 0.1 * Math.sin(age * 8);
        disc.rotation.z += dt * 0.4;
        // 持續竄火 (節流)
        acc += dt;
        const rate = 0.02;
        while (acc >= rate) {
          acc -= rate;
          const a = Math.random() * Math.PI * 2, rr = Math.random() * z.radius;
          ctx.particles.spawn({
            x: g.position.x + Math.cos(a) * rr, y: 2, z: g.position.z + Math.sin(a) * rr,
            vx: (Math.random() - 0.5) * 20, vy: 80 + Math.random() * 110, vz: (Math.random() - 0.5) * 20,
            gravity: -20, drag: 1.2, life: 0.4 + Math.random() * 0.4, size: 4 + Math.random() * 4,
            color: Math.random() < 0.4 ? '#ffd166' : (Math.random() < 0.6 ? '#ff7043' : '#e74c3c'), fade: true,
          });
        }
      },
    };
  },
});

// 隕石：delay 期間天降隕石 + 預警圈；落地時 hit fx 觸發大爆炸
registerVfx('elem_meteor', {
  zone(ctx, z) {
    const g = new THREE.Group();
    const col = new THREE.Color('#c0392b');
    // 地面預警圈
    const warn = new THREE.Mesh(
      new THREE.RingGeometry(0.86, 1, 48),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    warn.rotation.x = -Math.PI / 2; warn.position.y = 1.5; warn.scale.setScalar(z.radius); g.add(warn);
    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    inner.rotation.x = -Math.PI / 2; inner.position.y = 1; inner.scale.setScalar(z.radius); g.add(inner);
    // 隕石球 (從高空落下)
    const meteor = new THREE.Mesh(
      new THREE.IcosahedronGeometry(z.radius * 0.32, 1),
      new THREE.MeshStandardMaterial({ color: 0x4a1008, emissive: new THREE.Color('#ff5a1f'), emissiveIntensity: 2.4, roughness: 0.6 })
    );
    g.add(meteor);
    const totalDelay = Math.max(0.0001, z.delay || 1.2);
    const startH = 900;
    let exploded = false;
    return {
      object3D: g,
      update(dt, zz) {
        if (zz.delay > 0) {
          const fill = 1 - zz.delay / totalDelay;
          meteor.visible = true;
          meteor.position.y = startH * (zz.delay / totalDelay) + z.radius * 0.32;
          meteor.rotation.x += dt * 6; meteor.rotation.y += dt * 5;
          // 下墜火尾
          ctx.particles.spawn({
            x: g.position.x + (Math.random() - 0.5) * 10, y: meteor.position.y, z: g.position.z + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 20, vy: 40, vz: (Math.random() - 0.5) * 20, drag: 1.5, life: 0.5, size: 8, color: Math.random() < 0.5 ? '#ff7043' : '#ffd166', fade: true,
          });
          warn.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(fill * Math.PI * 6));
          inner.material.opacity = 0.1 + 0.12 * fill;
          inner.scale.setScalar(z.radius * (0.3 + 0.7 * fill));
        } else {
          meteor.visible = false;
          if (!exploded) {
            exploded = true;
            const c = { x: g.position.x, y: 16, z: g.position.z };
            sphereFlash(ctx, c, { color: '#ffd166', from: 10, to: z.radius * 1.1, life: 0.3, alpha: 1 });
            ring(ctx, c, { color: '#ff5a1f', from: 14, to: z.radius * 1.8, life: 0.45, y: 4, ease: true });
            for (let i = 0; i < 40; i++) {
              const a = Math.random() * Math.PI * 2, spd = 200 + Math.random() * 320;
              ctx.particles.spawn({ x: c.x, y: 6, z: c.z, vx: Math.cos(a) * spd, vy: 120 + Math.random() * 260, vz: Math.sin(a) * spd, gravity: 460, drag: 1, life: 0.6 + Math.random() * 0.6, size: 5 + Math.random() * 5, color: Math.random() < 0.5 ? '#ff7043' : '#4a1008', fade: false });
            }
            addShake(ctx, 22); addFlash(ctx, 0.32, '#ff5a1f');
          }
          warn.material.opacity = Math.max(0, warn.material.opacity - dt * 2);
          inner.material.opacity = Math.max(0, inner.material.opacity - dt * 1.5);
        }
      },
    };
  },
});
