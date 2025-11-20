import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRAVITY, 
  JUMP_FORCE, 
  MOVE_SPEED, 
  PLAYER_WIDTH, 
  PLAYER_HEIGHT,
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
  PLATFORM_GAP_MIN,
  PLATFORM_GAP_MAX,
  PLATFORM_SPEED_BASE,
  PLATFORM_SPEED_INC,
  SPIKE_DAMAGE,
  CEILING_DAMAGE,
  BOUNCE_FORCE,
  PLATFORM_TYPES_DISTRIBUTION,
  INITIAL_HP,
  FRICTION,
  MAX_FALL_SPEED,
  KEY_CODES
} from '../constants';
import { Player, Platform, PlatformType, GameState } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (players: Player[], duration: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p1Health, setP1Health] = useState(INITIAL_HP);
  const [p2Health, setP2Health] = useState(INITIAL_HP);
  const [score, setScore] = useState(0);
  
  // Game Loop Refs (to avoid closure staleness in loop)
  const playersRef = useRef<Player[]>([]);
  const platformsRef = useRef<Platform[]>([]);
  const keysPressedRef = useRef<Set<string>>(new Set());
  const frameIdRef = useRef<number>(0);
  const difficultyMultiplierRef = useRef<number>(1);
  const startTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  const generatePlatform = (y: number): Platform => {
    // Weighted random type
    const totalWeight = PLATFORM_TYPES_DISTRIBUTION.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let type = PlatformType.NORMAL;
    
    for (const item of PLATFORM_TYPES_DISTRIBUTION) {
      random -= item.weight;
      if (random <= 0) {
        type = item.type;
        break;
      }
    }

    return {
      id: Math.random(),
      x: Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH),
      y: y,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type: type,
    };
  };

  const initGame = useCallback(() => {
    playersRef.current = [
      {
        id: 1,
        name: 'Player 1',
        x: CANVAS_WIDTH / 3 - PLAYER_WIDTH / 2,
        y: 100,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        vx: 0,
        vy: 0,
        hp: INITIAL_HP,
        maxHp: INITIAL_HP,
        score: 0,
        isDead: false,
        color: '#3b82f6', // Blue
        controls: { left: [KEY_CODES.P1_LEFT], right: [KEY_CODES.P1_RIGHT] },
      },
      {
        id: 2,
        name: 'Player 2',
        x: (CANVAS_WIDTH / 3) * 2 - PLAYER_WIDTH / 2,
        y: 100,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        vx: 0,
        vy: 0,
        hp: INITIAL_HP,
        maxHp: INITIAL_HP,
        score: 0,
        isDead: false,
        color: '#ef4444', // Red
        controls: { left: [KEY_CODES.P2_LEFT], right: [KEY_CODES.P2_RIGHT] },
      },
    ];

    // Initial platforms
    platformsRef.current = [];
    for (let i = 0; i < 7; i++) {
      platformsRef.current.push({
        id: Math.random(),
        x: Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH),
        y: 200 + i * 100,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: PlatformType.NORMAL, // Start safe
      });
    }

    difficultyMultiplierRef.current = 1;
    startTimeRef.current = Date.now();
    isRunningRef.current = true;
    setP1Health(INITIAL_HP);
    setP2Health(INITIAL_HP);
    setScore(0);
  }, []);

  const update = () => {
    if (!isRunningRef.current) return;

    const currentSpeed = PLATFORM_SPEED_BASE + (difficultyMultiplierRef.current * 0.5);
    difficultyMultiplierRef.current += PLATFORM_SPEED_INC;

    // 1. Update Platforms
    platformsRef.current.forEach(p => p.y -= currentSpeed);
    
    // Remove platforms off top
    platformsRef.current = platformsRef.current.filter(p => p.y + p.height > 0);

    // Add new platforms at bottom
    const lastPlatform = platformsRef.current[platformsRef.current.length - 1];
    if (lastPlatform && lastPlatform.y < CANVAS_HEIGHT - PLATFORM_GAP_MIN) {
      const gap = PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
      platformsRef.current.push(generatePlatform(CANVAS_HEIGHT + gap));
    }

    // 2. Update Players
    let activePlayers = 0;

    playersRef.current.forEach(player => {
      if (player.isDead) return;
      activePlayers++;

      // Input X
      if (player.controls.left.some(k => keysPressedRef.current.has(k))) {
        player.vx = -MOVE_SPEED;
      } else if (player.controls.right.some(k => keysPressedRef.current.has(k))) {
        player.vx = MOVE_SPEED;
      } else {
        player.vx *= FRICTION; // Friction
      }

      // Physics Y
      player.vy += GRAVITY;
      if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

      player.x += player.vx;
      player.y += player.vy;

      // Wall collisions
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > CANVAS_WIDTH) player.x = CANVAS_WIDTH - player.width;

      // Ceiling collision (Spikes at y=0)
      if (player.y < 20) { // Top spike zone
        player.hp -= CEILING_DAMAGE;
        player.lastDamageSource = "Ceiling Spikes";
        // Force push down slightly
        player.y = 20;
        player.vy = 1; 
      }

      // Floor collision (Death)
      if (player.y > CANVAS_HEIGHT) {
        player.hp = 0;
        player.lastDamageSource = "The Void";
      }

      // Platform Collisions
      let onPlatform = false;
      
      // Only check collision if falling down
      if (player.vy > 0) {
        for (const plat of platformsRef.current) {
          if (
            player.x + player.width > plat.x + 5 && // Allow slight edge forgiveness
            player.x < plat.x + plat.width - 5 &&
            player.y + player.height >= plat.y &&
            player.y + player.height <= plat.y + plat.height + player.vy + 2 // Tuned collision depth
          ) {
            // Landed!
            player.y = plat.y - player.height;
            player.vy = -currentSpeed; // Stick to moving platform
            onPlatform = true;

            // Apply Platform Effects
            if (plat.type === PlatformType.SPIKE) {
              player.hp -= 1; // Continuous damage while standing
              player.lastDamageSource = "Spike Platform";
            } else if (plat.type === PlatformType.BOUNCY) {
              player.vy = BOUNCE_FORCE;
              onPlatform = false; // Don't stick
            } else if (plat.type === PlatformType.BREAKABLE) {
                if (!plat.touched) {
                    plat.touched = true; // Visual cue or delayed break could go here
                    // For now, instant break logic handled by filtering later? 
                    // Actually, simpler: make it a normal platform that disappears quickly.
                    // Let's just bounce them slightly and remove platform?
                    // Or standard NS-Shaft style: you stand, it breaks after X ms.
                    // Implementing instant break for simplicity -> turned to 'ghost' platform
                }
            } else if (plat.type === PlatformType.LEFT_CONVEYOR) {
              player.x -= 2;
            } else if (plat.type === PlatformType.RIGHT_CONVEYOR) {
              player.x += 2;
            }
            
            // Regenerate HP slowly if on normal platform? No, too easy.
          }
        }
      }

      // Check Life
      if (player.hp <= 0) {
        player.hp = 0;
        player.isDead = true;
      }

      // Score based on survival time + depth
      if (!player.isDead) {
        player.score += 0.1; 
      }
    });

    // Remove Broken Platforms (simulated by filtering touched breakables if we implemented delay, 
    // but for now let's say breakables break instantly upon landing? 
    // Let's make them traverse through: collision logic above handles "solidness".
    // If it's breakable, let's make it non-solid immediately after first touch frame?
    // Simplification: Breakable = Disappears if touched.
    platformsRef.current = platformsRef.current.filter(p => !(p.type === PlatformType.BREAKABLE && p.touched));

    // Sync UI State
    setP1Health(playersRef.current[0].hp);
    setP2Health(playersRef.current[1].hp);
    setScore(Math.floor(playersRef.current[0].score + playersRef.current[1].score)); // Combined score or just tracking

    // Game Over Check
    if (activePlayers === 0) {
      isRunningRef.current = false;
      const duration = (Date.now() - startTimeRef.current) / 1000;
      onGameOver(playersRef.current, duration);
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Background
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Ceiling Spikes
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 10, 20);
      ctx.lineTo(i + 20, 0);
    }
    ctx.fill();

    // Draw Platforms
    platformsRef.current.forEach(p => {
      let color = '#64748b'; // Default slate-500
      let shadowColor = '#475569';

      switch (p.type) {
        case PlatformType.NORMAL: color = '#a3e635'; shadowColor='#65a30d'; break; // Lime
        case PlatformType.SPIKE: color = '#f87171'; shadowColor='#b91c1c'; break; // Red
        case PlatformType.BOUNCY: color = '#f472b6'; shadowColor='#db2777'; break; // Pink
        case PlatformType.BREAKABLE: color = '#facc15'; shadowColor='#b45309'; break; // Yellow
        case PlatformType.LEFT_CONVEYOR: 
        case PlatformType.RIGHT_CONVEYOR: color = '#22d3ee'; shadowColor='#0891b2'; break; // Cyan
      }

      // 3D effect
      ctx.fillStyle = shadowColor;
      ctx.fillRect(p.x, p.y + 5, p.width, p.height);
      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Decorations
      if (p.type === PlatformType.SPIKE) {
        ctx.fillStyle = '#450a0a';
        for(let i=0; i<p.width; i+=10) {
            ctx.beginPath();
            ctx.moveTo(p.x + i, p.y);
            ctx.lineTo(p.x + i + 5, p.y - 5);
            ctx.lineTo(p.x + i + 10, p.y);
            ctx.fill();
        }
      }
      if (p.type === PlatformType.LEFT_CONVEYOR) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.font = "12px Arial";
        ctx.fillText("<<<", p.x + 10, p.y + 12);
        ctx.fillText("<<<", p.x + 60, p.y + 12);
      }
      if (p.type === PlatformType.RIGHT_CONVEYOR) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.font = "12px Arial";
        ctx.fillText(">>>", p.x + 10, p.y + 12);
        ctx.fillText(">>>", p.x + 60, p.y + 12);
      }
    });

    // Draw Players
    playersRef.current.forEach(p => {
      if (p.isDead) return;

      ctx.fillStyle = p.color;
      // Rounded Rect
      const r = 8;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, r);
      ctx.fill();

      // Eyes (direction aware)
      ctx.fillStyle = 'white';
      const eyeOffset = p.vx > 0.1 ? 4 : p.vx < -0.1 ? -4 : 0;
      ctx.beginPath();
      ctx.arc(p.x + 10 + eyeOffset, p.y + 10, 4, 0, Math.PI * 2);
      ctx.arc(p.x + 20 + eyeOffset, p.y + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(p.x + 11 + eyeOffset, p.y + 10, 2, 0, Math.PI * 2);
      ctx.arc(p.x + 21 + eyeOffset, p.y + 10, 2, 0, Math.PI * 2);
      ctx.fill();

      // Health bar above head
      const hpPct = p.hp / p.maxHp;
      ctx.fillStyle = 'red';
      ctx.fillRect(p.x, p.y - 10, p.width, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(p.x, p.y - 10, p.width * hpPct, 4);
    });
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    update();
    draw(ctx);

    if (isRunningRef.current) {
      frameIdRef.current = requestAnimationFrame(loop);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      initGame();
      frameIdRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(frameIdRef.current);
      isRunningRef.current = false;
    }
    return () => cancelAnimationFrame(frameIdRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, initGame]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="bg-slate-800 rounded-lg shadow-2xl border-4 border-slate-700 max-w-full h-auto"
      />
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between text-white font-pixel text-xs md:text-sm pointer-events-none">
        <div className="flex flex-col items-start">
          <div className="text-blue-400 font-bold mb-1">PLAYER 1 (WASD)</div>
          <div className="w-32 h-4 bg-gray-700 rounded border border-gray-500 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100" 
              style={{ width: `${Math.max(0, (p1Health / INITIAL_HP) * 100)}%` }}
            />
          </div>
        </div>

        <div className="text-yellow-400 text-xl animate-pulse">
            DEPTH: {score}m
        </div>

        <div className="flex flex-col items-end">
          <div className="text-red-400 font-bold mb-1">PLAYER 2 (ARROWS)</div>
          <div className="w-32 h-4 bg-gray-700 rounded border border-gray-500 overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-100" 
              style={{ width: `${Math.max(0, (p2Health / INITIAL_HP) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
