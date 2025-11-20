export enum PlatformType {
  NORMAL = 'NORMAL',
  SPIKE = 'SPIKE',     // Damages player if they land on it
  BOUNCY = 'BOUNCY',   // High jump
  BREAKABLE = 'BREAKABLE', // Disappears after landing
  LEFT_CONVEYOR = 'LEFT_CONVEYOR',
  RIGHT_CONVEYOR = 'RIGHT_CONVEYOR',
}

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  touched?: boolean; // For breakable platforms
}

export interface Player {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  score: number;
  isDead: boolean;
  color: string;
  name: string;
  controls: {
    left: string[];
    right: string[];
  };
  lastDamageSource?: string;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}
