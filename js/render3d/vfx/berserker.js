// 狂戰士：狂暴、血腥。雙斧血斬 / 血怒爆發 / 旋風刃環。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { slashBlade, ring, pillar, column, burst, cone, addShake, addFlash, ultimateBurst } from './lib.js';

// 大絕招 — 血之狂亂：血焰柱 + 多重旋轉刃環
registerVfx('berserker_ultimate', {
  onCast(ctx, f, c) {
    const R = f.range || 145;
    ultimateBurst(ctx, c, { color: '#ff3b2f', radius: R, pillarH: 185, pillarR: 32, shake: 22, flash: 0.4 });
    for (let k = 0; k < 6; k++) {
      const geo = new THREE.RingGeometry(0.55, 1, 48);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3b2f'), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2; m.position.set(c.x, 10 + k * 6, c.z);
      const baseR = R * (0.6 + k * 0.13);
      ctx.addTransient(m, 0.5, (mesh, t) => { mesh.scale.setScalar(baseR * (0.6 + 0.5 * t)); mesh.rotation.z = t * Math.PI * 4 + k; mesh.material.opacity = (1 - t) * 0.8; });
      m.userData.mat = m.material; m.userData.geo = geo;
    }
    column(ctx, c, { color: ['#ff3b2f', '#922b21'], count: 30, radius: R * 0.4, speed: 220, life: 0.7, size: 5 });
    burst(ctx, c, { color: ['#ff3b2f', '#922b21', '#ffffff'], count: 44, speed: 320, up: 30, flat: true, life: 0.6, size: 5 });
    addFlash(ctx, 0.28, '#ff1a0f');
  },
});

registerVfx('berserker_axes', {
  onCast(ctx, f, c) {
    // 雙斧交叉劈砍 + 血色火花
    slashBlade(ctx, c, f.facing + 0.25, { color: '#ff4d4d', len: f.range * 1.1, w: 14, swing: -0.8, life: 0.2 });
    slashBlade(ctx, c, f.facing - 0.25, { color: '#cd6155', len: f.range * 1.1, w: 14, swing: 0.8, life: 0.2 });
    cone(ctx, c, f.facing, { color: ['#ff4d4d', '#922b21', '#ffffff'], count: 12, speed: 240, spread: 0.6, offset: f.range * 0.4, up: 30, life: 0.35 });
    addShake(ctx, 4);
  },
});

registerVfx('berserker_rage', {
  onCast(ctx, f, c) {
    // 血怒爆發：地面血環 + 上升血焰柱 + 暗紅地燒 + 震動閃光
    pillar(ctx, c, { color: '#e74c3c', h: 130, r: 26, taper: 0.5, life: 0.6, alpha: 0.6, grow: 0.5 });
    ring(ctx, c, { color: '#922b21', from: 14, to: 110, life: 0.5, y: 3, ease: true, alpha: 0.9 });
    column(ctx, c, { color: ['#e74c3c', '#ff7043', '#3a0d0d'], count: 32, radius: 28, speed: 180, life: 0.8, size: 4 });
    burst(ctx, c, { color: '#e74c3c', count: 18, speed: 160, up: 80, flat: true, life: 0.6 });
    addShake(ctx, 8); addFlash(ctx, 0.2, '#e74c3c');
  },
});

registerVfx('berserker_whirlwind', {
  onCast(ctx, f, c) {
    // 旋風斬 (全方位)：多重旋轉刃環 + 血色拖尾環 + 火花
    const color = new THREE.Color('#ec7063');
    for (let k = 0; k < 3; k++) {
      const geo = new THREE.RingGeometry(0.55, 1, 48);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2; m.position.set(c.x, 14 + k * 6, c.z);
      const baseR = f.range * (0.7 + k * 0.18);
      ctx.addTransient(m, 0.4, (mesh, t) => { mesh.scale.setScalar(baseR * (0.6 + 0.5 * t)); mesh.rotation.z = t * Math.PI * 4 + k; mesh.material.opacity = (1 - t) * 0.8; });
      m.userData.mat = m.material; m.userData.geo = geo;
    }
    // 數道掃刃
    for (let i = 0; i < 6; i++) {
      slashBlade(ctx, c, (i / 6) * Math.PI * 2, { color: i % 2 ? '#ff4d4d' : '#ec7063', len: f.range, w: 10, swing: 1.2, life: 0.34 });
    }
    burst(ctx, c, { color: ['#ff4d4d', '#922b21'], count: 24, speed: 260, up: 20, flat: true, life: 0.5 });
    addShake(ctx, 9);
  },
});
