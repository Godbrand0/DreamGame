/**
 * Contract configuration for AlienInvaders GameFi
 */
export const CONTRACT_CONFIG = {
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0',
  module: 'AlienInvaders',
  network: process.env.NEXT_PUBLIC_NETWORK || 'testnet',
};

/**
 * Contract function names
 */
export const CONTRACT_FUNCTIONS = {
  // Entry functions
  INITIALIZE: 'initialize',
  ADD_TO_POOL: 'add_to_pool',
  START_GAME: 'start_game',
  COMPLETE_LEVEL: 'complete_level',
  END_GAME: 'end_game',
  CLAIM_REWARDS: 'claim_rewards',
  
  // View functions
  GET_SESSION_INFO: 'get_session_info',
  GET_POOL_INFO: 'get_pool_info',
  GET_ALIEN_COUNT_FOR_LEVEL: 'get_alien_count_for_level',
  CALCULATE_TOTAL_REWARD: 'calculate_total_reward',
};

/**
 * Reward per level (1 OCT with 6 decimals)
 */
export const REWARD_PER_LEVEL = 1000000;

/**
 * Maximum levels
 */
export const MAX_LEVELS = 5;

/**
 * Build transaction target
 */
export function buildTarget(functionName: string): string {
  return `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.module}::${functionName}`;
}

/**
 * Game session info interface
 */
export interface GameSessionInfo {
  currentLevel: number;
  levelsCompleted: number;
  totalEarned: number;
  levelStartTime: number;
  isActive: boolean;
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
 */
export function parseSessionInfo(data: any[]): GameSessionInfo | null {
  if (!data || data.length < 5) return null;
  
  return {
    currentLevel: Number(data[0]),
    levelsCompleted: Number(data[1]),
    totalEarned: Number(data[2]),
    levelStartTime: Number(data[3]),
    isActive: Boolean(data[4]),
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
