import { Container, Graphics, Sprite } from 'pixi.js';
import { TargetPriority, TowerStats, TowerType } from '../../types/game';
import { TOWER_CONFIGS } from './TowerConfig';
import { TextureFactory } from '../rendering/TextureFactory';
import { Enemy } from './Enemy';
import { soundManager } from '../audio/SoundManager';

export class Tower {
  public id: string;
  public type: TowerType;
  public col: number;
  public row: number;
  public x: number;
  public y: number;

  // Progression & Stats
  public level: number = 1;
  public stats: TowerStats;
  public totalInvested: number;
  public kills: number = 0;
  public damageDealt: number = 0;

  // Targeting AI & Target Caching
  public targetPriority: TargetPriority = 'FIRST';
  public target: Enemy | null = null;
  public targetCacheTimer: number = 0;
  public currentAngle: number = 0;
  public cooldown: number = 0;

  // Pixi Display Objects
  public container: Container;
  public baseSprite: Sprite;
  public headSprite: Sprite;
  public rangeGraphics: Graphics;
  public beamGraphics: Graphics; // Laser beams, Railgun slugs, Tesla arcs
  public muzzleFlashSprite: Sprite;

  // Beam animation timer
  public beamLife: number = 0;
  public isSelected: boolean = false;

  constructor(parent: Container, type: TowerType, col: number, row: number, tileSize: number = 48) {
    this.id = `tower_${type}_${col}_${row}`;
    this.type = type;
    this.col = col;
    this.row = row;
    this.x = col * tileSize + tileSize / 2;
    this.y = row * tileSize + tileSize / 2;

    const config = TOWER_CONFIGS[type];
    this.stats = { ...config.levels[0].stats };
    this.totalInvested = config.baseCost;

    this.container = new Container();
    this.container.position.set(this.x, this.y);

    // Range Graphics (drawn underneath base)
    this.rangeGraphics = new Graphics();
    this.rangeGraphics.visible = false;
    this.container.addChild(this.rangeGraphics);

    // Base Sprite
    this.baseSprite = new Sprite(TextureFactory.get('tower_base_1'));
    this.baseSprite.anchor.set(0.5);
    this.container.addChild(this.baseSprite);

    // Head Sprite
    this.headSprite = new Sprite(TextureFactory.get(`turret_${type}_1`));
    this.headSprite.anchor.set(0.5);
    this.container.addChild(this.headSprite);

    // Muzzle Flash
    this.muzzleFlashSprite = new Sprite(TextureFactory.get('particle_spark'));
    this.muzzleFlashSprite.anchor.set(0.5);
    this.muzzleFlashSprite.position.set(16, 0);
    this.muzzleFlashSprite.scale.set(1.4);
    this.muzzleFlashSprite.visible = false;
    this.headSprite.addChild(this.muzzleFlashSprite);

    // Beam / Arc Graphics
    this.beamGraphics = new Graphics();
    this.container.addChild(this.beamGraphics);

    parent.addChild(this.container);
    this.updateRangeCircle();
  }

  public updateRangeCircle() {
    this.rangeGraphics.clear();
    const color = TOWER_CONFIGS[this.type].color;

    // Glowing range perimeter
    this.rangeGraphics
      .circle(0, 0, this.stats.range)
      .fill({ color, alpha: 0.08 })
      .stroke({ width: 1.5, color, alpha: 0.6 });
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.rangeGraphics.visible = selected;
  }

  public setPriority(priority: TargetPriority) {
    this.targetPriority = priority;
    this.target = null; // Invalidate cached target to acquire new priority
  }

  public upgrade(): boolean {
    if (this.level >= 3) return false;

    const config = TOWER_CONFIGS[this.type];
    const nextLevelConfig = config.levels[this.level]; // 0-indexed: index 1 is Lvl 2, index 2 is Lvl 3

    this.level++;
    this.stats = { ...nextLevelConfig.stats };
    this.totalInvested += nextLevelConfig.upgradeCost;

    // Update visuals to reinforced tier textures
    this.baseSprite.texture = TextureFactory.get(`tower_base_${this.level}`);
    this.headSprite.texture = TextureFactory.get(`turret_${this.type}_${this.level}`);

    this.updateRangeCircle();
    soundManager.playUpgrade();
    return true;
  }

