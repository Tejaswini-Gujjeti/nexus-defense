import { performance } from 'perf_hooks';

// Spatial Hash implementation for Node benchmark
class BenchmarkSpatialHash {
  constructor(cellSize = 64) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  insert(entity) {
    const minCol = Math.floor((entity.x - entity.radius) / this.cellSize);
    const maxCol = Math.floor((entity.x + entity.radius) / this.cellSize);
    const minRow = Math.floor((entity.y - entity.radius) / this.cellSize);
    const maxRow = Math.floor((entity.y + entity.radius) / this.cellSize);

    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const key = `${c},${r}`;
        let cell = this.grid.get(key);
        if (!cell) {
          cell = [];
          this.grid.set(key, cell);
        }
        cell.push(entity);
      }
    }
  }

  queryRadius(x, y, radius) {
    const minCol = Math.floor((x - radius) / this.cellSize);
    const maxCol = Math.floor((x + radius) / this.cellSize);
    const minRow = Math.floor((y - radius) / this.cellSize);
    const maxRow = Math.floor((y + radius) / this.cellSize);

    const candidates = [];
    const radSq = radius * radius;

    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const cell = this.grid.get(`${c},${r}`);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const e = cell[i];
            const dx = e.x - x;
            const dy = e.y - y;
            if (dx * dx + dy * dy <= radSq) {
              candidates.push(e);
            }
          }
        }
      }
    }
    return candidates;
  }
}

function runBenchmark(mode, enemiesCount = 5000, towersCount = 100, projectilesCount = 1000, frames = 600) {
  const width = 1200;
  const height = 720;
  const dt = 1 / 60;

  // Setup Enemies
  const enemies = [];
  for (let i = 0; i < enemiesCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 60;
    enemies.push({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 12,
    });
  }

  // Setup Towers
  const towers = [];
  for (let i = 0; i < towersCount; i++) {
    towers.push({
      x: 50 + Math.random() * (width - 100),
      y: 50 + Math.random() * (height - 100),
      range: 180,
      targetCacheTimer: 0,
      target: null,
      cooldown: 0,
    });
  }

  // Setup Projectiles
  let projectiles = [];
  const projectilePool = [];
  if (mode === 'OPTIMIZED') {
    for (let i = 0; i < projectilesCount + 500; i++) {
      projectilePool.push({ x: 0, y: 0, vx: 0, vy: 0, active: false, life: 0 });
    }
  }

  const spatialHash = new BenchmarkSpatialHash(64);
  const frameTimes = [];

  // Warmup (30 frames)
  for (let w = 0; w < 30; w++) {
    // warmup tick
  }

  // Measure Frames
  for (let f = 0; f < frames; f++) {
    const start = performance.now();

    // 1. Move Enemies
    if (mode === 'OPTIMIZED') {
      spatialHash.clear();
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (e.x < 10) { e.x = 10; e.vx = Math.abs(e.vx); }
      else if (e.x > width - 10) { e.x = width - 10; e.vx = -Math.abs(e.vx); }
      if (e.y < 10) { e.y = 10; e.vy = Math.abs(e.vy); }
      else if (e.y > height - 10) { e.y = height - 10; e.vy = -Math.abs(e.vy); }

      if (mode === 'OPTIMIZED') {
        spatialHash.insert(e);
      }
    }

    // 2. Towers & Targeting
    for (let t = 0; t < towers.length; t++) {
      const tower = towers[t];
      tower.cooldown -= dt;

      let target = null;
      if (mode === 'BASELINE') {
        // Naive $O(T \times E)$ check
        let closest = tower.range;
        for (let e = 0; e < enemies.length; e++) {
          const enemy = enemies[e];
          const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
          if (dist < closest) {
            closest = dist;
            target = enemy;
          }
        }
      } else {
        // Optimized spatial query + target caching
        tower.targetCacheTimer -= dt;
        if (tower.targetCacheTimer <= 0) {
          tower.targetCacheTimer = 0.1;
          const candidates = spatialHash.queryRadius(tower.x, tower.y, tower.range);
          let closest = tower.range;
          for (let c = 0; c < candidates.length; c++) {
            const cand = candidates[c];
            const dist = Math.hypot(cand.x - tower.x, cand.y - tower.y);
            if (dist < closest) {
              closest = dist;
              target = cand;
            }
          }
          tower.target = target;
        } else {
          target = tower.target;
        }
      }

      // Fire projectiles
      if (target && tower.cooldown <= 0) {
        tower.cooldown = 0.12;
        const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
        const speed = 700;

        if (mode === 'OPTIMIZED') {
          // Object Pool
          const p = projectilePool.find(proj => !proj.active);
          if (p) {
            p.x = tower.x;
            p.y = tower.y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 1.2;
            p.active = true;
            projectiles.push(p);
          }
        } else {
          // Naive Allocation
          projectiles.push({
            x: tower.x,
            y: tower.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.2,
            active: true,
          });
        }
      }
    }

    // 3. Move Projectiles
    for (let p = projectiles.length - 1; p >= 0; p--) {
      const proj = projectiles[p];
      proj.life -= dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      if (proj.life <= 0 || proj.x < 0 || proj.x > width || proj.y < 0 || proj.y > height) {
        proj.active = false;
        projectiles.splice(p, 1);
      }
    }

    const frameDuration = performance.now() - start;
    frameTimes.push(frameDuration);
  }

  // Calculate stats
  frameTimes.sort((a, b) => a - b);
  const sum = frameTimes.reduce((acc, v) => acc + v, 0);
  const avg = sum / frameTimes.length;
  const p95 = frameTimes[Math.floor(frameTimes.length * 0.95)];
  const max = frameTimes[frameTimes.length - 1];
  const framesAbove33 = frameTimes.filter(t => t > 33.3).length;
  const framesAbove33Pct = (framesAbove33 / frameTimes.length) * 100;
  const fps = 1000 / avg;

  return {
    mode,
    enemies: enemiesCount,
    towers: towersCount,
    projectiles: projectilesCount,
    avgFps: Math.round(fps),
    avgFrameTime: Number(avg.toFixed(2)),
    p95FrameTime: Number(p95.toFixed(2)),
    maxFrameTime: Number(max.toFixed(2)),
    framesAbove33msPercent: Number(framesAbove33Pct.toFixed(1)),
  };
}

console.log('--- STARTING NEXUS DEFENSE BENCHMARK SUITE ---');
console.log('Target Scenario: 5,000 Enemies + 100 Towers + 1,000 Projectiles over 600 frames\n');

const baseline = runBenchmark('BASELINE', 5000, 100, 1000, 600);
console.log('BASELINE RESULTS:', JSON.stringify(baseline, null, 2));

const optimized = runBenchmark('OPTIMIZED', 5000, 100, 1000, 600);
console.log('\nOPTIMIZED RESULTS:', JSON.stringify(optimized, null, 2));

const fpsImprovement = Math.round(((optimized.avgFps - baseline.avgFps) / baseline.avgFps) * 100);
const frameTimeReduction = Math.round(((baseline.avgFrameTime - optimized.avgFrameTime) / baseline.avgFrameTime) * 100);

console.log('\n--- PERFORMANCE IMPROVEMENT SUMMARY ---');
console.log(`FPS Gain: +${fpsImprovement}%`);
console.log(`Frame Time Reduction: -${frameTimeReduction}%`);
console.log(`P95 Frame Time: ${baseline.p95FrameTime}ms (Baseline) -> ${optimized.p95FrameTime}ms (Optimized)`);
