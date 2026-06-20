// 音效設定按鈕：固定在右上角的齒輪鈕，點擊開啟面板調整「背景音樂」與「音效」音量（含靜音）。
// 全域掛在 App 最上層，因此選單/大廳/遊戲中/結算頁都能使用（遊戲內外皆可調）。

import { useEffect, useState } from 'react';
import {
  getAudioSettings,
  subscribeAudioSettings,
  updateAudioSettings,
  type AudioSettings,
} from '../utils/audioSettings';

export function AudioSettingsButton() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AudioSettings>(getAudioSettings());

  useEffect(() => subscribeAudioSettings(setSettings), []);

  return (
    <>
      <button
        className="settings-fab"
        title="音效設定"
        aria-label="音效設定"
        onClick={() => setOpen((v) => !v)}
      >
        ⚙
      </button>

      {open && (
        <div className="settings-overlay" onClick={() => setOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-head">
              <h3>音效設定</h3>
              <button className="settings-close" aria-label="關閉" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <VolumeRow
              label="背景音樂"
              volume={settings.musicVolume}
              muted={settings.musicMuted}
              onVolume={(v) => updateAudioSettings({ musicVolume: v, musicMuted: false })}
              onToggleMute={() => updateAudioSettings({ musicMuted: !settings.musicMuted })}
            />
            <VolumeRow
              label="音效"
              volume={settings.sfxVolume}
              muted={settings.sfxMuted}
              onVolume={(v) => updateAudioSettings({ sfxVolume: v, sfxMuted: false })}
              onToggleMute={() => updateAudioSettings({ sfxMuted: !settings.sfxMuted })}
            />
            <FullscreenRow />
          </div>
        </div>
      )}
    </>
  );
}

interface VolumeRowProps {
  label: string;
  volume: number;
  muted: boolean;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
}

function VolumeRow({ label, volume, muted, onVolume, onToggleMute }: VolumeRowProps) {
  const pct = Math.round((muted ? 0 : volume) * 100);
  return (
    <div className="settings-row">
      <div className="settings-row-top">
        <span className="settings-label">{label}</span>
        <span className="settings-pct">{pct}%</span>
      </div>
      <div className="settings-row-ctrl">
        <button
          className="settings-mute"
          aria-label={muted ? '解除靜音' : '靜音'}
          onClick={onToggleMute}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolume(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

function FullscreenRow() {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="settings-row">
      <div className="settings-row-top">
        <span className="settings-label">畫面設定</span>
        <span className="settings-pct">{isFullscreen ? '全螢幕' : '視窗'}</span>
      </div>
      <div className="settings-row-ctrl">
        <button
          className="btn primary"
          style={{ width: '100%', padding: '8px 12px', fontSize: '13px', margin: '4px 0 0' }}
          onClick={handleToggle}
        >
          {isFullscreen ? '🖥 退出全螢幕' : '🖥 進入全螢幕'}
        </button>
      </div>
    </div>
  );
}
