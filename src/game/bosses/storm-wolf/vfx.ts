// @ts-nocheck
// R7 風暴巨狼 技能特效。主題：藍白雷電／電弧／雷擊光柱／鋸齒閃電。
// 效能：一次性走粒子池＋自動回收 transient；無持續 zone（招式多為瞬時）。純視覺層。
import * as THREE from 'three';
import { registerVfx } from '../../render3d/vfx/registry.js';
import { slashBlade, cone, burst, ring, pillar, sphereFlash } from '../../render3d/vfx/lib.js';

const ELEC = '#aee3ff', BLUE = '#7ec8ff', WHITE = '#ffffff';

// 鋸齒閃電：沿抖動曲線的雙層管狀閃電（外藍＋白核），閃爍淡出自動回收
function bolt(ctx, x, z, h, big = false) {
  const { THREE: T, addTransient } = ctx;
  const segs = big ? 10 : 8, jitter = big ? 22 : 15;
  const pts = [];
  for (let i = 0; i <= segs; i++) { const fr = i / segs, edge = (i === 0 || i === segs); pts.push(new T.Vector3(x + (edge ? 0 : (Math.random() - 0.5) * jitter), h * (1 - fr), z + (edge ? 0 : (Math.random() - 0.5) * jitter))); }
  const curve = new T.CatmullRomCurve3(pts);
  const outer = new T.Mesh(new T.TubeGeometry(curve, segs * 2, big ? 5 : 3.4, 5, false), new T.MeshBasicMaterial({ color: new T.Color(BLUE), transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
  const core = new T.Mesh(new T.TubeGeometry(curve, segs * 2, big ? 2 : 1.4, 5, false), new T.MeshBasicMaterial({ color: new T.Color(WHITE), transparent: true, opacity: 0.98, blending: T.AdditiveBlending, depthWrite: false }));
  addTransient(outer, big ? 0.26 : 0.2, (m, t) => { m.material.opacity = (0.5 + 0.5 * Math.random()) * (1 - t); });
  addTransient(core, big ? 0.22 : 0.16, (m, t) => { m.material.opacity = (0.6 + 0.4 * Math.random()) * (1 - t); });
}

// 雷擊：鋸齒閃電 + 光柱 + 球閃 + 雙環 + 火星（瞬時，自動回收）
function strike(ctx, c, big = false) {
  bolt(ctx, c.x, c.z, big ? 260 : 190, big);
  pillar(ctx, c, { color: ELEC, h: big ? 200 : 150, r: big ? 14 : 9, taper: 0.2, life: big ? 0.4 : 0.3, alpha: 0.8, grow: 0.3 });
  sphereFlash(ctx, c, { color: WHITE, from: 4, to: big ? 52 : 34, life: 0.22, alpha: 0.95 });
  ring(ctx, c, { color: BLUE, from: 6, to: big ? 120 : 70, life: 0.34, y: 2, alpha: 0.85, ease: true });
  ring(ctx, c, { color: WHITE, from: 4, to: big ? 70 : 40, life: 0.26, y: 3, alpha: 0.7 });
  burst(ctx, c, { color: [ELEC, WHITE], count: big ? 26 : 14, speed: 260, up: 50, life: 0.45, size: 3.6 });
}

export function loadVfx() {
  // 雷爪連擊：雙層藍電快爪 + 電火星
  registerVfx('boss_wolf_claw', {
    onCast(ctx, f, c) {
      slashBlade(ctx, c, f.facing, { color: [WHITE, ELEC], len: (f.range || 90) * 1.3, swing: 1.1, life: 0.22, y: 14, sparkCount: 12, alpha: 0.97 });
      slashBlade(ctx, c, f.facing, { color: [BLUE, WHITE], len: (f.range || 90) * 0.95, swing: 0.95, life: 0.16, y: 16, sparkCount: 6, alpha: 0.8 });
      cone(ctx, c, f.facing, { color: [ELEC, BLUE, WHITE], count: 14, speed: 300, spread: 0.55, up: 18, life: 0.38, size: 3.2 });
    },
  });

  // 迅雷撲擊：起跳電爆 + 落地鋸齒雷擊
  registerVfx('boss_wolf_pounce', {
    onCast(ctx, f, c) {
      burst(ctx, c, { color: [ELEC, BLUE], count: 20, speed: 220, up: 50, life: 0.42, size: 3.8 });
      cone(ctx, c, f.facing, { color: [ELEC, WHITE], count: 18, speed: 360, spread: 0.35, life: 0.42, size: 3.8 });
    },
    onHit(ctx, f, c) {
      strike(ctx, c, false);
      ctx.sceneMgr.addShake(11); ctx.sceneMgr.addFlash(0.18, ELEC);
    },
  });

  // 暴風咆哮：三重風暴衝擊環 + 放射地面電弧 + 暴風粒子
  registerVfx('boss_wolf_howl', {
    onCast(ctx, f, c) {
      ring(ctx, c, { color: ELEC, from: 12, to: 280, life: 0.55, y: 3, alpha: 0.85, ease: true });
      ring(ctx, c, { color: WHITE, from: 8, to: 200, life: 0.42, y: 4, alpha: 0.7, ease: true });
      ring(ctx, c, { color: BLUE, from: 6, to: 140, life: 0.34, y: 5, alpha: 0.6 });
      sphereFlash(ctx, c, { color: BLUE, from: 8, to: 100, life: 0.36, alpha: 0.65 });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; bolt(ctx, c.x + Math.cos(a) * 120, c.z + Math.sin(a) * 120, 70, false); }
      for (let i = 0; i < 32; i++) { const a = (i / 32) * 6.283; ctx.particles.spawn({ x: c.x, y: 6, z: c.z, vx: Math.cos(a) * 280, vy: 30 + Math.random() * 70, vz: Math.sin(a) * 280, gravity: 80, drag: 1.6, life: 0.55, size: 3.6, color: Math.random() < 0.5 ? ELEC : WHITE, fade: true }); }
      ctx.sceneMgr.addShake(13); ctx.sceneMgr.addFlash(0.22, ELEC);
    },
  });

  // 雷霆亂舞：連續閃現雷擊（multiblink，每次閃現觸發鋸齒落雷 + 周圍亂舞落雷）
  registerVfx('boss_wolf_ult', {
    onCast(ctx, f, c) {
      strike(ctx, c, true);
      for (let i = 0; i < 2; i++) { const a = Math.random() * 6.283, rr = 40 + Math.random() * 70; bolt(ctx, c.x + Math.cos(a) * rr, c.z + Math.sin(a) * rr, 200, false); }
      ctx.sceneMgr.addShake(15); ctx.sceneMgr.addFlash(0.24, ELEC);
    },
  });

  // 死亡演出：雷霆轟頂崩散 — 雙道巨型落雷、雷擊光柱、白爆、一圈亂舞鋸齒落雷、放射電弧與靜電飛濺
  registerVfx('boss_wolf_death', {
    onDeath(ctx, f, c) {
      const { addTransient, sceneMgr, particles } = ctx;
      sceneMgr.addShake(24); sceneMgr.addFlash(0.5, ELEC);
      bolt(ctx, c.x, c.z, 300, true); bolt(ctx, c.x, c.z, 300, true);
      sphereFlash(ctx, c, { color: '#ffffff', from: 12, to: 130, life: 0.4, alpha: 0.98 });
      sphereFlash(ctx, c, { color: BLUE, from: 8, to: 80, life: 0.3, alpha: 0.65 });
      pillar(ctx, c, { color: ELEC, h: 280, r: 22, taper: 0.2, life: 0.5, alpha: 0.85, grow: 0.3 });
      pillar(ctx, c, { color: WHITE, h: 280, r: 9, taper: 0.15, life: 0.42, alpha: 0.95 });
      ring(ctx, c, { color: ELEC, from: 18, to: 340, life: 0.6, y: 3, alpha: 0.9, ease: true });
      ring(ctx, c, { color: WHITE, from: 12, to: 240, life: 0.45, y: 4, alpha: 0.75 });
      ring(ctx, c, { color: BLUE, from: 10, to: 180, life: 0.7, y: 2, alpha: 0.6, ease: true });
      // 周圍一圈亂舞鋸齒落雷
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, rr = 70 + Math.random() * 90; bolt(ctx, c.x + Math.cos(a) * rr, c.z + Math.sin(a) * rr, 180 + Math.random() * 80, Math.random() < 0.4); }
      // 放射電火星 + 靜電飛濺
      burst(ctx, c, { color: [ELEC, WHITE, BLUE], count: 48, speed: 360, up: 80, life: 0.7, size: 4.5 });
      for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, rr = Math.random() * 60; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 6 + Math.random() * 40, z: c.z + Math.sin(a) * rr, vx: Math.cos(a) * (200 + Math.random() * 200), vy: 40 + Math.random() * 120, vz: Math.sin(a) * (200 + Math.random() * 200), gravity: 120, drag: 1.4, life: 0.6 + Math.random() * 0.4, size: 3 + Math.random() * 2.5, color: Math.random() < 0.5 ? ELEC : WHITE, fade: true }); }
    },
  });
}
