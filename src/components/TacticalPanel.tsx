import React from 'react';
import { TacticalAbility } from '../types/game';
import { Bomb, ZapOff, Activity } from 'lucide-react';

interface TacticalPanelProps {
  abilities: TacticalAbility[];
  activeAbilityId: string | null;
  currentEnergy: number;
  onSelectAbility: (abilityId: string | null) => void;
}

const ABILITY_ICONS: Record<string, React.ReactNode> = {
  Bomb: <Bomb className="w-5 h-5 text-rose-400" />,
  ZapOff: <ZapOff className="w-5 h-5 text-cyan-400" />,
  Activity: <Activity className="w-5 h-5 text-amber-400" />,
};

const HOTKEYS = ['Q', 'W', 'E'];

export const TacticalPanel: React.FC<TacticalPanelProps> = ({
  abilities,
  activeAbilityId,
  currentEnergy,
  onSelectAbility,
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-cyber-card/90 backdrop-blur-md border border-cyber-border rounded-xl shadow-2xl">
      <div className="hidden sm:flex flex-col pr-2 border-r border-cyber-border/60">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">TACTICAL</span>
        <span className="text-xs font-orbitron font-bold text-rose-400">COMMAND</span>
      </div>

      <div className="flex items-center gap-2">
        {abilities.map((ability, idx) => {
          const isActive = activeAbilityId === ability.id;
          const onCooldown = ability.cooldownRemaining > 0;
          const hasEnergy = currentEnergy >= ability.energyCost;
          const isReady = !onCooldown && hasEnergy;

          const cooldownPct = onCooldown
            ? (ability.cooldownRemaining / ability.cooldownSec) * 100
            : 0;

          return (
            <button
              key={ability.id}
              onClick={() => {
                if (isReady) {
                  onSelectAbility(isActive ? null : ability.id);
                }
              }}
              className={`relative group flex flex-col items-center p-2 rounded-lg border transition-all ${
                isActive
                  ? 'bg-rose-500/20 border-rose-500 shadow-neon-red scale-105'
                  : isReady
                  ? 'bg-cyber-cardHover/70 border-cyber-border hover:border-slate-300'
                  : 'bg-black/50 border-slate-800 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Hotkey badge */}
              <span className="absolute -top-1.5 -left-1.5 px-1 py-0.2 bg-slate-900 border border-slate-700 rounded text-[9px] font-mono text-slate-400">
                {HOTKEYS[idx]}
              </span>

              {/* Icon */}
              <div className="p-1 rounded-md bg-black/40 mb-1">
                {ABILITY_ICONS[ability.icon]}
              </div>

              {/* Name */}
              <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">
                {ability.name}
              </span>

              {/* Energy Cost */}
              <span
                className={`text-[10px] font-mono font-bold ${
                  hasEnergy ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {ability.energyCost} EP
              </span>

              {/* Cooldown overlay */}
              {onCooldown && (
                <div
                  className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-amber-300"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${cooldownPct}%, 0 ${cooldownPct}%)`,
                  }}
                >
                  {ability.cooldownRemaining.toFixed(1)}s
                </div>
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2.5 bg-cyber-dark/95 border border-cyber-border rounded-lg text-left pointer-events-none z-50 shadow-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-orbitron font-bold text-rose-400">{ability.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400">{ability.energyCost} EP</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight">{ability.description}</p>
                {ability.radius > 0 && (
                  <div className="mt-1 text-[10px] font-mono text-slate-400">
                    Radius: <span className="text-slate-100">{ability.radius}px</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
