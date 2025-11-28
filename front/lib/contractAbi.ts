/**
 * Contract configuration for AlienInvaders GameFi
 */
export const CONTRACT_CONFIG = {
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0',
  gamePoolId: process.env.NEXT_PUBLIC_GAMEPOOL_ID || '0x0',
  module: 'AlienInvaders',
  network: process.env.NEXT_PUBLIC_NETWORK || 'testnet',
};

/**
 * Contract function names
 */
export const CONTRACT_FUNCTIONS = {
  // Entry functions
  START_GAME: 'start_game',
  COMPLETE_LEVEL: 'complete_level',
  ABANDON_GAME: 'abandon_game',
  CLAIM_REWARDS: 'claim_rewards',
  
  // View functions
  GET_SESSION_INFO: 'get_session_info',
  GET_PLAYER_SESSIONS: 'get_player_sessions',
  GET_POOL_INFO: 'get_pool_info',
  GET_ALIEN_COUNT_FOR_LEVEL: 'get_alien_count_for_level',
  CALCULATE_TOTAL_REWARD: 'calculate_total_reward',
};

/**
 * Reward per level (2 OCT with 6 decimals)
 */
export const REWARD_PER_LEVEL = 2000000;

/**
 * Maximum levels
 */
export const MAX_LEVELS = 5;

/**
 * Build transaction target
 */
export function buildTarget(functionName: string): `${string}::${string}::${string}` {
  const target = `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.module}::${functionName}`;
  console.log('Built target:', target);
  return target as `${string}::${string}::${string}`;
}

/**
 * Game session info interface
 */
export interface GameSessionInfo {
  player: string;
  currentLevel: number;
  levelsCompleted: number;
  totalRewardsEarned: number;
  startTime: number;
  isActive: boolean;
  isCompleted: boolean;
}

/**
 * Pool info interface
 */
export interface PoolInfo {
  rewardPoolBalance: number;
  totalGames: number;
  totalRewardsDistributed: number;
}

/**
 * Parse session info from contract response
 * Contract returns: (address, u64, u64, u64, u64, bool, bool)
 * (player, current_level, levels_completed, total_rewards_earned, start_time, is_active, is_completed)
 */
export function parseSessionInfo(data: any[]): GameSessionInfo | null {
  if (!data || data.length < 7) return null;
  
  return {
    player: String(data[0]),
    currentLevel: Number(data[1]),
    levelsCompleted: Number(data[2]),
    totalRewardsEarned: Number(data[3]),
    startTime: Number(data[4]),
    isActive: Boolean(data[5]),
    isCompleted: Boolean(data[6]),
  };
}

/**
 * Parse pool info from contract response
 */
export function parsePoolInfo(data: any[]): PoolInfo | null {
  if (!data || data.length < 3) return null;
  
  return {
    rewardPoolBalance: Number(data[0]),
    totalGames: Number(data[1]),
    totalRewardsDistributed: Number(data[2]),
  };
}

/**
 * Format OCT amount
 */
export function formatOCT(amount: number): string {
  return (amount / 1000000).toFixed(2);
}

/**
 * Calculate total possible earnings
 */
export function calculateMaxEarnings(): number {
  return REWARD_PER_LEVEL * MAX_LEVELS;
}

/**
 * Get alien count for level
 */
export function getAlienCountForLevel(level: number): number {
  return 11 * level;
}
