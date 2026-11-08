import React, { useEffect, useRef, useState } from 'react';
import { Application, Graphics } from 'pixi.js';
import { GameEngine } from '../game/core/GameEngine';
import { TextureFactory } from '../game/rendering/TextureFactory';
import { TowerType } from '../types/game';
import { TOWER_CONFIGS } from '../game/entities/TowerConfig';

interface GameCanvasProps {
  engineRef: React.MutableRefObject<GameEngine | null>;
  selectedBuildType: TowerType | null;
  activeTacticalAbility: string | null;
  credits: number;
  onClearBuildSelection: () => void;
  onClearTacticalSelection: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engineRef,
  selectedBuildType,
  activeTacticalAbility,
  credits,
  onClearBuildSelection,
  onClearTacticalSelection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // References for placement preview
  const hoverGraphicsRef = useRef<Graphics | null>(null);

  useEffect(() => {
    let app: Application | null = null;
    let isMounted = true;

    async function initPixi() {
      if (!containerRef.current) return;

      // Initialize Pixi v8 Application
      app = new Application();
      await app.init({
        width: 1200,
        height: 720,
        backgroundColor: 0x060913,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (!isMounted) {
        app.destroy(true, { children: true });
        return;
      }

      // Initialize Procedural Texture Factory
      TextureFactory.initAll();

      // Initialize Game Engine
      const engine = new GameEngine(app);
      engineRef.current = engine;

      // Overlay hover/preview graphics layer
      const hoverGfx = new Graphics();
      app.stage.addChild(hoverGfx);
      hoverGraphicsRef.current = hoverGfx;

      // Append Pixi canvas to container
      containerRef.current.appendChild(app.canvas);
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.display = 'block';

      // Start ticker
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime / 60; // Delta time in seconds
        engine.update(dt);
      });

      setIsReady(true);
    }

    initPixi();

    return () => {
      isMounted = false;
      if (app) {
        try {
          app.destroy(true, { children: true });
        } catch (e) {}
      }
      engineRef.current = null;
    };
  }, []);

  // Mouse coordinate converter
  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0, col: 0, row: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = 1200 / rect.width;
    const scaleY = 720 / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(x / 48);
    const row = Math.floor(y / 48);

    return { x, y, col, row };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const gfx = hoverGraphicsRef.current;
    const engine = engineRef.current;
    if (!gfx || !engine) return;

    gfx.clear();
    const { x, y, col, row } = getCanvasCoords(e);

    // 1. Tower Placement Preview
    if (selectedBuildType) {
      const config = TOWER_CONFIGS[selectedBuildType];
      const isBuildable = engine.isCellBuildable(col, row);
      const canAfford = credits >= config.baseCost;
      const isValid = isBuildable && canAfford;

      const strokeColor = isValid ? 0x00ff88 : 0xef4444;
      const fillColor = isValid ? 0x00ff88 : 0xef4444;

      // Tile cursor box
      gfx
        .rect(col * 48, row * 48, 48, 48)
        .fill({ color: fillColor, alpha: 0.2 })
        .stroke({ width: 2, color: strokeColor, alpha: 0.8 });

      // Range preview circle
      gfx
        .circle(col * 48 + 24, row * 48 + 24, config.levels[0].stats.range)
        .fill({ color: config.color, alpha: 0.08 })
        .stroke({ width: 1.5, color: config.color, alpha: 0.5 });
    }
    // 2. Tactical Ability Reticle Preview
    else if (activeTacticalAbility) {
      const ability = engine.tacticalAbilities.find((a) => a.id === activeTacticalAbility);
      if (ability && ability.radius > 0) {
        gfx
          .circle(x, y, ability.radius)
          .fill({ color: 0xff0055, alpha: 0.15 })
          .stroke({ width: 2, color: 0xff0055, alpha: 0.8 });

        // Reticle crosshair
        gfx
          .moveTo(x - 20, y).lineTo(x + 20, y)
          .moveTo(x, y - 20).lineTo(x, y + 20)
          .stroke({ width: 1.5, color: 0xffffff, alpha: 0.9 });
      }
    }
  };

  const handleMouseLeave = () => {
    if (hoverGraphicsRef.current) {
      hoverGraphicsRef.current.clear();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const engine = engineRef.current;
    if (!engine) return;

    const { x, y, col, row } = getCanvasCoords(e);

    // 1. Tactical Ability deployment
    if (activeTacticalAbility) {
      engine.activateTacticalAbility(activeTacticalAbility, x, y);
      onClearTacticalSelection();
      if (hoverGraphicsRef.current) hoverGraphicsRef.current.clear();
      return;
    }

    // 2. Tower Building
    if (selectedBuildType) {
      const built = engine.buildTower(selectedBuildType, col, row);
      if (built) {
        onClearBuildSelection();
        if (hoverGraphicsRef.current) hoverGraphicsRef.current.clear();
      }
      return;
    }

    // 3. Tower Selection / Deselection
    const tower = engine.towers.get(`${col},${row}`);
    if (tower) {
      engine.selectTower(tower);
    } else {
      engine.deselectTower();
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="relative w-full h-full aspect-[5/3] max-w-[1400px] max-h-[840px] border border-cyber-border/70 rounded-xl overflow-hidden shadow-2xl cursor-crosshair bg-cyber-dark"
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-cyber-dark text-cyan-400 font-orbitron text-sm">
          INITIALIZING NEURAL DEFENSE GRID...
        </div>
      )}
    </div>
  );
};
