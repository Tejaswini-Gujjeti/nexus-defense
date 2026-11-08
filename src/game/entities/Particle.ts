import { Container, Sprite } from 'pixi.js';
import { TextureFactory } from '../rendering/TextureFactory';

export class Particle {
  public sprite: Sprite;
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public life: number = 0;
  public maxLife: number = 1;
  public startScale: number = 1;
  public endScale: number = 0;
  public rotationSpeed: number = 0;
  public active: boolean = false;

  constructor() {
    this.sprite = new Sprite(TextureFactory.get('particle_spark'));
    this.sprite.anchor.set(0.5);
    this.sprite.visible = false;
  }

  public init(
    x: number,
    y: number,
    vx: number,
    vy: number,
    maxLife: number,
    tint: number = 0xffffff,
    startScale: number = 1,
    endScale: number = 0,
    textureName: string = 'particle_spark'
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = maxLife;
    this.maxLife = maxLife;
    this.startScale = startScale;
    this.endScale = endScale;
    this.rotationSpeed = (Math.random() - 0.5) * 8;
    this.active = true;

    this.sprite.texture = TextureFactory.get(textureName);
    this.sprite.tint = tint;
    this.sprite.position.set(x, y);
    this.sprite.scale.set(startScale);
    this.sprite.alpha = 1;
    this.sprite.visible = true;
  }

  public update(dt: number): boolean {
    if (!this.active) return false;

    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      this.sprite.visible = false;
      return false;
    }

    const progress = 1 - this.life / this.maxLife;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Apply slight friction
    this.vx *= 0.96;
    this.vy *= 0.96;

    this.sprite.position.set(this.x, this.y);
    this.sprite.rotation += this.rotationSpeed * dt;

    const currentScale = this.startScale + (this.endScale - this.startScale) * progress;
    this.sprite.scale.set(currentScale);
    this.sprite.alpha = 1 - progress;

    return true;
  }
}

export class ParticleManager {
  private particles: Particle[] = [];
  private container: Container;

  constructor(parent: Container, capacity: number = 250) {
    this.container = new Container();
    parent.addChild(this.container);

    for (let i = 0; i < capacity; i++) {
      const p = new Particle();
      this.container.addChild(p.sprite);
      this.particles.push(p);
    }
  }

  public spawnExplosion(x: number, y: number, color: number = 0xff6b35, count: number = 16) {
    let spawned = 0;
    for (const p of this.particles) {
      if (!p.active) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 180;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const life = 0.3 + Math.random() * 0.4;
        p.init(x, y, vx, vy, life, color, 0.9 + Math.random() * 0.5, 0.1);
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  public spawnSparks(x: number, y: number, color: number = 0x00e5ff, count: number = 8) {
    let spawned = 0;
    for (const p of this.particles) {
      if (!p.active) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 200;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const life = 0.15 + Math.random() * 0.25;
        p.init(x, y, vx, vy, life, color, 0.7, 0.05);
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  public spawnShockwave(x: number, y: number, color: number = 0x00e5ff) {
    for (const p of this.particles) {
      if (!p.active) {
        p.init(x, y, 0, 0, 0.4, color, 0.2, 1.8, 'vfx_ring');
        break;
      }
    }
  }

  public update(dt: number) {
    for (const p of this.particles) {
      if (p.active) {
        p.update(dt);
      }
    }
  }

  public clear() {
    for (const p of this.particles) {
      p.active = false;
      p.sprite.visible = false;
    }
  }
}
