import { Container, Graphics, Sprite } from 'pixi.js';
import { EnemyStats, EnemyType, Position } from '../../types/game';
import { ENEMY_CONFIGS } from './EnemyConfig';
import { TextureFactory } from '../rendering/TextureFactory';
import { SpatialEntity } from '../core/SpatialHash';

export class Enemy implements SpatialEntity {
  public id: string;
  public type: EnemyType;
  public x: number = 0;
  public y: number = 0;
  public radius: number = 18;
  public active: boolean = false;

  // Stats
  public stats: EnemyStats;
  public hp: number = 0;
  public shield: number = 0;
  public speed: number = 0;
  public baseSpeed: number = 0;
  public armor: number = 0;

  // Waypoint progression
  public waypoints: Position[] = [];
  public currentWaypointIndex: number = 0;
  public totalDistanceTraveled: number = 0;

  // Status effects
  public slowMultiplier: number = 1.0;
  public slowTimer: number = 0;
  public armorShred: number = 0;
  public empTimer: number = 0;
  public hitFlashTimer: number = 0;
  public isCloaked: boolean = false;

  // Pixi Display Objects
  public container: Container;
  public sprite: Sprite;
  public shieldSprite: Sprite;
  public barGraphics: Graphics;

  constructor(parent: Container) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.type = 'SCOUT';
    this.stats = { ...ENEMY_CONFIGS.SCOUT.stats };

