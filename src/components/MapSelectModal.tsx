import React from 'react';
import { useGameStore } from '../state/gameStore';
import { MAPS } from '../game/map/MapConfig';
import { ArrowLeft, Play, MapPin, Zap } from 'lucide-react';
import { soundManager } from '../game/audio/SoundManager';

export const MapSelectModal: React.FC = () => {
  const { selectedMapId, setSelectedMapId, setScreen } = useGameStore();
  const mapList = Object.values(MAPS);

  const handleSelectMap = (id: string) => {
    soundManager.playUpgrade();
    setSelectedMapId(id);
    setScreen('GAME');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-dark flex flex-col items-center justify-center p-6 font-rajdhani select-none">
      <div className="absolute inset-0 holo-grid opacity-50 pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl bg-cyber-card/95 border border-cyber-border rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyber-border mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScreen('MAIN_MENU')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase">
                TACTICAL BATTLEFIELD SELECTION
              </span>
              <h2 className="text-2xl font-orbitron font-extrabold text-slate-100">
                DEPLOYMENT THEATER
              </h2>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
            50 PLAYABLE WAVES
          </span>
        </div>

        {/* Map Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {mapList.map((map) => {
            const isSelected = selectedMapId === map.id;

            return (
              <div
                key={map.id}
                onClick={() => setSelectedMapId(map.id)}
                className={`relative flex flex-col p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyber-cardHover/90 border-cyan-400 shadow-neon-blue scale-[1.02]'
                    : 'bg-black/40 border-slate-800 hover:border-slate-600 hover:bg-slate-900/50'
                }`}
              >
                {/* Badge */}
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[10px] font-mono text-cyan-300">
                    SECTOR THEATER
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>NEXUS ONLINE</span>
                  </div>
                </div>

                {/* Map Name & Details */}
                <h3 className="text-xl font-orbitron font-bold text-slate-100 flex items-center gap-2 mb-1">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  {map.name}
                </h3>
                <span className="text-xs font-mono text-cyan-300/80 mb-3">{map.subtitle}</span>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{map.description}</p>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/50 p-2.5 rounded-xl border border-slate-800/80 mb-4">
                  <div>
                    <span className="text-slate-500 block">ENTRY GATES</span>
                    <span className="text-slate-200 font-bold">{map.spawnPoints.length} Attack Routes</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">TERRAIN GRID</span>
                    <span className="text-slate-200 font-bold">{map.cols} x {map.rows} Tiles (48px)</span>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectMap(map.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-orbitron font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-neon-blue'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>COMMENCE BATTLE IN {map.name.toUpperCase()}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
