import { Container, Text, TextStyle } from 'pixi.js';

export class FloatingText {
  public text: Text;
  public x: number = 0;
  public y: number = 0;
  public vy: number = -35;
  public life: number = 0;
  public maxLife: number = 0.8;
  public active: boolean = false;

  constructor() {
    const style = new TextStyle({
      fontFamily: 'Orbitron, sans-serif',
      fontSize: 12,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#000000', width: 2 },
    });
    this.text = new Text({ text: '', style });
    this.text.anchor.set(0.5);
    this.text.visible = false;
  }

  public init(x: number, y: number, content: string, color: string = '#ffffff', fontSize: number = 12) {
    this.x = x + (Math.random() - 0.5) * 12;
    this.y = y - 10;
    this.life = 0.8;
    this.maxLife = 0.8;
    this.active = true;

    this.text.text = content;
    this.text.style.fill = color;
    this.text.style.fontSize = fontSize;
    this.text.position.set(this.x, this.y);
    this.text.alpha = 1;
    this.text.scale.set(1);
    this.text.visible = true;
  }

  public update(dt: number): boolean {
    if (!this.active) return false;

    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      this.text.visible = false;
      return false;
    }

    const progress = 1 - this.life / this.maxLife;
    this.y += this.vy * dt;
    this.text.position.set(this.x, this.y);
    this.text.alpha = 1 - progress * progress;

    if (progress < 0.2) {
      this.text.scale.set(1 + progress * 1.5);
    } else {
      this.text.scale.set(1.3 - (progress - 0.2) * 0.3);
    }

    return true;
  }
}

export class FloatingTextManager {
  private items: FloatingText[] = [];
  private container: Container;

  constructor(parent: Container, capacity: number = 40) {
    this.container = new Container();
    parent.addChild(this.container);

    for (let i = 0; i < capacity; i++) {
      const item = new FloatingText();
      this.container.addChild(item.text);
      this.items.push(item);
    }
  }

  public spawn(x: number, y: number, text: string, color: string = '#ffffff', fontSize: number = 12) {
    for (const item of this.items) {
      if (!item.active) {
        item.init(x, y, text, color, fontSize);
        break;
      }
    }
  }

  public update(dt: number) {
    for (const item of this.items) {
      if (item.active) {
        item.update(dt);
      }
    }
  }

  public clear() {
    for (const item of this.items) {
      item.active = false;
      item.text.visible = false;
    }
  }
}
