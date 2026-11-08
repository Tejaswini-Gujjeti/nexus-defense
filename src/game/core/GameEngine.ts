import { Application, Container, Sprite } from 'pixi.js';
import { GameState, TacticalAbility, TowerType } from '../../types/game';
import { MAPS, WAVES_50, getPathTileCoords } from '../map/MapConfig';
import { TextureFactory } from '../rendering/TextureFactory';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { ParticleManager } from '../entities/Particle';
import { FloatingTextManager } from '../entities/FloatingText';
import { SpatialHash } from './SpatialHash';
import { ObjectPool } from './ObjectPool';
import { globalEventBus } from './EventEmitter';
import { soundManager } from '../audio/SoundManager';
import { TOWER_CONFIGS } from '../entities/TowerConfig';

export class GameEngine {
  public app: Application;
  public mapId: string;
  public map = MAPS.orbital_nexus;
  public pathTilesSet: Set<string>;
  public blockedTilesSet: Set<string>;

  // Layers
  public worldContainer: Container; // For screen shake
  public groundLayer: Container;
  public rangeLayer: Container;
  public towersLayer: Container;
  public enemiesLayer: Container;
  public projectilesLayer: Container;
  public vfxLayer: Container;
  public textLayer: Container;

  // Screen shake
  public shakeDuration: number = 0;
  public shakeIntensity: number = 0;

  // Subsystems
  public spatialHash: SpatialHash<Enemy>;
  public particleManager: ParticleManager;
  public textManager: FloatingTextManager;
  public projectilePool: ObjectPool<Projectile>;

  // Game Entities
  public towers: Map<string, Tower> = new Map(); // key: "col,row"
  public enemies: Enemy[] = [];
  public activeProjectiles: Projectile[] = [];

  // Wave Spawner State (50 Waves)
  public currentWaveIndex: number = 0;
  public waveTimeElapsed: number = 0;
  public isSpawningWave: boolean = false;
  public waveSpawnQueue: {
    enemyType: any;
    spawnTime: number;
    hpMultiplier: number;
    speedMultiplier: number;
    routeIndex: number;
  }[] = [];

  // Commander Abilities
  public tacticalAbilities: TacticalAbility[] = [
    {
      id: 'ORBITAL_STRIKE',
      name: 'Orbital Strike',
      description: 'Devastating orbital kinetic lance delivering 650 direct impact damage.',
      energyCost: 100,
      cooldownSec: 25,
      cooldownRemaining: 0,
      radius: 130,
      icon: 'Bomb',
      type: 'TARGETED_AOE',
    },
    {
      id: 'EMP_BLAST',
      name: 'EMP Burst',
      description: 'Discharges an electromagnetic pulse stunning hostiles for 4.5s and stripping shields.',
      energyCost: 75,
      cooldownSec: 20,
      cooldownRemaining: 0,
      radius: 150,
      icon: 'ZapOff',
      type: 'TARGETED_AOE',
    },
    {
      id: 'GRID_OVERDRIVE',
      name: 'Grid Overdrive',
      description: 'Supercharges all active defensive towers with +50% fire rate for 10 seconds.',
      energyCost: 60,
      cooldownSec: 22,
      cooldownRemaining: 0,
      radius: 0,
      icon: 'Activity',
      type: 'GLOBAL_BUFF',
    },
  ];

  public overdriveTimer: number = 0;

  // React Synchronized State
  public state: GameState = {
    coreHp: 100,
    maxCoreHp: 100,
    coreShield: 50,
    maxCoreShield: 50,
    credits: 400,
    energy: 100,
    maxEnergy: 100,
    wave: 0,
    totalWaves: WAVES_50.length,
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
    mapId: 'orbital_nexus',
  };

  private stateSyncTimer: number = 0;

