import React, { useState } from 'react';
import { GameState } from '../types/game';
import { Shield, Coins, Zap, Play, FastForward, Pause, Settings, Swords, RotateCcw, Home, Skull } from 'lucide-react';

interface HUDProps {
  state: GameState;
  onStartNextWave: () => void;
  onSetGameSpeed: (speed: number) => void;
  onOpenSettings: () => void;
  onRestart: () => void;
  onReturnToMenu: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  onStartNextWave,
  onSetGameSpeed,
  onOpenSettings,
  onRestart,
  onReturnToMenu,
}) => {
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showMenuConfirm, setShowMenuConfirm] = useState(false);

  const hpPct = Math.max(0, Math.min(100, (state.coreHp / state.maxCoreHp) * 100));
  const shieldPct = Math.max(0, Math.min(100, (state.coreShield / state.maxCoreShield) * 100));
  const energyPct = Math.max(0, Math.min(100, (state.energy / state.maxEnergy) * 100));

  const bossHpPct = state.bossActive && state.bossMaxHp
    ? Math.max(0, Math.min(100, ((state.bossHp || 0) / state.bossMaxHp) * 100))
    : 0;

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2 bg-cyber-dark/90 backdrop-blur-md border-b border-cyber-border shadow-2xl select-none">
        {/* Left: Brand & Menu Return */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowMenuConfirm(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
            title="Return to Main Menu"
          >
            <Home className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyber-card border border-cyan-400 flex items-center justify-center shadow-neon-blue">
              <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-orbitron font-extrabold tracking-wider text-slate-100 flex items-center gap-1.5">
                NEXUS DEFENSE
                <span className="text-[9px] font-mono px-1 py-0.2 bg-rose-950/80 border border-rose-800 text-rose-400 rounded">
                  LAST STAND
                </span>
              </h1>
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className="text-cyan-400">SCORE: {state.score.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Core Integrity Telemetry */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-cyber-card/80 border border-cyber-border rounded-xl">
          <div className="w-32">
            <div className="flex justify-between text-[10px] font-mono mb-0.5">
              <span className="text-slate-400">NEXUS HULL</span>
              <span className={hpPct > 50 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {Math.round(state.coreHp)} / {state.maxCoreHp}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className={`h-full transition-all duration-300 ${
                  hpPct > 50 ? 'bg-emerald-400' : hpPct > 25 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          <div className="w-24">
            <div className="flex justify-between text-[10px] font-mono mb-0.5">
              <span className="text-cyan-400">SHIELD</span>
              <span className="text-cyan-300 font-bold">
                {Math.round(state.coreShield)} / {state.maxCoreShield}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${shieldPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Economy, Wave, Speed, and Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Credits */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/20 border border-amber-600/40 rounded-xl">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 tracking-wider">
              {state.credits}
            </span>
            <span className="text-[10px] font-mono text-amber-500/80">CR</span>
          </div>

          {/* Tactical Energy */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-cyan-950/20 border border-cyan-600/40 rounded-xl">
            <Zap className="w-4 h-4 text-cyan-400" />
            <div className="w-14">
              <div className="flex justify-between text-[9px] font-mono text-cyan-400 leading-none mb-1">
                <span>ENERGY</span>
                <span>{Math.round(state.energy)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${energyPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Wave Tracker & Launch Button */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-cyber-card border border-cyber-border rounded-xl">
            <div className="text-right">
              <span className="text-[9px] font-mono text-slate-400 block leading-tight">
                {state.waveInProgress ? `ENEMIES: ${state.enemiesAlive}` : `NEXT: ${state.waveCountdown.toFixed(1)}s`}
              </span>
              <span className="text-xs font-orbitron font-bold text-slate-200">
                WAVE {state.wave} / {state.totalWaves}
              </span>
            </div>

            {!state.waveInProgress && (
              <button
                onClick={onStartNextWave}
                className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-[11px] rounded-lg transition-all shadow-neon-blue flex items-center gap-1"
                title="Launch Wave Now"
              >
                <Swords className="w-3 h-3" />
                <span>LAUNCH</span>
              </button>
            )}
          </div>

          {/* Game Speed (1x, 2x, 3x) and Pause Controls */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
            <button
              onClick={() => onSetGameSpeed(state.gameSpeed === 0 ? 1 : 0)}
              className={`p-1.5 rounded-lg text-xs font-mono transition-colors ${
                state.gameSpeed === 0 ? 'bg-amber-500/30 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Pause / Resume (Spacebar)"
            >
              {state.gameSpeed === 0 ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onSetGameSpeed(1)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                state.gameSpeed === 1 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => onSetGameSpeed(2)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                state.gameSpeed === 2 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              2x
            </button>
            <button
              onClick={() => onSetGameSpeed(3)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                state.gameSpeed === 3 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-white'
              }`}
              title="Fast Forward 3x"
            >
              <FastForward className="w-3 h-3 inline mr-0.5" />
              3x
            </button>
          </div>

          {/* Restart Button */}
          <button
            onClick={() => setShowRestartConfirm(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-600 transition-colors"
            title="Restart Active Mission"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-600 transition-colors"
            title="System Config"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Dedicated Boss Health Bar Banner (Visible when Boss is on Battlefield) */}
      {state.bossActive && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 animate-fade-in pointer-events-none">
          <div className="bg-black/85 backdrop-blur-md border border-purple-500 rounded-xl p-2.5 shadow-neon-purple">
            <div className="flex justify-between items-center text-xs font-orbitron font-bold mb-1">
              <span className="text-purple-300 flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-purple-400 animate-pulse" />
                {state.bossName || 'OMEGA DREADNOUGHT TITAN'}
              </span>
              <span className="text-rose-400 font-mono">
                {Math.round(state.bossHp || 0)} / {state.bossMaxHp} HP
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-purple-900/80">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-rose-500 to-amber-400 transition-all duration-150"
                style={{ width: `${bossHpPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Restart Confirmation Dialog */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-cyber-card border border-rose-600/80 rounded-2xl p-6 text-center shadow-neon-red">
            <h3 className="text-lg font-orbitron font-bold text-rose-400 mb-2">
              CONFIRM DEFENSE RESTART
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              Restarting will reset all active defense towers, currency, and wave progress back to Wave 1. Are you sure you wish to redeploy?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setShowRestartConfirm(false);
                  onRestart();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold shadow-neon-red"
              >
                CONFIRM RESTART
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return to Menu Confirmation Dialog */}
      {showMenuConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-cyber-card border border-cyan-500/80 rounded-2xl p-6 text-center shadow-neon-blue">
            <h3 className="text-lg font-orbitron font-bold text-cyan-300 mb-2">
              RETURN TO COMMAND HEADQUARTERS
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              Your defense progress is automatically saved and can be resumed from the Main Menu. Return to title screen?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowMenuConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold"
              >
                RESUME DEFENSE
              </button>
              <button
                onClick={() => {
                  setShowMenuConfirm(false);
                  onReturnToMenu();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold shadow-neon-blue"
              >
                RETURN TO MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
