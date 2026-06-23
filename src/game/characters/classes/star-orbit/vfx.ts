// @ts-nocheck
import * as THREE from 'three';
import { registerVfx } from '../../../render3d/vfx/registry.js';
import { ring, sphereFlash, burst, cone, addShake, addFlash } from '../../../render3d/vfx/lib.js';

const BLUE = '#5ad7ff';
const WHITE = '#f2f7ff';
const GOLD = '#ffd166';
const DEEP = '#153b66';

function starBeam(ctx, c, facing, opt = {}) {
  const range = opt.range || 680;
  const width = opt.width || opt.radius || 30;
  const color = new THREE.Color(opt.color || BLUE);
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(range, 8, width),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opt.alpha || 0.72, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(range, 4, width * 2.8),
    new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  const rail = new THREE.Mesh(
    new THREE.PlaneGeometry(range, width * 3.4),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  const g = new THREE.Group();
  const dx = Math.cos(facing), dz = Math.sin(facing);
  g.position.set(c.x + dx * range * 0.5, 14, c.z + dz * range * 0.5);
  g.rotation.y = -facing;
  rail.rotation.x = -Math.PI / 2;
  rail.position.y = -11.5;
  g.add(rail, glow, core);
  ctx.addTransient(g, opt.life || 0.26, (mesh, t) => {
    const scaleY = 1 + Math.sin(t * Math.PI) * 0.75;
    core.scale.z = scaleY;
    glow.scale.z = 1 + Math.sin(t * Math.PI) * 0.75;
    rail.scale.y = 0.55 + t * 0.85;
    core.material.opacity = (1 - t) * (opt.alpha || 0.72);
    glow.material.opacity = (1 - t) * 0.34;
    rail.material.opacity = (1 - t) * 0.24;
  });
  burst(ctx, { x: c.x + dx * Math.min(range, 150), y: 20, z: c.z + dz * Math.min(range, 150) }, { color: [WHITE, opt.color || BLUE, GOLD], count: opt.final ? 36 : 24, speed: opt.final ? 460 : 340, up: 65, life: 0.5, size: opt.final ? 5.8 : 4.8 });
}

function starGateBeam(ctx, c, facing, opt = {}) {
  const range = opt.range || 780;
  const width = opt.width || opt.radius || 48;
  const final = !!opt.final;
  const color = final ? GOLD : BLUE;
  const dx = Math.cos(facing), dz = Math.sin(facing);
  const gateDist = final ? 104 : 94;
  const gate = new THREE.Group();
  gate.position.set(c.x + dx * gateDist, 34, c.z + dz * gateDist);
  gate.rotation.y = -facing + Math.PI / 2;

  const gateMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: final ? 0.92 : 0.78, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const whiteMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(WHITE), transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const deepMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(DEEP), transparent: true, opacity: 0.54, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const portalR = final ? 74 : 58;
  const outer = new THREE.Mesh(new THREE.TorusGeometry(portalR, final ? 4.2 : 3.2, 10, 80), gateMat);
  const middle = new THREE.Mesh(new THREE.TorusGeometry(portalR * 0.78, final ? 1.8 : 1.4, 8, 64), whiteMat);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(portalR * 0.5, 1.2, 8, 48), gateMat);
  const veil = new THREE.Mesh(new THREE.CircleGeometry(portalR * 0.7, 64), deepMat);
  const rift = new THREE.Mesh(new THREE.RingGeometry(portalR * 0.12, portalR * 0.42, 7), whiteMat);
  const slash = new THREE.Mesh(new THREE.PlaneGeometry(portalR * 0.18, portalR * 1.25), whiteMat);
  slash.rotation.z = 0.55;
  gate.add(veil, outer, middle, inner, rift, slash);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.BoxGeometry(final ? 17 : 12, final ? 3.2 : 2.4, 2), i % 3 === 0 ? whiteMat : gateMat);
    shard.position.set(Math.cos(a) * portalR * 0.98, Math.sin(a) * portalR * 0.98, 0);
    shard.rotation.z = a + Math.PI / 2;
    gate.add(shard);
  }
  for (const child of gate.children) child.userData.baseOpacity = child.material.opacity;
  ctx.addTransient(gate, final ? 0.52 : 0.42, (m, t) => {
    outer.rotation.z += final ? 0.13 : 0.09;
    middle.rotation.z -= final ? 0.19 : 0.13;
    inner.rotation.z += final ? 0.25 : 0.18;
    veil.rotation.z -= final ? 0.16 : 0.11;
    rift.rotation.z += final ? 0.42 : 0.3;
    slash.rotation.z = 0.55 + Math.sin(t * Math.PI * 5) * 0.08;
    const pulse = 1 + Math.sin(t * Math.PI) * (final ? 0.22 : 0.15);
    m.scale.setScalar(pulse);
    for (const child of m.children) {
      const flicker = 0.82 + 0.18 * Math.sin(t * 46 + child.id);
      child.material.opacity = child.userData.baseOpacity * (1 - t * 0.72) * flicker;
    }
  });

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.42, width * 0.72, range, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: final ? 0.76 : 0.58, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  const halo = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 1.1, width * 1.65, range, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(WHITE), transparent: true, opacity: final ? 0.3 : 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  const beam = new THREE.Group();
  beam.position.set(c.x + dx * (gateDist + range * 0.5), 34, c.z + dz * (gateDist + range * 0.5));
  beam.rotation.z = Math.PI / 2;
  beam.rotation.y = -facing;
  beam.add(halo, core);
  ctx.addTransient(beam, final ? 0.46 : 0.34, (m, t) => {
    const swell = 1 + Math.sin(t * Math.PI) * (final ? 0.55 : 0.35);
    core.scale.x = core.scale.z = swell;
    halo.scale.x = halo.scale.z = 1 + Math.sin(t * Math.PI) * 0.8;
    core.material.opacity = (1 - t) * (final ? 0.76 : 0.58);
    halo.material.opacity = (1 - t) * (final ? 0.3 : 0.2);
  });

  ring(ctx, { x: c.x + dx * gateDist, y: c.y, z: c.z + dz * gateDist }, { color, from: final ? 34 : 24, to: final ? 176 : 132, life: final ? 0.54 : 0.42, y: 4, alpha: 0.92, ease: true });
  burst(ctx, { x: c.x + dx * gateDist, y: 34, z: c.z + dz * gateDist }, { color: [WHITE, color, GOLD], count: final ? 58 : 38, speed: final ? 560 : 400, up: final ? 100 : 76, life: 0.62, size: final ? 6 : 4.8 });
}

