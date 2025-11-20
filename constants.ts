import { PlatformType } from './types';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;

export const GRAVITY = 0.4;
export const JUMP_FORCE = -7;
export const BOUNCE_FORCE = -14;
export const MOVE_SPEED = 5;
export const FRICTION = 0.8;
export const MAX_FALL_SPEED = 12;

export const PLAYER_WIDTH = 30;
export const PLAYER_HEIGHT = 30;

export const PLATFORM_WIDTH = 100;
export const PLATFORM_HEIGHT = 16;
export const PLATFORM_GAP_MIN = 80;
export const PLATFORM_GAP_MAX = 120;
export const PLATFORM_SPEED_BASE = 1.5;
export const PLATFORM_SPEED_INC = 0.001; // Speed increase per frame

export const SPIKE_DAMAGE = 20;
export const CEILING_DAMAGE = 5; // Damage per frame touching ceiling spikes

export const PLATFORM_TYPES_DISTRIBUTION = [
  { type: PlatformType.NORMAL, weight: 50 },
  { type: PlatformType.SPIKE, weight: 15 },
  { type: PlatformType.BOUNCY, weight: 10 },
  { type: PlatformType.BREAKABLE, weight: 10 },
  { type: PlatformType.LEFT_CONVEYOR, weight: 7 },
  { type: PlatformType.RIGHT_CONVEYOR, weight: 8 },
];

export const INITIAL_HP = 100;

export const KEY_CODES = {
  P1_LEFT: 'KeyA',
  P1_RIGHT: 'KeyD',
  P2_LEFT: 'ArrowLeft',
  P2_RIGHT: 'ArrowRight',
};
