// 足球模式 3D 物件：球 + 兩側球門。依 state.ball / state.goals 同步;非足球模式時隱藏。

import * as THREE from 'three';
import { sceneX, sceneZ } from './coords.js';
import { TEAM_COLORS } from '../systems/soccer.ts';

export function createSoccerLayer(scene, particles = null) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  let ball = null;          // { mesh }
  const goalNodes = [];     // 對應 state.goals
  let built = false;

  function build(goals) {
    // 球：白色發光球 + 黑色斑紋感 (用低 metalness 標準材質 + 外光暈)
    const bg = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 2),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x222233, emissiveIntensity: 0.4, roughness: 0.45, metalness: 0.05 }),
    );
    core.castShadow = true;
    bg.add(core);
    const halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    halo.scale.setScalar(1.5);
    bg.add(halo);
    group.add(bg);
    ball = { node: bg, core };

    // 球門：半透明發光「力場」立方 + 頂橫桿 + 地面光帶,以隊色標示
    for (const g of goals) {
      const color = new THREE.Color(TEAM_COLORS[g.team] || '#ffffff');
      const node = new THREE.Group();
      const len = g.half * 2;          // 沿世界 y → 場景 z
      const depth = 26, height = 160;
      const field = new THREE.Mesh(
        new THREE.BoxGeometry(depth, height, len),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
      );
      field.position.y = height / 2;
      node.add(field);
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(depth + 6, 12, len + 12),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6, roughness: 0.4 }),
      );
      bar.position.y = height;
      node.add(bar);
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(depth + 60, len + 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
      );
      strip.rotation.x = -Math.PI / 2;
      strip.position.y = 1.5;
      node.add(strip);
      group.add(node);
      goalNodes.push(node);
    }
    built = true;
  }

  function sync(state, dt) {
    if (!state.ball || !state.goals) { group.visible = false; return; }
    if (!built) build(state.goals);
    group.visible = true;

    const b = state.ball;
    const bx = sceneX(b.x), bz = sceneZ(b.y);
    ball.node.position.set(bx, b.r, bz);
    // 依速度滾動
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 1) {
      const axis = new THREE.Vector3(-b.vy, 0, b.vx).normalize();
      ball.core.rotateOnAxis(axis, (sp / Math.max(1, b.r)) * dt);
    }
    // 高速拖尾 (射門感)
    if (particles && sp > 360) {
      particles.spawn({
        x: bx, y: b.r, z: bz,
        vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 20, vz: (Math.random() - 0.5) * 30,
        life: 0.3, size: b.r * 0.7, color: '#cfe6ff', drag: 3, fade: true,
      });
    }
    ball.core.scale.setScalar(b.r);
    for (let i = 0; i < goalNodes.length; i++) {
      const g = state.goals[i];
      if (!g) continue;
      goalNodes[i].position.set(sceneX(g.x), 0, sceneZ(g.y));
    }
  }

  function clear() {
    scene.remove(group);
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { Array.isArray(o.material) ? o.material.forEach((m) => m.dispose()) : o.material.dispose(); }
    });
  }

  return { sync, clear };
}
