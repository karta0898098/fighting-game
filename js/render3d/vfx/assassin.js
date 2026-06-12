// 刺客：迅捷銳利、暗影。交叉快刀 / 瞬步殘影煙 / 背刺紫爆。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { slashBlade, ring, sphereFlash, burst, cone, column, addShake, addFlash, ultimateBurst } from './lib.js';

// 大絕招 — 影殺·千刀：環身亂刀 + 紫爆
registerVfx('assassin_ultimate', {
  onCast(ctx, f, c) {
    const R = f.range || 160;
    ultimateBurst(ctx, c, { color: '#e056fd', radius: R, pillar: false, shake: 16, flash: 0.3 });
    for (let i = 0; i < 20; i++) slashBlade(ctx, c, (i / 20) * Math.PI * 2, { color: i % 2 ? '#ffffff' : '#e056fd', len: R * (i % 2 ? 1.0 : 1.18), w: 9, swing: 1.6, life: 0.32 });
    ring(ctx, c, { color: '#e056fd', from: 16, to: R * 1.25, life: 0.5, y: 4, alpha: 0.7, ease: true });
    sphereFlash(ctx, c, { color: '#ffffff', from: 8, to: R * 0.45, life: 0.24, alpha: 0.9 });
    burst(ctx, c, { color: ['#9b59b6', '#e056fd', '#ffffff'], count: 44, speed: 320, up: 40, life: 0.55, size: 4 });
  },
});

registerVfx('assassin_slash', {
  onCast(ctx, f, c) {
    // 兩道交叉細刃，快而薄
    slashBlade(ctx, c, f.facing + 0.35, { color: '#e9d5ff', len: f.range * 1.1, w: 6, swing: -0.7, life: 0.16 });
    slashBlade(ctx, c, f.facing - 0.35, { color: f.color, len: f.range * 1.1, w: 6, swing: 0.7, life: 0.16 });
    cone(ctx, c, f.facing, { color: '#c39bd3', count: 8, speed: 260, spread: 0.4, offset: f.range * 0.4, life: 0.22, size: 2.4 });
  },
});

registerVfx('assassin_blink', {
  onCast(ctx, f, c) {
    // 目的地紫煙湧現 + 環 + 上升殘影
    ring(ctx, c, { color: '#c39bd3', from: 4, to: 50, life: 0.34, y: 6, alpha: 0.9 });
    burst(ctx, c, { color: ['#9b59b6', '#c39bd3', '#3a2150'], count: 22, speed: 130, up: 40, gravity: -20, drag: 1.4, life: 0.5, size: 5 });
    column(ctx, c, { color: '#c39bd3', count: 10, radius: 12, speed: 120, life: 0.4, size: 3 });
  },
});

registerVfx('assassin_backstab', {
  onCast(ctx, f, c) {
    // 致命一擊 (重爆)：洋紅球爆 + 巨型碎刃 + 雙環 + 閃光
    sphereFlash(ctx, c, { color: '#e056fd', from: 6, to: 58, life: 0.22, alpha: 0.98 });
    slashBlade(ctx, c, f.facing, { color: '#ffffff', len: f.range * 1.4, w: 22, swing: (f.arc || 1.6), life: 0.24 });
    cone(ctx, c, f.facing, { color: ['#e056fd', '#ffffff', '#9b59b6'], count: 28, speed: 380, spread: 0.7, offset: f.range * 0.3, up: 40, life: 0.45, size: 4 });
    ring(ctx, c, { color: '#e056fd', from: 6, to: 90, life: 0.32, y: 8, ease: true });
    addShake(ctx, 9);
    addFlash(ctx, 0.22, '#e056fd');
  },
});