  constructor(app: Application, mapId: string = 'orbital_nexus') {
    this.app = app;
    this.mapId = mapId;
    this.map = MAPS[mapId] || MAPS.orbital_nexus;
    this.pathTilesSet = getPathTileCoords(this.map.waypointRoutes, this.map.tileSize);
    this.blockedTilesSet = new Set(this.map.blockedTiles.map((t) => `${t.col},${t.row}`));

    // Root World Container for screen shake
    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    // Initialize display containers
    this.groundLayer = new Container();
    this.rangeLayer = new Container();
    this.towersLayer = new Container();
    this.enemiesLayer = new Container();
    this.projectilesLayer = new Container();
    this.vfxLayer = new Container();
    this.textLayer = new Container();

    this.worldContainer.addChild(this.groundLayer);
    this.worldContainer.addChild(this.rangeLayer);
    this.worldContainer.addChild(this.towersLayer);
    this.worldContainer.addChild(this.enemiesLayer);
    this.worldContainer.addChild(this.projectilesLayer);
    this.worldContainer.addChild(this.vfxLayer);
    this.worldContainer.addChild(this.textLayer);

    // Initialize subsystems
    this.spatialHash = new SpatialHash<Enemy>(64);
    this.particleManager = new ParticleManager(this.vfxLayer, 400);
    this.textManager = new FloatingTextManager(this.textLayer, 60);

    this.projectilePool = new ObjectPool<Projectile>(
      () => new Projectile(this.projectilesLayer),
      (p) => {
        p.active = false;
        p.sprite.visible = false;
      },
      80
    );

    // Load Highscore
    const saved = localStorage.getItem('nexus_defense_high_score');
    if (saved) {
      this.state.highScore = parseInt(saved, 10) || 0;
    }

    this.state.mapId = this.mapId;
    this.renderGroundMap();
  }

  public setMap(newMapId: string) {
    this.resetGame();
    this.mapId = newMapId;
    this.map = MAPS[newMapId] || MAPS.orbital_nexus;
    this.pathTilesSet = getPathTileCoords(this.map.waypointRoutes, this.map.tileSize);
    this.blockedTilesSet = new Set(this.map.blockedTiles.map((t) => `${t.col},${t.row}`));
    this.state.mapId = newMapId;
    this.renderGroundMap();
  }

  private renderGroundMap() {
    this.groundLayer.removeChildren();

    // Render Grid Tiles
    for (let c = 0; c < this.map.cols; c++) {
      for (let r = 0; r < this.map.rows; r++) {
        const key = `${c},${r}`;
        let texName = 'tile_empty';

        if (this.pathTilesSet.has(key)) {
          texName = 'tile_path';
        } else if (this.blockedTilesSet.has(key)) {
          texName = 'tile_blocked';
        }

        const tile = new Sprite(TextureFactory.get(texName));
        tile.position.set(c * this.map.tileSize, r * this.map.tileSize);
        tile.width = this.map.tileSize;
        tile.height = this.map.tileSize;
        this.groundLayer.addChild(tile);
      }
    }

    // Render Spawn Portals
    this.map.spawnPoints.forEach((sp) => {
      const portal = new Sprite(TextureFactory.get('spawn_portal'));
      portal.anchor.set(0.5);
      portal.position.set(sp.x, sp.y);
      this.groundLayer.addChild(portal);
    });

    // Render Nexus Core
    const nexus = new Sprite(TextureFactory.get('nexus_core'));
    nexus.anchor.set(0.5);
    nexus.position.set(this.map.nexusPoint.x, this.map.nexusPoint.y);
    this.groundLayer.addChild(nexus);
  }

  public triggerScreenShake(intensity: number = 8, duration: number = 0.35) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  public isCellBuildable(col: number, row: number): boolean {
    if (col < 0 || col >= this.map.cols || row < 0 || row >= this.map.rows) return false;
    const key = `${col},${row}`;
    if (this.pathTilesSet.has(key)) return false;
    if (this.blockedTilesSet.has(key)) return false;
    if (this.towers.has(key)) return false;
    return true;
  }

  public buildTower(type: TowerType, col: number, row: number): boolean {
    if (!this.isCellBuildable(col, row)) return false;

    const config = TOWER_CONFIGS[type];
    if (this.state.credits < config.baseCost) {
      soundManager.playNexusHit();
      this.textManager.spawn(
        col * this.map.tileSize + 24,
        row * this.map.tileSize + 24,
        'CREDITS INSUFFICIENT',
        '#ef4444'
      );
      return false;
    }

    this.state.credits -= config.baseCost;
    const tower = new Tower(this.towersLayer, type, col, row, this.map.tileSize);
    this.towers.set(`${col},${row}`, tower);

    soundManager.playUpgrade();
    this.particleManager.spawnShockwave(tower.x, tower.y, config.color);
    this.particleManager.spawnSparks(tower.x, tower.y, config.color, 14);

    this.selectTower(tower);
    this.saveGame();
    this.syncStateNow();
    return true;
  }

