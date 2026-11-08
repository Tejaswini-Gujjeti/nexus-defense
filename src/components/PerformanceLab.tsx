import React, { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { useGameStore } from '../state/gameStore';
import { BENCHMARK_PRESETS, BenchmarkEngine, BenchmarkMode, BenchmarkPreset } from '../game/benchmark/BenchmarkEngine';
import { TextureFactory } from '../game/rendering/TextureFactory';
import { BenchmarkMetrics } from '../types/game';
import { ArrowLeft, Play, Square, RotateCcw, Cpu, Activity, BarChart3 } from 'lucide-react';
import { soundManager } from '../game/audio/SoundManager';

export const PerformanceLab: React.FC = () => {
  const {
    setScreen,
    baselineMetrics,
    optimizedMetrics,
    setBaselineMetrics,
    setOptimizedMetrics,
  } = useGameStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BenchmarkEngine | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<BenchmarkPreset>(BENCHMARK_PRESETS[4]); // Default to 5000+100+1000
  const [activeMode, setActiveMode] = useState<BenchmarkMode>('OPTIMIZED');
  const [isRunning, setIsRunning] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<BenchmarkMetrics | null>(null);
  const [testTimeLeft, setTestTimeLeft] = useState<number>(10);

  useEffect(() => {
    let app: Application | null = null;
    let isMounted = true;

    async function initPixi() {
      if (!canvasRef.current) return;

      app = new Application();
      await app.init({
        width: 1200,
        height: 720,
        backgroundColor: 0x060913,
        antialias: false,
        resolution: 1,
        autoDensity: true,
      });

      if (!isMounted) {
        app.destroy(true, { children: true });
        return;
      }

      TextureFactory.initAll();
      const engine = new BenchmarkEngine(app);
      engineRef.current = engine;

      canvasRef.current.appendChild(app.canvas);
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.display = 'block';

      app.ticker.add(() => {
        engine.update();
      });

      engine.setupScenario(selectedPreset, activeMode);
    }

    initPixi();

    return () => {
      isMounted = false;
      if (engineRef.current) {
        engineRef.current.destroy();
      }
      if (app) {
        try {
          app.destroy(true, { children: true });
        } catch (e) {}
      }
    };
  }, []);

  const handlePresetChange = (preset: BenchmarkPreset) => {
    soundManager.playUpgrade();
    setSelectedPreset(preset);
    if (engineRef.current) {
      engineRef.current.setupScenario(preset, activeMode);
      setLiveMetrics(engineRef.current.currentMetrics);
    }
  };

  const handleModeChange = (mode: BenchmarkMode) => {
    soundManager.playUpgrade();
    setActiveMode(mode);
    if (engineRef.current) {
      engineRef.current.setupScenario(selectedPreset, mode);
      setLiveMetrics(engineRef.current.currentMetrics);
    }
  };

  const handleStart = () => {
    soundManager.playUpgrade();
    if (!engineRef.current) return;

    setIsRunning(true);
    setTestTimeLeft(10);

    engineRef.current.setupScenario(selectedPreset, activeMode);
    engineRef.current.start(
      10, // 10 second measurement window
      (metrics) => {
        setLiveMetrics(metrics);
        setTestTimeLeft(Math.max(0, 10 - metrics.durationSec));
      },
      (finalMetrics) => {
        setIsRunning(false);
        setLiveMetrics(finalMetrics);
        soundManager.playWaveAlert();

        if (activeMode === 'BASELINE') {
          setBaselineMetrics(finalMetrics);
        } else {
          setOptimizedMetrics(finalMetrics);
        }
      }
    );
  };

  const handleStop = () => {
    soundManager.playPlasma();
    if (engineRef.current) {
      engineRef.current.stop();
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    soundManager.playPlasma();
    if (engineRef.current) {
      engineRef.current.setupScenario(selectedPreset, activeMode);
      setLiveMetrics(engineRef.current.currentMetrics);
      setIsRunning(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-dark flex flex-col p-4 sm:p-6 font-rajdhani select-none">
      <div className="absolute inset-0 holo-grid opacity-35 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-cyber-border mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (engineRef.current) engineRef.current.stop();
              setScreen('MAIN_MENU');
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase">
              HIGH-PERFORMANCE ARCHITECTURE TESTING SUITE
            </span>
            <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-slate-100 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-cyan-400" />
              PERFORMANCE LAB & BENCHMARK
            </h2>
          </div>
        </div>

        {/* Live FPS Badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-xl bg-black/60 border border-cyan-500/50 flex items-center gap-2 shadow-neon-blue">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-400">LIVE FPS:</span>
            <span className="text-xl font-orbitron font-extrabold text-cyan-300">
              {liveMetrics ? liveMetrics.fps : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        {/* Left Column: Viewport & Controls */}
        <div className="lg:col-span-8 flex flex-col gap-3 overflow-hidden">
          {/* Pixi Canvas Viewport */}
          <div
            ref={canvasRef}
            className="relative flex-1 w-full bg-black/70 border border-cyber-border rounded-xl overflow-hidden shadow-2xl"
          >
            {/* Status Overlay */}
            <div className="absolute top-2 left-2 z-20 flex items-center gap-2 px-3 py-1 bg-black/80 border border-slate-800 rounded-lg text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300">
                MODE: <strong className={activeMode === 'OPTIMIZED' ? 'text-cyan-400' : 'text-amber-400'}>{activeMode}</strong>
              </span>
              <span>•</span>
              <span className="text-slate-400">
                {selectedPreset.enemies.toLocaleString()} ENEMIES + {selectedPreset.towers} TOWERS + {selectedPreset.projectiles} PROJ
              </span>
            </div>

            {isRunning && (
              <div className="absolute top-2 right-2 z-20 px-3 py-1 bg-cyan-950/90 border border-cyan-500 rounded-lg text-xs font-mono text-cyan-300 font-bold shadow-neon-blue animate-pulse">
                MEASURING: {testTimeLeft.toFixed(1)}s
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-cyber-card/90 border border-cyber-border rounded-xl">
            {/* Mode Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-black/50 border border-slate-800 rounded-xl">
              <button
                onClick={() => handleModeChange('BASELINE')}
                disabled={isRunning}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeMode === 'BASELINE'
                    ? 'bg-amber-500 text-black shadow-neon-yellow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                MODE A: BASELINE NAIVE
              </button>

              <button
                onClick={() => handleModeChange('OPTIMIZED')}
                disabled={isRunning}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeMode === 'OPTIMIZED'
                    ? 'bg-cyan-500 text-black shadow-neon-blue'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                MODE B: OPTIMIZED ENGINE
              </button>
            </div>

            {/* Run Actions */}
            <div className="flex items-center gap-2">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-extrabold text-xs tracking-wider transition-all shadow-neon-blue"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>START BENCHMARK (10s)</span>
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-orbitron font-extrabold text-xs tracking-wider transition-all shadow-neon-red"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>ABORT TEST</span>
                </button>
              )}

              <button
                onClick={handleReset}
                disabled={isRunning}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Reset Scenario"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Presets & Live Comparative Telemetry */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Preset Buttons */}
          <div className="p-4 bg-cyber-card/90 border border-cyber-border rounded-xl">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-2 font-bold">
              STRESS TEST LOAD PRESETS
            </span>
            <div className="flex flex-col gap-1.5">
              {BENCHMARK_PRESETS.map((p) => {
                const isSelected = selectedPreset.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePresetChange(p)}
                    disabled={isRunning}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono transition-all text-left ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 font-bold shadow-neon-blue'
                        : 'bg-black/30 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {p.enemies >= 1000 ? `${p.enemies / 1000}k` : p.enemies}E / {p.towers}T
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-1">AVG FRAME TIME</span>
              <span className="text-base font-bold text-cyan-400">
                {liveMetrics ? `${liveMetrics.avgFrameTime} ms` : '--'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-1">P95 FRAME TIME</span>
              <span className="text-base font-bold text-cyan-400">
                {liveMetrics ? `${liveMetrics.p95FrameTime} ms` : '--'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-1">MAX FRAME SPIKE</span>
              <span className="text-base font-bold text-rose-400">
                {liveMetrics ? `${liveMetrics.maxFrameTime} ms` : '--'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-1">FRAMES &gt; 33.3ms</span>
              <span className="text-base font-bold text-amber-400">
                {liveMetrics ? `${liveMetrics.framesAbove33msPercent}%` : '--'}
              </span>
            </div>
          </div>

          {/* Side-by-Side Comparison Table (Mode A vs Mode B) */}
          <div className="p-4 bg-cyber-card/90 border border-cyber-border rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                MEASURED BENCHMARK COMPARISON
              </span>
            </div>

            <div className="overflow-x-auto text-[11px] font-mono">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-1.5 font-normal">METRIC</th>
                    <th className="pb-1.5 font-normal text-amber-400">BASELINE</th>
                    <th className="pb-1.5 font-normal text-cyan-400">OPTIMIZED</th>
                    <th className="pb-1.5 font-normal text-emerald-400">DELTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-1.5 text-slate-400">Average FPS</td>
                    <td className="py-1.5 text-slate-200">{baselineMetrics ? `${baselineMetrics.fps}` : '—'}</td>
                    <td className="py-1.5 text-cyan-300 font-bold">{optimizedMetrics ? `${optimizedMetrics.fps}` : '—'}</td>
                    <td className="py-1.5 text-emerald-400 font-bold">
                      {baselineMetrics && optimizedMetrics
                        ? `+${Math.round(((optimizedMetrics.fps - baselineMetrics.fps) / Math.max(1, baselineMetrics.fps)) * 100)}%`
                        : '—'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-1.5 text-slate-400">Avg Frame Time</td>
                    <td className="py-1.5 text-slate-200">{baselineMetrics ? `${baselineMetrics.avgFrameTime}ms` : '—'}</td>
                    <td className="py-1.5 text-cyan-300 font-bold">{optimizedMetrics ? `${optimizedMetrics.avgFrameTime}ms` : '—'}</td>
                    <td className="py-1.5 text-emerald-400 font-bold">
                      {baselineMetrics && optimizedMetrics
                        ? `-${Math.round(((baselineMetrics.avgFrameTime - optimizedMetrics.avgFrameTime) / Math.max(1, baselineMetrics.avgFrameTime)) * 100)}%`
                        : '—'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-1.5 text-slate-400">P95 Frame Time</td>
                    <td className="py-1.5 text-slate-200">{baselineMetrics ? `${baselineMetrics.p95FrameTime}ms` : '—'}</td>
                    <td className="py-1.5 text-cyan-300 font-bold">{optimizedMetrics ? `${optimizedMetrics.p95FrameTime}ms` : '—'}</td>
                    <td className="py-1.5 text-emerald-400 font-bold">
                      {baselineMetrics && optimizedMetrics
                        ? `-${Math.round(((baselineMetrics.p95FrameTime - optimizedMetrics.p95FrameTime) / Math.max(1, baselineMetrics.p95FrameTime)) * 100)}%`
                        : '—'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-1.5 text-slate-400">Frames &gt; 33ms</td>
                    <td className="py-1.5 text-slate-200">{baselineMetrics ? `${baselineMetrics.framesAbove33msPercent}%` : '—'}</td>
                    <td className="py-1.5 text-cyan-300 font-bold">{optimizedMetrics ? `${optimizedMetrics.framesAbove33msPercent}%` : '—'}</td>
                    <td className="py-1.5 text-emerald-400 font-bold">
                      {baselineMetrics && optimizedMetrics
                        ? `${(optimizedMetrics.framesAbove33msPercent - baselineMetrics.framesAbove33msPercent).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[10px] text-slate-500 leading-normal">
              * Mode A deliberately disables 2D spatial hash binning, forces per-frame $O(N \times M)$ distance checks, and bypasses object pooling to demonstrate algorithmic bottlenecking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