  public update(
    dt: number,
    potentialTargets: Enemy[],
    onFireProjectile: (tower: Tower, target: Enemy) => void,
    onInstantDamage: (target: Enemy, dmg: number, armorPen?: number) => void
  ) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }

    // Fade beam graphics
    if (this.beamLife > 0) {
      this.beamLife -= dt;
      this.beamGraphics.alpha = Math.max(0, this.beamLife / 0.15);
      if (this.beamLife <= 0) {
        this.beamGraphics.clear();
        this.muzzleFlashSprite.visible = false;
      }
    }

    // TARGET CACHING OPTIMIZATION:
    // Only re-evaluate target if cached target is dead, inactive, or moved out of range
    const isTargetStillValid =
      this.target &&
      this.target.active &&
      !this.target.isCloaked &&
      Math.hypot(this.target.x - this.x, this.target.y - this.y) <= this.stats.range;

    this.targetCacheTimer -= dt;
    if (!isTargetStillValid || this.targetCacheTimer <= 0) {
      this.targetCacheTimer = 0.1; // Re-evaluate targeting every 100ms max

      // Filter in-range enemies
      const validTargets = potentialTargets.filter((enemy) => {
        if (!enemy.active || enemy.isCloaked) return false;
        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        return dist <= this.stats.range;
      });

      this.target = this.selectBestTarget(validTargets);
    }

    if (this.target) {
      // Smooth turret rotation toward target
      const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      let angleDiff = targetAngle - this.currentAngle;

      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      const rotationSpeed = 14.0; // Fast responsive rotation
      this.currentAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotationSpeed * dt);
      this.headSprite.rotation = this.currentAngle;

      // Fire weapon when cooldown ready
      if (this.cooldown <= 0) {
        this.cooldown = 1 / this.stats.fireRate;
        this.fireWeapon(this.target, potentialTargets, onFireProjectile, onInstantDamage);
      }
    }
  }

  private selectBestTarget(enemies: Enemy[]): Enemy | null {
    if (enemies.length === 0) return null;

    switch (this.targetPriority) {
      case 'FIRST':
        return enemies.reduce((prev, curr) => (curr.totalDistanceTraveled > prev.totalDistanceTraveled ? curr : prev));
      case 'CLOSEST':
        return enemies.reduce((prev, curr) => {
          const dCurr = Math.hypot(curr.x - this.x, curr.y - this.y);
          const dPrev = Math.hypot(prev.x - this.x, prev.y - this.y);
          return dCurr < dPrev ? curr : prev;
        });
      case 'STRONGEST':
        return enemies.reduce((prev, curr) => (curr.hp + curr.shield > prev.hp + prev.shield ? curr : prev));
      case 'WEAKEST':
        return enemies.reduce((prev, curr) => (curr.hp + curr.shield < prev.hp + prev.shield ? curr : prev));
      default:
        return enemies[0];
    }
  }

  private fireWeapon(
    primaryTarget: Enemy,
    allInRange: Enemy[],
    onFireProjectile: (tower: Tower, target: Enemy) => void,
    onInstantDamage: (target: Enemy, dmg: number, armorPen?: number) => void
  ) {
    // Show muzzle flash
    this.muzzleFlashSprite.visible = true;

    switch (this.type) {
      case 'PULSE_CANNON': {
        soundManager.playLaser();
        onFireProjectile(this, primaryTarget);
        break;
      }

      case 'LASER_TOWER': {
        // Continuous hitscan laser beam
        soundManager.playLaser();
        const relX = primaryTarget.x - this.x;
        const relY = primaryTarget.y - this.y;

        this.beamGraphics.clear();
        this.beamGraphics
          .moveTo(0, 0)
          .lineTo(relX, relY)
          .stroke({ width: 3.5, color: 0xf72585, alpha: 0.9 });
        this.beamGraphics
          .moveTo(0, 0)
          .lineTo(relX, relY)
          .stroke({ width: 1.5, color: 0xffffff, alpha: 1.0 });

        this.beamLife = 0.12;

        onInstantDamage(primaryTarget, this.stats.damage, this.stats.armorShred || 0.2);
        this.damageDealt += this.stats.damage;
        break;
      }

      case 'CRYO_TOWER': {
        soundManager.playPlasma();
        onFireProjectile(this, primaryTarget);
        break;
      }

      case 'ARTILLERY_TOWER': {
        soundManager.playPlasma();
        onFireProjectile(this, primaryTarget);
        break;
      }

      case 'RAILGUN': {
        soundManager.playRailgun();
        const maxDist = this.stats.range;
        const dirX = Math.cos(this.currentAngle);
        const dirY = Math.sin(this.currentAngle);
        const endX = dirX * maxDist;
        const endY = dirY * maxDist;

        this.beamGraphics.clear();
        this.beamGraphics
          .moveTo(0, 0)
          .lineTo(endX, endY)
          .stroke({ width: 4.5, color: 0x9d4edd, alpha: 0.9 });
        this.beamGraphics
          .moveTo(0, 0)
          .lineTo(endX, endY)
          .stroke({ width: 2, color: 0xffffff, alpha: 1.0 });

        this.beamLife = 0.15;

        // Pierce through all hostiles along line
        allInRange.forEach((enemy) => {
          if (!enemy.active) return;
          const toEnemyX = enemy.x - this.x;
          const toEnemyY = enemy.y - this.y;
          const projection = toEnemyX * dirX + toEnemyY * dirY;

          if (projection > 0 && projection < maxDist) {
            const perpDist = Math.abs(toEnemyX * dirY - toEnemyY * dirX);
            if (perpDist <= enemy.radius + 10) {
              onInstantDamage(enemy, this.stats.damage, this.stats.armorShred || 0.5);
              this.damageDealt += this.stats.damage;
            }
          }
        });
        break;
      }

      case 'TESLA_COIL': {
        soundManager.playTesla();
        const maxChain = this.stats.chainTargets || 4;
        const chained: Enemy[] = [primaryTarget];
        const visited = new Set<string>([primaryTarget.id]);

        let current = primaryTarget;
        for (let i = 1; i < maxChain; i++) {
          let nextEnemy: Enemy | null = null;
          let bestDist = 130;

          for (const cand of allInRange) {
            if (!visited.has(cand.id) && cand.active) {
              const d = Math.hypot(cand.x - current.x, cand.y - current.y);
              if (d < bestDist) {
                bestDist = d;
                nextEnemy = cand;
              }
            }
          }

          if (nextEnemy) {
            chained.push(nextEnemy);
            visited.add(nextEnemy.id);
            current = nextEnemy;
          } else {
            break;
          }
        }

        // Draw lightning bolt
        this.beamGraphics.clear();
        let prevRelX = 0;
        let prevRelY = 0;

        chained.forEach((target, idx) => {
          const relX = target.x - this.x;
          const relY = target.y - this.y;

          const midX = (prevRelX + relX) / 2 + (Math.random() - 0.5) * 18;
          const midY = (prevRelY + relY) / 2 + (Math.random() - 0.5) * 18;

          this.beamGraphics
            .moveTo(prevRelX, prevRelY)
            .lineTo(midX, midY)
            .lineTo(relX, relY)
            .stroke({ width: 3, color: 0xffd60a, alpha: 0.9 });

          const falloff = Math.pow(0.85, idx);
          const dmg = Math.round(this.stats.damage * falloff);
          onInstantDamage(target, dmg);
          this.damageDealt += dmg;

          prevRelX = relX;
          prevRelY = relY;
        });

        this.beamLife = 0.14;
        break;
      }
    }
  }

  public destroy() {
    this.container.destroy({ children: true });
  }
}