  public sellTower(tower: Tower): void {
    const refund = Math.round(tower.totalInvested * 0.7);
    this.state.credits += refund;

    this.towers.delete(`${tower.col},${tower.row}`);
    tower.destroy();

    soundManager.playPlasma();
    this.particleManager.spawnSparks(tower.x, tower.y, 0xffd60a, 14);
    this.textManager.spawn(tower.x, tower.y, `+${refund} CR`, '#ffd60a');

    this.deselectTower();
    this.saveGame();
    this.syncStateNow();
  }

  public upgradeTower(tower: Tower): boolean {
    if (tower.level >= 3) return false;

    const config = TOWER_CONFIGS[tower.type];
    const nextLevelConfig = config.levels[tower.level];
    const cost = nextLevelConfig.upgradeCost;

    if (this.state.credits < cost) {
      this.textManager.spawn(tower.x, tower.y, 'NOT ENOUGH CREDITS', '#ef4444');
      return false;
    }

    this.state.credits -= cost;
    const success = tower.upgrade();
    if (success) {
      this.particleManager.spawnShockwave(tower.x, tower.y, config.color);
      this.particleManager.spawnSparks(tower.x, tower.y, 0x00e5ff, 22);
      this.textManager.spawn(tower.x, tower.y, `UPGRADED TO LV ${tower.level}!`, '#00ff88', 14);
      this.saveGame();
      this.syncStateNow();
    }
    return success;
  }

  public selectTower(tower: Tower | null) {
    if (this.state.selectedTowerId) {
      const prev = Array.from(this.towers.values()).find((t) => t.id === this.state.selectedTowerId);
      if (prev) prev.setSelected(false);
    }

    if (tower) {
      tower.setSelected(true);
      this.state.selectedTowerId = tower.id;
      globalEventBus.emit('tower_selected', tower);
    } else {
      this.state.selectedTowerId = null;
      globalEventBus.emit('tower_selected', null);
    }
  }

  public deselectTower() {
    this.selectTower(null);
  }

  // --- WAVE MANAGER (50 Waves) ---
  public startNextWave(): boolean {
    if (this.state.waveInProgress || this.state.isGameOver || this.state.isVictory) return false;

    if (this.currentWaveIndex >= WAVES_50.length) {
      return false;
    }

    const waveDef = WAVES_50[this.currentWaveIndex];
    this.state.wave = waveDef.waveNumber;
    this.state.waveInProgress = true;
    this.isSpawningWave = true;
    this.waveTimeElapsed = 0;
    this.waveSpawnQueue = [];

    // Queue spawns across routes
    const numRoutes = this.map.waypointRoutes.length;
    waveDef.groups.forEach((group, groupIdx) => {
      for (let i = 0; i < group.count; i++) {
        this.waveSpawnQueue.push({
          enemyType: group.enemyType,
          spawnTime: group.delaySec + i * group.intervalSec,
          hpMultiplier: group.hpMultiplier || 1.0,
          speedMultiplier: group.speedMultiplier || 1.0,
          routeIndex: (groupIdx + i) % numRoutes,
        });
      }
    });

    this.waveSpawnQueue.sort((a, b) => a.spawnTime - b.spawnTime);

    if (waveDef.isBossWave) {
      soundManager.playNexusHit();
      this.triggerScreenShake(10, 0.5);
      this.textManager.spawn(600, 360, waveDef.bossAnnouncement || 'BOSS INCOMING!', '#ff0055', 20);
    } else {
      soundManager.playWaveAlert();
    }

    this.syncStateNow();
    return true;
  }

