import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { Shield, Play, RotateCcw, Cpu, BookOpen, Skull, Settings, HelpCircle } from 'lucide-react';
import { soundManager } from '../game/audio/SoundManager';

export const MainMenu: React.FC = () => {
  const { setScreen, hasSavedGame, checkSavedGame } = useGameStore();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; speed: number; opacity: number }[]>([]);

  useEffect(() => {
    checkSavedGame();

    // Generate futuristic background floating particles
    const items = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 20 + 10,
      opacity: Math.random() * 0.6 + 0.2,
    }));
    setParticles(items);
  }, []);

  const handleStartGame = () => {
    soundManager.playUpgrade();
    setScreen('MAP_SELECT');
  };

  const handleContinueGame = () => {
    soundManager.playUpgrade();
    setScreen('GAME');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-dark flex flex-col items-center justify-center font-rajdhani select-none">
      {/* Background Animated Particle Field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-cyan-400 animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              boxShadow: '0 0 8px rgba(0, 229, 255, 0.8)',
            }}
          />
        ))}

        {/* Ambient Grid Background */}
        <div className="absolute inset-0 holo-grid opacity-60" />
        <div className="absolute inset-0 bg-radial-vignette opacity-80" />
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 flex flex-col items-center max-w-xl w-full px-6 text-center animate-fade-in">
        {/* Futuristic Crest / Badge */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-cyber-card border-2 border-cyan-400 flex items-center justify-center shadow-neon-blue rotate-45">
            <Shield className="w-10 h-10 text-cyan-400 -rotate-45 animate-pulse" />
          </div>
          <div className="absolute -inset-2 rounded-2xl border border-cyan-500/30 animate-ping pointer-events-none" />
        </div>

        {/* Game Title */}
        <div className="mb-8">
          <span className="px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-700/80 text-[11px] font-mono tracking-widest text-cyan-300 uppercase shadow-neon-blue mb-2 inline-block">
            YEAR 2189 • HUMANITY'S LAST BASTION
          </span>
          <h1 className="text-4xl sm:text-5xl font-orbitron font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 drop-shadow-[0_0_25px_rgba(0,229,255,0.4)]">
            NEXUS DEFENSE
          </h1>
          <h2 className="text-lg font-orbitron font-bold tracking-[0.3em] text-rose-500 uppercase mt-1">
            LAST STAND
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Construct advanced defensive towers, safeguard the planetary energy core, and survive 50 escalating hostile alien drone waves.
          </p>
        </div>

        {/* Navigation Menu Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {/* Play New Campaign */}
          <button
            onClick={handleStartGame}
            className="group relative flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-extrabold text-sm tracking-wider transition-all duration-200 shadow-neon-blue transform hover:-translate-y-0.5"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>COMMENCE DEFENSE</span>
          </button>

          {/* Continue Game (if save exists) */}
          {hasSavedGame && (
            <button
              onClick={handleContinueGame}
              className="flex items-center justify-center gap-3 py-2.5 px-6 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500 text-purple-200 font-orbitron font-bold text-xs tracking-wider transition-all shadow-neon-purple"
            >
              <RotateCcw className="w-4 h-4 text-purple-400" />
              <span>RESUME SAVED CAMPAIGN</span>
            </button>
          )}

          {/* Performance Lab */}
          <button
            onClick={() => {
              soundManager.playUpgrade();
              setScreen('PERFORMANCE_LAB');
            }}
            className="flex items-center justify-center gap-3 py-2.5 px-6 rounded-xl bg-cyber-card hover:bg-cyber-cardHover border border-cyan-500/40 text-cyan-300 font-orbitron font-bold text-xs tracking-wider transition-all hover:border-cyan-400 shadow-neon-blue"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>PERFORMANCE LAB (5,000 ENTITIES)</span>
          </button>

          {/* Encyclopedias Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundManager.playUpgrade();
                setScreen('TOWER_ENCYCLOPEDIA');
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyber-card hover:bg-cyber-cardHover border border-slate-700 text-slate-300 font-mono text-xs hover:border-slate-400 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>TOWERS (LV 1-3)</span>
            </button>

            <button
              onClick={() => {
                soundManager.playUpgrade();
                setScreen('ENEMY_ENCYCLOPEDIA');
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyber-card hover:bg-cyber-cardHover border border-slate-700 text-slate-300 font-mono text-xs hover:border-slate-400 transition-colors"
            >
              <Skull className="w-4 h-4 text-rose-400" />
              <span>HOSTILES INTEL</span>
            </button>
          </div>

          {/* Secondary Controls */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => {
                soundManager.playUpgrade();
                setScreen('HOW_TO_PLAY');
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-black/40 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-mono text-xs transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>FIELD MANUAL</span>
            </button>

            <button
              onClick={() => {
                soundManager.playUpgrade();
                setScreen('SETTINGS');
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-black/40 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-mono text-xs transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>SYSTEM CONFIG</span>
            </button>
          </div>
        </div>

        {/* Footer Version & Specs */}
        <div className="mt-8 text-[11px] font-mono text-slate-500">
          <span>NEXUS DEFENSE ENGINE v1.0.0 • PIXI.JS v8 GPU ACCELERATED</span>
        </div>
      </div>
    </div>
  );
};
