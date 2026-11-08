export type TowerType = 
  | 'PULSE_CANNON'
  | 'LASER_TOWER'
  | 'CRYO_TOWER'
  | 'ARTILLERY_TOWER'
  | 'RAILGUN'
  | 'TESLA_COIL';

export type EnemyType = 
  | 'SCOUT'
  | 'GRUNT'
  | 'TANK'
  | 'SWARM'
  | 'BOSS';

export type TargetPriority = 
  | 'FIRST'
  | 'CLOSEST'
  | 'STRONGEST'
  | 'WEAKEST';

export type GameScreen = 
  | 'MAIN_MENU'
  | 'MAP_SELECT'
  | 'GAME'
  | 'TOWER_ENCYCLOPEDIA'
  | 'ENEMY_ENCYCLOPEDIA'
  | 'PERFORMANCE_LAB'
  | 'SETTINGS'
  | 'HOW_TO_PLAY';

export interface Position {
  x: number;
  y: number;
}

export interface GridCoord {
  col: number;
  row: number;
}

export interface TowerStats {
  damage: number;
  fireRate: number; // Attacks per second
  range: number; // Pixels
  projectileSpeed: number;
  splashRadius?: number;
  slowEffect?: number; // 0.0 to 1.0 (multiplier)
  slowDuration?: number; // Seconds
  chainTargets?: number; // For Tesla
  armorShred?: number;
}

export interface TowerLevelConfig {
  level: number;
  name: string;
  description: string;
  upgradeCost: number;
  stats: TowerStats;
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  category: string;
  description: string;
  baseCost: number;
  color: number;
  colorHex: string;
  icon: string;
  lore: string;
  levels: [TowerLevelConfig, TowerLevelConfig, TowerLevelConfig]; // Level 1, 2, 3
}

export interface EnemyStats {
  maxHp: number;
  maxShield: number;
  shieldRegenRate: number;
  speed: number;
  armor: number; // % damage reduction (0 to 0.8)
  reward: number; // Credits
  energyReward: number; // Tactical energy
  coreDamage: number; // Damage to Nexus Core if reached
}

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  role: string;
  description: string;
  stats: EnemyStats;
  color: number;
  colorHex: string;
  threatLevel: string;
  weakness: string;
}

export interface WaveGroup {
  enemyType: EnemyType;
  count: number;
  intervalSec: number;
  delaySec: number;
  hpMultiplier?: number;
  speedMultiplier?: number;
}

export interface WaveDefinition {
  waveNumber: number;
  title: string;
  isBossWave?: boolean;
  bossAnnouncement?: string;
  groups: WaveGroup[];
  rewardBonus: number;
}

export interface TacticalAbility {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  cooldownSec: number;
  cooldownRemaining: number;
  radius: number;
  icon: string;
  type: 'TARGETED_AOE' | 'GLOBAL_BUFF';
}

export interface GameState {
  coreHp: number;
  maxCoreHp: number;
  coreShield: number;
  maxCoreShield: number;
  credits: number;
  energy: number;
  maxEnergy: number;
  wave: number;
  totalWaves: number;
  waveInProgress: boolean;
  waveCountdown: number;
  gameSpeed: number; // 0 = paused, 1 = 1x, 2 = 2x, 3 = 3x
  isGameOver: boolean;
  isVictory: boolean;
  score: number;
  enemiesAlive: number;
  selectedTowerId: string | null;
  activeTacticalAbility: string | null;
  highScore: number;
  bossActive: boolean;
  bossName?: string;
  bossHp?: number;
  bossMaxHp?: number;
  mapId: string;
}

export interface MapData {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  cols: number;
  rows: number;
  tileSize: number;
  spawnPoints: Position[];
  nexusPoint: Position;
  waypointRoutes: Position[][]; // Supports multi-entry routing!
  blockedTiles: GridCoord[];
}

export interface BenchmarkMetrics {
  fps: number;
  avgFrameTime: number;
  p95FrameTime: number;
  maxFrameTime: number;
  framesAbove33msPercent: number;
  activeEnemies: number;
  activeTowers: number;
  activeProjectiles: number;
  activeParticles: number;
  memoryMb?: number;
  durationSec: number;
}