registerVfx('star_orbit_shot', {
  projectile(ctx, p) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry((p.radius || 8) * 1.25, 12, 10), new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0.9 }));
    const halo = new THREE.Mesh(new THREE.TorusGeometry((p.radius || 8) * 1.45, 1.1, 6, 18), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }));
    g.add(core);
    g.add(halo);
    let emit = 0;
    return { object3D: g, update(dt) {
      emit -= dt;
      if (emit <= 0) {
        emit = 0.035;
        ctx.particles.spawn({ x: g.position.x, y: 8, z: g.position.z, vx: (Math.random() - 0.5) * 25, vy: 8, vz: (Math.random() - 0.5) * 25, drag: 1.5, life: 0.28, size: 3.2, color: Math.random() < 0.5 ? WHITE : BLUE, fade: true });
      }
      core.rotation.y += dt * 7;
      halo.rotation.x += dt * 9;
      halo.rotation.y += dt * 6;
    } };
  },
  onHit(ctx, f, c) {
    sphereFlash(ctx, c, { color: BLUE, from: 4, to: 34, life: 0.22, alpha: 0.75 });
    burst(ctx, c, { color: [WHITE, BLUE], count: 10, speed: 150, up: 35, life: 0.35, size: 3.2 });
  },
});

registerVfx('star_orbit_cannon', {
  onCast(ctx, f, c) {
    addShake(ctx, f.final ? 14 : 10);
    starBeam(ctx, c, f.facing, { color: f.final ? GOLD : BLUE, range: f.range || 720, width: f.width || f.radius || 42, final: f.final, alpha: f.final ? 0.82 : 0.74, life: f.final ? 0.38 : 0.34 });
    ring(ctx, c, { color: f.final ? GOLD : BLUE, from: 14, to: f.final ? 128 : 104, life: 0.42, y: 4, alpha: 0.9, ease: true });
    sphereFlash(ctx, c, { color: WHITE, from: 8, to: f.final ? 74 : 56, life: 0.24, alpha: 0.58 });
    cone(ctx, c, f.facing + Math.PI, { color: [WHITE, BLUE, GOLD], count: f.final ? 36 : 28, speed: f.final ? 420 : 340, spread: 0.34, life: 0.42, size: f.final ? 5.2 : 4.4 });
  },
  onHit(ctx, f, c) {
    this.onCast(ctx, f, c);
  },
});