  private spawnEnemy(type: any, hpMultiplier: number, speedMultiplier: number, routeIndex: number) {
    let enemy = this.enemies.find((e) => !e.active);
    if (!enemy) {
      enemy = new Enemy(this.enemiesLayer);
      this.enemies.push(enemy);
    }

    const route = this.map.waypointRoutes[routeIndex] || this.map.waypointRoutes[0];
    enemy.init(type, route, hpMultiplier, speedMultiplier);

    const spawnPt = route[0];
    this.particleManager.spawnSparks(spawnPt.x, spawnPt.y, 0xef4444, 8);

    if (type === 'BOSS') {
      this.state.bossActive = true;
      this.state.bossName = 'OMEGA TITAN';
      this.state.bossHp = enemy.hp;
      this.state.bossMaxHp = enemy.stats.maxHp;
      this.particleManager.spawnShockwave(spawnPt.x, spawnPt.y, 0xa855f7);
      this.triggerScreenShake(8, 0.4);
    }
  }

  // --- TACTICAL COMMANDER ABILITIES ---
  public activateTacticalAbility(abilityId: string, targetX?: number, targetY?: number) {
    const ability = this.tacticalAbilities.find((a) => a.id === abilityId);
    if (!ability || ability.cooldownRemaining > 0 || this.state.energy < ability.energyCost) {
      return;
    }

    if (ability.id === 'ORBITAL_STRIKE' && targetX !== undefined && targetY !== undefined) {
      this.state.energy -= ability.energyCost;
      ability.cooldownRemaining = ability.cooldownSec;

      soundManager.playOrbitalStrike();
      this.triggerScreenShake(12, 0.5);
      this.particleManager.spawnShockwave(targetX, targetY, 0xff0055);
      this.particleManager.spawnExplosion(targetX, targetY, 0xff6b35, 35);

      const hits = this.spatialHash.queryRadius(targetX, targetY, ability.radius);
      hits.forEach((enemy) => {
        const res = enemy.takeDamage(650, 0.85);
        this.textManager.spawn(enemy.x, enemy.y, '650', '#ff0055', 18);
        if (res.killed) {
          this.handleEnemyDeath(enemy);
        }
      });
    } else if (ability.id === 'EMP_BLAST' && targetX !== undefined && targetY !== undefined) {
      this.state.energy -= ability.energyCost;
      ability.cooldownRemaining = ability.cooldownSec;

      soundManager.playEmp();
      this.triggerScreenShake(6, 0.3);
      this.particleManager.spawnShockwave(targetX, targetY, 0x00e5ff);

      const hits = this.spatialHash.queryRadius(targetX, targetY, ability.radius);
      hits.forEach((enemy) => {
        enemy.applyEMP(4.5);
        this.particleManager.spawnSparks(enemy.x, enemy.y, 0x00e5ff, 12);
        this.textManager.spawn(enemy.x, enemy.y, 'EMP STUN', '#00e5ff', 13);
      });
    } else if (ability.id === 'GRID_OVERDRIVE') {
      this.state.energy -= ability.energyCost;
      ability.cooldownRemaining = ability.cooldownSec;

      this.overdriveTimer = 10.0;
      soundManager.playUpgrade();
      this.towers.forEach((t) => {
        this.particleManager.spawnShockwave(t.x, t.y, 0xffd60a);
      });
      this.textManager.spawn(600, 360, 'GRID OVERDRIVE ACTIVE (+50% FIRE RATE)', '#ffd60a', 18);
    }

    this.state.activeTacticalAbility = null;
    this.syncStateNow();
  }

  // --- MAIN TICK LOOP ---
  public update(rawDt: number) {
    if (this.state.isGameOver || this.state.isVictory) return;

    // Screen Shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration -= rawDt;
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.worldContainer.position.set(offsetX, offsetY);
      if (this.shakeDuration <= 0) {
        this.worldContainer.position.set(0, 0);
      }
    }

    const dt = Math.min(rawDt, 0.1) * this.state.gameSpeed;
    if (dt === 0) return;

    // 1. Ability Cooldowns & Energy Regen
    this.tacticalAbilities.forEach((a) => {
      if (a.cooldownRemaining > 0) {
        a.cooldownRemaining = Math.max(0, a.cooldownRemaining - dt);
      }
    });

