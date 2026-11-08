import { Application, Container, Sprite } from 'pixi.js';
import { BenchmarkMetrics } from '../../types/game';
import { SpatialHash } from '../core/SpatialHash';
import { TextureFactory } from '../rendering/TextureFactory';

export type BenchmarkMode = 'OPTIMIZED' | 'BASELINE';

export interface BenchmarkPreset {
  id: string;
  name: string;
  enemies: number;
  towers: number;
  projectiles: number;
}

export const BENCHMARK_PRESETS: BenchmarkPreset[] = [
  { id: 'light', name: '1. Light Load', enemies: 500, towers: 20, projectiles: 100 },
  { id: 'medium', name: '2. Medium Load', enemies: 1500, towers: 50, projectiles: 300 },
  { id: 'heavy', name: '3. Heavy Load', enemies: 3000, towers: 80, projectiles: 600 },
  { id: 'extreme', name: '4. Extreme Load', enemies: 4500, towers: 90, projectiles: 800 },
  { id: 'target', name: '5. Assignment Target: 5,000 Enemies + 100 Towers + 1,000 Proj', enemies: 5000, towers: 100, projectiles: 1000 },
];

interface SimEnemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  radius: number;
  id: string;
  sprite: Sprite;
}

interface SimTower {
  x: number;
  y: number;
  range: number;
  targetId: string | null;
  targetCacheTimer: number;
  cooldown: number;
  sprite: Sprite;
}

interface SimProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  life: number;
  sprite: Sprite;
}

export class BenchmarkEngine {
  public app: Application;
  public mode: BenchmarkMode = 'OPTIMIZED';
  public isRunning: boolean = false;

  // Containers
  public rootContainer: Container;
  public enemiesContainer: Container;
  public towersContainer: Container;
  public projectilesContainer: Container;

  // Spatial Partitioning (Mode B)
  public spatialHash: SpatialHash<any>;

  // Entities
  public enemies: SimEnemy[] = [];
  public towers: SimTower[] = [];
  public projectiles: SimProjectile[] = [];
  public projectilePool: SimProjectile[] = [];

  // Frame telemetry
  public frameTimes: number[] = [];
  public lastFrameTime: number = 0;
  public elapsedTime: number = 0;
  public testDuration: number = 10; // seconds

  // Live Metrics
  public currentMetrics: BenchmarkMetrics = {
    fps: 60,
    avgFrameTime: 16.6,
    p95FrameTime: 16.6,
    maxFrameTime: 16.6,
    framesAbove33msPercent: 0,
    activeEnemies: 0,
    activeTowers: 0,
    activeProjectiles: 0,
    activeParticles: 0,
    durationSec: 0,
  };

  private onUpdateCallback?: (m: BenchmarkMetrics) => void;
  private onCompleteCallback?: (finalMetrics: BenchmarkMetrics) => void;

  constructor(app: Application) {
    this.app = app;
    this.rootContainer = new Container();
    this.app.stage.addChild(this.rootContainer);

    this.enemiesContainer = new Container();
    this.towersContainer = new Container();
    this.projectilesContainer = new Container();

    this.rootContainer.addChild(this.enemiesContainer);
    this.rootContainer.addChild(this.towersContainer);
    this.rootContainer.addChild(this.projectilesContainer);

    this.spatialHash = new SpatialHash(64);
  }

