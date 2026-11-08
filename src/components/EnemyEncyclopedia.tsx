import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { ENEMY_CONFIGS } from '../game/entities/EnemyConfig';
import { EnemyType } from '../types/game';
import { ArrowLeft, Skull, AlertTriangle } from 'lucide-react';
import { soundManager } from '../game/audio/SoundManager';

export const EnemyEncyclopedia: React.FC = () => {
  const { setScreen } = useGameStore();
  const enemyList = Object.values(ENEMY_CONFIGS);
  const [selectedType, setSelectedType] = useState<EnemyType>('SCOUT');

  const currentEnemy = ENEMY_CONFIGS[selectedType];

  const handleSelectEnemy = (type: EnemyType) => {
    soundManager.playUpgrade();
    setSelectedType(type);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-dark flex flex-col p-4 sm:p-6 font-rajdhani select-none">
      <div className="absolute inset-0 holo-grid opacity-40 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-cyber-border mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('MAIN_MENU')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-mono tracking-widest text-rose-400 uppercase">
              THREAT INTEL DATABASE
            </span>
            <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-slate-100">
              HOSTILE ALIEN FORCES INTEL
            </h2>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Enemy List */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 overflow-y-auto pr-1">
          {enemyList.map((enemy) => {
            const isSelected = selectedType === enemy.type;
            return (
              <button
                key={enemy.type}
                onClick={() => handleSelectEnemy(enemy.type)}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-rose-950/40 border-rose-500 shadow-neon-red'
                    : 'bg-cyber-card/70 border-cyber-border hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
                    <Skull className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-rose-400 uppercase block">
                      {enemy.role}
                    </span>
                    <h4 className="text-sm font-orbitron font-bold text-slate-100">
                      {enemy.name}
                    </h4>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    enemy.threatLevel === 'EXTREME'
                      ? 'bg-purple-950 border border-purple-700 text-purple-300'
                      : enemy.threatLevel === 'CRITICAL'
                      ? 'bg-rose-950 border border-rose-700 text-rose-300'
                      : 'bg-amber-950 border border-amber-700 text-amber-300'
                  }`}
                >
                  {enemy.threatLevel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-8 flex flex-col bg-cyber-card/90 border border-cyber-border rounded-2xl p-5 sm:p-6 overflow-y-auto">
          {/* Enemy Header */}
          <div className="flex items-center justify-between pb-4 border-b border-cyber-border/80 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-black/50 border border-rose-500/50 shadow-neon-red">
                <Skull className="w-7 h-7 text-rose-500" />
              </div>
              <div>
                <span className="text-xs font-mono text-rose-400 uppercase tracking-wider">
                  CLASSIFICATION: {currentEnemy.role}
                </span>
                <h3 className="text-2xl font-orbitron font-extrabold text-slate-100">
                  {currentEnemy.name}
                </h3>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-700 text-xs font-mono text-rose-300 font-bold">
              THREAT: {currentEnemy.threatLevel}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            {currentEnemy.description}
          </p>

          {/* Combat Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mb-6">
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">BASE HIT POINTS</span>
              <span className="text-base font-bold text-rose-400">{currentEnemy.stats.maxHp} HP</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">ENERGY SHIELD</span>
              <span className="text-base font-bold text-cyan-400">{currentEnemy.stats.maxShield} SHD</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">VELOCITY</span>
              <span className="text-base font-bold text-amber-400">{currentEnemy.stats.speed} px/s</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">ARMOR MITIGATION</span>
              <span className="text-base font-bold text-purple-400">
                {Math.round(currentEnemy.stats.armor * 100)}% REDUCTION
              </span>
            </div>
          </div>

          {/* Rewards & Threat to Core */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-6">
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 flex items-center justify-between">
              <span>ELIMINATION BOUNTY</span>
              <span className="font-bold text-emerald-400">+{currentEnemy.stats.reward} CREDITS</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 flex items-center justify-between">
              <span>CORE THREAT LEVEL</span>
              <span className="font-bold text-rose-400">-{currentEnemy.stats.coreDamage * 5} NEXUS HULL</span>
            </div>
          </div>

          {/* Known Counter & Weakness */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/40 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>TACTICAL COUNTER & WEAKNESS</span>
            </div>
            <p className="text-slate-200 leading-relaxed">{currentEnemy.weakness}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
