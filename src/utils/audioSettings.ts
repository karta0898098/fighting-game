// 音效/音樂設定中樞：集中管理「背景音樂音量」與「音效音量」（含各自靜音），
// 持久化到 localStorage，並套用到 audioManager（背景音樂）與 sfxManager（音效）。
// UI（AudioSettingsButton）讀此 store 並呼叫 update；App 在掛載時 apply 一次。

import { getAudioManager } from './audioManager';
import { getSfxManager } from './sfxManager';

export interface AudioSettings {
  /** 背景音樂音量 0..1。 */
  musicVolume: number;
  /** 音效音量 0..1。 */
  sfxVolume: number;
  /** 背景音樂靜音。 */
  musicMuted: boolean;
  /** 音效靜音。 */
  sfxMuted: boolean;
}

const STORAGE_KEY = 'fg-audio-settings';
const DEFAULTS: AudioSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.9,
  musicMuted: false,
  sfxMuted: false,
};

function clamp01(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function loadSettings(): AudioSettings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      musicVolume: clamp01(parsed.musicVolume, DEFAULTS.musicVolume),
      sfxVolume: clamp01(parsed.sfxVolume, DEFAULTS.sfxVolume),
      musicMuted: !!parsed.musicMuted,
      sfxMuted: !!parsed.sfxMuted,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

let state: AudioSettings = loadSettings();
const subscribers = new Set<(s: AudioSettings) => void>();

function persist(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage 不可用（隱私模式等）→ 略過持久化 */
  }
}

// 將目前設定推到兩個管理器（靜音 = 音量視為 0）。
function apply(): void {
  const music = getAudioManager();
  music.setVolume(state.musicMuted ? 0 : state.musicVolume);

  const sfx = getSfxManager();
  sfx.setMasterVolume(state.sfxMuted ? 0 : state.sfxVolume);
  sfx.setMuted(state.sfxMuted);
}

/** 取得目前設定（唯讀快照）。 */
export function getAudioSettings(): AudioSettings {
  return state;
}

/** 訂閱設定變更；回傳取消訂閱函式。 */
export function subscribeAudioSettings(cb: (s: AudioSettings) => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

/** 局部更新設定 → 持久化 + 套用到管理器 + 通知訂閱者。 */
export function updateAudioSettings(patch: Partial<AudioSettings>): void {
  state = {
    ...state,
    ...patch,
    musicVolume: patch.musicVolume !== undefined ? clamp01(patch.musicVolume, state.musicVolume) : state.musicVolume,
    sfxVolume: patch.sfxVolume !== undefined ? clamp01(patch.sfxVolume, state.sfxVolume) : state.sfxVolume,
  };
  persist();
  apply();
  subscribers.forEach((cb) => cb(state));
}

/** 套用目前設定到管理器（App 掛載時呼叫一次，確保載入的音量生效）。 */
export function applyAudioSettings(): void {
  apply();
}