registerVfx('star_orbit_guard', {
  onCast(ctx, f, c) {
    ring(ctx, c, { color: GOLD, from: 18, to: 118, life: 0.48, y: 4, alpha: 0.9, ease: true });
    ring(ctx, c, { color: BLUE, from: 8, to: 72, life: 0.36, y: 8, alpha: 0.7 });
    sphereFlash(ctx, c, { color: WHITE, from: 8, to: 66, life: 0.34, alpha: 0.68 });
    burst(ctx, c, { color: [WHITE, BLUE, GOLD], count: 18, speed: 210, up: 80, life: 0.55, size: 4.4 });
  },
});

registerVfx('star_orbit_shard', {
  onCast(ctx, f, c) {
    const n = Math.max(1, Math.min(3, f.shards || 3));
    if (n >= 2) ring(ctx, c, { color: n >= 3 ? GOLD : BLUE, from: f.radius || 62, to: (f.radius || 62) + 10, inner: 0.965, life: 0.18, y: 3.5, alpha: n >= 3 ? 0.42 : 0.28 });
    for (let i = 0; i < n; i++) {
      const a = (f.angle || 0) + (i / n) * Math.PI * 2;
      const color = i === 2 ? GOLD : BLUE;
      const g = new THREE.Group();
      const matCore = new THREE.MeshBasicMaterial({ color: new THREE.Color(WHITE), transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false });
      const matGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const core = new THREE.Mesh(new THREE.SphereGeometry(i === 2 ? 7.2 : 6.2, 14, 10), matCore);
      const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(i === 2 ? 12.5 : 10.5, 1), matGlow);
      const star = new THREE.Mesh(new THREE.TorusGeometry(i === 2 ? 10.5 : 8.8, 2.2, 5, 5), matGlow);
      const orbitA = new THREE.Mesh(new THREE.TorusGeometry(i === 2 ? 15 : 12, 0.9, 8, 28), matGlow);
      const orbitB = new THREE.Mesh(new THREE.TorusGeometry(i === 2 ? 18 : 14, 0.75, 8, 30), matGlow);
      orbitA.rotation.x = Math.PI / 2.8;
      orbitB.rotation.z = Math.PI / 2.6;
      g.add(shell, core, star, orbitA, orbitB);
      g.position.set(c.x + Math.cos(a) * (f.radius || 72), 31 + Math.sin(a * 2) * 4, c.z + Math.sin(a) * (f.radius || 72));
      ctx.addTransient(g, f.life || 0.14, (m, t) => {
        m.rotation.x += 0.08;
        m.rotation.y += 0.2;
        m.rotation.z += 0.05;
        const pulse = 1 + Math.sin(t * Math.PI) * 0.08;
        m.scale.setScalar(pulse);
        for (const child of m.children) {
          child.material.opacity = child === core ? 0.72 : 0.44;
        }
      });
      ctx.particles.spawn({
        x: g.position.x - Math.cos(a) * 14, y: g.position.y - 1, z: g.position.z - Math.sin(a) * 14,
        vx: -Math.sin(a) * 26, vy: 10, vz: Math.cos(a) * 26,
        drag: 1.3, gravity: 20, life: 0.18, size: i === 2 ? 4.2 : 3.4, color: [WHITE, color], fade: true,
      });
    }
  },
});

registerVfx('star_orbit_ultimate', {
  onCast(ctx, f, c) {
    addShake(ctx, f.final ? 20 : 12);
    if (f.final) addFlash(ctx, 0.18, WHITE);
    starGateBeam(ctx, c, f.facing, { range: f.range || 780, width: f.width || f.radius || 48, final: f.final });
    const dx = Math.cos(f.facing), dz = Math.sin(f.facing);
    const gateDist = f.final ? 104 : 94;
    ring(ctx, { x: c.x + dx * gateDist, y: c.y, z: c.z + dz * gateDist }, { color: f.final ? GOLD : DEEP, from: 8, to: f.final ? 92 : 66, life: 0.34, y: 12, alpha: 0.64 });
  },
  onHit(ctx, f, c) {
    this.onCast(ctx, f, c);
  },
});
