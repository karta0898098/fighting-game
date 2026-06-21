// @ts-nocheck
// R5 廢墟古代巨兵 技能特效。主題：石塵震波／符文藍雷射／橙焰巨鋸／核心過載藍白爆。
// 效能：一次性走粒子池＋自動回收 transient；zone 只建少量網格、update 內輕量更新。純視覺層。
import * as THREE from 'three';
import { registerVfx } from '../../render3d/vfx/registry.js';
import { burst, ring, column, sphereFlash } from '../../render3d/vfx/lib.js';

const STONE = '#b0a99f', RUNE = '#49d0ff', RUNED = '#9fe8ff', SAW = '#ff7043', SPARK = '#ffd166';
const basicAdd = (color, op) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
const addRing = (color, op = 0.85) => new THREE.Mesh(new THREE.RingGeometry(0.84, 1, 48), basicAdd(color, op));
const addCol = (color, op, r1, r2, h) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 12, 1, true), basicAdd(color, op));

export function loadVfx() {
  // 踏地震波：雙重擴張石塵環 + 放射地裂 + 揚塵柱 + 震動
  registerVfx('boss_titan_stomp', {
    zone(ctx, z) {
      const R = z.radius || 160;
      const g = new THREE.Group();
      const wave = addRing(STONE, 0.85); wave.position.y = 2; g.add(wave);
      const wave2 = addRing(SPARK, 0.6); wave2.position.y = 2.5; g.add(wave2);
      const cracks = [];
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; const cr = new THREE.Mesh(new THREE.PlaneGeometry(R * 0.9, R * 0.06), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5a4f45'), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); cr.rotation.x = -Math.PI / 2; cr.rotation.z = a; cr.position.set(Math.cos(a) * R * 0.45, 0.6, Math.sin(a) * R * 0.45); g.add(cr); cracks.push(cr); }
      let t = 0, kicked = false;
      return {
        object3D: g,
        update(dt) {
          t += dt; const e = Math.min(1, t / 0.4);
          wave.scale.setScalar(R * (0.2 + e)); wave.material.opacity = 0.85 * (1 - e);
          wave2.scale.setScalar(R * (0.1 + e * 0.8)); wave2.material.opacity = 0.6 * (1 - e);
          for (const cr of cracks) cr.material.opacity = 0.7 * Math.max(0, 1 - t * 1.4);
          if (!kicked) {
            kicked = true;
            burst(ctx, { x: g.position.x, y: 3, z: g.position.z }, { color: [STONE, '#7d7066'], count: 30, speed: 230, up: 60, flat: true, life: 0.55, size: 5.5 });
            column(ctx, { x: g.position.x, y: 0, z: g.position.z }, { color: ['#7d7066', STONE], count: 18, radius: R * 0.35, speed: 240, life: 0.7, size: 6 });
            ctx.sceneMgr.addShake(13); ctx.sceneMgr.addFlash(0.1, STONE);
          }
        },
      };
    },
  });

  // 殲滅雷射：符文藍能量光束（外暈＋亮核）＋ 灼地符文環 ＋ 螺旋上升藍火星
  registerVfx('boss_titan_laser', {
    zone(ctx, z) {
      const R = z.radius || 90;
      const g = new THREE.Group();
      const halo = addCol(RUNED, 0.22, R * 1.0, R * 0.8, 240); halo.position.y = 120; g.add(halo);
      const beam = addCol(RUNE, 0.5, R * 0.7, R * 0.5, 240); beam.position.y = 120; g.add(beam);
      const coreBeam = addCol('#ffffff', 0.75, R * 0.3, R * 0.2, 240); coreBeam.position.y = 120; g.add(coreBeam);
      const spot = new THREE.Mesh(new THREE.CircleGeometry(R, 28), basicAdd(RUNED, 0.6)); spot.rotation.x = -Math.PI / 2; spot.position.y = 1; g.add(spot);
      const runeRing = addRing(RUNED, 0.7); runeRing.scale.setScalar(R * 1.3); runeRing.position.y = 2; g.add(runeRing);
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt; const pulse = 0.85 + 0.15 * Math.sin(t * 20);
          halo.scale.x = halo.scale.z = pulse * 1.05; beam.scale.x = beam.scale.z = pulse; coreBeam.scale.x = coreBeam.scale.z = pulse;
          spot.material.opacity = 0.5 + 0.2 * Math.sin(t * 12);
          runeRing.rotation.z += dt * 1.5; runeRing.material.opacity = 0.45 + 0.2 * Math.sin(t * 8);
          em -= dt;
          if (em <= 0) { em = 0.025; const a = Math.random() * 6.283, rr = R * (0.4 + Math.random() * 0.7); ctx.particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 2, z: g.position.z + Math.sin(a) * rr, vx: -Math.cos(a) * 30, vy: 160 + Math.random() * 150, vz: -Math.sin(a) * 30, gravity: -10, drag: 0.8, life: 0.55, size: 3.5, color: Math.random() < 0.5 ? RUNE : RUNED, fade: true }); }
        },
      };
    },
  });

  // 旋轉巨鋸：橙焰鋸盤（外暈＋雙層反轉鋸齒＋亮核）＋ 切線飛濺火星
  registerVfx('boss_titan_saw', {
    zone(ctx, z) {
      const R = z.radius || 150;
      const g = new THREE.Group();
      const glow = new THREE.Mesh(new THREE.CircleGeometry(R * 1.15, 32), basicAdd(SAW, 0.25)); glow.rotation.x = -Math.PI / 2; glow.position.y = 3; g.add(glow);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 6, 24), basicAdd(SAW, 0.5)); disc.position.y = 6; g.add(disc);
      const teeth = new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.12, 4, 16), basicAdd(SPARK, 0.75)); teeth.rotation.x = -Math.PI / 2; teeth.position.y = 6; g.add(teeth);
      const teeth2 = new THREE.Mesh(new THREE.TorusGeometry(R * 0.7, R * 0.08, 4, 14), basicAdd('#ffffff', 0.55)); teeth2.rotation.x = -Math.PI / 2; teeth2.position.y = 7; g.add(teeth2);
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt; disc.rotation.y += dt * 16; teeth.rotation.z += dt * 16; teeth2.rotation.z -= dt * 22;
          teeth.material.opacity = 0.6 + 0.2 * Math.sin(t * 24); glow.material.opacity = 0.18 + 0.1 * Math.sin(t * 18);
          em -= dt;
          if (em <= 0) { em = 0.03; const a = Math.random() * 6.283; ctx.particles.spawn({ x: g.position.x + Math.cos(a) * R, y: 6, z: g.position.z + Math.sin(a) * R, vx: Math.cos(a) * 150, vy: 50 + Math.random() * 90, vz: Math.sin(a) * 150, gravity: 160, drag: 2, life: 0.45, size: 3.2, color: Math.random() < 0.5 ? SAW : SPARK, fade: true }); }
        },
      };
    },
  });

  // 核心過載：符文藍白能量總爆發（過載內縮＋擴張波＋符文六角環＋中央能量柱）
  registerVfx('boss_titan_ult', {
    onCast(ctx, f, c) {
      sphereFlash(ctx, c, { color: '#ffffff', from: 8, to: 110, life: 0.4, alpha: 0.98 });
      ring(ctx, c, { color: RUNED, from: 130, to: 16, life: 0.4, y: 4, alpha: 0.8 });
      burst(ctx, c, { color: [RUNE, RUNED, '#ffffff'], count: 42, speed: 300, up: 90, life: 0.75, size: 5.5 });
      ctx.sceneMgr.addShake(22); ctx.sceneMgr.addFlash(0.34, RUNE);
    },
    zone(ctx, z) {
      const R = z.radius || 260;
      const g = new THREE.Group();
      const ringMesh = addRing(RUNE, 0.7); ringMesh.scale.setScalar(R); ringMesh.position.y = 2; g.add(ringMesh);
      const wave = addRing(RUNED, 0.6); wave.position.y = 3; g.add(wave);
      const hex = new THREE.Mesh(new THREE.RingGeometry(R * 0.42, R * 0.5, 6, 1), basicAdd(RUNED, 0.55)); hex.rotation.x = -Math.PI / 2; hex.position.y = 4; g.add(hex);
      const pillarMesh = addCol(RUNE, 0, R * 0.16, R * 0.26, R * 1.6); pillarMesh.position.y = R * 0.8; g.add(pillarMesh);
      const pillarCore = addCol('#ffffff', 0, R * 0.07, R * 0.12, R * 1.6); pillarCore.position.y = R * 0.8; g.add(pillarCore);
      let t = 0, kicked = false;
      return {
        object3D: g,
        update(dt) {
          t += dt;
          ringMesh.rotation.z += dt * 2; ringMesh.material.opacity = Math.max(0, 0.7 * (1 - t * 0.8));
          hex.rotation.z -= dt * 1.5; hex.material.opacity = 0.4 + 0.2 * Math.sin(t * 6);
          wave.scale.setScalar(R * (0.3 + t * 1.1)); wave.material.opacity = Math.max(0, 0.6 * (1 - t));
          const e = Math.min(1, t / 0.25); const fade = 1 - Math.max(0, (t - 0.5) / 0.8);
          pillarMesh.material.opacity = Math.max(0, 0.6 * e * fade); pillarMesh.scale.y = 0.5 + e;
          pillarCore.material.opacity = Math.max(0, 0.85 * e * fade); pillarCore.scale.y = 0.5 + e;
          if (!kicked) { kicked = true; column(ctx, { x: g.position.x, y: 0, z: g.position.z }, { color: [RUNE, '#ffffff'], count: 46, radius: R * 0.5, speed: 340, life: 1.0, size: 5.5 }); }
        },
      };
    },
  });

  // 死亡演出：機關核心過載崩解 — 核心藍白炸裂、中央符文能量柱噴發、巨石塊崩落拋飛、揚塵與落塵
  registerVfx('boss_titan_death', {
    onDeath(ctx, f, c) {
      const { THREE: T, addTransient, sceneMgr, particles } = ctx;
      sceneMgr.addShake(28); sceneMgr.addFlash(0.48, RUNE);
      sphereFlash(ctx, c, { color: '#ffffff', from: 12, to: 130, life: 0.42, alpha: 0.98 });
      sphereFlash(ctx, c, { color: RUNE, from: 8, to: 90, life: 0.32, alpha: 0.7 });
      ring(ctx, c, { color: RUNE, from: 18, to: 340, life: 0.7, y: 4, alpha: 0.9, ease: true });
      ring(ctx, c, { color: RUNED, from: 12, to: 250, life: 0.55, y: 5, alpha: 0.75 });
      ring(ctx, c, { color: STONE, from: 10, to: 190, life: 0.85, y: 2, alpha: 0.6, ease: true });
      // 中央符文能量柱噴發（雙層）
      const pillar = addCol(RUNE, 0, 30, 50, 320); pillar.position.set(c.x, 160, c.z);
      addTransient(pillar, 0.9, (m, t) => { const e = Math.min(1, t / 0.16), fade = 1 - Math.max(0, (t - 0.4) / 0.5); m.material.opacity = Math.max(0, 0.7 * e * fade); m.scale.y = 0.4 + e; });
      const pillarCore = addCol('#ffffff', 0, 14, 22, 320); pillarCore.position.set(c.x, 160, c.z);
      addTransient(pillarCore, 0.85, (m, t) => { const e = Math.min(1, t / 0.16), fade = 1 - Math.max(0, (t - 0.4) / 0.5); m.material.opacity = Math.max(0, 0.9 * e * fade); m.scale.y = 0.4 + e; });
      // 巨石塊崩落拋飛（翻滾＋拋物線＋落下淡出）
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.283 + Math.random() * 0.4, sz = 18 + Math.random() * 16;
        const block = new T.Mesh(new T.BoxGeometry(sz, sz, sz), new T.MeshStandardMaterial({ color: new T.Color(STONE), roughness: 0.9, metalness: 0.1, transparent: true, opacity: 1 }));
        block.position.set(c.x, 40, c.z); const d = 150 + Math.random() * 120, up = 90 + Math.random() * 100;
        addTransient(block, 1.1, (m, t) => { m.position.set(c.x + Math.cos(a) * d * t, 40 + up * t - 200 * t * t, c.z + Math.sin(a) * d * t); m.rotation.x += 0.18; m.rotation.z += 0.15; m.material.opacity = 1 - Math.max(0, (t - 0.6) / 0.4); });
      }
      // 符文火星 + 揚塵柱 + 石塵爆散
      burst(ctx, c, { color: [RUNE, RUNED, '#ffffff'], count: 40, speed: 340, up: 90, life: 0.8, size: 5 });
      column(ctx, c, { color: ['#6a6258', STONE], count: 30, radius: 90, speed: 260, life: 0.9, size: 6.5 });
      burst(ctx, c, { color: [STONE, '#7d7066'], count: 30, speed: 260, up: 50, flat: true, life: 0.9, size: 6 });
      // 落塵
      for (let i = 0; i < 30; i++) { const a = Math.random() * 6.283, rr = Math.random() * 120; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 8, z: c.z + Math.sin(a) * rr, vx: Math.cos(a) * 100, vy: 30 + Math.random() * 60, vz: Math.sin(a) * 100, gravity: -8, drag: 1.2, life: 1.1 + Math.random() * 0.5, size: 6 + Math.random() * 5, color: '#8a8076', fade: true }); }
    },
  });
}
