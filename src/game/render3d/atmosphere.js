// 大氣粒子：依 theme 持續產生環境粒子 (雪、餘燼、落葉、星塵、幽魂…)
// 用既有 particles 系統 spawn — 高度自 sky 灑下，順著 fallSpeed 飄至地面。
//
// theme.atmosphere = {
//   kind: 'snow' | 'embers' | 'leaves' | 'stardust' | 'spores',
//   rate: 8,          // 每秒粒子數
//   color: 0xffffff,
//   fallSpeed: 100,
//   drift: 30,        // 橫向飄動幅度
//   life: 4,
//   size: 5,
// }

import { ARENA } from '../constants.js';

const PRESETS = {
  snow:     { color: '#e8f6ff', fallSpeed: 90,  drift: 40, life: 4.5, size: 4.5, rate: 24 },
  embers:   { color: '#ff7a3d', fallSpeed: -40, drift: 12, life: 2.2, size: 3,   rate: 22, glow: true },
  leaves:   { color: '#a6c84a', fallSpeed: 60,  drift: 55, life: 5.0, size: 5,   rate: 12 },
  stardust: { color: '#c39bff', fallSpeed: 18,  drift: 20, life: 6.0, size: 3.5, rate: 16, glow: true },
  spores:   { color: '#9ad13a', fallSpeed: 22,  drift: 35, life: 5.5, size: 4,   rate: 14, glow: true },
  petals:   { color: '#ffb3e6', fallSpeed: 50,  drift: 70, life: 5.5, size: 4.5, rate: 14 },
  ash:      { color: '#7a7a7a', fallSpeed: 35,  drift: 18, life: 4.0, size: 3.5, rate: 16 },
};

export function createAtmosphere(particles) {
  let cfg = null;
  let acc = 0;

  function setTheme(theme) {
    const atm = theme && theme.atmosphere;
    if (!atm) { cfg = null; return; }
    const preset = PRESETS[atm.kind] || PRESETS.snow;
    cfg = { ...preset, ...atm };
    acc = 0;
  }

  function update(dt) {
    if (!cfg) return;
    acc += dt * (cfg.rate || 10);
    while (acc >= 1) {
      acc -= 1;
      spawn();
    }
  }

  function spawn() {
    // 在競技場上方 / 內均勻分布 (場景座標：x 約 ±600, z 約 ±400)
    const x = (Math.random() - 0.5) * (ARENA.width + 200);
    const z = (Math.random() - 0.5) * (ARENA.height + 200);
    const y = cfg.fallSpeed < 0 ? 0 : 380 + Math.random() * 200;
    particles.spawn({
      x, y, z,
      vx: (Math.random() - 0.5) * (cfg.drift || 20),
      vy: -cfg.fallSpeed + (Math.random() - 0.5) * 8,
      vz: (Math.random() - 0.5) * (cfg.drift || 20),
      gravity: 0, drag: 0.4,
      life: cfg.life * (0.7 + Math.random() * 0.5),
      size: cfg.size * (0.7 + Math.random() * 0.5),
      color: cfg.color, fade: true,
    });
  }

  return { setTheme, update };
}