    this.container = new Container();
    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5);

    this.shieldSprite = new Sprite();
    this.shieldSprite.anchor.set(0.5);
    this.shieldSprite.visible = false;

    this.barGraphics = new Graphics();

    this.container.addChild(this.sprite);
    this.container.addChild(this.shieldSprite);
    this.container.addChild(this.barGraphics);

    parent.addChild(this.container);
    this.container.visible = false;
  }

  public init(
    type: EnemyType,
    waypoints: Position[],
    hpMultiplier: number = 1.0,
    speedMultiplier: number = 1.0
  ) {
    this.id = `enemy_${type}_${Math.random().toString(36).substring(2, 7)}`;
    this.type = type;
    const baseStats = ENEMY_CONFIGS[type].stats;
    this.stats = {
      ...baseStats,
      maxHp: Math.round(baseStats.maxHp * hpMultiplier),
      maxShield: Math.round(baseStats.maxShield * hpMultiplier),
      speed: baseStats.speed * speedMultiplier,
    };

    this.hp = this.stats.maxHp;
    this.shield = this.stats.maxShield;
    this.speed = this.stats.speed;
    this.baseSpeed = this.stats.speed;
    this.armor = this.stats.armor;

    this.waypoints = waypoints;
    this.currentWaypointIndex = 1;
    this.totalDistanceTraveled = 0;

    this.slowMultiplier = 1.0;
    this.slowTimer = 0;
    this.armorShred = 0;
    this.empTimer = 0;
    this.hitFlashTimer = 0;
    this.isCloaked = false;

    if (waypoints.length > 0) {
      this.x = waypoints[0].x;
      this.y = waypoints[0].y;
    }

    if (type === 'BOSS') this.radius = 36;
    else if (type === 'TANK') this.radius = 26;
    else if (type === 'SWARM') this.radius = 14;
    else this.radius = 18;

    this.sprite.texture = TextureFactory.get(`enemy_${type}`);
    this.sprite.tint = 0xffffff;
    this.shieldSprite.texture = TextureFactory.get('vfx_shield');
    this.shieldSprite.scale.set((this.radius * 2.3) / 64);

    this.container.position.set(this.x, this.y);
    this.container.visible = true;
    this.active = true;

    this.updateHealthBar();
  }

  public update(dt: number): 'ALIVE' | 'DEAD' | 'REACHED_NEXUS' {
    if (!dt || !this.active) return 'DEAD';

    // Hit flash decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (this.hitFlashTimer <= 0) {
        this.sprite.tint = 0xffffff;
      }
    }

    // EMP stun
    if (this.empTimer > 0) {
      this.empTimer -= dt;
      this.updateHealthBar();
      return 'ALIVE';
    }

    // Slow effect decay
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowMultiplier = 1.0;
      }
    }

    // Shield passive regeneration
    if (this.stats.maxShield > 0 && this.shield < this.stats.maxShield) {
      this.shield = Math.min(this.stats.maxShield, this.shield + this.stats.shieldRegenRate * dt);
    }

    // Waypoint movement
    const targetWp = this.waypoints[this.currentWaypointIndex];
    if (!targetWp) {
      return 'REACHED_NEXUS';
    }

    const dx = targetWp.x - this.x;
    const dy = targetWp.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Face travel direction
    const angle = Math.atan2(dy, dx);
    this.sprite.rotation = angle;

    const currentSpeed = this.baseSpeed * this.slowMultiplier;
    const step = currentSpeed * dt;

    if (dist <= step) {
      this.x = targetWp.x;
      this.y = targetWp.y;
      this.totalDistanceTraveled += dist;
      this.currentWaypointIndex++;

      if (this.currentWaypointIndex >= this.waypoints.length) {
        return 'REACHED_NEXUS';
      }
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      this.totalDistanceTraveled += step;
    }

    this.container.position.set(this.x, this.y);

    // Update shield bubble
    if (this.shield > 0) {
      this.shieldSprite.visible = true;
      this.shieldSprite.alpha = 0.5 + (this.shield / this.stats.maxShield) * 0.45;
    } else {
      this.shieldSprite.visible = false;
    }

    this.updateHealthBar();
    return 'ALIVE';
  }

  public takeDamage(amount: number, armorPen: number = 0): { effectiveDmg: number; killed: boolean } {
    let dmg = amount;

    // Flash white on hit
    this.hitFlashTimer = 0.08;
    this.sprite.tint = 0xffffff;

    // 1. Energy Shield absorbs first
    if (this.shield > 0) {
      if (this.shield >= dmg) {
        this.shield -= dmg;
        dmg = 0;
      } else {
        dmg -= this.shield;
        this.shield = 0;
      }
    }

    // 2. Armor mitigation
    if (dmg > 0) {
      const effectiveArmor = Math.max(0, (this.armor - armorPen) * (1 - this.armorShred));
      const reducedDmg = dmg * (1 - effectiveArmor);
      this.hp -= reducedDmg;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      return { effectiveDmg: amount, killed: true };
    }

    this.updateHealthBar();
    return { effectiveDmg: amount, killed: false };
  }

  public applySlow(factor: number, duration: number) {
    if (factor < this.slowMultiplier) {
      this.slowMultiplier = factor;
    }
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  public applyEMP(duration: number) {
    this.empTimer = Math.max(this.empTimer, duration);
    this.shield = 0; // Instantly discharges shields
  }

  private updateHealthBar() {
    this.barGraphics.clear();

    const w = this.radius * 2;
    const h = 4;
    const yOff = -this.radius - 8;

    // Bar background
    this.barGraphics.rect(-w / 2, yOff, w, h).fill({ color: 0x070b16, alpha: 0.85 });

    // Health ratio
    const hpRatio = Math.max(0, Math.min(1, this.hp / this.stats.maxHp));
    const hpColor = hpRatio > 0.5 ? 0x00ff88 : hpRatio > 0.25 ? 0xffd60a : 0xff0055;
    this.barGraphics.rect(-w / 2, yOff, w * hpRatio, h).fill({ color: hpColor });

    // Shield ratio
    if (this.stats.maxShield > 0) {
      const shieldRatio = Math.max(0, Math.min(1, this.shield / this.stats.maxShield));
      this.barGraphics.rect(-w / 2, yOff - 3, w * shieldRatio, 2).fill({ color: 0x00e5ff });
    }
  }

  public destroy() {
    this.active = false;
    this.container.visible = false;
  }
}
