// 法師：奧術元素。漩渦火球 / 冰霜碎晶新星 / 分支閃電。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, sphereFlash, burst, cone, addShake, ultimateBurst } from './lib.js';

// 大絕招 — 極寒風暴：向外冰晶風暴 + 巨環
registerVfx('mage_ultimate', {
  onCast(ctx, f, c) {
    const R = f.radius || 320;
    ultimateBurst(ctx, c, { color: '#7fdfff', radius: R, pillarH: 220, pillarR: 44, shake: 16, flash: 0.3 });
    for (let i = 0; i < 96; i++) {
      const a = Math.random() * Math.PI * 2, spd = 220 + Math.random() * 320;
      ctx.particles.spawn({ x: c.x, y: 8 + Math.random() * 50, z: c.z, vx: Math.cos(a) * spd, vy: 20 + Math.random() * 70, vz: Math.sin(a) * spd, gravity: 150, drag: 1.3, life: 0.6 + Math.random() * 0.6, size: 4 + Math.random() * 2, color: Math.random() < 0.5 ? '#bfefff' : '#ffffff', fade: true });
    }
    ring(ctx, c, { color: '#bfefff', from: 20, to: R, life: 0.62, y: 5, ease: true });
    ring(ctx, c, { color: '#ffffff', from: 30, to: R * 0.75, life: 0.5, y: 7, alpha: 0.7 });
    sphereFlash(ctx, c, { color: '#dffaff', from: 10, to: R * 0.4, life: 0.3, alpha: 0.7 });
  },
});

// 火球：白核 + 橙色火殼，飛行時噴餘燼
registerVfx('mage_fireball', {
  projectile(ctx, pr) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(pr.radius * 0.7, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd27f, emissiveIntensity: 3 })
    );
    g.add(core);
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(pr.radius * 1.4, 2),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(pr.color), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    g.add(shell);
    let spin = 0;
    return {
      object3D: g,
      update(dt) {
        spin += dt * 6;
        const s = 0.9 + 0.1 * Math.sin(spin * 3);
        shell.scale.setScalar(s);
        core.rotation.x += dt * 5; core.rotation.y += dt * 7;
        ctx.particles.spawn({
          x: g.position.x + (Math.random() - 0.5) * 6, y: g.position.y + (Math.random() - 0.5) * 6, z: g.position.z + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 30, vy: 20 + Math.random() * 40, vz: (Math.random() - 0.5) * 30,
          gravity: -20, drag: 2.5, life: 0.3 + Math.random() * 0.25,
          size: pr.radius * 1.1, color: Math.random() < 0.5 ? '#ff9f43' : '#ffd27f', fade: true,
        });
      },
    };
  },
  onHit(ctx, f, c) {
    sphereFlash(ctx, c, { color: '#ffd27f', from: 6, to: f.radius || 36, life: 0.22, alpha: 0.95 });
    ring(ctx, c, { color: '#ff9f43', from: 6, to: (f.radius || 28) * 1.6, life: 0.32, y: c.y * 0 + 6 });
    burst(ctx, c, { color: ['#ff9f43', '#ffd27f', '#e74c3c'], count: 18, speed: 200, up: 30, life: 0.5 });
    // 黑煙
    burst(ctx, c, { color: '#3a2a22', count: 8, speed: 70, up: 50, gravity: -10, drag: 1.2, life: 0.7, size: 6, fade: false });
    addShake(ctx, 4);
  },
});

// 冰霜新星：自身為中心瞬間爆發 (zone, 無 delay → 自訂 zone 處理視覺)
registerVfx('mage_frostnova', {
  zone(ctx, z) {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#bfefff'), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    disc.rotation.x = -Math.PI / 2; disc.position.y = 1; disc.scale.setScalar(z.radius);
    g.add(disc);
    let fired = false; let age = 0;
    return {
      object3D: g,
      update(dt) {
        age += dt;
        if (!fired) {
          fired = true;
          const c = { x: g.position.x, y: 14, z: g.position.z };
          ring(ctx, c, { color: '#74e0ff', from: 10, to: z.radius, life: 0.4, y: 4, alpha: 0.95, ease: true });
          ring(ctx, c, { color: '#ffffff', from: 6, to: z.radius * 0.7, life: 0.3, y: 6 });
          // 冰晶往外飛
          for (let i = 0; i < 26; i++) {
            const a = (i / 26) * Math.PI * 2;
            const spd = 160 + Math.random() * 120;
            ctx.particles.spawn({
              x: c.x, y: 8, z: c.z, vx: Math.cos(a) * spd, vy: 30 + Math.random() * 60, vz: Math.sin(a) * spd,
              gravity: 180, drag: 1.6, life: 0.5 + Math.random() * 0.3, size: 4, color: Math.random() < 0.5 ? '#bfefff' : '#ffffff', fade: true,
            });
          }
          addShake(ctx, 5);
        }
        disc.material.opacity = Math.max(0, 0.32 * (1 - age / Math.max(0.2, z.lifetime)));
        disc.rotation.z += dt * 0.6;
      },
    };
  },
});

// 閃電鏈：穿透。亮白電芯 + 抖動分支
registerVfx('mage_lightning', {
  projectile(ctx, pr) {
    const g = new THREE.Group();
    const len = Math.max(46, pr.radius * 9);
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(pr.radius * 0.7, pr.radius * 0.7, len, 6),
      new THREE.MeshStandardMaterial({ color: 0xeaffff, emissive: new THREE.Color('#b388ff'), emissiveIntensity: 3.4 })
    );
    core.rotation.z = Math.PI / 2; g.add(core);
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(pr.radius * 0.3, pr.radius * 0.3, len * 0.6, 5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#dffaff'), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    g.add(branch);
    return {
      object3D: g,
      update(dt) {
        branch.rotation.set(Math.random() * 0.6 - 0.3, 0, Math.PI / 2 + (Math.random() * 0.8 - 0.4));
        branch.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        core.material.emissiveIntensity = 2.8 + Math.random() * 1.4;
        ctx.particles.spawn({
          x: g.position.x, y: g.position.y, z: g.position.z,
          vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, vz: (Math.random() - 0.5) * 60,
          drag: 4, life: 0.18, size: pr.radius * 1.2, color: '#dffaff', fade: true,
        });
      },
    };
  },
  onHit(ctx, f, c) {
    sphereFlash(ctx, c, { color: '#dffaff', from: 4, to: (f.radius || 24), life: 0.16, alpha: 1 });
    ring(ctx, c, { color: '#b388ff', from: 4, to: (f.radius || 20) * 2, life: 0.26, y: 8 });
    // 分叉電弧：數道短電芒向外炸裂 (呼應閃電鏈分裂)
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.random() * 0.5;
      const len = 22 + Math.random() * 20;
      const geo = new THREE.CylinderGeometry(1.2, 0.2, len, 5);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#dffaff'), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.position.set(c.x + Math.cos(a) * len * 0.5, c.y, c.z + Math.sin(a) * len * 0.5);
      m.rotation.z = Math.PI / 2; m.rotation.y = -a;
      ctx.addTransient(m, 0.18, (mesh, t) => { mesh.material.opacity = (1 - t) * 0.9; mesh.scale.x = 1 + Math.random() * 0.4; });
      m.userData.mat = m.material; m.userData.geo = geo;
    }
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, spd = 220 + Math.random() * 220;
      ctx.particles.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * spd, vy: (Math.random() - 0.3) * 130, vz: Math.sin(a) * spd, drag: 3, life: 0.25, size: 3, color: '#dffaff', fade: true });
    }
    addShake(ctx, 6);
  },
});
