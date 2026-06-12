// 場景管理：WebGLRenderer + 透視鏡頭 + 燈光/陰影 + 地板/邊界 + 泛光後處理 + 震動/閃光
//
// 對外介面：
//   createSceneManager(canvas) -> {
//     scene, camera, renderer, stage,
//     resize(), update(dt), render(),
//     addShake(mag), addFlash(alpha, color),
//     setBloom(on), time
//   }

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ARENA } from '../constants.js';

const BG = '#070b11';

export function createSceneManager(canvas) {
  const stage = canvas.parentElement || canvas;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 1500, 3000);

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 1, 8000);
  // 固定全場框取 (不跟隨)；俯視傾斜約 50°
  const camBase = new THREE.Vector3(0, 940, 780);
  const camTarget = new THREE.Vector3(0, 36, -10);
  camera.position.copy(camBase);
  camera.lookAt(camTarget);

  // ---- 燈光 ----
  const hemi = new THREE.HemisphereLight(0xbcd6ff, 0x20262e, 0.95);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xfff2dd, 1.35);
  dir.position.set(360, 1050, 480);
  dir.target.position.set(0, 0, 0);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 200;
  dir.shadow.camera.far = 2600;
  dir.shadow.camera.left = -820;
  dir.shadow.camera.right = 820;
  dir.shadow.camera.top = 820;
  dir.shadow.camera.bottom = -820;
  dir.shadow.bias = -0.0004;
  dir.shadow.normalBias = 1.2;
  scene.add(dir);
  scene.add(dir.target);
  // 補一盞冷色背光增加立體感
  const rim = new THREE.DirectionalLight(0x4a7bff, 0.45);
  rim.position.set(-420, 360, -560);
  scene.add(rim);

  // ---- 地板 (格線材質) ----
  scene.add(buildFloor());
  // ---- 邊界發光牆 (幫助景深 + bloom) ----
  scene.add(buildWalls());

  // ---- 泛光後處理鏈 ----
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.55, 0.62);
  composer.addPass(bloom);
  const outputPass = new OutputPass();
  composer.addPass(outputPass);
  let bloomOn = true;

  // ---- 全畫面命中閃光 (DOM overlay，mix-blend screen) ----
  const flashEl = document.createElement('div');
  flashEl.style.cssText =
    'position:absolute;inset:0;pointer-events:none;z-index:5;opacity:0;mix-blend-mode:screen;background:#fff;';
  stage.appendChild(flashEl);

  // ---- 狀態 ----
  let time = 0;
  let shakeMag = 0;
  let flashA = 0;
  let flashColor = '#ffffff';
  let lastW = 0, lastH = 0;
  const _v = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _up = new THREE.Vector3();

  function resize() {
    const w = Math.max(1, stage.clientWidth | 0);
    const h = Math.max(1, stage.clientHeight | 0);
    if (w === lastW && h === lastH) return false;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    return true;
  }

  function addShake(mag) { shakeMag = Math.min(46, shakeMag + mag); }
  function addFlash(a, color = '#ffffff') {
    if (a > flashA) { flashA = Math.min(1, a); flashColor = color; }
  }
  function setBloom(on) { bloomOn = !!on; } // render() 內依旗標選擇 composer / 直接渲染

  function update(dt) {
    time += dt;
    // 震動衰減
    shakeMag *= Math.exp(-9 * dt);
    if (shakeMag < 0.05) shakeMag = 0;
    // 閃光衰減
    flashA *= Math.exp(-6 * dt);
    if (flashA < 0.01) flashA = 0;
    flashEl.style.background = flashColor;
    flashEl.style.opacity = (flashA * 0.85).toFixed(3);

    // 鏡頭：基準位置 + 極輕微 idle 浮動 + 震動位移 (沿螢幕 right/up)
    _v.copy(camBase);
    _v.y += Math.sin(time * 0.5) * 6;
    _v.z += Math.sin(time * 0.37) * 5;
    camera.position.copy(_v);
    camera.lookAt(camTarget);
    if (shakeMag > 0) {
      // 取相機座標系的 right / up
      _right.setFromMatrixColumn(camera.matrixWorld, 0);
      _up.setFromMatrixColumn(camera.matrixWorld, 1);
      const sx = (Math.random() * 2 - 1) * shakeMag;
      const sy = (Math.random() * 2 - 1) * shakeMag;
      camera.position.addScaledVector(_right, sx);
      camera.position.addScaledVector(_up, sy);
    }
  }

  function render() {
    if (bloomOn) composer.render();
    else renderer.render(scene, camera);
  }

  function dispose() { renderer.dispose(); composer.dispose?.(); flashEl.remove(); }

  return {
    scene, camera, renderer, stage,
    resize, update, render, addShake, addFlash, setBloom, dispose,
    get time() { return time; },
  };
}

function buildFloor() {
  const g = new THREE.Group();
  const tex = gridTexture();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(ARENA.width / 100, ARENA.height / 100);
  tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x141d29, roughness: 0.92, metalness: 0.05,
    map: tex, emissive: 0x0a1622, emissiveIntensity: 0.4,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ARENA.width, ARENA.height), mat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);
  // 中央暗圈裝飾
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x274056, transparent: true, opacity: 0.5 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(120, 128, 64), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.5;
  g.add(ring);
  return g;
}

function gridTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#101825';
  x.fillRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(90,140,190,0.30)';
  x.lineWidth = 2;
  x.strokeRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(90,140,190,0.12)';
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(64, 0); x.lineTo(64, 128); x.moveTo(0, 64); x.lineTo(128, 64); x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildWalls() {
  const g = new THREE.Group();
  const W = ARENA.width, H = ARENA.height, t = 10, h = 26;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1b2a3a, emissive: 0x2f6dff, emissiveIntensity: 1.6, roughness: 0.4, metalness: 0.3,
  });
  const mk = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, h / 2, z);
    m.castShadow = false; m.receiveShadow = false;
    g.add(m);
  };
  mk(W + t * 2, t, 0, -H / 2);
  mk(W + t * 2, t, 0, H / 2);
  mk(t, H, -W / 2, 0);
  mk(t, H, W / 2, 0);
  return g;
}
