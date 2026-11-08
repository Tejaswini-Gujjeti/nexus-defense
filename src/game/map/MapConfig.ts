import { MapData, WaveDefinition } from '../../types/game';

export const MAPS: Record<string, MapData> = {
  orbital_nexus: {
    id: 'orbital_nexus',
    name: 'Orbital Nexus - Sector 7',
    subtitle: 'Humanity\'s Primary Orbital Power Bastion',
    description: 'A fortified planetary power array with high ground and serpentine defensive chokepoints.',
    cols: 25,
    rows: 15,
    tileSize: 48,
    spawnPoints: [
      { x: 48 * 0.5, y: 48 * 2.5 }, // Alpha Gate (Top-Left)
      { x: 48 * 0.5, y: 48 * 12.5 }, // Beta Gate (Bottom-Left)
    ],
    nexusPoint: { x: 48 * 24.5, y: 48 * 7.5 }, // Center-Right Nexus Core
    waypointRoutes: [
      // Route 1 (from Alpha Gate)
      [
        { x: 48 * 0.5, y: 48 * 2.5 },
        { x: 48 * 7.5, y: 48 * 2.5 },
        { x: 48 * 7.5, y: 48 * 6.5 },
        { x: 48 * 14.5, y: 48 * 6.5 },
        { x: 48 * 14.5, y: 48 * 3.5 },
        { x: 48 * 20.5, y: 48 * 3.5 },
        { x: 48 * 20.5, y: 48 * 7.5 },
        { x: 48 * 24.5, y: 48 * 7.5 },
      ],
      // Route 2 (from Beta Gate)
      [
        { x: 48 * 0.5, y: 48 * 12.5 },
        { x: 48 * 7.5, y: 48 * 12.5 },
        { x: 48 * 7.5, y: 48 * 8.5 },
        { x: 48 * 14.5, y: 48 * 8.5 },
        { x: 48 * 14.5, y: 48 * 11.5 },
        { x: 48 * 20.5, y: 48 * 11.5 },
        { x: 48 * 20.5, y: 48 * 7.5 },
        { x: 48 * 24.5, y: 48 * 7.5 },
      ],
    ],
    blockedTiles: [
      { col: 3, row: 4 }, { col: 3, row: 5 }, { col: 3, row: 9 }, { col: 3, row: 10 },
      { col: 10, row: 1 }, { col: 10, row: 2 }, { col: 10, row: 12 }, { col: 10, row: 13 },
      { col: 17, row: 5 }, { col: 17, row: 9 },
    ],
  },

  cyber_trench: {
    id: 'cyber_trench',
    name: 'Cyber Trench - Sector 9',
    subtitle: 'Underground Geothermal Conduit Facility',
    description: 'Deep subterranean power channels with narrow trench intersections and rapid transit lines.',
    cols: 25,
    rows: 15,
    tileSize: 48,
    spawnPoints: [
      { x: 48 * 0.5, y: 48 * 7.5 }, // Central West Gate
    ],
    nexusPoint: { x: 48 * 24.5, y: 48 * 7.5 },
    waypointRoutes: [
      // Serpentine Trench Route
      [
        { x: 48 * 0.5, y: 48 * 7.5 },
        { x: 48 * 4.5, y: 48 * 7.5 },
        { x: 48 * 4.5, y: 48 * 2.5 },
        { x: 48 * 10.5, y: 48 * 2.5 },
        { x: 48 * 10.5, y: 48 * 12.5 },
        { x: 48 * 16.5, y: 48 * 12.5 },
        { x: 48 * 16.5, y: 48 * 4.5 },
        { x: 48 * 21.5, y: 48 * 4.5 },
        { x: 48 * 21.5, y: 48 * 7.5 },
        { x: 48 * 24.5, y: 48 * 7.5 },
      ],
    ],
    blockedTiles: [
      { col: 2, row: 4 }, { col: 2, row: 10 },
      { col: 7, row: 5 }, { col: 7, row: 6 }, { col: 7, row: 7 }, { col: 7, row: 8 }, { col: 7, row: 9 },
      { col: 13, row: 5 }, { col: 13, row: 6 }, { col: 13, row: 7 }, { col: 13, row: 8 }, { col: 13, row: 9 },
      { col: 19, row: 1 }, { col: 19, row: 2 }, { col: 19, row: 11 }, { col: 19, row: 12 },
    ],
  },
};

