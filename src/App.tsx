import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from './state/gameStore';
import { GameEngine } from './game/core/GameEngine';
import { GameState, TargetPriority, TowerType } from './types/game';
import { globalEventBus } from './game/core/EventEmitter';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { TowerDeck } from './components/TowerDeck';
import { TacticalPanel } from './components/TacticalPanel';
import { TowerInspector } from './components/TowerInspector';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { MainMenu } from './components/MainMenu';
import { MapSelectModal } from './components/MapSelectModal';
import { TowerEncyclopedia } from './components/TowerEncyclopedia';
import { EnemyEncyclopedia } from './components/EnemyEncyclopedia';
import { PerformanceLab } from './components/PerformanceLab';
import { HowToPlayModal } from './components/HowToPlayModal';
import { Tower } from './game/entities/Tower';

export const App: React.FC = () => {
  const { currentScreen, selectedMapId, setScreen } = useGameStore();
  const engineRef = useRef<GameEngine | null>(null);

  // Synchronized Game State
  const [gameState, setGameState] = useState<GameState>({
    coreHp: 100,
    maxCoreHp: 100,
    coreShield: 50,
    maxCoreShield: 50,
    credits: 400,
    energy: 100,
    maxEnergy: 100,
    wave: 0,
    totalWaves: 50,
    waveInProgress: false,
    waveCountdown: 8,
    gameSpeed: 1,
    isGameOver: false,
    isVictory: false,
    score: 0,
    enemiesAlive: 0,
    selectedTowerId: null,
    activeTacticalAbility: null,
    highScore: 0,
    bossActive: false,
    bossName: '',
    bossHp: 0,
    bossMaxHp: 0,
    mapId: selectedMapId,
  });

  // User Selections
  const [selectedBuildType, setSelectedBuildType] = useState<TowerType | null>(null);
  const [activeTacticalAbility, setActiveTacticalAbility] = useState<string | null>(null);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // EventBus subscriptions
    const unsubState = globalEventBus.on<GameState>('state_update', (newState) => {
      setGameState({ ...newState });
    });

    const unsubTower = globalEventBus.on<Tower | null>('tower_selected', (tower) => {
      setSelectedTower(tower);
      if (tower) {
        setSelectedBuildType(null);
        setActiveTacticalAbility(null);
      }
    });

    return () => {
      unsubState();
      unsubTower();
    };
  }, []);

  // Update engine map if map changes
  useEffect(() => {
    if (engineRef.current && currentScreen === 'GAME') {
      if (engineRef.current.mapId !== selectedMapId) {
        engineRef.current.setMap(selectedMapId);
      }
    }
  }, [selectedMapId, currentScreen]);

  // Keyboard Shortcuts (active during GAME screen)
  useEffect(() => {
    if (currentScreen !== 'GAME') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();

      // Escape: Deselect everything
      if (key === 'ESCAPE') {
        setSelectedBuildType(null);
        setActiveTacticalAbility(null);
        if (engineRef.current) engineRef.current.deselectTower();
      }

      // Space: Toggle pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (engineRef.current) {
          const currentSpeed = engineRef.current.state.gameSpeed;
          engineRef.current.setGameSpeed(currentSpeed === 0 ? 1 : 0);
        }
      }

      // Hotkeys 1-6: Tower selection
      const towerTypes: TowerType[] = [
        'PULSE_CANNON',
        'LASER_TOWER',
        'CRYO_TOWER',
        'ARTILLERY_TOWER',
        'RAILGUN',
        'TESLA_COIL',
      ];
      const num = parseInt(key, 10);
      if (num >= 1 && num <= 6) {
        const type = towerTypes[num - 1];
        setSelectedBuildType((prev) => (prev === type ? null : type));
        setActiveTacticalAbility(null);
        if (engineRef.current) engineRef.current.deselectTower();
      }

      // Hotkeys Q, W, E: Tactical Abilities
      if (key === 'Q') {
        setSelectedBuildType(null);
        setActiveTacticalAbility((prev) => (prev === 'ORBITAL_STRIKE' ? null : 'ORBITAL_STRIKE'));
      } else if (key === 'W') {
        setSelectedBuildType(null);
        setActiveTacticalAbility((prev) => (prev === 'EMP_BLAST' ? null : 'EMP_BLAST'));
      } else if (key === 'E') {
        if (engineRef.current) {
          engineRef.current.activateTacticalAbility('GRID_OVERDRIVE');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen]);

  // Handlers
  const handleStartNextWave = () => {
    if (engineRef.current) {
      engineRef.current.startNextWave();
    }
  };

  const handleSetGameSpeed = (speed: number) => {
    if (engineRef.current) {
      engineRef.current.setGameSpeed(speed);
    }
  };

  const handleUpgradeTower = (tower: Tower) => {
    if (engineRef.current) {
      engineRef.current.upgradeTower(tower);
    }
  };

  const handleSellTower = (tower: Tower) => {
    if (engineRef.current) {
      engineRef.current.sellTower(tower);
    }
  };

  const handleChangePriority = (tower: Tower, priority: TargetPriority) => {
    tower.setPriority(priority);
    setSelectedTower({ ...tower } as any);
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.resetGame();
      setSelectedTower(null);
      setSelectedBuildType(null);
      setActiveTacticalAbility(null);
    }
  };

  const handleReturnToMenu = () => {
    if (engineRef.current) {
      engineRef.current.saveGame();
    }
    setScreen('MAIN_MENU');
  };

  // --- SCREEN ROUTING ---
  if (currentScreen === 'MAIN_MENU') {
    return (
      <>
        <MainMenu />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </>
    );
  }

  if (currentScreen === 'MAP_SELECT') {
    return <MapSelectModal />;
  }

  if (currentScreen === 'TOWER_ENCYCLOPEDIA') {
    return <TowerEncyclopedia />;
  }

  if (currentScreen === 'ENEMY_ENCYCLOPEDIA') {
    return <EnemyEncyclopedia />;
  }

  if (currentScreen === 'PERFORMANCE_LAB') {
    return <PerformanceLab />;
  }

  if (currentScreen === 'HOW_TO_PLAY') {
    return <HowToPlayModal />;
  }

  if (currentScreen === 'SETTINGS') {
    return (
      <div className="relative w-screen h-screen bg-cyber-dark flex items-center justify-center">
        <SettingsModal isOpen={true} onClose={() => setScreen('MAIN_MENU')} />
      </div>
    );
  }

  // GAMEPLAY SCREEN
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-dark text-slate-100 flex flex-col font-rajdhani select-none">
      {/* Top Telemetry HUD */}
      <HUD
        state={gameState}
        onStartNextWave={handleStartNextWave}
        onSetGameSpeed={handleSetGameSpeed}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRestart={handleRestart}
        onReturnToMenu={handleReturnToMenu}
      />

      {/* Main Game Canvas Arena */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-3 pt-14 pb-18 overflow-hidden holo-grid">
        <GameCanvas
          engineRef={engineRef}
          selectedBuildType={selectedBuildType}
          activeTacticalAbility={activeTacticalAbility}
          credits={gameState.credits}
          onClearBuildSelection={() => setSelectedBuildType(null)}
          onClearTacticalSelection={() => setActiveTacticalAbility(null)}
        />
      </main>

      {/* Bottom Command Docks */}
      <footer className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 sm:gap-4 max-w-full px-2">
        <TowerDeck
          selectedBuildType={selectedBuildType}
          onSelectBuildType={(type) => {
            setSelectedBuildType(type);
            setActiveTacticalAbility(null);
            if (engineRef.current) engineRef.current.deselectTower();
          }}
          credits={gameState.credits}
        />

        {engineRef.current && (
          <TacticalPanel
            abilities={engineRef.current.tacticalAbilities}
            activeAbilityId={activeTacticalAbility}
            currentEnergy={gameState.energy}
            onSelectAbility={(abilityId) => {
              if (abilityId === 'GRID_OVERDRIVE') {
                engineRef.current?.activateTacticalAbility('GRID_OVERDRIVE');
                setActiveTacticalAbility(null);
              } else {
                setActiveTacticalAbility(abilityId);
                setSelectedBuildType(null);
                if (engineRef.current) engineRef.current.deselectTower();
              }
            }}
          />
        )}
      </footer>

      {/* Tower Inspector Sidebar */}
      <TowerInspector
        tower={selectedTower}
        credits={gameState.credits}
        onUpgrade={handleUpgradeTower}
        onSell={handleSellTower}
        onClose={() => {
          if (engineRef.current) engineRef.current.deselectTower();
        }}
        onChangePriority={handleChangePriority}
      />

      {/* Game Over / Victory Modal */}
      <GameOverModal state={gameState} onRestart={handleRestart} />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;
