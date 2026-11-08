import { performance } from 'perf_hooks';

// Run with selective optimizations
function runStage(name, useSpatialHash, useTargetCaching, usePooling, frames = 300) {
  const width = 1200;
  const height = 720;
  const dt = 1 / 60;
  const enemiesCount = 5000;
  const towersCount = 100;
  const projectilesCount = 1000;

  // Grid for spatial hash
  const cellSize = 64;
  const grid = new Map();

  const enemies = [];
  for (let i = 0; i < enemiesCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 60;
    enemies.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 12,
    });
  }

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

  let projectiles = [];
  const pool = [];
  if (usePooling) {
    for (let i = 0; i < projectilesCount + 500; i++) {
      pool.push({ x: 0, y: 0, vx: 0, vy: 0, active: false, life: 0 });
    }
  }

  const frameTimes = [];

  for (let f = 0; f < frames; f++) {
    const start = performance.now();

    // 1. Enemies
    if (useSpatialHash) {
      grid.clear();
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.x < 10) e.x = 10; else if (e.x > width - 10) e.x = width - 10;
      if (e.y < 10) e.y = 10; else if (e.y > height - 10) e.y = height - 10;

      if (useSpatialHash) {
        const key = `${Math.floor(e.x / cellSize)},${Math.floor(e.y / cellSize)}`;
        let cell = grid.get(key);
        if (!cell) { cell = []; grid.set(key, cell); }
        cell.push(e);
      }
    }

    // 2. Towers
    for (let t = 0; t < towers.length; t++) {
      const tower = towers[t];
      tower.cooldown -= dt;
      let target = null;

      if (useTargetCaching) {
        tower.targetCacheTimer -= dt;
      }

      if (!useTargetCaching || tower.targetCacheTimer <= 0) {
        if (useTargetCaching) tower.targetCacheTimer = 0.1;

        if (useSpatialHash) {
          const minC = Math.floor((tower.x - tower.range) / cellSize);
          const maxC = Math.floor((tower.x + tower.range) / cellSize);
          const minR = Math.floor((tower.y - tower.range) / cellSize);
          const maxR = Math.floor((tower.y + tower.range) / cellSize);
          let closest = tower.range;

          for (let c = minC; c <= maxC; c++) {
            for (let r = minR; r <= maxR; r++) {
              const cell = grid.get(`${c},${r}`);
              if (cell) {
                for (let i = 0; i < cell.length; i++) {
                  const cand = cell[i];
                  const dist = Math.hypot(cand.x - tower.x, cand.y - tower.y);
                  if (dist < closest) {
                    closest = dist;
                    target = cand;
                  }
                }
              }
            }
          }
        } else {
          let closest = tower.range;
          for (let e = 0; e < enemies.length; e++) {
            const cand = enemies[e];
            const dist = Math.hypot(cand.x - tower.x, cand.y - tower.y);
            if (dist < closest) {
              closest = dist;
              target = cand;
            }
          }
        }
        tower.target = target;
      } else {
        target = tower.target;
      }

      if (target && tower.cooldown <= 0) {
        tower.cooldown = 0.12;
        if (usePooling) {
          const p = pool.find(pr => !pr.active);
          if (p) {
            p.x = tower.x; p.y = tower.y; p.vx = 500; p.vy = 500; p.life = 1.0; p.active = true;
            projectiles.push(p);
          }
        } else {
          projectiles.push({ x: tower.x, y: tower.y, vx: 500, vy: 500, life: 1.0, active: true });
        }
      }
    }

    // 3. Projectiles
    for (let p = projectiles.length - 1; p >= 0; p--) {
      const proj = projectiles[p];
      proj.life -= dt;
      if (proj.life <= 0) {
        proj.active = false;
        projectiles.splice(p, 1);
      }
    }

    frameTimes.push(performance.now() - start);
  }

  frameTimes.sort((a, b) => a - b);
  const sum = frameTimes.reduce((acc, v) => acc + v, 0);
  const avg = sum / frameTimes.length;
  const p95 = frameTimes[Math.floor(frameTimes.length * 0.95)];
  const max = frameTimes[frameTimes.length - 1];
  const framesAbove33 = frameTimes.filter(t => t > 33.3).length;
  const framesAbove33Pct = (framesAbove33 / frameTimes.length) * 100;
  const fps = Math.round(1000 / avg);

  return {
    stage: name,
    avgFps: fps,
    avgFrameTime: Number(avg.toFixed(2)),
    p95FrameTime: Number(p95.toFixed(2)),
    maxFrameTime: Number(max.toFixed(2)),
    framesAbove33msPercent: Number(framesAbove33Pct.toFixed(1)),
  };
}

console.log('MEASURING INDIVIDUAL OPTIMIZATION STAGES (5000 enemies + 100 towers):');
const s1 = runStage('1. Initial Baseline', false, false, false);
console.log(JSON.stringify(s1));

const s2 = runStage('2. + Object Pooling', false, false, true);
console.log(JSON.stringify(s2));

const s3 = runStage('3. + Spatial Partitioning', true, false, true);
console.log(JSON.stringify(s3));

const s4 = runStage('4. + Targeting Caching Optimization', true, true, true);
console.log(JSON.stringify(s4));