    if (this.state.energy < this.state.maxEnergy) {
      this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + 2.8 * dt);
    }

    if (this.overdriveTimer > 0) {
      this.overdriveTimer -= dt;
    }

    // 2. Wave Countdown
    if (!this.state.waveInProgress) {
      this.state.waveCountdown -= dt;
      if (this.state.waveCountdown <= 0) {
        this.startNextWave();
      }
    }

    // 3. Spawning Wave Queue
    if (this.isSpawningWave) {
      this.waveTimeElapsed += dt;
      while (this.waveSpawnQueue.length > 0 && this.waveSpawnQueue[0].spawnTime <= this.waveTimeElapsed) {
        const item = this.waveSpawnQueue.shift()!;
        this.spawnEnemy(item.enemyType, item.hpMultiplier, item.speedMultiplier, item.routeIndex);
      }

      if (this.waveSpawnQueue.length === 0) {
        this.isSpawningWave = false;
      }
    }

    // 4. Spatial Hash Grid Update
    this.spatialHash.clear();
    let aliveCount = 0;
    let currentBoss: Enemy | null = null;

    for (const enemy of this.enemies) {
      if (enemy.active) {
        this.spatialHash.insert(enemy);
        aliveCount++;
        if (enemy.type === 'BOSS') {
          currentBoss = enemy;
        }
      }
    }

    this.state.enemiesAlive = aliveCount;

    // Update Boss telemetry
    if (currentBoss) {
      const bossEnemy: Enemy = currentBoss;
      this.state.bossActive = true;
      this.state.bossHp = bossEnemy.hp;
      this.state.bossMaxHp = bossEnemy.stats.maxHp;
    } else {
      this.state.bossActive = false;
    }

    // 5. Update Enemies
    this.enemies.forEach((enemy) => {
      if (enemy.active) {
        const status = enemy.update(dt);
        if (status === 'REACHED_NEXUS') {
          this.handleEnemyReachNexus(enemy);
        } else if (status === 'DEAD') {
          this.handleEnemyDeath(enemy);
        }
      }
    });

    // 6. Update Towers
    const effectiveFireRateBonus = this.overdriveTimer > 0 ? 1.5 : 1.0;
    this.towers.forEach((tower) => {
      const originalRate = tower.stats.fireRate;
      tower.stats.fireRate = originalRate * effectiveFireRateBonus;

      const potentialTargets = this.spatialHash.queryRadius(tower.x, tower.y, tower.stats.range);

      tower.update(
        dt,
        potentialTargets,
        (t, target) => this.fireProjectile(t, target),
        (target, dmg, armorPen) => this.applyDirectDamage(target, dmg, armorPen, tower)
      );

      tower.stats.fireRate = originalRate;
    });

    // 7. Update Projectiles
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const proj = this.activeProjectiles[i];
      const result = proj.update(dt);

      if (result && result.hit) {
        this.handleProjectileHit(proj, result.x, result.y);
        this.activeProjectiles.splice(i, 1);
        this.projectilePool.release(proj);
      } else if (!proj.active) {
        this.activeProjectiles.splice(i, 1);
        this.projectilePool.release(proj);
      }
    }

    // 8. Update Particles & Text
    this.particleManager.update(dt);
    this.textManager.update(dt);

    // 9. Check Wave Completion
    if (this.state.waveInProgress && !this.isSpawningWave && aliveCount === 0) {
      this.handleWaveCompleted();
    }

    // 10. Throttle sync with React State (at 10Hz)
    this.stateSyncTimer += dt;
    if (this.stateSyncTimer >= 0.1) {
      this.stateSyncTimer = 0;
      this.syncStateNow();
    }
  }

  private fireProjectile(tower: Tower, target: Enemy) {
    const proj = this.projectilePool.obtain();
    proj.init({
      towerType: tower.type,
      x: tower.x,
      y: tower.y,
      target,
      targetPos: { x: target.x, y: target.y },
      damage: tower.stats.damage,
      speed: tower.stats.projectileSpeed,
      splashRadius: tower.stats.splashRadius,
      slowEffect: tower.stats.slowEffect,
      slowDuration: tower.stats.slowDuration,
      armorPen: tower.stats.armorShred,
    });
    this.activeProjectiles.push(proj);
  }

  private handleProjectileHit(proj: Projectile, x: number, y: number) {
    if (proj.splashRadius && proj.splashRadius > 0) {
      soundManager.playExplosion('small');
      this.triggerScreenShake(4, 0.2);
      this.particleManager.spawnExplosion(x, y, 0xff6b35, 16);

      const hitEnemies = this.spatialHash.queryRadius(x, y, proj.splashRadius);
      hitEnemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - x, enemy.y - y);
        const falloff = 1 - (dist / proj.splashRadius) * 0.45;
        const dmg = Math.round(proj.damage * falloff);

        const res = enemy.takeDamage(dmg, proj.armorPen);
        this.textManager.spawn(enemy.x, enemy.y, `${res.effectiveDmg}`, '#ff6b35', 11);

        if (proj.slowEffect && proj.slowDuration) {
          enemy.applySlow(proj.slowEffect, proj.slowDuration);
        }

        if (res.killed) {
          this.handleEnemyDeath(enemy);
        }
      });
    } else if (proj.target && proj.target.active) {
      const res = proj.target.takeDamage(proj.damage, proj.armorPen);
      this.particleManager.spawnSparks(x, y, 0x00e5ff, 8);
      this.textManager.spawn(proj.target.x, proj.target.y, `${res.effectiveDmg}`, '#ffffff', 11);

      if (proj.slowEffect && proj.slowDuration) {
        proj.target.applySlow(proj.slowEffect, proj.slowDuration);
      }

      if (res.killed) {
        this.handleEnemyDeath(proj.target);
      }
    }
  }

  private applyDirectDamage(target: Enemy, dmg: number, armorPen: number = 0, tower?: Tower) {
    const res = target.takeDamage(dmg, armorPen);
    this.particleManager.spawnSparks(target.x, target.y, 0xffd60a, 6);
    this.textManager.spawn(target.x, target.y, `${res.effectiveDmg}`, '#ffd60a', 12);

    if (res.killed) {
      if (tower) tower.kills++;
      this.handleEnemyDeath(target);
    }
  }

  private handleEnemyDeath(enemy: Enemy) {
    enemy.destroy();
    soundManager.playExplosion(enemy.type === 'BOSS' ? 'large' : 'small');
    this.particleManager.spawnExplosion(enemy.x, enemy.y, 0xff0055, enemy.type === 'BOSS' ? 40 : 16);

    if (enemy.type === 'BOSS') {
      this.triggerScreenShake(14, 0.6);
      this.textManager.spawn(enemy.x, enemy.y, 'TITAN DESTROYED!', '#00ff88', 22);
    }

    this.state.credits += enemy.stats.reward;
    this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + enemy.stats.energyReward);
    this.state.score += enemy.stats.reward * 12;

    this.textManager.spawn(enemy.x, enemy.y, `+${enemy.stats.reward} CR`, '#00ff88', 12);
  }

  private handleEnemyReachNexus(enemy: Enemy) {
    enemy.destroy();
    soundManager.playNexusHit();
    this.triggerScreenShake(10, 0.4);
    this.particleManager.spawnExplosion(this.map.nexusPoint.x, this.map.nexusPoint.y, 0xef4444, 25);

    let dmg = enemy.stats.coreDamage * 5;

    if (this.state.coreShield > 0) {
      if (this.state.coreShield >= dmg) {
        this.state.coreShield -= dmg;
        dmg = 0;
      } else {
        dmg -= this.state.coreShield;
        this.state.coreShield = 0;
      }
    }

    if (dmg > 0) {
      this.state.coreHp = Math.max(0, this.state.coreHp - dmg);
    }

    this.textManager.spawn(
      this.map.nexusPoint.x,
      this.map.nexusPoint.y,
      `-${enemy.stats.coreDamage * 5} NEXUS INTEGRITY`,
      '#ef4444',
      14
    );

    if (this.state.coreHp <= 0) {
      this.triggerGameOver();
    }
  }

  private handleWaveCompleted() {
    this.state.waveInProgress = false;
    const waveDef = WAVES_50[this.currentWaveIndex];
    this.state.credits += waveDef.rewardBonus;
    this.state.score += waveDef.rewardBonus * 20;

    soundManager.playUpgrade();
    this.textManager.spawn(600, 360, `WAVE ${waveDef.waveNumber} SECURED! +${waveDef.rewardBonus} CR`, '#00e5ff', 20);

    this.currentWaveIndex++;
    if (this.currentWaveIndex >= WAVES_50.length) {
      this.triggerVictory();
    } else {
      this.state.waveCountdown = 8;
    }

    this.saveGame();
    this.syncStateNow();
  }

  private triggerGameOver() {
    this.state.isGameOver = true;
    soundManager.playExplosion('large');
    this.triggerScreenShake(16, 0.8);
    this.updateHighScore();
    localStorage.removeItem('nexus_defense_saved_game');
    globalEventBus.emit('game_over', { score: this.state.score, wave: this.state.wave });
    this.syncStateNow();
  }

  private triggerVictory() {
    this.state.isVictory = true;
    soundManager.playUpgrade();
    this.triggerScreenShake(12, 0.6);
    this.updateHighScore();
    localStorage.removeItem('nexus_defense_saved_game');
    globalEventBus.emit('victory', { score: this.state.score });
    this.syncStateNow();
  }

  private updateHighScore() {
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      localStorage.setItem('nexus_defense_high_score', this.state.highScore.toString());
    }
  }

  public setGameSpeed(speed: number) {
    this.state.gameSpeed = speed;
    this.syncStateNow();
  }

  public saveGame() {
    try {
      const saveData = {
        waveIndex: this.currentWaveIndex,
        credits: this.state.credits,
        energy: this.state.energy,
        coreHp: this.state.coreHp,
        coreShield: this.state.coreShield,
        score: this.state.score,
        mapId: this.mapId,
        towers: Array.from(this.towers.values()).map((t) => ({
          type: t.type,
          col: t.col,
          row: t.row,
          level: t.level,
        })),
      };
      localStorage.setItem('nexus_defense_saved_game', JSON.stringify(saveData));
    } catch (e) {}
  }

  public loadSavedGame(): boolean {
    try {
      const raw = localStorage.getItem('nexus_defense_saved_game');
      if (!raw) return false;
      const data = JSON.parse(raw);

      this.resetGame();
      if (data.mapId && data.mapId !== this.mapId) {
        this.setMap(data.mapId);
      }

      this.currentWaveIndex = data.waveIndex || 0;
      this.state.credits = data.credits || 400;
      this.state.energy = data.energy || 100;
      this.state.coreHp = data.coreHp || 100;
      this.state.coreShield = data.coreShield || 50;
      this.state.score = data.score || 0;
      this.state.wave = this.currentWaveIndex;

      if (Array.isArray(data.towers)) {
        data.towers.forEach((td: any) => {
          const tower = new Tower(this.towersLayer, td.type, td.col, td.row, this.map.tileSize);
          for (let l = 1; l < td.level; l++) {
            tower.upgrade();
          }
          this.towers.set(`${td.col},${td.row}`, tower);
        });
      }

      this.syncStateNow();
      return true;
    } catch (e) {
      return false;
    }
  }

  public resetGame() {
    this.towers.forEach((t) => t.destroy());
    this.towers.clear();

    this.enemies.forEach((e) => e.destroy());
    this.enemies = [];

    this.activeProjectiles.forEach((p) => {
      p.active = false;
      p.sprite.visible = false;
    });
    this.activeProjectiles = [];

    this.particleManager.clear();
    this.textManager.clear();

    this.currentWaveIndex = 0;
    this.waveTimeElapsed = 0;
    this.isSpawningWave = false;
    this.waveSpawnQueue = [];
    this.overdriveTimer = 0;
    this.shakeDuration = 0;
    this.worldContainer.position.set(0, 0);

    this.tacticalAbilities.forEach((a) => (a.cooldownRemaining = 0));

    this.state = {
      coreHp: 100,
      maxCoreHp: 100,
      coreShield: 50,
      maxCoreShield: 50,
      credits: 400,
      energy: 100,
      maxEnergy: 100,
      wave: 0,
      totalWaves: WAVES_50.length,
      waveInProgress: false,
      waveCountdown: 8,
      gameSpeed: 1,
      isGameOver: false,
      isVictory: false,
      score: 0,
      enemiesAlive: 0,
      selectedTowerId: null,
      activeTacticalAbility: null,
      highScore: this.state.highScore,
      bossActive: false,
      bossName: '',
      bossHp: 0,
      bossMaxHp: 0,
      mapId: this.mapId,
    };

    this.syncStateNow();
  }

  public syncStateNow() {
    globalEventBus.emit('state_update', { ...this.state });
  }
}