  public setupScenario(preset: BenchmarkPreset, mode: BenchmarkMode) {
    this.stop();
    this.mode = mode;

    // Clear existing
    this.enemiesContainer.removeChildren();
    this.towersContainer.removeChildren();
    this.projectilesContainer.removeChildren();

    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.projectilePool = [];
    this.frameTimes = [];
    this.elapsedTime = 0;

    const width = 1200;
    const height = 720;

    // 1. Spawn Towers (Grid layout)
    const towerTex = TextureFactory.get('turret_PULSE_CANNON_1');
    const cols = Math.ceil(Math.sqrt(preset.towers * 1.5));
    const stepX = (width - 100) / cols;
    const stepY = (height - 100) / Math.ceil(preset.towers / cols);

    for (let i = 0; i < preset.towers; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = 50 + c * stepX + (Math.random() - 0.5) * 15;
      const y = 50 + r * stepY + (Math.random() - 0.5) * 15;

      const sp = new Sprite(towerTex);
      sp.anchor.set(0.5);
      sp.scale.set(0.65);
      sp.position.set(x, y);
      this.towersContainer.addChild(sp);

      this.towers.push({
        x,
        y,
        range: 180,
        targetId: null,
        targetCacheTimer: 0,
        cooldown: Math.random() * 0.5,
        sprite: sp,
      });
    }

    // 2. Spawn Enemies (Swarm distribution)
    const enemyTex = TextureFactory.get('enemy_SCOUT');
    for (let i = 0; i < preset.enemies; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;

      const sp = new Sprite(enemyTex);
      sp.anchor.set(0.5);
      sp.scale.set(0.6);
      sp.position.set(x, y);
      this.enemiesContainer.addChild(sp);

      this.enemies.push({
        id: `e_${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        hp: 100,
        radius: 12,
        sprite: sp,
      });
    }

    // 3. Pre-allocate Projectile Pool (Mode B Optimized)
    const projTex = TextureFactory.get('proj_PULSE_CANNON');
    const poolSize = preset.projectiles + 200;
    for (let i = 0; i < poolSize; i++) {
      const sp = new Sprite(projTex);
      sp.anchor.set(0.5);
      sp.visible = false;
      this.projectilesContainer.addChild(sp);

      this.projectilePool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        active: false,
        life: 0,
        sprite: sp,
      });
    }

    this.currentMetrics = {
      fps: 60,
      avgFrameTime: 16.6,
      p95FrameTime: 16.6,
      maxFrameTime: 16.6,
      framesAbove33msPercent: 0,
      activeEnemies: preset.enemies,
      activeTowers: preset.towers,
      activeProjectiles: 0,
      activeParticles: 0,
      durationSec: 0,
    };
  }

  public start(
    durationSec: number = 10,
    onUpdate?: (m: BenchmarkMetrics) => void,
    onComplete?: (finalMetrics: BenchmarkMetrics) => void
  ) {
    this.isRunning = true;
    this.testDuration = durationSec;
    this.elapsedTime = 0;
    this.frameTimes = [];
    this.lastFrameTime = performance.now();
    this.onUpdateCallback = onUpdate;
    this.onCompleteCallback = onComplete;
  }

  public stop() {
    this.isRunning = false;
  }

  public update() {
    if (!this.isRunning) return;

    const now = performance.now();
    const frameDelta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Record frame time for statistics
    if (this.elapsedTime > 0.5) {
      // Warm-up skip 500ms
      this.frameTimes.push(frameDelta);
    }

    const dt = Math.min(frameDelta / 1000, 0.05); // cap at 50ms
    this.elapsedTime += dt;

    const width = 1200;
    const height = 720;

    // --- 1. SIMULATE ENEMIES ---
    if (this.mode === 'OPTIMIZED') {
      this.spatialHash.clear();
    }

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Bounce at boundary
      if (e.x < 10) { e.x = 10; e.vx = Math.abs(e.vx); }
      else if (e.x > width - 10) { e.x = width - 10; e.vx = -Math.abs(e.vx); }

      if (e.y < 10) { e.y = 10; e.vy = Math.abs(e.vy); }
      else if (e.y > height - 10) { e.y = height - 10; e.vy = -Math.abs(e.vy); }

      e.sprite.position.set(e.x, e.y);

      if (this.mode === 'OPTIMIZED') {
        this.spatialHash.insert(e);
      }
    }

    // --- 2. SIMULATE TOWERS & TARGETING ---
    for (let tIdx = 0; tIdx < this.towers.length; tIdx++) {
      const t = this.towers[tIdx];
      t.cooldown -= dt;

      let target: SimEnemy | null = null;

      if (this.mode === 'BASELINE') {
        // NAIVE BASELINE: Iterates over ALL 5,000 enemies every single frame!
        let closestDist = t.range;
        for (let eIdx = 0; eIdx < this.enemies.length; eIdx++) {
          const e = this.enemies[eIdx];
          const dist = Math.hypot(e.x - t.x, e.y - t.y);
          if (dist < closestDist) {
            closestDist = dist;
            target = e;
          }
        }
      } else {
        // OPTIMIZED: Query 64px spatial hash bins + target caching!
        t.targetCacheTimer -= dt;
        if (t.targetCacheTimer <= 0) {
          t.targetCacheTimer = 0.1; // Evaluate every 100ms
          const candidates = this.spatialHash.queryRadius(t.x, t.y, t.range);
          let closestDist = t.range;
          for (let cIdx = 0; cIdx < candidates.length; cIdx++) {
            const cand = candidates[cIdx];
            const dist = Math.hypot(cand.x - t.x, cand.y - t.y);
            if (dist < closestDist) {
              closestDist = dist;
              target = cand;
            }
          }
        }
      }

      if (target && t.cooldown <= 0) {
        t.cooldown = 0.12; // High rate of fire to stress test projectiles!

        // Spawn Projectile
        const angle = Math.atan2(target.y - t.y, target.x - t.x);
        t.sprite.rotation = angle;
        const speed = 700;

        if (this.mode === 'OPTIMIZED') {
          // Reusable pool obtain
          const p = this.projectilePool.find((proj) => !proj.active);
          if (p) {
            p.x = t.x;
            p.y = t.y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 1.2;
            p.active = true;
            p.sprite.visible = true;
            p.sprite.position.set(p.x, p.y);
            p.sprite.rotation = angle;
            this.projectiles.push(p);
          }
        } else {
          // BASELINE: Repeated allocation of new objects and DOM/Sprite objects!
          const sp = new Sprite(TextureFactory.get('proj_PULSE_CANNON'));
          sp.anchor.set(0.5);
          sp.position.set(t.x, t.y);
          this.projectilesContainer.addChild(sp);

          this.projectiles.push({
            x: t.x,
            y: t.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            active: true,
            life: 1.2,
            sprite: sp,
          });
        }
      }
    }

    // --- 3. SIMULATE PROJECTILES ---
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.sprite.position.set(p.x, p.y);

      if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        p.active = false;
        p.sprite.visible = false;
        if (this.mode === 'BASELINE') {
          this.projectilesContainer.removeChild(p.sprite);
          p.sprite.destroy();
        }
        this.projectiles.splice(i, 1);
      }
    }

    // --- 4. CALCULATE TELEMETRY METRICS ---
    const len = this.frameTimes.length;
    let avgFt = frameDelta;
    let p95Ft = frameDelta;
    let maxFt = frameDelta;
    let above33Count = 0;

    if (len > 0) {
      let sum = 0;
      const sorted = [...this.frameTimes].sort((a, b) => a - b);
      for (let i = 0; i < len; i++) {
        sum += sorted[i];
        if (sorted[i] > 33.3) above33Count++;
      }
      avgFt = sum / len;
      p95Ft = sorted[Math.floor(len * 0.95)] || avgFt;
      maxFt = sorted[len - 1];
    }

    const fps = Math.round(1000 / Math.max(1, frameDelta));
    const memoryMb = (performance as any).memory
      ? Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024))
      : undefined;

    this.currentMetrics = {
      fps,
      avgFrameTime: Number(avgFt.toFixed(2)),
      p95FrameTime: Number(p95Ft.toFixed(2)),
      maxFrameTime: Number(maxFt.toFixed(2)),
      framesAbove33msPercent: Number(((above33Count / Math.max(1, len)) * 100).toFixed(1)),
      activeEnemies: this.enemies.length,
      activeTowers: this.towers.length,
      activeProjectiles: this.projectiles.length,
      activeParticles: 0,
      memoryMb,
      durationSec: Number(this.elapsedTime.toFixed(1)),
    };

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.currentMetrics);
    }

    // Completion condition
    if (this.elapsedTime >= this.testDuration) {
      this.stop();
      if (this.onCompleteCallback) {
        this.onCompleteCallback(this.currentMetrics);
      }
    }
  }

  public destroy() {
    this.stop();
    this.rootContainer.destroy({ children: true });
  }
}
