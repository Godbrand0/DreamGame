'use client'

import { useEffect, useRef, useState } from 'react'
import { Game } from '@/lib/game/Game'
import { Gamepad2, Trophy, Clock, Coins } from 'lucide-react'
import { formatOCT, MAX_LEVELS, REWARD_PER_LEVEL, CONTRACT_CONFIG } from '@/lib/contractAbi'
import WalletConnect from '@/components/WalletConnect'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { 
  buildStartGameTx, 
  buildCompleteLevelTx, 
  buildClaimRewardsTx,
  extractSessionIdFromTransaction,
  formatContractError 
} from '@/lib/contract'

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver' | 'victory'>('menu')
  const [currentLevel, setCurrentLevel] = useState(1)
  const [levelsCompleted, setLevelsCompleted] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [totalEarned, setTotalEarned] = useState(0)
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const currentAccount = useCurrentAccount()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const suiClient = useSuiClient()
  
  // Log configuration and wallet info
  console.log('Contract config:', {
    packageId: process.env.NEXT_PUBLIC_PACKAGE_ID,
    gamePoolId: process.env.NEXT_PUBLIC_GAMEPOOL_ID,
    network: process.env.NEXT_PUBLIC_NETWORK,
    rpc: process.env.NEXT_PUBLIC_ONECHAIN_RPC
  })
  console.log('Current account:', currentAccount)
  console.log('Sui client:', suiClient)

  useEffect(() => {
    return () => {
      if (gameRef.current) {
        gameRef.current.stop()
      }
    }
  }, [])

  const startGame = async () => {
    if (!canvasRef.current) return
    if (!currentAccount) {
      setErrorMessage('Please connect your wallet first!')
      return
    }

    try {
      setIsProcessing(true)
      setErrorMessage(null)

      // Build and execute start_game transaction
      const tx = buildStartGameTx()

      console.log('Starting game transaction...')

      const result = await signAndExecuteTransaction({
        transaction: tx,
      })
      
      console.log('Start game result:', result)
      
      // Extract session ID from transaction events
      const newSessionId = await extractSessionIdFromTransaction(suiClient as any, result.digest)
      
      if (!newSessionId) {
        throw new Error('Failed to extract session ID from transaction')
      }
      
      console.log('Session ID:', newSessionId)
      setSessionId(newSessionId)
      setHasActiveSession(true)
      setGameState('playing')
      setCurrentLevel(1)
      setLevelsCompleted(0)
      setTotalEarned(0)

      const game = new Game(
        canvasRef.current,
        {
          onLevelComplete: (level) => {
            console.log(`Level ${level} complete!`)
            setLevelsCompleted(level)
            setTotalEarned(level * REWARD_PER_LEVEL)
            
            if (level >= MAX_LEVELS) {
              setGameState('victory')
            } else {
              setGameState('levelComplete')
            }
          },
          onGameOver: (levelsCompleted) => {
            console.log(`Game over! Completed ${levelsCompleted} levels`)
            setLevelsCompleted(levelsCompleted)
            setTotalEarned(levelsCompleted * REWARD_PER_LEVEL)
            setGameState('gameOver')
          },
          onTimeUpdate: (time) => {
            setTimeRemaining(time)
          },
        },
        currentLevel
      )

      gameRef.current = game
      game.start()
    } catch (error: any) {
      console.error('Error starting game:', error)
      setErrorMessage(formatContractError(error))
    } finally {
      setIsProcessing(false)
    }
  }

  const nextLevel = async () => {
    if (!sessionId || !gameRef.current) {
      setErrorMessage('No active session found')
      return
    }

    try {
      setIsProcessing(true)
      setErrorMessage(null)
      
      const completedLevel = gameRef.current.getCurrentLevel()
      const score = gameRef.current.getScore()
      const aliensDestroyed = completedLevel * 11 // Contract expects level * 11
      
      // Build and execute complete_level transaction
      const tx = buildCompleteLevelTx(sessionId, completedLevel, score, aliensDestroyed)

      const result = await signAndExecuteTransaction({
        transaction: tx,
      })
      
      console.log('Complete level result:', result)
      
      // Move to next level
      const nextLevelNum = completedLevel + 1
      setCurrentLevel(nextLevelNum)
      setGameState('playing')
      gameRef.current.nextLevel()
    } catch (error: any) {
      console.error('Error completing level:', error)
      setErrorMessage(formatContractError(error))
    } finally {
      setIsProcessing(false)
    }
  }

  const claimRewards = async () => {
    console.log('🎮 claimRewards function called!')
    console.log('sessionId:', sessionId)
    console.log('currentAccount:', currentAccount)

    if (!sessionId) {
      console.error('❌ No session ID found')
      setErrorMessage('No active session found')
      return
    }

    if (!currentAccount) {
      console.error('❌ No current account found')
      setErrorMessage('Wallet disconnected. Please reconnect your wallet.')
      return
    }

    console.log('✅ Validation passed, starting claim process...')

    try {
      setIsProcessing(true)
      setErrorMessage(null)

      console.log('📋 Claiming rewards for session:', sessionId)
      console.log('📋 Session ID type:', typeof sessionId)
      console.log('📋 Total earned:', totalEarned, 'OCT')
      console.log('📋 Levels completed:', levelsCompleted)
      console.log('📋 Current account:', currentAccount.address)

      // Add a small delay to allow wallet to stabilize after game over
      console.log('⏳ Waiting 500ms...')
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('✅ Wait complete')

      // Build and execute claim_rewards transaction
      console.log('🔨 Building claim transaction...')
      const tx = buildClaimRewardsTx(sessionId)
      console.log('✅ Claim transaction built:', tx)

      console.log('📝 Calling signAndExecuteTransaction...')
      const result = await signAndExecuteTransaction({
        transaction: tx,
      })

      console.log('✅ Transaction executed successfully!')
      console.log('📊 Claim rewards result:', result)
      console.log(`🎉 Successfully claimed ${formatOCT(totalEarned)} OCT!`)
      
      // Reset game state
      setGameState('menu')
      setHasActiveSession(false)
      setCurrentLevel(1)
      setLevelsCompleted(0)
      setTotalEarned(0)
      setSessionId(null)
      
      if (gameRef.current) {
        gameRef.current.stop()
        gameRef.current = null
      }
    } catch (error: any) {
      console.error('❌ ERROR claiming rewards:', error)
      console.error('❌ Error type:', typeof error)
      console.error('❌ Error name:', error?.name)
      console.error('❌ Error message:', error?.message)
      console.error('❌ Error cause:', error?.cause)
      console.error('❌ Error stack:', error?.stack)
      console.error('❌ Full error object:', JSON.stringify(error, null, 2))

      // Check if it's a network/RPC error
      if (error?.message?.includes('endpoints') || error?.message?.includes('network')) {
        setErrorMessage('Network error. Please refresh the page and try again, or check your wallet connection.')
      } else if (error?.message?.includes('User rejected')) {
        setErrorMessage('Transaction cancelled by user.')
      } else {
        setErrorMessage(formatContractError(error))
      }
    } finally {
      console.log('🏁 Finally block - setting isProcessing to false')
      setIsProcessing(false)
    }
  }

  const restartGame = () => {
    setGameState('menu')
    setCurrentLevel(1)
    setLevelsCompleted(0)
    setTotalEarned(0)
    setHasActiveSession(false)
    if (gameRef.current) {
      gameRef.current.stop()
      gameRef.current = null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #1e293b, #581c87, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: '72rem', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Gamepad2 style={{ width: '48px', height: '48px', color: '#c084fc' }} />
              Alien Invaders GameFi
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#d1d5db' }}>
              Play through 5 levels • Earn 2 OCT per level • 60 seconds each
            </p>
          </div>
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <WalletConnect />
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div style={{ marginBottom: '24px', backgroundColor: 'rgba(127, 29, 29, 0.5)', border: '2px solid #ef4444', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <p style={{ color: '#fca5a5', fontWeight: '600' }}>Error</p>
                <p style={{ color: '#fecaca' }}>{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                style={{ marginLeft: 'auto', color: '#fca5a5', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div style={{ marginBottom: '24px', backgroundColor: 'rgba(147, 51, 234, 0.5)', border: '2px solid #a855f7', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', height: '24px', width: '24px', borderBottom: '2px solid #c084fc' }}></div>
              <p style={{ color: '#e9d5ff' }}>Processing transaction... Please sign in your wallet</p>
            </div>
          </div>
        )}

        {/* Game Stats */}
        {hasActiveSession && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', marginBottom: '4px' }}>
                <Trophy style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px' }}>Level</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {currentLevel} / {MAX_LEVELS}
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', marginBottom: '4px' }}>
                <Clock style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px' }}>Time Left</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: timeRemaining <= 10 ? '#f87171' : 'white' }}>
                {timeRemaining}s
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', marginBottom: '4px' }}>
                <Coins style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px' }}>Earned</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>
                {formatOCT(totalEarned)} OCT
              </div>
            </div>
          </div>
        )}

        {/* Game Canvas Container */}
        <div style={{ position: 'relative', backgroundColor: 'black', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '4px solid rgba(168, 85, 247, 0.5)' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full"
            style={{ zIndex: 1 }}
          />

          {/* Menu Overlay */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-index-10" style={{ zIndex: 10 }}>
              {(() => { console.log('Menu overlay rendering'); return null; })()}
              <div className="text-center p-8">
                <h2 className="text-4xl font-bold text-white mb-6">Ready to Play?</h2>
                <p className="text-gray-300 mb-8 max-w-md">
                  Destroy all aliens in each level within 60 seconds.
                  Complete all 5 levels to earn 5 OCT!
                </p>
                <button
                  onClick={startGame}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4 border-white shadow-2xl"
                  style={{ zIndex: 20 }}
                >
                  {isProcessing ? 'Starting...' : 'Start Game'}
                </button>
                <div className="mt-8 text-sm text-gray-400">
                  <p>Controls: Arrow Keys to move, Spacebar to shoot</p>
                </div>
              </div>
            </div>
          )}

          {/* Level Complete Overlay */}
          {gameState === 'levelComplete' && (
            <div className="absolute inset-0 bg-black/95 flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-pulse" />
                <h2 className="text-4xl font-bold text-white mb-4">Level {levelsCompleted} Complete!</h2>
                <p className="text-3xl text-green-400 mb-4">
                  +{formatOCT(REWARD_PER_LEVEL)} OCT
                </p>
                <p className="text-xl text-gray-300 mb-8">
                  Total Earned: <span className="text-green-400 font-bold">{formatOCT(totalEarned)} OCT</span>
                </p>
                <button
                  onClick={nextLevel}
                  disabled={isProcessing}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isProcessing ? 'Processing...' : `Continue to Level ${currentLevel + 1} →`}
                </button>
                <p className="text-sm text-gray-400 mt-4">
                  (Requires wallet signature)
                </p>
              </div>
            </div>
          )}

          {/* Victory Overlay */}
          {gameState === 'victory' && (
            <div className="absolute inset-0 bg-black/95 flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-bounce" />
                <h2 className="text-5xl font-bold text-white mb-6">🎉 Victory! 🎉</h2>
                <p className="text-2xl text-gray-300 mb-4">
                  All 5 Levels Complete!
                </p>
                <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-6 mb-8">
                  <p className="text-lg text-gray-300 mb-2">Total Rewards</p>
                  <p className="text-5xl font-bold text-green-400">
                    {formatOCT(totalEarned)} OCT
                  </p>
                </div>
                <button
                  onClick={claimRewards}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isProcessing ? 'Claiming...' : 'Claim Rewards'}
                </button>
                <p className="text-sm text-gray-400 mt-4">
                  (Requires wallet signature)
                </p>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === 'gameOver' && (
            <div className="absolute inset-0 bg-black/95 flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <div className="text-6xl mb-6">💥</div>
                <h2 className="text-4xl font-bold text-red-400 mb-4">Game Over</h2>
                <p className="text-xl text-gray-300 mb-6">
                  You completed {levelsCompleted} level{levelsCompleted !== 1 ? 's' : ''}
                </p>
                {totalEarned > 0 ? (
                  <>
                    <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-6 mb-8">
                      <p className="text-lg text-gray-300 mb-2">Rewards Earned</p>
                      <p className="text-5xl font-bold text-green-400">
                        {formatOCT(totalEarned)} OCT
                      </p>
                    </div>
                    <button
                      onClick={claimRewards}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isProcessing ? 'Claiming...' : 'Claim Rewards'}
                    </button>
                    <p className="text-sm text-gray-400 mt-4">
                      (Requires wallet signature)
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 mb-8">
                      Complete at least one level to earn rewards!
                    </p>
                    <button
                      onClick={restartGame}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-lg border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">How to Play</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">Objective</h4>
              <ul className="space-y-1 text-sm text-green-300">
                <li>• Destroy all aliens before time runs out</li>
                <li>• Complete 5 levels to earn maximum rewards</li>
                <li>• Each level adds more aliens (11, 22, 33, 44, 55)</li>
                <li>• Same 60-second timer for all levels</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">Rewards</h4>
              <ul className="space-y-1 text-sm">
                <li>• Earn 1 OCT per level completed</li>
                <li>• Claim anytime after losing or winning</li>
                <li>• Maximum earnings: 5 OCT (all levels)</li>
                <li>• No stake required - just play!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
