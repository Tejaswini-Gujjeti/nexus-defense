import React from 'react';
import { TowerType } from '../types/game';
import { TOWER_CONFIGS } from '../game/entities/TowerConfig';
import { Zap, Sun, Snowflake, Flame, Crosshair, Radio } from 'lucide-react';

interface TowerDeckProps {
  selectedBuildType: TowerType | null;
  onSelectBuildType: (type: TowerType | null) => void;
  credits: number;
}

const ICONS: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5 text-cyan-400" />,
  Sun: <Sun className="w-5 h-5 text-pink-400" />,
  Snowflake: <Snowflake className="w-5 h-5 text-sky-400" />,
  Flame: <Flame className="w-5 h-5 text-orange-400" />,
  Crosshair: <Crosshair className="w-5 h-5 text-purple-400" />,
  Radio: <Radio className="w-5 h-5 text-yellow-400" />,
};

const HOTKEYS = ['1', '2', '3', '4', '5', '6'];

export const TowerDeck: React.FC<TowerDeckProps> = ({
  selectedBuildType,
  onSelectBuildType,
  credits,
}) => {
  const towers = Object.values(TOWER_CONFIGS);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-cyber-card/90 backdrop-blur-md border border-cyber-border rounded-xl shadow-2xl">
      <div className="hidden sm:flex flex-col pr-2 border-r border-cyber-border/60">
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">DEFENSE</span>
        <span className="text-xs font-orbitron font-bold text-cyan-400">ARSENAL</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
        {towers.map((tower, idx) => {
          const isSelected = selectedBuildType === tower.type;
          const canAfford = credits >= tower.baseCost;

          return (
            <button
              key={tower.type}
              onClick={() => onSelectBuildType(isSelected ? null : tower.type)}
              className={`relative group flex flex-col items-center p-1.5 sm:p-2 rounded-lg transition-all border ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-neon-blue scale-105'
                  : canAfford
                  ? 'bg-cyber-cardHover/70 border-cyber-border hover:border-slate-400 hover:bg-slate-800/60'
                  : 'bg-black/40 border-slate-800/60 opacity-50 cursor-not-allowed'
              }`}
              title={`${tower.name}: ${tower.description}`}
            >
              {/* Hotkey badge */}
              <span className="absolute -top-1.5 -left-1.5 px-1 py-0.2 bg-slate-900 border border-slate-700 rounded text-[9px] font-mono text-slate-400">
                {HOTKEYS[idx]}
              </span>

              {/* Icon */}
              <div className="p-1 rounded-md bg-black/40 mb-1">
                {ICONS[tower.icon]}
              </div>

              {/* Name & Cost */}
              <span className="text-[11px] sm:text-xs font-semibold text-slate-200 whitespace-nowrap">
                {tower.name}
              </span>
              <span
                className={`text-[10px] sm:text-[11px] font-mono font-bold ${
                  canAfford ? 'text-amber-400' : 'text-rose-500'
                }`}
              >
                {tower.baseCost} CR
              </span>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2.5 bg-cyber-dark/95 border border-cyan-500/40 rounded-lg text-left pointer-events-none z-50 shadow-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-orbitron font-bold text-cyan-300">{tower.name}</span>
                  <span className="text-[10px] font-mono text-amber-400">{tower.baseCost} CR</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight mb-2">{tower.description}</p>
                <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-400">
                  <div>DMG: <span className="text-slate-100">{tower.levels[0].stats.damage}</span></div>
                  <div>RNG: <span className="text-slate-100">{tower.levels[0].stats.range}px</span></div>
                  <div>RATE: <span className="text-slate-100">{tower.levels[0].stats.fireRate}/s</span></div>
                  <div>SPD: <span className="text-slate-100">{tower.levels[0].stats.projectileSpeed}</span></div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
