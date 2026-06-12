// 戰士：厚重、物理、地面感。鋼鐵月牙斬 / 衝鋒塵爆 / 金色戰吼。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { slashBlade, cone, ring, column, burst, addShake, addFlash, ultimateBurst } from './lib.js';

// 大絕招 — 天崩劍擊：巨型月牙連斬 + 衝擊波
registerVfx('warrior_ultimate', {
  onCast(ctx, f, c) {
    const R = f.range || 195;
    ultimateBurst(ctx, c, { color: '#ffcaa0', radius: R, pillarH: 175, pillarR: 34, shake: 22, flash: 0.36 });
    for (let i = 0; i < 5; i++) slashBlade(ctx, c, f.facing + (i - 2) * 0.42, { color: i === 2 ? '#ffffff' : '#ffcaa0', len: R * 1.25, w: 30 + (i === 2 ? 12 : 0), swing: 2.4, life: 0.34 });
    ring(ctx, c, { color: '#ff8a5b', from: 20, to: R * 1.2, life: 0.5, y: 2, alpha: 0.8, ease: true }); // 前向地裂衝擊波
    cone(ctx, c, f.facing, { color: ['#ffd166', '#ff6b5b', '#ffffff'], count: 34, speed: 420, spread: 1.2, offset: R * 0.4, up: 70, life: 0.55, size: 5.5 });
    addShake(ctx, 10);
  },
});

registerVfx('warrior_slash', {
  onCast(ctx, f, c) {
    // 鋼鐵月牙：白熱刀光掃過 + 火花
    slashBlade(ctx, c, f.facing, { color: '#ffffff', len: f.range * 1.1, w: 16, swing: (f.arc || 1.3), life: 0.22 });
    slashBlade(ctx, c, f.facing, { color: f.color, len: f.range, w: 26, swing: (f.arc || 1.3), life: 0.26 });
    cone(ctx, c, f.facing, { color: ['#ffd166', '#ff6b5b', '#ffffff'], count: 12, speed: 230, spread: (f.arc || 1.3) / 2, offset: f.range * 0.4, up: 40, life: 0.35 });
    addShake(ctx, 4);
  },
});

registerVfx('warrior_charge', {
  onCast(ctx, f, c) {
    // 衝鋒：地面衝擊環 + 身後塵土 + 前向速度線
    ring(ctx, c, { color: '#ff8a5b', from: 10, to: 90, life: 0.4, y: 2, alpha: 0.85 });
    cone(ctx, c, f.facing + Math.PI, { color: ['#caa472', '#8a6a44'], count: 18, speed: 180, spread: 0.9, up: 60, gravity: 200, life: 0.5, size: 4 });
    cone(ctx, c, f.facing, { color: '#ffd9b0', count: 10, speed: 360, spread: 0.18, life: 0.25, size: 3 });
    addShake(ctx, 6);
  },
});

registerVfx('warrior_warcry', {
  onCast(ctx, f, c) {
    // 戰吼：雙金環擴散 + 上升火星柱 + 地面閃光
    ring(ctx, c, { color: '#ffd166', from: 14, to: 120, life: 0.5, y: 3, alpha: 0.9, ease: true });
    ring(ctx, c, { color: '#ffffff', from: 8, to: 80, life: 0.4, y: 5, alpha: 0.7 });
    column(ctx, c, { color: ['#ffd166', '#ffe9a8'], count: 26, radius: 30, speed: 150, life: 0.7 });
    burst(ctx, c, { color: '#ffd166', count: 16, speed: 120, up: 60, flat: true, life: 0.5 });
    addShake(ctx, 5);
    addFlash(ctx, 0.16, '#ffd166');
  },
});
