// GLB 角色皮膚載入管線（選用，找不到檔案就安全回退到 models.js 的程序化模型）。
//
// === 如何加入皮膚 ===
// 1. 取得一個 rigged glTF 角色（含 idle / walk / attack / hit 動畫最佳）。
//    免費 CC0 來源建議：
//      - Quaternius  https://quaternius.com  （Universal Animation Library / RPG Characters，已綁骨含多段動畫）
//      - Kenney      https://kenney.nl/assets （Mini Characters / Blocky Characters）
//      - Mixamo      https://mixamo.com       （自動綁骨 + 動畫，匯出 glTF Binary）
// 2. 匯出成 .glb，放到：public/assets/characters/models/<名稱>.glb
//    對應檔名見下方 CHAR_FILES（warrior.glb / mage.glb / ... / fighter.glb）。
// 3. 若模型大小/朝向不對，調整下方 OVERRIDES 的 scale / yOffset / rotationY。
//    模型最終需「面向 +X」、雙腳踩在 y=0；程序化模型約 55 單位高，scale 預設讓 ~1.8m 模型對齊。
//
// 沒有放任何 .glb 時，本管線的 prepareSkin() 會因 404 回傳 null，遊戲照常使用程序化模型。

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
const modelUrl = (file) => asset(`assets/characters/models/${file}`);

// charId -> 檔名（與 public/assets/characters 既有命名一致）
const CHAR_FILES = [
  'warrior', 'mage', 'assassin', 'tank', 'archer',
  'healer', 'berserker', 'ninja', 'elementalist', 'fighter',
];

// 各動作的候選 clip 名稱（不同來源命名不一，依序比對，先精確再模糊包含）。
const DEFAULT_CLIPS = {
  idle: ['Idle', 'idle', 'Idle_Neutral', 'CharacterArmature|Idle', 'Armature|Idle', 'mixamo.com'],
  walk: ['Walk', 'walk', 'Walking', 'Run', 'run', 'CharacterArmature|Walk', 'Armature|Walk'],
  attack: ['Attack', 'attack', 'Punch', 'Slash', 'Sword', 'Cast', 'Spellcast', 'CharacterArmature|Attack', 'Armature|Attack'],
  hit: ['Hit', 'hit', 'HitRecieve', 'HitReceive', 'HitReact', 'Damage', 'Death', 'CharacterArmature|Hit'],
};

// 每角色覆寫（預設值適用大多數人形模型；依實際模型微調）。
const DEFAULT_CFG = { scale: 30, yOffset: 0, rotationY: -Math.PI / 2 };
const OVERRIDES = {
  // 例：3: { scale: 36, yOffset: 1 },   // 坦克更高大
  // 例：1: { rotationY: Math.PI / 2 },  // 朝向相反時翻轉
};

export function getSkinConfig(charId) {
  const file = CHAR_FILES[charId];
  if (!file) return null;
  return {
    url: modelUrl(`${file}.glb`),
    clips: DEFAULT_CLIPS,
    ...DEFAULT_CFG,
    ...(OVERRIDES[charId] || {}),
  };
}

const loader = new GLTFLoader();
const cache = new Map(); // charId -> Promise<Template|null>

// 載入並快取 gltf 模板（共用 geometry，逐實例再 clone 骨架）。無檔/失敗回 null。
export function prepareSkin(charId) {
  if (cache.has(charId)) return cache.get(charId);
  const cfg = getSkinConfig(charId);
  if (!cfg) { const p = Promise.resolve(null); cache.set(charId, p); return p; }
  const p = loader.loadAsync(cfg.url)
    .then((gltf) => ({ scene: gltf.scene, animations: gltf.animations || [], cfg }))
    .catch(() => null); // 404 / 解析失敗 → 回退程序化
  cache.set(charId, p);
  return p;
}

function pickClip(animations, names) {
  if (!animations.length) return null;
  for (const n of names) {
    const c = animations.find((a) => a.name === n);
    if (c) return c;
  }
  for (const n of names) {
    const low = n.toLowerCase();
    const c = animations.find((a) => a.name.toLowerCase().includes(low));
    if (c) return c;
  }
  return null;
}

// 由模板複製出可獨立播放動畫的實例：{ root, mixer, actions, cfg }
export function instantiateSkin(template) {
  if (!template) return null;
  const cfg = template.cfg;
  const root = cloneSkinned(template.scene);
  root.scale.setScalar(cfg.scale);
  root.position.y = cfg.yOffset || 0;
  root.rotation.y = cfg.rotationY || 0;
  // 逐實例 clone 材質（避免隱身淡出影響到共用同模型的其他玩家）
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.frustumCulled = false; // 骨架動畫會移動包圍盒，關閉視錐裁切避免閃失
    if (Array.isArray(o.material)) o.material = o.material.map((m) => m.clone());
    else if (o.material) o.material = o.material.clone();
  });

  const mixer = new THREE.AnimationMixer(root);
  const actions = {};
  for (const key of ['idle', 'walk', 'attack', 'hit']) {
    const clip = pickClip(template.animations, cfg.clips[key] || []);
    if (!clip) continue;
    const act = mixer.clipAction(clip);
    if (key === 'attack' || key === 'hit') {
      act.setLoop(THREE.LoopOnce, 1);
      act.clampWhenFinished = true;
    }
    actions[key] = act;
  }
  return { root, mixer, actions, cfg };
}
