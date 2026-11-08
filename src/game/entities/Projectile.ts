import { Container, Sprite } from 'pixi.js';
import { Position, TowerType } from '../../types/game';
import { TextureFactory } from '../rendering/TextureFactory';
import { Enemy } from './Enemy';

export interface ProjectileParams {
  towerType: TowerType;
  x: number;
  y: number;
  target: Enemy;
  targetPos: Position;
  damage: number;
  speed: number;
  splashRadius?: number;
  slowEffect?: number;
  slowDuration?: number;
  armorPen?: number;
}

export class Projectile {
  public sprite: Sprite;
  public towerType: TowerType = 'PULSE_CANNON';
  public x: number = 0;
  public y: number = 0;
  public target: Enemy | null = null;
  public targetPos: Position = { x: 0, y: 0 };
  public damage: number = 0;
  public speed: number = 500;
  public splashRadius: number = 0;
  public slowEffect: number = 0;
  public slowDuration: number = 0;
  public armorPen: number = 0;
  public active: boolean = false;
  public life: number = 0;

  constructor(parent: Container) {
    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5);
    parent.addChild(this.sprite);
    this.sprite.visible = false;
  }

  public init(params: ProjectileParams) {
    this.towerType = params.towerType;
    this.x = params.x;
    this.y = params.y;
    this.target = params.target;
    this.targetPos = { ...params.targetPos };
    this.damage = params.damage;
    this.speed = params.speed;
    this.splashRadius = params.splashRadius || 0;
    this.slowEffect = params.slowEffect || 0;
    this.slowDuration = params.slowDuration || 0;
    this.armorPen = params.armorPen || 0;
    this.active = true;
    this.life = 3.5;

    let texKey = `proj_${this.towerType}`;
    this.sprite.texture = TextureFactory.get(texKey);
    this.sprite.position.set(this.x, this.y);
    this.sprite.visible = true;

    const angle = Math.atan2(this.targetPos.y - this.y, this.targetPos.x - this.x);
    this.sprite.rotation = angle;
  }

  public update(dt: number): { hit: boolean; x: number; y: number } | null {
    if (!this.active) return null;

    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      this.sprite.visible = false;
      return null;
    }

    // Direct homing towards moving target if still active
    if (this.target && this.target.active) {
      this.targetPos.x = this.target.x;
      this.targetPos.y = this.target.y;
    }

    const dx = this.targetPos.x - this.x;
    const dy = this.targetPos.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;

    if (dist <= step || dist < 14) {
      this.active = false;
      this.sprite.visible = false;
      return { hit: true, x: this.targetPos.x, y: this.targetPos.y };
    }

    const angle = Math.atan2(dy, dx);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;

    this.sprite.rotation = angle;
    this.sprite.position.set(this.x, this.y);

    return null;
  }
}
