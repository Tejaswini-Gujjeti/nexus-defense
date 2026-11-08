import React from 'react';
import { useGameStore } from '../state/gameStore';
import { ArrowLeft, BookOpen, Shield, Target, DollarSign, Swords } from 'lucide-react';

export const HowToPlayModal: React.FC = () => {
  const { setScreen } = useGameStore();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-dark flex flex-col p-4 sm:p-6 font-rajdhani select-none">
      <div className="absolute inset-0 holo-grid opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-cyber-border mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('MAIN_MENU')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase">
              COMMAND OPERATIONAL DIRECTIVE
            </span>
            <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              FIELD TACTICAL MANUAL
            </h2>
          </div>
        </div>
      </div>

      {/* Manual Content */}
      <div className="relative z-10 flex-1 max-w-4xl mx-auto w-full bg-cyber-card/90 border border-cyber-border rounded-2xl p-6 overflow-y-auto space-y-6 text-slate-200">
        {/* Mission Objective */}
        <div>
          <h3 className="text-base font-orbitron font-bold text-cyan-400 flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            1. PRIMARY MISSION DIRECTIVE
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The year is 2189. Alien cybernetic dreadnoughts and drone swarms have invaded the orbital sector. Your mandate as Defense Commander is to protect humanity's final energy reactor—<strong>The Nexus Core</strong>—across 50 escalating combat waves. If the Nexus hull reaches 0, civilization falls.
          </p>
        </div>

        {/* Keyboard Shortcuts */}
        <div>
          <h3 className="text-base font-orbitron font-bold text-amber-400 flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-amber-400" />
            2. KEYBOARD SHORTCUTS & COMBAT DOCK
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex justify-between">
              <span className="text-slate-400">SELECT TOWERS 1–6</span>
              <span className="text-cyan-400 font-bold">KEYS 1, 2, 3, 4, 5, 6</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex justify-between">
              <span className="text-slate-400">ORBITAL KINETIC STRIKE</span>
              <span className="text-rose-400 font-bold">KEY Q</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex justify-between">
              <span className="text-slate-400">EMP DISRUPTION BURST</span>
              <span className="text-cyan-400 font-bold">KEY W</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex justify-between">
              <span className="text-slate-400">GRID OVERDRIVE (+50% SPEED)</span>
              <span className="text-amber-400 font-bold">KEY E</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex justify-between">
              <span className="text-slate-400">PAUSE / PLAY SIMULATION</span>
              <span className="text-slate-200 font-bold">SPACEBAR</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex justify-between">
              <span className="text-slate-400">CANCEL / DESELECT SELECTION</span>
              <span className="text-slate-200 font-bold">ESCAPE</span>
            </div>
          </div>
        </div>

        {/* Economy & Upgrades */}
        <div>
          <h3 className="text-base font-orbitron font-bold text-emerald-400 flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            3. ECONOMY & 3-TIER TOWER UPGRADES
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Defeating hostiles rewards Credits (CR) and Tactical Energy (EP). Every defense tower can be upgraded through <strong>Level 1 (Base), Level 2 (Reinforced), and Level 3 (Apex)</strong>. Upgrading increases damage, firing rate, range, and equips special armor-shredding or chain-lightning capabilities.
          </p>
          <div className="p-3 rounded-xl bg-black/50 border border-slate-800 text-xs font-mono text-slate-400">
            Tip: Decommissioning and recycling towers refunds <strong>70% of total invested credits</strong>, allowing you to reposition your defensive line for boss encounters.
          </div>
        </div>

        {/* Wave Milestones & Bosses */}
        <div>
          <h3 className="text-base font-orbitron font-bold text-rose-400 flex items-center gap-2 mb-2">
            <Swords className="w-5 h-5 text-rose-400" />
            4. 50-WAVE ESCALATION & TITAN MILESTONES
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hostile waves escalate in armor, speed, and numbers. Beware of milestone boss waves at <strong>Wave 10 (Vanguard Overlord), Wave 20 (Goliath Siege Mech), Wave 30 (Cyber Empress), Wave 40 (Twin Dreadnoughts), and Wave 50 (The Omega World-Eater)</strong>!
          </p>
        </div>
      </div>
    </div>
  );
};