export function getPathTileCoords(routes: { x: number; y: number }[][], tileSize: number): Set<string> {
  const set = new Set<string>();

  routes.forEach((waypoints) => {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];

      const c1 = Math.floor(p1.x / tileSize);
      const r1 = Math.floor(p1.y / tileSize);
      const c2 = Math.floor(p2.x / tileSize);
      const r2 = Math.floor(p2.y / tileSize);

      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);
      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);

      for (let c = minC; c <= maxC; c++) {
        for (let r = minR; r <= maxR; r++) {
          set.add(`${c},${r}`);
        }
      }
    }
  });

  return set;
}

// 50 PLAYABLE WAVES
export const WAVES_50: WaveDefinition[] = [
  // Tier 1: Waves 1 - 10 (Initial Infiltration)
  {
    waveNumber: 1,
    title: 'First Contact',
    rewardBonus: 100,
    groups: [{ enemyType: 'SCOUT', count: 8, intervalSec: 1.0, delaySec: 0 }],
  },
  {
    waveNumber: 2,
    title: 'Recon Incursion',
    rewardBonus: 110,
    groups: [
      { enemyType: 'SCOUT', count: 12, intervalSec: 0.8, delaySec: 0 },
      { enemyType: 'GRUNT', count: 3, intervalSec: 1.5, delaySec: 5 },
    ],
  },
  {
    waveNumber: 3,
    title: 'Infantry Probe',
    rewardBonus: 120,
    groups: [
      { enemyType: 'GRUNT', count: 8, intervalSec: 1.2, delaySec: 0 },
      { enemyType: 'SCOUT', count: 8, intervalSec: 0.6, delaySec: 6 },
    ],
  },
  {
    waveNumber: 4,
    title: 'Swarm Cluster',
    rewardBonus: 130,
    groups: [
      { enemyType: 'SWARM', count: 18, intervalSec: 0.4, delaySec: 0 },
      { enemyType: 'GRUNT', count: 5, intervalSec: 1.2, delaySec: 5 },
    ],
  },
  {
    waveNumber: 5,
    title: 'Heavy Vanguard',
    rewardBonus: 150,
    groups: [
      { enemyType: 'TANK', count: 2, intervalSec: 3.0, delaySec: 0 },
      { enemyType: 'GRUNT', count: 8, intervalSec: 1.0, delaySec: 4 },
      { enemyType: 'SCOUT', count: 10, intervalSec: 0.5, delaySec: 8 },
    ],
  },
  {
    waveNumber: 6,
    title: 'Armored Column',
    rewardBonus: 160,
    groups: [
      { enemyType: 'TANK', count: 4, intervalSec: 2.2, delaySec: 0 },
      { enemyType: 'SWARM', count: 16, intervalSec: 0.45, delaySec: 4 },
    ],
  },
  {
    waveNumber: 7,
    title: 'Rapid Blitz',
    rewardBonus: 175,
    groups: [
      { enemyType: 'SCOUT', count: 24, intervalSec: 0.35, delaySec: 0, speedMultiplier: 1.15 },
      { enemyType: 'GRUNT', count: 8, intervalSec: 0.9, delaySec: 6 },
    ],
  },
  {
    waveNumber: 8,
    title: 'Combined Assault',
    rewardBonus: 190,
    groups: [
      { enemyType: 'TANK', count: 5, intervalSec: 1.8, delaySec: 0 },
      { enemyType: 'GRUNT', count: 12, intervalSec: 0.8, delaySec: 4 },
      { enemyType: 'SWARM', count: 20, intervalSec: 0.35, delaySec: 8 },
    ],
  },
  {
    waveNumber: 9,
    title: 'Prelude to War',
    rewardBonus: 220,
    groups: [
      { enemyType: 'TANK', count: 6, intervalSec: 1.5, delaySec: 0, hpMultiplier: 1.15 },
      { enemyType: 'SWARM', count: 25, intervalSec: 0.3, delaySec: 5 },
      { enemyType: 'SCOUT', count: 15, intervalSec: 0.4, delaySec: 10 },
    ],
  },
  {
    waveNumber: 10,
    title: 'TITAN BOSS: VANGUARD OVERLORD',
    isBossWave: true,
    bossAnnouncement: 'ALERT: Class-IV Titan Dreadnought detected approaching Sector 7!',
    rewardBonus: 400,
    groups: [
      { enemyType: 'BOSS', count: 1, intervalSec: 0, delaySec: 0, hpMultiplier: 1.0 },
      { enemyType: 'TANK', count: 4, intervalSec: 2.0, delaySec: 4 },
      { enemyType: 'SWARM', count: 20, intervalSec: 0.4, delaySec: 8 },
    ],
  },

  // Tier 2: Waves 11 - 20 (Armored Vanguard)
  {
    waveNumber: 11,
    title: 'Second Influx',
    rewardBonus: 240,
    groups: [
      { enemyType: 'GRUNT', count: 16, intervalSec: 0.7, delaySec: 0, hpMultiplier: 1.2 },
      { enemyType: 'SCOUT', count: 18, intervalSec: 0.4, delaySec: 5 },
    ],
  },
  {
    waveNumber: 12,
    title: 'Swarm Tide',
    rewardBonus: 260,
    groups: [
      { enemyType: 'SWARM', count: 32, intervalSec: 0.3, delaySec: 0, hpMultiplier: 1.2 },
      { enemyType: 'TANK', count: 4, intervalSec: 2.0, delaySec: 6 },
    ],
  },
  {
    waveNumber: 13,
    title: 'Iron Phalanx',
    rewardBonus: 280,
    groups: [
      { enemyType: 'TANK', count: 8, intervalSec: 1.4, delaySec: 0, hpMultiplier: 1.25 },
      { enemyType: 'GRUNT', count: 14, intervalSec: 0.8, delaySec: 5 },
    ],
  },
  {
    waveNumber: 14,
    title: 'Sonic Swarm',
    rewardBonus: 300,
    groups: [
      { enemyType: 'SCOUT', count: 28, intervalSec: 0.3, delaySec: 0, speedMultiplier: 1.25 },
      { enemyType: 'SWARM', count: 24, intervalSec: 0.35, delaySec: 6 },
    ],
  },
  {
    waveNumber: 15,
    title: 'Heavy Breakers',
    rewardBonus: 330,
    groups: [
      { enemyType: 'TANK', count: 10, intervalSec: 1.3, delaySec: 0, hpMultiplier: 1.3 },
      { enemyType: 'GRUNT', count: 16, intervalSec: 0.7, delaySec: 6 },
    ],
  },
  {
    waveNumber: 16,
    title: 'Double Trouble',
    rewardBonus: 360,
    groups: [
      { enemyType: 'TANK', count: 8, intervalSec: 1.2, delaySec: 0 },
      { enemyType: 'SCOUT', count: 30, intervalSec: 0.3, delaySec: 5 },
      { enemyType: 'SWARM', count: 30, intervalSec: 0.25, delaySec: 10 },
    ],
  },
  {
    waveNumber: 17,
    title: 'Armored Surge',
    rewardBonus: 390,
    groups: [
      { enemyType: 'TANK', count: 12, intervalSec: 1.1, delaySec: 0, hpMultiplier: 1.35 },
      { enemyType: 'GRUNT', count: 20, intervalSec: 0.6, delaySec: 6 },
    ],
  },
  {
    waveNumber: 18,
    title: 'Overwhelming Hive',
    rewardBonus: 420,
    groups: [
      { enemyType: 'SWARM', count: 45, intervalSec: 0.22, delaySec: 0, hpMultiplier: 1.3 },
      { enemyType: 'TANK', count: 6, intervalSec: 1.8, delaySec: 6 },
    ],
  },
  {
    waveNumber: 19,
    title: 'Siege Escalation',
    rewardBonus: 450,
    groups: [
      { enemyType: 'TANK', count: 14, intervalSec: 1.0, delaySec: 0, hpMultiplier: 1.4 },
      { enemyType: 'SCOUT', count: 35, intervalSec: 0.25, delaySec: 6 },
    ],
  },
  {
    waveNumber: 20,
    title: 'TITAN BOSS: GOLIATH SIEGE MECH',
    isBossWave: true,
    bossAnnouncement: 'WARNING: Goliath Siege Mech breaching orbital blast barriers!',
    rewardBonus: 600,
    groups: [
      { enemyType: 'BOSS', count: 1, intervalSec: 0, delaySec: 0, hpMultiplier: 1.6 },
      { enemyType: 'TANK', count: 8, intervalSec: 1.5, delaySec: 3 },
      { enemyType: 'SWARM', count: 35, intervalSec: 0.3, delaySec: 8 },
    ],
  },

  // Tier 3: Waves 21 - 30 (Swarm Escalation)
  {
    waveNumber: 21,
    title: 'Resilient Wave',
    rewardBonus: 480,
    groups: [
      { enemyType: 'GRUNT', count: 24, intervalSec: 0.6, delaySec: 0, hpMultiplier: 1.5 },
      { enemyType: 'TANK', count: 8, intervalSec: 1.2, delaySec: 6 },
    ],
  },
  {
    waveNumber: 22,
    title: 'Hyper Swarm',
    rewardBonus: 510,
    groups: [
      { enemyType: 'SWARM', count: 50, intervalSec: 0.2, delaySec: 0, speedMultiplier: 1.2 },
      { enemyType: 'SCOUT', count: 20, intervalSec: 0.3, delaySec: 6 },
    ],
  },
  {
    waveNumber: 23,
    title: 'Tungsten Bastion',
    rewardBonus: 540,
    groups: [
      { enemyType: 'TANK', count: 16, intervalSec: 0.9, delaySec: 0, hpMultiplier: 1.6 },
      { enemyType: 'GRUNT', count: 20, intervalSec: 0.6, delaySec: 6 },
    ],
  },
  {
    waveNumber: 24,
    title: 'Infiltration Matrix',
    rewardBonus: 570,
    groups: [
      { enemyType: 'SCOUT', count: 40, intervalSec: 0.22, delaySec: 0, speedMultiplier: 1.3 },
      { enemyType: 'SWARM', count: 40, intervalSec: 0.22, delaySec: 6 },
    ],
  },
  {
    waveNumber: 25,
    title: 'Armored Division',
    rewardBonus: 600,
    groups: [
      { enemyType: 'TANK', count: 18, intervalSec: 0.9, delaySec: 0, hpMultiplier: 1.7 },
      { enemyType: 'TANK', count: 6, intervalSec: 1.0, delaySec: 8, hpMultiplier: 2.0 },
    ],
  },
  {
    waveNumber: 26,
    title: 'Endless Drone Storm',
    rewardBonus: 640,
    groups: [
      { enemyType: 'SWARM', count: 60, intervalSec: 0.18, delaySec: 0, hpMultiplier: 1.6 },
      { enemyType: 'GRUNT', count: 25, intervalSec: 0.5, delaySec: 7 },
    ],
  },
  {
    waveNumber: 27,
    title: 'High-Impact Shock',
    rewardBonus: 680,
    groups: [
      { enemyType: 'TANK', count: 20, intervalSec: 0.8, delaySec: 0, hpMultiplier: 1.8 },
      { enemyType: 'SCOUT', count: 35, intervalSec: 0.25, delaySec: 6 },
    ],
  },
  {
    waveNumber: 28,
    title: 'Chaos Legion',
    rewardBonus: 720,
    groups: [
      { enemyType: 'GRUNT', count: 35, intervalSec: 0.4, delaySec: 0, hpMultiplier: 1.8 },
      { enemyType: 'SWARM', count: 50, intervalSec: 0.2, delaySec: 6 },
      { enemyType: 'TANK', count: 12, intervalSec: 1.0, delaySec: 10 },
    ],
  },
  {
    waveNumber: 29,
    title: 'Eve of Destruction',
    rewardBonus: 760,
    groups: [
      { enemyType: 'TANK', count: 22, intervalSec: 0.8, delaySec: 0, hpMultiplier: 2.0 },
      { enemyType: 'SWARM', count: 65, intervalSec: 0.16, delaySec: 6 },
    ],
  },
  {
    waveNumber: 30,
    title: 'TITAN BOSS: CYBER EMPRESS CARRIER',
    isBossWave: true,
    bossAnnouncement: 'DANGER: Cyber Empress Carrier manifesting with dual escorts!',
    rewardBonus: 850,
    groups: [
      { enemyType: 'BOSS', count: 1, intervalSec: 0, delaySec: 0, hpMultiplier: 2.4 },
      { enemyType: 'TANK', count: 15, intervalSec: 0.9, delaySec: 4 },
      { enemyType: 'SWARM', count: 50, intervalSec: 0.2, delaySec: 8 },
    ],
  },

  // Tier 4: Waves 31 - 40 (Elite Overdrive)
  {
    waveNumber: 31,
    title: 'Overdrive Onslaught',
    rewardBonus: 800,
    groups: [
      { enemyType: 'GRUNT', count: 40, intervalSec: 0.35, delaySec: 0, hpMultiplier: 2.2 },
      { enemyType: 'SCOUT', count: 45, intervalSec: 0.2, delaySec: 5, speedMultiplier: 1.3 },
    ],
  },
  {
    waveNumber: 32,
    title: 'Bio-Synthetic Wave',
    rewardBonus: 850,
    groups: [
      { enemyType: 'SWARM', count: 75, intervalSec: 0.15, delaySec: 0, hpMultiplier: 2.0 },
      { enemyType: 'TANK', count: 16, intervalSec: 0.8, delaySec: 6, hpMultiplier: 2.2 },
    ],
  },
  {
    waveNumber: 33,
    title: 'Heavy Citadel Division',
    rewardBonus: 900,
    groups: [
      { enemyType: 'TANK', count: 25, intervalSec: 0.7, delaySec: 0, hpMultiplier: 2.5 },
      { enemyType: 'GRUNT', count: 30, intervalSec: 0.5, delaySec: 6 },
    ],
  },
  {
    waveNumber: 34,
    title: 'Velocity Breach',
    rewardBonus: 950,
    groups: [
      { enemyType: 'SCOUT', count: 60, intervalSec: 0.15, delaySec: 0, speedMultiplier: 1.35 },
      { enemyType: 'SWARM', count: 60, intervalSec: 0.15, delaySec: 6 },
    ],
  },
  {
    waveNumber: 35,
    title: 'Reinforced Column',
    rewardBonus: 1000,
    groups: [
      { enemyType: 'TANK', count: 28, intervalSec: 0.65, delaySec: 0, hpMultiplier: 2.8 },
      { enemyType: 'GRUNT', count: 40, intervalSec: 0.4, delaySec: 6 },
    ],
  },
  {
    waveNumber: 36,
    title: 'Omega Swarm',
    rewardBonus: 1050,
    groups: [
      { enemyType: 'SWARM', count: 90, intervalSec: 0.12, delaySec: 0, hpMultiplier: 2.4 },
      { enemyType: 'TANK', count: 18, intervalSec: 0.8, delaySec: 6 },
    ],
  },
  {
    waveNumber: 37,
    title: 'Shock Troopers',
    rewardBonus: 1100,
    groups: [
      { enemyType: 'GRUNT', count: 50, intervalSec: 0.3, delaySec: 0, hpMultiplier: 3.0 },
      { enemyType: 'SCOUT', count: 50, intervalSec: 0.2, delaySec: 6 },
    ],
  },
  {
    waveNumber: 38,
    title: 'Juggernaut Front',
    rewardBonus: 1150,
    groups: [
      { enemyType: 'TANK', count: 32, intervalSec: 0.6, delaySec: 0, hpMultiplier: 3.2 },
      { enemyType: 'SWARM', count: 70, intervalSec: 0.15, delaySec: 7 },
    ],
  },
  {
    waveNumber: 39,
    title: 'Total Annihilation Drill',
    rewardBonus: 1200,
    groups: [
      { enemyType: 'TANK', count: 35, intervalSec: 0.55, delaySec: 0, hpMultiplier: 3.5 },
      { enemyType: 'SCOUT', count: 65, intervalSec: 0.15, delaySec: 6 },
      { enemyType: 'SWARM', count: 80, intervalSec: 0.12, delaySec: 10 },
    ],
  },
  {
    waveNumber: 40,
    title: 'TITAN BOSS: TWIN DREADNOUGHTS',
    isBossWave: true,
    bossAnnouncement: 'CRITICAL ALERT: Dual Class-V Dreadnought Titans detected!',
    rewardBonus: 1500,
    groups: [
      { enemyType: 'BOSS', count: 2, intervalSec: 6.0, delaySec: 0, hpMultiplier: 2.8 },
      { enemyType: 'TANK', count: 20, intervalSec: 0.8, delaySec: 4 },
      { enemyType: 'SWARM', count: 60, intervalSec: 0.15, delaySec: 8 },
    ],
  },

  // Tier 5: Waves 41 - 50 (The Last Stand)
  {
    waveNumber: 41,
    title: 'Apocalypse Vanguard',
    rewardBonus: 1300,
    groups: [
      { enemyType: 'GRUNT', count: 60, intervalSec: 0.25, delaySec: 0, hpMultiplier: 3.8 },
      { enemyType: 'TANK', count: 25, intervalSec: 0.6, delaySec: 6, hpMultiplier: 3.8 },
    ],
  },
  {
    waveNumber: 42,
    title: 'Endless Dark',
    rewardBonus: 1350,
    groups: [
      { enemyType: 'SWARM', count: 110, intervalSec: 0.1, delaySec: 0, hpMultiplier: 3.0 },
      { enemyType: 'SCOUT', count: 60, intervalSec: 0.15, delaySec: 6 },
    ],
  },
  {
    waveNumber: 43,
    title: 'Titan Vanguard',
    rewardBonus: 1400,
    groups: [
      { enemyType: 'TANK', count: 40, intervalSec: 0.5, delaySec: 0, hpMultiplier: 4.2 },
      { enemyType: 'GRUNT', count: 50, intervalSec: 0.3, delaySec: 6 },
    ],
  },
  {
    waveNumber: 44,
    title: 'Velocity Supernova',
    rewardBonus: 1450,
    groups: [
      { enemyType: 'SCOUT', count: 80, intervalSec: 0.12, delaySec: 0, speedMultiplier: 1.4 },
      { enemyType: 'SWARM', count: 100, intervalSec: 0.1, delaySec: 5 },
    ],
  },
  {
    waveNumber: 45,
    title: 'Crushing Momentum',
    rewardBonus: 1500,
    groups: [
      { enemyType: 'TANK', count: 45, intervalSec: 0.45, delaySec: 0, hpMultiplier: 4.5 },
      { enemyType: 'SWARM', count: 120, intervalSec: 0.08, delaySec: 6 },
    ],
  },
  {
    waveNumber: 46,
    title: 'Cyber Cataclysm',
    rewardBonus: 1600,
    groups: [
      { enemyType: 'GRUNT', count: 80, intervalSec: 0.2, delaySec: 0, hpMultiplier: 4.5 },
      { enemyType: 'TANK', count: 35, intervalSec: 0.5, delaySec: 6 },
    ],
  },
  {
    waveNumber: 47,
    title: 'Dark Eclipse',
    rewardBonus: 1700,
    groups: [
      { enemyType: 'SWARM', count: 150, intervalSec: 0.07, delaySec: 0, hpMultiplier: 3.5 },
      { enemyType: 'SCOUT', count: 90, intervalSec: 0.1, delaySec: 5 },
    ],
  },
  {
    waveNumber: 48,
    title: 'Iron Apocalypse',
    rewardBonus: 1800,
    groups: [
      { enemyType: 'TANK', count: 50, intervalSec: 0.4, delaySec: 0, hpMultiplier: 5.0 },
      { enemyType: 'GRUNT', count: 70, intervalSec: 0.2, delaySec: 6 },
    ],
  },
  {
    waveNumber: 49,
    title: 'Final Countdown',
    rewardBonus: 2000,
    groups: [
      { enemyType: 'TANK', count: 55, intervalSec: 0.35, delaySec: 0, hpMultiplier: 5.5 },
      { enemyType: 'SWARM', count: 160, intervalSec: 0.06, delaySec: 6 },
      { enemyType: 'SCOUT', count: 100, intervalSec: 0.08, delaySec: 10 },
    ],
  },
  {
    waveNumber: 50,
    title: 'THE FINAL STAND: OMEGA WORLD-EATER TITAN',
    isBossWave: true,
    bossAnnouncement: 'EMERGENCY: OMEGA WORLD-EATER TITAN HAS ENTERED ORBIT! ALL PERSONNEL TO BATTLE STATIONS!',
    rewardBonus: 5000,
    groups: [
      { enemyType: 'BOSS', count: 1, intervalSec: 0, delaySec: 0, hpMultiplier: 5.0 },
      { enemyType: 'BOSS', count: 1, intervalSec: 0, delaySec: 12, hpMultiplier: 3.5 },
      { enemyType: 'TANK', count: 40, intervalSec: 0.4, delaySec: 4, hpMultiplier: 4.0 },
      { enemyType: 'SWARM', count: 150, intervalSec: 0.08, delaySec: 8 },
    ],
  },
];
