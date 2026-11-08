import { create } from 'zustand';
import { BenchmarkMetrics, GameScreen } from '../types/game';

interface GameStoreState {
  currentScreen: GameScreen;
  selectedMapId: string;
  hasSavedGame: boolean;
  masterVolume: number;
  sfxMuted: boolean;
  bgmMuted: boolean;

  // Benchmark Comparisons
  baselineMetrics: BenchmarkMetrics | null;
  optimizedMetrics: BenchmarkMetrics | null;

  // Actions
  setScreen: (screen: GameScreen) => void;
  setSelectedMapId: (mapId: string) => void;
  checkSavedGame: () => void;
  setMasterVolume: (vol: number) => void;
  setSfxMuted: (muted: boolean) => void;
  setBgmMuted: (muted: boolean) => void;
  setBaselineMetrics: (m: BenchmarkMetrics) => void;
  setOptimizedMetrics: (m: BenchmarkMetrics) => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  currentScreen: 'MAIN_MENU',
  selectedMapId: 'orbital_nexus',
  hasSavedGame: !!localStorage.getItem('nexus_defense_saved_game'),
  masterVolume: 0.7,
  sfxMuted: false,
  bgmMuted: false,

  baselineMetrics: null,
  optimizedMetrics: null,

  setScreen: (screen) => set({ currentScreen: screen }),
  setSelectedMapId: (mapId) => set({ selectedMapId: mapId }),
  checkSavedGame: () => set({ hasSavedGame: !!localStorage.getItem('nexus_defense_saved_game') }),
  setMasterVolume: (masterVolume) => set({ masterVolume }),
  setSfxMuted: (sfxMuted) => set({ sfxMuted }),
  setBgmMuted: (bgmMuted) => set({ bgmMuted }),
  setBaselineMetrics: (baselineMetrics) => set({ baselineMetrics }),
  setOptimizedMetrics: (optimizedMetrics) => set({ optimizedMetrics }),
}));
