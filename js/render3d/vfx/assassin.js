// 刺客：迅捷銳利、暗影。交叉快刀 / 瞬步殘影煙 / 背刺紫爆。
import * as THREE from 'three';
import { registerVfx } from './registry.js';
import { slashBlade, ring, sphereFlash, burst, cone, column, addShake, addFlash, ultimateBurst } from './lib.js';

// 大絕招 — 影殺·千刀：環身亂刀 + 紫爆
registerVfx('assassin_ultimate', {
  onCast(ctx, f, c) {
    ultimateBurst(ctx, c, { color: '#e056fd', radius: 150, pillar: false, shake: 14, flash: 0.28 });
    for (let i = 0; i < 12; i++) slashBlade(ctx, c, (i / 12) * Math.PI * 2, { color: i % 2 ? '#ffffff' : '#e056fd', len: f.range || 130, w: 8, swing: 1.4, life: 0.3 });
    burst(ctx, c, { color: ['#9b59b6', '#e056fd', '#ffffff'], count: 30, speed: 280, up: 30, life: 0.5 });
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
    // 致命一擊：洋紅球爆 + 前向碎刃 + 閃光
    sphereFlash(ctx, c, { color: '#e056fd', from: 6, to: 46, life: 0.2, alpha: 0.95 });
    slashBlade(ctx, c, f.facing, { color: '#ffffff', len: f.range * 1.3, w: 18, swing: (f.arc || 1.5), life: 0.22 });
    cone(ctx, c, f.facing, { color: ['#e056fd', '#ffffff', '#9b59b6'], count: 20, speed: 320, spread: 0.6, offset: f.range * 0.3, up: 30, life: 0.4 });
    ring(ctx, c, { color: '#e056fd', from: 6, to: 70, life: 0.3, y: 8 });
    addShake(ctx, 7);
    addFlash(ctx, 0.18, '#e056fd');
  },
});
