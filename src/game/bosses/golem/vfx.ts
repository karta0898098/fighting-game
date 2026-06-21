// @ts-nocheck
// R1 巨木傀儡 技能特效。主題：樹幹／苔蘚／藤根／翠綠生命光。
// 效能：一次性用粒子池(particles)＋自動回收的 addTransient；持續型(zone)只建少量網格、
// 由 entities3d 負責 dispose。純視覺層，不進網路協定。
import * as THREE from 'three';
import { registerVfx } from '../../render3d/vfx/registry.js';
import { slashBlade, cone, burst, column } from '../../render3d/vfx/lib.js';

const BARK = '#6b4a2b', BARKD = '#4a3220', LEAF = '#4a7a2c', LEAFB = '#7ac050', LIFE = '#9acd32';

const matBark = () => new THREE.MeshStandardMaterial({ color: BARK, roughness: 0.95, metalness: 0 });
const matLeaf = (c = LEAF) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, emissive: new THREE.Color('#1c3a12'), emissiveIntensity: 0.3 });
const addRing = (color, op = 0.85) => new THREE.Mesh(new THREE.RingGeometry(0.84, 1, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));

export function loadVfx() {
  // 橫掃巨臂：帶葉樹幹橫掃 + 雙層綠白刀光 + 大量落葉木屑
  registerVfx('boss_golem_sweep', {
    onCast(ctx, f, c) {
      const { addTransient, sceneMgr } = ctx;
      const reach = (f.range || 200) * 0.98;
      slashBlade(ctx, c, f.facing, { color: [LEAFB, BARK], len: reach, swing: 1.85, life: 0.36, y: 16, sparkCount: 16, alpha: 0.95 });
      slashBlade(ctx, c, f.facing, { color: [LIFE, '#eaffd0'], len: reach * 0.78, swing: 1.6, life: 0.26, y: 19, sparkCount: 8, alpha: 0.8 });
      // 橫掃的樹幹枝（更粗、更多葉簇）
      const branch = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(4, 7.5, reach, 6), matBark());
      trunk.rotation.z = Math.PI / 2; trunk.position.x = reach * 0.5; branch.add(trunk);
      for (let i = 0; i < 8; i++) {
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(7 + Math.random() * 5, 0), matLeaf(i % 2 ? LEAF : LEAFB));
        leaf.position.set(reach * (0.4 + i * 0.08), (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 12); branch.add(leaf);
      }
      branch.position.set(c.x, 16, c.z);
      const sw = f.arc >= 6 ? 6.283 : 1.9; const start = -f.facing - sw * 0.5;
      branch.traverse((o) => { if (o.material) o.material.transparent = true; });
      addTransient(branch, 0.36, (g, t) => { g.rotation.y = start + sw * t; g.traverse((o) => { if (o.material) o.material.opacity = 1 - t * t; }); });
      cone(ctx, c, f.facing, { color: [LEAF, LEAFB, BARK], count: 26, speed: 230, spread: 1.0, up: 40, life: 0.6, size: 4.5 });
      burst(ctx, c, { color: [LEAFB, LIFE], count: 14, speed: 110, up: 70, life: 0.7, size: 4.5, gravity: 60 }); // 飛揚落葉
      sceneMgr.addShake(7);
    },
  });

  // 巨力砸地：樹樁從天砸落 → 坑洞 + 放射裂縫 + 雙重震波 + 揚塵木屑
  registerVfx('boss_golem_slam', {
    zone(ctx, z) {
      const { sceneMgr } = ctx;
      const R = z.radius || 130;
      const g = new THREE.Group();
      const crater = new THREE.Mesh(new THREE.CircleGeometry(R, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#332313'), transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
      crater.rotation.x = -Math.PI / 2; crater.position.y = 0.5; g.add(crater);
      const rim = addRing(LEAFB); rim.scale.setScalar(R * 0.9); rim.position.y = 0.7; g.add(rim);
      const wave = addRing(LIFE, 0.7); wave.position.y = 0.9; g.add(wave); // 外擴震波
      // 放射裂縫
      const cracks = [];
      for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283; const cr = new THREE.Mesh(new THREE.PlaneGeometry(R * 0.9, R * 0.06), new THREE.MeshBasicMaterial({ color: new THREE.Color(LEAFB), transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); cr.rotation.x = -Math.PI / 2; cr.rotation.z = a; cr.position.set(Math.cos(a) * R * 0.45, 0.7, Math.sin(a) * R * 0.45); g.add(cr); cracks.push(cr); }
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.34, R * 0.44, R * 0.85, 8), matBark()); stump.position.y = R * 1.7; g.add(stump);
      const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.4, 0), matLeaf()); cap.position.y = R * 1.7 + R * 0.5; g.add(cap);
      let t = 0, hit = false;
      return {
        object3D: g,
        update(dt) {
          t += dt;
          if (!hit) {
            const drop = Math.min(1, t / 0.13); const y = R * 1.7 * (1 - drop * drop);
            stump.position.y = y; cap.position.y = y + R * 0.55;
            if (drop >= 1) {
              hit = true;
              burst(ctx, { x: g.position.x, y: 4, z: g.position.z }, { color: [BARK, LEAF, LEAFB], count: 34, speed: 260, up: 70, flat: true, life: 0.6, size: 5.5 });
              column(ctx, { x: g.position.x, y: 0, z: g.position.z }, { color: ['#5a4a32', BARK], count: 20, radius: R * 0.5, speed: 200, life: 0.7, size: 6 }); // 揚塵柱
              sceneMgr.addShake(16); sceneMgr.addFlash(0.16, LEAFB);
            }
          } else {
            const k = Math.max(0, 1 - (t - 0.13) * 2.2); stump.material.transparent = cap.material.transparent = true; stump.material.opacity = cap.material.opacity = k;
          }
          rim.scale.setScalar(R * (0.9 + t * 0.4)); rim.material.opacity = Math.max(0, 0.85 * (1 - t * 1.6));
          wave.scale.setScalar(R * (0.4 + t * 2.2)); wave.material.opacity = Math.max(0, 0.7 * (1 - t * 1.3));
          for (const cr of cracks) cr.material.opacity = Math.max(0, 0.7 * (1 - t * 1.4));
        },
      };
    },
  });

  // 纏根束縛：地面長出一圈帶刺藤根，向中心彎曲纏縛 + 內外雙環 + 綠芽噴湧
  registerVfx('boss_golem_roots', {
    zone(ctx, z) {
      const { particles } = ctx;
      const R = z.radius || 200;
      const g = new THREE.Group();
      const ringMesh = new THREE.Mesh(new THREE.RingGeometry(R * 0.9, R, 44), new THREE.MeshBasicMaterial({ color: new THREE.Color(LEAF), transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      ringMesh.rotation.x = -Math.PI / 2; ringMesh.position.y = 1; g.add(ringMesh);
      const inner = new THREE.Mesh(new THREE.RingGeometry(R * 0.4, R * 0.46, 36), new THREE.MeshBasicMaterial({ color: new THREE.Color(LIFE), transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      inner.rotation.x = -Math.PI / 2; inner.position.y = 1.2; g.add(inner);
      const roots = [];
      const N = 14;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * 6.283; const rr = R * (0.48 + Math.random() * 0.42);
        const root = new THREE.Group();
        const stalk = new THREE.Mesh(new THREE.ConeGeometry(R * 0.045, R * 0.58, 5), matBark()); stalk.position.y = R * 0.29; root.add(stalk);
        const tip = new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.05, 0), matLeaf(i % 2 ? LEAFB : LIFE)); tip.position.y = R * 0.56; root.add(tip);
        root.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr);
        root.userData = { a, lean: 0.4 + Math.random() * 0.35 };
        g.add(root); roots.push(root);
      }
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt; const grow = Math.min(1, t / 0.3);
          for (const r of roots) { r.scale.setScalar(grow); r.rotation.z = Math.cos(r.userData.a) * r.userData.lean * grow; r.rotation.x = -Math.sin(r.userData.a) * r.userData.lean * grow; }
          ringMesh.material.opacity = 0.32 + 0.14 * Math.sin(t * 4); inner.rotation.z += dt * 0.8; inner.material.opacity = 0.4 + 0.16 * Math.sin(t * 5);
          em -= dt;
          if (em <= 0) { em = 0.06; const a = Math.random() * 6.283, rr = Math.random() * R * 0.8; particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 2, z: g.position.z + Math.sin(a) * rr, vx: 0, vy: 45 + Math.random() * 60, vz: 0, gravity: -10, drag: 1, life: 0.7, size: 3.5 + Math.random() * 2, color: Math.random() < 0.6 ? LEAFB : LIFE, fade: true }); }
        },
      };
    },
  });

  // 死亡演出：生命核心過載內爆 + 六巨樹幹向外傾倒 + 木屑爆散 + 枯葉雨 + 多重枯綠環
  registerVfx('boss_golem_death', {
    onDeath(ctx, f, c) {
      const { THREE: T, addTransient, sceneMgr, particles } = ctx;
      sceneMgr.addShake(24); sceneMgr.addFlash(0.42, LIFE);
      // 生命核心：先過載膨脹再內爆熄滅
      const core = new T.Mesh(new T.IcosahedronGeometry(26, 1), new T.MeshBasicMaterial({ color: new T.Color('#eaffd0'), transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false }));
      core.position.set(c.x, 34, c.z);
      addTransient(core, 0.7, (m, t) => { if (t < 0.45) { m.scale.setScalar(1 + (t / 0.45) * 3.2); m.material.opacity = 0.95; } else { const k = (t - 0.45) / 0.55; m.scale.setScalar(4.2 * (1 - k * 0.95)); m.material.opacity = 0.95 * (1 - k); } });
      // 多重枯綠擴張環
      for (let k = 0; k < 3; k++) { const rg = addRing(k % 2 ? LIFE : LEAFB, 0.85); rg.position.set(c.x, 3 + k * 2, c.z); rg.scale.setScalar(20); addTransient(rg, 0.7 + k * 0.12, (m, t) => { m.scale.setScalar(20 + (220 + k * 70) * t); m.material.opacity = 0.85 * (1 - t); }); }
      // 六根巨樹幹向外傾倒淡出
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 6.283; const trunk = new T.Group();
        const tr = new T.Mesh(new T.CylinderGeometry(6, 10, 90, 6), matBark()); tr.position.y = 45; trunk.add(tr);
        const cap = new T.Mesh(new T.IcosahedronGeometry(20, 0), matLeaf(i % 2 ? LEAF : LEAFB)); cap.position.y = 92; trunk.add(cap);
        trunk.traverse((o) => { if (o.material) o.material.transparent = true; });
        addTransient(trunk, 0.95, (gg, t) => { gg.rotation.z = Math.cos(a) * 1.4 * t; gg.rotation.x = -Math.sin(a) * 1.4 * t; gg.position.set(c.x + Math.cos(a) * (20 + 70 * t), 0, c.z + Math.sin(a) * (20 + 70 * t)); gg.traverse((o) => { if (o.material) o.material.opacity = 1 - Math.max(0, (t - 0.4) / 0.6); }); });
      }
      // 木屑大爆散 + 揚塵柱 + 枯葉騰起
      burst(ctx, c, { color: [BARK, BARKD, LEAF], count: 46, speed: 320, up: 90, flat: true, life: 0.9, size: 6 });
      burst(ctx, c, { color: [LEAFB, LIFE, '#eaffd0'], count: 30, speed: 200, up: 150, life: 1.1, size: 5 });
      column(ctx, c, { color: ['#5a4a32', BARK], count: 26, radius: 90, speed: 240, life: 0.9, size: 6.5 });
      // 緩降枯葉雨
      for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, rr = Math.random() * 180; particles.spawn({ x: c.x + Math.cos(a) * rr, y: 150 + Math.random() * 80, z: c.z + Math.sin(a) * rr, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 40, vz: (Math.random() - 0.5) * 30, gravity: 30, drag: 1.5, life: 1.2 + Math.random() * 0.6, size: 4 + Math.random() * 3, color: Math.random() < 0.5 ? LEAF : LEAFB, fade: true }); }
    },
  });

  // 森羅旋掃：六棵巨樹繞中心高速旋轉 + 多重翠綠衝擊環 + 中心生命光柱 + 落葉風暴
  registerVfx('boss_golem_ult', {
    zone(ctx, z) {
      const { sceneMgr, particles } = ctx;
      const R = z.radius || 200;
      const g = new THREE.Group();
      const shock = addRing(LIFE); shock.position.y = 4; g.add(shock);
      const shock2 = addRing('#eaffd0', 0.7); shock2.position.y = 6; g.add(shock2);
      const core = new THREE.Mesh(new THREE.RingGeometry(R * 0.92, R, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(LIFE), transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      core.rotation.x = -Math.PI / 2; core.position.y = 2; g.add(core);
      // 中心生命光柱
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.16, R * 0.26, R * 1.4, 12, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(LIFE), transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      pillar.position.y = R * 0.7; g.add(pillar);
      const trees = [];
      const N = 6;
      for (let i = 0; i < N; i++) {
        const tree = new THREE.Group();
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.05, R * 0.09, R * 0.8, 6), matBark()); tr.position.y = R * 0.4; tree.add(tr);
        const cv = new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.24, 0), matLeaf(i % 2 ? LEAF : LEAFB)); cv.position.y = R * 0.82; tree.add(cv);
        g.add(tree); trees.push(tree);
      }
      sceneMgr.addShake(18); sceneMgr.addFlash(0.22, LIFE);
      let t = 0, em = 0;
      return {
        object3D: g,
        update(dt) {
          t += dt;
          const sp = Math.min(1, t / 0.6); shock.scale.setScalar(R * (0.3 + sp)); shock.material.opacity = 0.85 * (1 - sp);
          const sp2 = Math.min(1, t / 0.85); shock2.scale.setScalar(R * (0.2 + sp2 * 1.4)); shock2.material.opacity = 0.7 * (1 - sp2);
          const spin = t * 6;
          for (let i = 0; i < trees.length; i++) { const a = (i / trees.length) * 6.283 + spin; trees[i].position.set(Math.cos(a) * R * 0.74, 0, Math.sin(a) * R * 0.74); trees[i].rotation.y = -a; }
          core.rotation.z += dt * 3; core.material.opacity = 0.4 + 0.2 * Math.sin(t * 8);
          pillar.scale.x = pillar.scale.z = 1 + 0.12 * Math.sin(t * 10); pillar.material.opacity = 0.35 + 0.15 * Math.sin(t * 6);
          em -= dt;
          if (em <= 0) { em = 0.04; const a = spin + Math.random() * 6.283, rr = R * (0.5 + Math.random() * 0.5); particles.spawn({ x: g.position.x + Math.cos(a) * rr, y: 6 + Math.random() * 40, z: g.position.z + Math.sin(a) * rr, vx: -Math.sin(a) * 120, vy: 20 + Math.random() * 40, vz: Math.cos(a) * 120, gravity: 40, drag: 1.2, life: 0.7, size: 4 + Math.random() * 2, color: Math.random() < 0.5 ? LEAFB : LIFE, fade: true }); }
        },
      };
    },
  });
}
