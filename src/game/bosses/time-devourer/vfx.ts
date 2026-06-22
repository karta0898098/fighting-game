// @ts-nocheck
import * as THREE from 'three';
import { registerVfx } from '../../render3d/vfx/registry.js';
import { burst, ring, sphereFlash } from '../../render3d/vfx/lib.js';

export function loadVfx() {
  registerVfx('boss_time_claw', {
    melee(ctx, fx) { burst(ctx, fx, { color: ['#d6b45f', '#ffffff'], count: 24, speed: 260, life: 0.5, size: 4 }); },
  });
  registerVfx('boss_time_breath', {
    projectile(ctx, p) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(p.radius || 16, 1), new THREE.MeshBasicMaterial({ color: '#70e6ff', transparent: true, opacity: 0.8 }));
      return { object3D: m, update(dt) { m.rotation.x += dt * 5; m.rotation.y += dt * 8; } };
    },
  });
  registerVfx('boss_time_fall', {
    zone(ctx, z) { ring(ctx, { x: z.x, y: 2, z: z.y }, { color: '#d06cff', radius: z.radius || 100, life: 0.5 }); return null; },
  });
  registerVfx('boss_time_ult', {
    ultimate(ctx, fx) { sphereFlash(ctx, fx, { color: '#ff6b9f', radius: 320, life: 0.8 }); },
  });
  registerVfx('boss_time_dragon_death', {
    death(ctx, fx) { burst(ctx, fx, { color: ['#d6b45f', '#70e6ff', '#d06cff'], count: 90, speed: 520, up: 180, life: 1.4, size: 8 }); },
  });
}
