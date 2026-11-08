import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { TOWER_CONFIGS } from '../game/entities/TowerConfig';
import { TowerType } from '../types/game';
import { ArrowLeft, Zap, Sun, Snowflake, Flame, Crosshair, Radio, Crosshair as TargetIcon } from 'lucide-react';
import { soundManager } from '../game/audio/SoundManager';

const TOWER_ICONS: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-6 h-6 text-cyan-400" />,
  Sun: <Sun className="w-6 h-6 text-pink-400" />,
  Snowflake: <Snowflake className="w-6 h-6 text-sky-400" />,
  Flame: <Flame className="w-6 h-6 text-orange-400" />,
  Crosshair: <Crosshair className="w-6 h-6 text-purple-400" />,
  Radio: <Radio className="w-6 h-6 text-yellow-400" />,
};

export const TowerEncyclopedia: React.FC = () => {
  const { setScreen } = useGameStore();
  const towerList = Object.values(TOWER_CONFIGS);
  const [selectedType, setSelectedType] = useState<TowerType>('PULSE_CANNON');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  const currentTower = TOWER_CONFIGS[selectedType];
  const currentLvlConfig = currentTower.levels[selectedLevel - 1];

  const handleSelectTower = (type: TowerType) => {
    soundManager.playUpgrade();
    setSelectedType(type);
    setSelectedLevel(1);
  };

  const handleSelectLevel = (lvl: number) => {
    soundManager.playUpgrade();
    setSelectedLevel(lvl);
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
            <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase">
              ALLIANCE DEFENSE DATABASE
            </span>
            <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-slate-100">
              TOWER ENCYCLOPEDIA (LEVELS 1–3)
            </h2>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Towers List */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 overflow-y-auto pr-1">
          {towerList.map((tower) => {
            const isSelected = selectedType === tower.type;
            return (
              <button
                key={tower.type}
                onClick={() => handleSelectTower(tower.type)}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyber-cardHover/90 border-cyan-400 shadow-neon-blue'
                    : 'bg-cyber-card/70 border-cyber-border hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
                    {TOWER_ICONS[tower.icon]}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase block">
                      {tower.category}
                    </span>
                    <h4 className="text-sm font-orbitron font-bold text-slate-100">
                      {tower.name}
                    </h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-400 block">
                    {tower.baseCost} CR
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">3 TIERS</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-8 flex flex-col bg-cyber-card/90 border border-cyber-border rounded-2xl p-5 sm:p-6 overflow-y-auto">
          {/* Tower Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cyber-border/80 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/50 shadow-neon-blue">
                {TOWER_ICONS[currentTower.icon]}
              </div>
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  {currentTower.category}
                </span>
                <h3 className="text-2xl font-orbitron font-extrabold text-slate-100">
                  {currentTower.name}
                </h3>
              </div>
            </div>

            {/* Level Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-black/50 border border-slate-800 rounded-xl">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleSelectLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    selectedLevel === lvl
                      ? 'bg-cyan-500 text-black shadow-neon-blue'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  LEVEL {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Level Details */}
          <div className="my-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-orbitron font-bold text-cyan-300">
                {currentLvlConfig.name}
              </h4>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {selectedLevel === 1 ? `BASE COST: ${currentTower.baseCost} CR` : `UPGRADE COST: ${currentLvlConfig.upgradeCost} CR`}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {currentLvlConfig.description}
            </p>

            {/* Combat Specs Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mb-6">
              <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">DAMAGE</span>
                <span className="text-base font-bold text-cyan-400">{currentLvlConfig.stats.damage}</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">FIRE CADENCE</span>
                <span className="text-base font-bold text-cyan-400">{currentLvlConfig.stats.fireRate}/s</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">EFFECTIVE RANGE</span>
                <span className="text-base font-bold text-cyan-400">{currentLvlConfig.stats.range}px</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">EST. DPS</span>
                <span className="text-base font-bold text-emerald-400">
                  {Math.round(currentLvlConfig.stats.damage * currentLvlConfig.stats.fireRate)}
                </span>
              </div>
            </div>

            {/* Special Traits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono mb-6">
              {currentLvlConfig.stats.splashRadius && (
                <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-800/40 text-orange-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span>Explosive Splash Radius: {currentLvlConfig.stats.splashRadius}px</span>
                </div>
              )}

              {currentLvlConfig.stats.slowEffect && (
                <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-800/40 text-sky-300 flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Field Slow: {Math.round(currentLvlConfig.stats.slowEffect * 100)}% for {currentLvlConfig.stats.slowDuration}s</span>
                </div>
              )}

              {currentLvlConfig.stats.armorShred && (
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-purple-300 flex items-center gap-2">
                  <TargetIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Armor Piercing: {Math.round(currentLvlConfig.stats.armorShred * 100)}% mitigation bypass</span>
                </div>
              )}

              {currentLvlConfig.stats.chainTargets && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Chain Arc: Jumps across {currentLvlConfig.stats.chainTargets} hostiles</span>
                </div>
              )}
            </div>

            {/* Tactical Lore */}
            <div className="p-4 rounded-xl bg-black/50 border border-slate-800 text-xs">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                ALLIANCE ENGINEERING LORE & TACTICAL ADVICE
              </span>
              <p className="text-slate-300 leading-relaxed italic">{currentTower.lore}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
