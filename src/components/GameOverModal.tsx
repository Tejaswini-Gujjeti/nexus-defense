import React from 'react';
import { GameState } from '../types/game';
import { RotateCcw, Trophy, Skull, Award } from 'lucide-react';

interface GameOverModalProps {
  state: GameState;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ state, onRestart }) => {
  if (!state.isGameOver && !state.isVictory) return null;

  const isVictory = state.isVictory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4 animate-fade-in">
      <div
        className={`w-full max-w-md p-6 rounded-2xl border text-center shadow-2xl ${
          isVictory
            ? 'bg-cyber-card/95 border-emerald-500 shadow-neon-green'
            : 'bg-cyber-card/95 border-rose-600 shadow-neon-red'
        }`}
      >
        {/* Icon Header */}
        <div className="inline-flex p-3 rounded-2xl bg-black/50 border border-slate-800 mb-3">
          {isVictory ? (
            <Award className="w-10 h-10 text-emerald-400 animate-bounce" />
          ) : (
            <Skull className="w-10 h-10 text-rose-500 animate-pulse" />
          )}
        </div>

        {/* Title */}
        <h2
          className={`text-2xl font-orbitron font-extrabold tracking-wider mb-1 ${
            isVictory ? 'text-emerald-300' : 'text-rose-400'
          }`}
        >
          {isVictory ? 'TACTICAL VICTORY' : 'NEXUS OVERRUN'}
        </h2>

        <p className="text-xs text-slate-300 mb-5">
          {isVictory
            ? 'All hostile alien cybernetic dreadnoughts and drone swarms have been neutralized.'
            : 'The primary power array has collapsed under the weight of hostile incursions.'}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-left">
          <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">FINAL SCORE</span>
            <span className="text-lg font-bold text-cyan-400">
              {state.score.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 block flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              HIGH SCORE
            </span>
            <span className="text-lg font-bold text-amber-300">
              {state.highScore.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">FINAL WAVE</span>
            <span className="text-base font-bold text-slate-200">
              {state.wave} / {state.totalWaves}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">REMAINING HULL</span>
            <span
              className={`text-base font-bold ${
                state.coreHp > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {Math.max(0, Math.round(state.coreHp))} / {state.maxCoreHp}
            </span>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className={`w-full py-3 px-4 rounded-xl font-orbitron font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-xl ${
            isVictory
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-neon-green'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-neon-red'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          REDEPLOY DEFENSE PROTOCOL
        </button>
      </div>
    </div>
  );
};
