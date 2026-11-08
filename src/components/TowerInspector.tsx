import React from 'react';
import { Tower } from '../game/entities/Tower';
import { TOWER_CONFIGS } from '../game/entities/TowerConfig';
import { TargetPriority } from '../types/game';
import { X, ArrowUpCircle, DollarSign, Award } from 'lucide-react';

interface TowerInspectorProps {
  tower: Tower | null;
  credits: number;
  onUpgrade: (tower: Tower) => void;
  onSell: (tower: Tower) => void;
  onClose: () => void;
  onChangePriority: (tower: Tower, priority: TargetPriority) => void;
}

export const TowerInspector: React.FC<TowerInspectorProps> = ({
  tower,
  credits,
  onUpgrade,
  onSell,
  onClose,
  onChangePriority,
}) => {
  if (!tower) return null;

  const config = TOWER_CONFIGS[tower.type];
  const sellRefund = Math.round(tower.totalInvested * 0.7);

  const isMaxLevel = tower.level >= 3;
  const nextLevelConfig = !isMaxLevel ? config.levels[tower.level] : null;
  const upgradeCost = nextLevelConfig ? nextLevelConfig.upgradeCost : 0;
  const canAffordUpgrade = !isMaxLevel && credits >= upgradeCost;

  const priorities: TargetPriority[] = ['FIRST', 'CLOSEST', 'STRONGEST', 'WEAKEST'];

  return (
    <div className="absolute right-4 top-16 w-80 bg-cyber-card/95 backdrop-blur-md border border-cyber-border rounded-xl shadow-2xl p-4 z-40 text-slate-200 select-none animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
            {config.category}
          </span>
          <h3 className="text-base font-orbitron font-bold text-slate-100 flex items-center gap-2">
            {config.name}
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">
              TIER {tower.level} / 3
            </span>
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Combat Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 my-3 text-xs font-mono">
        <div className="p-2 rounded bg-black/40 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">DAMAGE</span>
          <span className="text-cyan-400 font-bold">{tower.stats.damage}</span>
        </div>
        <div className="p-2 rounded bg-black/40 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">ATTACK SPEED</span>
          <span className="text-cyan-400 font-bold">{tower.stats.fireRate}/s</span>
        </div>
        <div className="p-2 rounded bg-black/40 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">RANGE</span>
          <span className="text-cyan-400 font-bold">{tower.stats.range}px</span>
        </div>
        <div className="p-2 rounded bg-black/40 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">CONFIRMED KILLS</span>
          <span className="text-emerald-400 font-bold">{tower.kills}</span>
        </div>
      </div>

      {/* Targeting Priority Selector */}
      <div className="mb-4">
        <label className="text-[11px] font-mono text-slate-400 block mb-1">
          TARGET ACQUISITION PRIORITY
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {priorities.map((p) => (
            <button
              key={p}
              onClick={() => onChangePriority(tower, p)}
              className={`py-1 px-2 rounded text-[10px] font-mono font-semibold transition-all border text-center ${
                tower.targetPriority === p
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-neon-blue'
                  : 'bg-black/40 border-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Level Upgrade Action */}
      <div className="mb-4">
        {isMaxLevel ? (
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/80 text-xs font-mono text-purple-300 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div>
              <span className="font-bold block">APEX LEVEL 3 REACHED</span>
              <span className="text-[10px] text-purple-400/80">Maximum titanium armor and output achieved.</span>
            </div>
          </div>
        ) : (
          <button
            disabled={!canAffordUpgrade}
            onClick={() => onUpgrade(tower)}
            className={`w-full text-left p-3 rounded-xl border transition-all ${
              canAffordUpgrade
                ? 'bg-cyber-cardHover/90 border-cyan-500/60 hover:border-cyan-400 shadow-neon-blue'
                : 'bg-black/30 border-slate-800 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-1.5">
                <ArrowUpCircle className="w-4 h-4 text-cyan-400" />
                UPGRADE TO TIER {tower.level + 1}
              </span>
              <span className={`text-xs font-mono font-bold ${canAffordUpgrade ? 'text-amber-400' : 'text-rose-400'}`}>
                {upgradeCost} CR
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              {nextLevelConfig?.name}: {nextLevelConfig?.description}
            </p>
          </button>
        )}
      </div>

      {/* Sell Action */}
      <div className="pt-3 border-t border-cyber-border">
        <button
          onClick={() => onSell(tower)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900/50 hover:border-rose-600 transition-colors text-xs font-mono font-bold"
        >
          <DollarSign className="w-4 h-4" />
          DECOMMISSION & RECYCLE (+{sellRefund} CR)
        </button>
      </div>
    </div>
  );
};
