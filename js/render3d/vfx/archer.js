// 弓箭手：精準、輕盈。流線箭矢 / 多重散射 / 後撤陷阱網。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { ring, burst, cone } from './lib.js';

// 大絕招 — 萬箭齊發：箭雨自天而降 + 地面環
registerVfx('archer_ultimate', {
  onCast(ctx, f, c) {
    const R = f.radius || 230;
    ring(ctx, c, { color: '#7bed9f', from: 20, to: R, life: 0.62, y: 4, ease: true });
    ring(ctx, c, { color: '#d8ffe6', from: 12, to: R * 0.7, life: 0.5, y: 6, alpha: 0.7 });
    ctx.sceneMgr.addShake(10);
    ctx.sceneMgr.addFlash(0.16, '#7bed9f');
    for (let i = 0; i < 130; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * R;
      ctx.particles.spawn({ x: c.x + Math.cos(a) * rr, y: 320 + Math.random() * 240, z: c.z + Math.sin(a) * rr, vx: 0, vy: -560, vz: 0, drag: 0, gravity: 0, life: 0.8, size: 5, color: Math.random() < 0.5 ? '#7bed9f' : '#d8ffe6', fade: false });
    }
  },
});

function makeArrow(ctx, pr, tint) {
  const g = new THREE.Group();
  const col = new THREE.Color(tint || pr.color);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(pr.radius * 0.35, pr.radius * 0.35, pr.radius * 6, 6),
    new THREE.MeshStandardMaterial({ color: 0xede3c8, emissive: col, emissiveIntensity: 0.6 })
  );
  shaft.rotation.z = Math.PI / 2; g.add(shaft);
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(pr.radius * 0.8, pr.radius * 2, 7),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: col, emissiveIntensity: 1.6, metalness: 0.6, roughness: 0.3 })
  );
  tip.rotation.z = -Math.PI / 2; tip.position.x = pr.radius * 4; g.add(tip);
  // 尾羽
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(
      new THREE.BoxGeometry(pr.radius * 1.6, 0.6, pr.radius * 1.2),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 })
    );
    f.position.x = -pr.radius * 2.6; f.rotation.x = (i / 3) * Math.PI; g.add(f);
  }
  return {
    object3D: g,
    update() {
      ctx.particles.spawn({
        x: g.position.x, y: g.position.y, z: g.position.z,
        vx: 0, vy: 0, vz: 0, drag: 5, life: 0.2, size: pr.radius * 1.1, color: tint || pr.color, fade: true,
      });
    },
  };
}

registerVfx('archer_arrow', {
  projectile(ctx, pr) { return makeArrow(ctx, pr, '#2ecc71'); },
  onHit(ctx, f, c) {
    ring(ctx, c, { color: '#2ecc71', from: 4, to: (f.radius || 16) * 2.2, life: 0.26, y: 8 });
    burst(ctx, c, { color: ['#2ecc71', '#7bed9f'], count: 12, speed: 180, up: 40, life: 0.4, size: 2.6 });
  },
});

registerVfx('archer_multishot', {
  projectile(ctx, pr) { return makeArrow(ctx, pr, '#7bed9f'); },
  onHit(ctx, f, c) {
    burst(ctx, c, { color: '#7bed9f', count: 9, speed: 160, up: 30, life: 0.35, size: 2.4 });
  },
});

// 後撤陷阱：地面網 (lifetime 4s)
registerVfx('archer_trap', {
  zone(ctx, z) {
    const g = new THREE.Group();
    const col = new THREE.Color('#1abc9c');
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    disc.rotation.x = -Math.PI / 2; disc.position.y = 1; disc.scale.setScalar(z.radius); g.add(disc);
    // 交叉網線
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(z.radius * 2, 0.6, 1.4),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      line.position.y = 1.4; line.rotation.y = -a; g.add(line);
    }
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1, 40),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    rim.rotation.x = -Math.PI / 2; rim.position.y = 1.5; rim.scale.setScalar(z.radius); g.add(rim);
    let fired = false; let age = 0;
    return {
      object3D: g,
      update(dt) {
        age += dt;
        if (!fired) { fired = true; const c = { x: g.position.x, y: 10, z: g.position.z }; ring(ctx, c, { color: '#1abc9c', from: 8, to: z.radius, life: 0.4, y: 4 }); cone(ctx, c, 0, { color: '#caa472', count: 14, speed: 120, spread: Math.PI, up: 60, life: 0.5 }); }
        const pulse = 0.5 + 0.5 * Math.sin(age * 5);
        disc.material.opacity = 0.14 + 0.1 * pulse;
        g.rotation.y += dt * 0.5;
      },
    };
  },
});
