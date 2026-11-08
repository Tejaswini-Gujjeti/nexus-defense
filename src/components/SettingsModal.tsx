import React, { useState } from 'react';
import { soundManager } from '../game/audio/SoundManager';
import { X, Volume2, VolumeX, Music, BookOpen, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [sfxMuted, setSfxMuted] = useState(false);
  const [bgmMuted, setBgmMuted] = useState(false);
  const [masterVol, setMasterVol] = useState(0.7);

  if (!isOpen) return null;

  const toggleSfx = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    soundManager.setSfxMuted(next);
  };

  const toggleBgm = () => {
    const next = !bgmMuted;
    setBgmMuted(next);
    soundManager.setBgmMuted(next);
    if (!next) {
      soundManager.startAmbientBgm();
    } else {
      soundManager.stopAmbientBgm();
    }
  };

  const handleVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMasterVol(val);
    soundManager.setMasterVolume(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-cyber-card/95 border border-cyber-border rounded-2xl shadow-2xl p-6 text-slate-200">
        <div className="flex justify-between items-center pb-3 border-b border-cyber-border mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-orbitron font-bold text-slate-100">
              COMMAND SYSTEM CONFIGURATION
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Controls */}
        <div className="space-y-4 mb-6">
          <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            AUDIO SYNTHESIZER SETTINGS
          </h4>

          {/* Master Volume */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">MASTER SYNTH VOLUME</span>
              <span className="text-cyan-400 font-bold">{Math.round(masterVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVol}
              onChange={handleVolChange}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* SFX and BGM Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={toggleSfx}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-mono transition-all ${
                sfxMuted
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-cyber-cardHover border-cyan-800 text-cyan-300 shadow-neon-blue'
              }`}
            >
              {sfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{sfxMuted ? 'SFX MUTED' : 'SFX ACTIVE'}</span>
            </button>

            <button
              onClick={toggleBgm}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-mono transition-all ${
                bgmMuted
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-cyber-cardHover border-cyan-800 text-cyan-300 shadow-neon-blue'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>{bgmMuted ? 'AMBIENT BGM OFF' : 'AMBIENT BGM ON'}</span>
            </button>
          </div>
        </div>

        {/* Tactical Guide / Intel */}
        <div className="border-t border-cyber-border pt-4">
          <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            FIELD TACTICAL DIRECTIVE
          </h4>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-slate-100">Keyboard Shortcuts:</strong> Keys{' '}
              <code className="text-cyan-400 font-mono">1-6</code> select defense towers;{' '}
              <code className="text-rose-400 font-mono">Q, W, E</code> activate Tactical Abilities.
            </li>
            <li>
              <strong className="text-slate-100">Armor vs Shields:</strong> Blue rings indicate enemy energy shields; red mechs possess heavy armor that mitigates kinetic damage.
            </li>
            <li>
              <strong className="text-slate-100">Phase Infiltrators:</strong> Periodically cloak and cannot be targeted while phased—use Cryo Disrupters or AOE weapons to flush them out.
            </li>
            <li>
              <strong className="text-slate-100">Grid Overdrive:</strong> Use when bosses appear to instantly boost all tower attack speeds by 50%!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
