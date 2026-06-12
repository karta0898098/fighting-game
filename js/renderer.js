// three.js (WebGL) 渲染入口 — 取代舊版 Canvas2D 渲染。
//
// 對外維持相同介面：createRenderer(canvas) -> { render(state, selfId) }
// 模擬/網路/輸入/UI 完全不變；本檔僅負責把遊戲狀態畫成 3D。
//
// 編排：場景(scene.js) + GPU 粒子(particles.js) + 投射物/區域(entities3d.js)
//      + 特效匯流排(fxbus.js) + 角色模型(models.js) + 引擎內 HUD(hud.js)

import { createSceneManager } from './render3d/scene.js';
import { createParticleSystem } from './render3d/particles.js';
import { createEntityLayer } from './render3d/entities3d.js';
import { createFxBus } from './render3d/fxbus.js';
import { createHud } from './render3d/hud.js';
import { createCharacterModel, animateModel } from './render3d/models.js';
import { sceneX, sceneZ } from './render3d/coords.js';

export function createRenderer(canvas) {
  const sceneMgr = createSceneManager(canvas);
  const { scene, camera } = sceneMgr;

  const particles = createParticleSystem(scene, { capacity: 5000 });
  particles.setDpr(sceneMgr.renderer.getPixelRatio());
  const fxbus = createFxBus({ scene, particles, sceneMgr });
  const entities = createEntityLayer(scene, particles, { addTransient: fxbus.addTransient, sceneMgr });
  const hud = createHud({ stage: sceneMgr.stage, scene, camera });

  // 本地視覺狀態 (不進 snapshot)
  let lastT = 0;
  const models = new Map();  // pid -> { group, charId }
  const prev = new Map();    // pid -> { x, y } 上一幀世界座標 (算速度)

  sceneMgr.resize();
  hud.resize();

  function ensureModel(p) {
    let e = models.get(p.id);
    if (e && e.charId !== p.charId) { disposeModel(e); models.delete(p.id); e = null; }
    if (!e) {
      const group = createCharacterModel(p.charId);
      group.position.set(sceneX(p.x), 0, sceneZ(p.y));
      scene.add(group);
      e = { group, charId: p.charId };
      models.set(p.id, e);
    }
    return e;
  }

  function disposeModel(e) {
    scene.remove(e.group);
    e.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }

  function syncPlayers(state, selfId, dt) {
    const seen = new Set();
    for (const p of Object.values(state.players)) {
      seen.add(p.id);
      const e = ensureModel(p);
      if (!p.alive) { e.group.visible = false; continue; }
      e.group.visible = true;
      e.group.position.x = sceneX(p.x);
      e.group.position.z = sceneZ(p.y);

      // 速度 (世界座標位移 / dt)
      let pr = prev.get(p.id);
      if (!pr) { pr = { x: p.x, y: p.y }; prev.set(p.id, pr); }
      let speed = 0;
      if (dt > 0) speed = Math.hypot(p.x - pr.x, p.y - pr.y) / dt;
      pr.x = p.x; pr.y = p.y;

      animateModel(e.group, dt, { speed, facing: p.facing, p, isSelf: p.id === selfId });
    }
    // 離開房間的玩家才釋放模型
    for (const [pid, e] of models) {
      if (!seen.has(pid)) { disposeModel(e); models.delete(pid); prev.delete(pid); }
    }
  }

  function render(state, selfId) {
    const now = performance.now();
    let dt = lastT ? (now - lastT) / 1000 : 0;
    lastT = now;
    if (dt > 0.05) dt = 0.05;

    if (sceneMgr.resize()) hud.resize();

    fxbus.process(state);
    syncPlayers(state, selfId, dt);
    entities.syncProjectiles(state.projectiles, dt);
    entities.syncZones(state.zones, dt);
    particles.update(dt);
    fxbus.update(dt);
    sceneMgr.update(dt);
    hud.update(state, selfId);

    sceneMgr.render();
    hud.render();
  }

  return { render };
}
