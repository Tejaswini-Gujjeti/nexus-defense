import { Texture } from 'pixi.js';
import { TowerType, EnemyType } from '../../types/game';

export class TextureFactory {
  private static textures: Map<string, Texture> = new Map();

  private static createCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  }

  public static get(name: string): Texture {
    const tex = this.textures.get(name);
    if (!tex) {
      console.warn(`Texture ${name} not found!`);
      return Texture.WHITE;
    }
    return tex;
  }

  public static initAll(): void {
    if (this.textures.size > 0) return;

    this.createTileTextures();
    this.createTowerTextures();
    this.createEnemyTextures();
    this.createProjectileTextures();
    this.createVFXTextures();
    this.createNexusAndSpawnTextures();
  }

  private static createTileTextures(): void {
    // 1. Grid empty tile
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      ctx.fillStyle = '#070b16';
      ctx.fillRect(0, 0, 48, 48);
      ctx.strokeStyle = '#121b2d';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 47, 47);

      // Sci-fi circuit corner notches
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.lineWidth = 1.5;
      const m = 5;
      ctx.beginPath();
      ctx.moveTo(1, m); ctx.lineTo(1, 1); ctx.lineTo(m, 1);
      ctx.moveTo(47 - m, 1); ctx.lineTo(47, 1); ctx.lineTo(47, m);
      ctx.moveTo(1, 47 - m); ctx.lineTo(1, 47); ctx.lineTo(m, 47);
      ctx.moveTo(47 - m, 47); ctx.lineTo(47, 47); ctx.lineTo(47, 47 - m);
      ctx.stroke();

      this.textures.set('tile_empty', Texture.from(canvas));
    }

    // 2. Path tile
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 48, 48);

      // Glowing energy runway
      const grad = ctx.createLinearGradient(0, 0, 48, 48);
      grad.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
      grad.addColorStop(0.5, 'rgba(0, 229, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 229, 255, 0.08)');
      ctx.fillStyle = grad;
      ctx.fillRect(6, 6, 36, 36);

      // Cyber runway markers
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, 44, 44);

      this.textures.set('tile_path', Texture.from(canvas));
    }

    // 3. Blocked obstacle tile
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      ctx.fillStyle = '#0e1422';
      ctx.fillRect(0, 0, 48, 48);

      // Hazard industrial stripes
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(3, 3, 42, 42);

      ctx.beginPath();
      ctx.moveTo(8, 8); ctx.lineTo(40, 40);
      ctx.moveTo(40, 8); ctx.lineTo(8, 40);
      ctx.stroke();

      this.textures.set('tile_blocked', Texture.from(canvas));
    }
  }

  private static createTowerTextures(): void {
    // 1. Common Base (Levels 1, 2, 3)
    [1, 2, 3].forEach((lvl) => {
      const { canvas, ctx } = this.createCanvas(48, 48);
      ctx.translate(24, 24);

      // Outer fortified chassis
      ctx.fillStyle = lvl === 3 ? '#1e1b4b' : lvl === 2 ? '#162035' : '#0f172a';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = 21;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Glowing perimeter ring
      ctx.strokeStyle = lvl === 3 ? '#c084fc' : lvl === 2 ? '#38bdf8' : '#00e5ff';
      ctx.lineWidth = lvl === 3 ? 2.5 : 2;
      ctx.stroke();

      // Central turret socket
      ctx.fillStyle = '#060913';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      this.textures.set(`tower_base_${lvl}`, Texture.from(canvas));
    });

    // 2. Turret Heads across Levels 1, 2, 3
    const towerTypes: TowerType[] = [
      'PULSE_CANNON',
      'LASER_TOWER',
      'CRYO_TOWER',
      'ARTILLERY_TOWER',
      'RAILGUN',
      'TESLA_COIL',
    ];

    towerTypes.forEach((type) => {
      [1, 2, 3].forEach((lvl) => {
        const { canvas, ctx } = this.createCanvas(48, 48);
        ctx.translate(24, 24);

        switch (type) {
          case 'PULSE_CANNON': {
            // Rotating auto-cannon
            ctx.fillStyle = '#082f49';
            ctx.beginPath();
            ctx.arc(0, 0, 9 + lvl, 0, Math.PI * 2);
            ctx.fill();

            // Barrels
            ctx.fillStyle = '#00e5ff';
            if (lvl === 1) {
              ctx.fillRect(4, -3, 14, 6);
            } else if (lvl === 2) {
              ctx.fillRect(4, -6, 16, 4);
              ctx.fillRect(4, 2, 16, 4);
            } else {
              // Quad vulcan
              ctx.fillRect(4, -8, 18, 3.5);
              ctx.fillRect(4, -3, 18, 3.5);
              ctx.fillRect(4, 2, 18, 3.5);
              ctx.fillRect(4, 7, 18, 3.5);
            }

            // Core capacitor
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-2, 0, 3 + lvl * 0.5, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case 'LASER_TOWER': {
            // Precision prism emitter
            ctx.fillStyle = '#4c0519';
            ctx.beginPath();
            ctx.arc(0, 0, 9 + lvl, 0, Math.PI * 2);
            ctx.fill();

            // Laser projector
            ctx.fillStyle = '#f72585';
            ctx.beginPath();
            ctx.moveTo(3, -5 - lvl);
            ctx.lineTo(16 + lvl * 2, 0);
            ctx.lineTo(3, 5 + lvl);
            ctx.closePath();
            ctx.fill();

            // Ruby lens tip
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(16 + lvl * 2, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case 'CRYO_TOWER': {
            // Sub-zero dish
            ctx.fillStyle = '#082f49';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            // Crystal emitter dish
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(6, 0, 7 + lvl * 2, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(6, 0);
            ctx.closePath();
            ctx.fill();

            // Frost pulse rings
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(6, 0, 9 + lvl * 2, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
            break;
          }

          case 'ARTILLERY_TOWER': {
            // Heavy siege chassis
            ctx.fillStyle = '#431407';
            ctx.fillRect(-8, -8, 16, 16);

            // Mortar cannon
            ctx.fillStyle = '#ff6b35';
            if (lvl === 1) {
              ctx.fillRect(4, -5, 14, 10);
            } else if (lvl === 2) {
              ctx.fillRect(4, -7, 16, 6);
              ctx.fillRect(4, 1, 16, 6);
            } else {
              // Heavy thermonuclear siege bore
              ctx.fillRect(4, -8, 18, 16);
              ctx.fillStyle = '#f97316';
              ctx.fillRect(18, -9, 4, 18);
            }
            break;
          }

          case 'RAILGUN': {
            // Accelerator base
            ctx.fillStyle = '#2e1065';
            ctx.fillRect(-10, -7, 18, 14);

            // Long magnetic rails
            ctx.fillStyle = '#9d4edd';
            ctx.fillRect(0, -6, 20 + lvl * 3, 3);
            ctx.fillRect(0, 3, 20 + lvl * 3, 3);

            // Relativistic coils
            ctx.fillStyle = '#d8b4fe';
            for (let c = 0; c < 2 + lvl; c++) {
              ctx.fillRect(6 + c * 6, -7, 3, 14);
            }
            break;
          }

          case 'TESLA_COIL': {
            // Tesla generator sphere
            ctx.fillStyle = '#422006';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            // Gold emitter
            ctx.fillStyle = '#ffd60a';
            ctx.beginPath();
            ctx.arc(5, 0, 6 + lvl * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Arc prongs
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(8, -6); ctx.lineTo(16 + lvl, -10);
            ctx.moveTo(11, 0); ctx.lineTo(19 + lvl, 0);
            ctx.moveTo(8, 6); ctx.lineTo(16 + lvl, 10);
            ctx.stroke();
            break;
          }
        }

        this.textures.set(`turret_${type}_${lvl}`, Texture.from(canvas));
      });
    });
  }

  private static createEnemyTextures(): void {
    const enemies: EnemyType[] = ['SCOUT', 'GRUNT', 'TANK', 'SWARM', 'BOSS'];

    enemies.forEach((type) => {
      let size = 48;
      if (type === 'BOSS') size = 80;
      if (type === 'TANK') size = 56;
      if (type === 'SWARM') size = 36;

      const { canvas, ctx } = this.createCanvas(size, size);
      const center = size / 2;
      ctx.translate(center, center);

      switch (type) {
        case 'SCOUT': {
          // Viper Scout: aerodynamic needle-dart
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(15, 0);
          ctx.lineTo(-12, -9);
          ctx.lineTo(-7, 0);
          ctx.lineTo(-12, 9);
          ctx.closePath();
          ctx.fill();

          // Afterburner
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(-8, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'GRUNT': {
          // Cyber Grunt: standard battle chassis
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(2, -12);
          ctx.lineTo(-12, -8);
          ctx.lineTo(-8, 0);
          ctx.lineTo(-12, 8);
          ctx.lineTo(2, 12);
          ctx.closePath();
          ctx.fill();

          // Visor sensor
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(4, -3, 6, 6);
          break;
        }

        case 'TANK': {
          // Ironclad Juggernaut: quad-track fortress
          ctx.fillStyle = '#334155';
          ctx.fillRect(-18, -14, 36, 28);

          // Armored composite plates
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-14, -11, 28, 22);

          // Heavy reinforced turret head
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-6, -6, 16, 12);

          // Red targeting optic
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(8, -2.5, 6, 5);
          break;
        }

        case 'SWARM': {
          // Nanite Swarm drone: crystalline cluster
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(10, 0);
          ctx.lineTo(0, -8);
          ctx.lineTo(-10, 0);
          ctx.lineTo(0, 8);
          ctx.closePath();
          ctx.fill();

          // Core pulse
          ctx.fillStyle = '#a7f3d0';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'BOSS': {
          // Omega Dreadnought Titan: colossal capital starship
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.moveTo(34, 0);
          ctx.lineTo(14, -26);
          ctx.lineTo(-28, -24);
          ctx.lineTo(-20, 0);
          ctx.lineTo(-28, 24);
          ctx.lineTo(14, 26);
          ctx.closePath();
          ctx.fill();

          // Reinforced energy shields border
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Dual power reactors
          ctx.fillStyle = '#9333ea';
          ctx.beginPath();
          ctx.arc(-8, -11, 8, 0, Math.PI * 2);
          ctx.arc(-8, 11, 8, 0, Math.PI * 2);
          ctx.fill();

          // Command bridge
          ctx.fillStyle = '#ffd60a';
          ctx.beginPath();
          ctx.arc(10, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      this.textures.set(`enemy_${type}`, Texture.from(canvas));
    });
  }

  private static createProjectileTextures(): void {
    // 1. Cyan pulse bolt
    {
      const { canvas, ctx } = this.createCanvas(24, 8);
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.ellipse(12, 4, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(12, 4, 5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      this.textures.set('proj_PULSE_CANNON', Texture.from(canvas));
    }

    // 2. Ruby laser bolt
    {
      const { canvas, ctx } = this.createCanvas(24, 8);
      ctx.fillStyle = '#f72585';
      ctx.beginPath();
      ctx.ellipse(12, 4, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(12, 4, 5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      this.textures.set('proj_LASER_TOWER', Texture.from(canvas));
    }

    // 3. Cryo ice shard
    {
      const { canvas, ctx } = this.createCanvas(18, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(9, 1); ctx.lineTo(17, 9); ctx.lineTo(9, 17); ctx.lineTo(1, 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(9, 9, 3, 0, Math.PI * 2);
      ctx.fill();
      this.textures.set('proj_CRYO_TOWER', Texture.from(canvas));
    }

    // 4. Heavy artillery shell
    {
      const { canvas, ctx } = this.createCanvas(22, 12);
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath();
      ctx.moveTo(18, 6);
      ctx.lineTo(2, 2);
      ctx.lineTo(6, 6);
      ctx.lineTo(2, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd60a';
      ctx.fillRect(0, 5, 3, 2);
      this.textures.set('proj_ARTILLERY_TOWER', Texture.from(canvas));
    }

    // 5. Relativistic rail slug
    {
      const { canvas, ctx } = this.createCanvas(28, 8);
      ctx.fillStyle = '#9d4edd';
      ctx.fillRect(0, 2, 28, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 3, 16, 2);
      this.textures.set('proj_RAILGUN', Texture.from(canvas));
    }
  }

  private static createVFXTextures(): void {
    // 1. Spark
    {
      const { canvas, ctx } = this.createCanvas(16, 16);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(8, 0); ctx.lineTo(10, 6); ctx.lineTo(16, 8); ctx.lineTo(10, 10);
      ctx.lineTo(8, 16); ctx.lineTo(6, 10); ctx.lineTo(0, 8); ctx.lineTo(6, 6);
      ctx.closePath();
      ctx.fill();
      this.textures.set('particle_spark', Texture.from(canvas));
    }

    // 2. Shockwave ring
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, Math.PI * 2);
      ctx.stroke();
      this.textures.set('vfx_ring', Texture.from(canvas));
    }

    // 3. Shield bubble
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      const rad = ctx.createRadialGradient(32, 32, 16, 32, 32, 30);
      rad.addColorStop(0, 'rgba(0, 229, 255, 0.05)');
      rad.addColorStop(0.8, 'rgba(0, 229, 255, 0.35)');
      rad.addColorStop(1, 'rgba(0, 229, 255, 0.85)');
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();
      this.textures.set('vfx_shield', Texture.from(canvas));
    }
  }

  private static createNexusAndSpawnTextures(): void {
    // Nexus Core
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      ctx.translate(32, 32);

      // Multi-layer reactor
      ctx.fillStyle = '#060d1f';
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();

      const rad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
      rad.addColorStop(0, '#ffffff');
      rad.addColorStop(0.4, '#00e5ff');
      rad.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      this.textures.set('nexus_core', Texture.from(canvas));
    }

    // Spawn Portal
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      ctx.translate(32, 32);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();

      const rad = ctx.createRadialGradient(0, 0, 3, 0, 0, 20);
      rad.addColorStop(0, '#ff0055');
      rad.addColorStop(0.6, '#450a0a');
      rad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      this.textures.set('spawn_portal', Texture.from(canvas));
    }
  }
}
