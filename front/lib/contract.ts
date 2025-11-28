/**
 * Contract interaction utilities for AlienInvaders GameFi
 */

import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import { CONTRACT_CONFIG, CONTRACT_FUNCTIONS, buildTarget } from './contractAbi';

/**
 * Build transaction to start a new game session
 */
export function buildStartGameTx(): TransactionBlock {
  const tx = new TransactionBlock();
  
  tx.moveCall({
    target: buildTarget(CONTRACT_FUNCTIONS.START_GAME),
    arguments: [
      tx.object(CONTRACT_CONFIG.gamePoolId),
    ],
  });
  
  return tx;
}

/**
 * Build transaction to complete a level
 */
export function buildCompleteLevelTx(
  sessionId: string | number,
  level: number,
  score: number,
  aliensDestroyed: number
): TransactionBlock {
  const tx = new TransactionBlock();
  
  tx.moveCall({
    target: buildTarget(CONTRACT_FUNCTIONS.COMPLETE_LEVEL),
    arguments: [
      tx.object(CONTRACT_CONFIG.gamePoolId),
      tx.pure.u64(sessionId),
      tx.pure.u64(level),
      tx.pure.u64(score),
      tx.pure.u64(aliensDestroyed),
    ],
  });
  
  return tx;
}

/**
 * Build transaction to claim rewards
 */
export function buildClaimRewardsTx(sessionId: string | number): TransactionBlock {
  const tx = new TransactionBlock();
  
  tx.moveCall({
    target: buildTarget(CONTRACT_FUNCTIONS.CLAIM_REWARDS),
    arguments: [
      tx.object(CONTRACT_CONFIG.gamePoolId),
      tx.pure.u64(sessionId),
    ],
  });
  
  return tx;
}

/**
 * Build transaction to abandon game
 */
export function buildAbandonGameTx(sessionId: string | number): TransactionBlock {
  const tx = new TransactionBlock();
  
  tx.moveCall({
    target: buildTarget(CONTRACT_FUNCTIONS.ABANDON_GAME),
    arguments: [
      tx.object(CONTRACT_CONFIG.gamePoolId),
      tx.pure.u64(sessionId),
    ],
  });
  
  return tx;
}

/**
 * Extract session ID from transaction result
 * The result structure from useSignAndExecuteTransaction includes a digest
 * We need to fetch the full transaction details to get events
 */
export async function extractSessionIdFromTransaction(
  client: SuiClient,
  digest: string
): Promise<string | null> {
  try {
    const txResponse = await client.getTransactionBlock({
      digest,
      options: {
        showEvents: true,
      },
    });
    
    const events = txResponse.events || [];
    
    // Look for GameStarted event
    for (const event of events) {
      if (event.type?.includes('GameStarted')) {
        const parsedJson = event.parsedJson as any;
        return parsedJson?.session_id?.toString() || null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting session ID:', error);
    return null;
  }
}

/**
 * Get session info from contract
 */
export async function getSessionInfo(
  client: SuiClient,
  sessionId: string | number
): Promise<any> {
  try {
    const result = await client.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new TransactionBlock();
        tx.moveCall({
          target: buildTarget(CONTRACT_FUNCTIONS.GET_SESSION_INFO),
          arguments: [
            tx.object(CONTRACT_CONFIG.gamePoolId),
            tx.pure.u64(sessionId),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });
    
    return result;
  } catch (error) {
    console.error('Error getting session info:', error);
    return null;
  }
}

/**
 * Get player's session IDs
 */
export async function getPlayerSessions(
  client: SuiClient,
  playerAddress: string
): Promise<string[]> {
  try {
    const result = await client.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new TransactionBlock();
        tx.moveCall({
          target: buildTarget(CONTRACT_FUNCTIONS.GET_PLAYER_SESSIONS),
          arguments: [
            tx.object(CONTRACT_CONFIG.gamePoolId),
            tx.pure.address(playerAddress),
          ],
        });
        return tx;
      })(),
      sender: playerAddress,
    });
    
    // Parse the result to extract session IDs
    // This will depend on the exact format returned by the contract
    return [];
  } catch (error) {
    console.error('Error getting player sessions:', error);
    return [];
  }
}

/**
 * Parse transaction result to check for errors
 */
export function parseTransactionResult(result: any): {
  success: boolean;
  error?: string;
  digest?: string;
} {
  if (!result) {
    return { success: false, error: 'No result returned' };
  }
  
  if (result.effects?.status?.status === 'success') {
    return {
      success: true,
      digest: result.digest,
    };
  }
  
  return {
    success: false,
    error: result.effects?.status?.error || 'Transaction failed',
  };
}

/**
 * Format error message for user display
 */
export function formatContractError(error: any): string {
  if (typeof error === 'string') return error;
  
  const errorStr = error?.message || error?.toString() || 'Unknown error';
  
  // Map common error codes to user-friendly messages
  if (errorStr.includes('ELevelTimeExpired')) {
    return 'Time limit exceeded for this level';
  }
  if (errorStr.includes('EInvalidLevel')) {
    return 'Invalid level number';
  }
  if (errorStr.includes('ENotSessionOwner')) {
    return 'You are not the owner of this session';
  }
  if (errorStr.includes('EInsufficientContractBalance')) {
    return 'Contract has insufficient balance. Please contact support.';
  }
  if (errorStr.includes('ENoRewardsToClaim')) {
    return 'No rewards available to claim';
  }
  if (errorStr.includes('ESessionNotActive')) {
    return 'Game session is not active';
  }
  if (errorStr.includes('EInvalidLevelHash')) {
    return 'Invalid alien count for this level';
  }
  
  return errorStr;
}
