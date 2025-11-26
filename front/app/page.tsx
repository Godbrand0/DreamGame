'use client'

import { useEffect, useRef, useState } from 'react'
import { Game } from '@/lib/game/Game'
import { Gamepad2, Trophy, Clock, Coins } from 'lucide-react'
import { formatOCT, MAX_LEVELS, REWARD_PER_LEVEL } from '@/lib/contractAbi'
import WalletConnect from '@/components/WalletConnect'
import { useCurrentAccount } from '@mysten/dapp-kit'

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver' | 'victory'>('menu')
  const [currentLevel, setCurrentLevel] = useState(1)
  const [levelsCompleted, setLevelsCompleted] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [totalEarned, setTotalEarned] = useState(0)
  const [hasActiveSession, setHasActiveSession] = useState(false)
  
  const currentAccount = useCurrentAccount()

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
      alert('Please connect your wallet first!')
      return
    }

    // TODO: Call smart contract to start game session
    // For now, just start the game
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
  }

  const nextLevel = async () => {
    // TODO: Sign transaction to call complete_level() on smart contract
    // This awards 1 OCT and updates the session to next level
    // await signAndExecuteTransaction({ ... complete_level ... })
    
    if (gameRef.current) {
      const nextLevelNum = gameRef.current.getCurrentLevel() + 1
      setCurrentLevel(nextLevelNum)
      setGameState('playing')
      gameRef.current.nextLevel()
    }
  }

  const claimRewards = async () => {
    // TODO: Sign transaction to call claim_rewards() on smart contract
    // This transfers the earned OCT to the player's wallet
    // await signAndExecuteTransaction({ ... claim_rewards ... })
    
    console.log(`Claiming ${formatOCT(totalEarned)} OCT`)
    alert(`Claimed ${formatOCT(totalEarned)} OCT! (Demo mode)`)
    
    // Redirect to home/menu after claiming
    setGameState('menu')
    setHasActiveSession(false)
    setCurrentLevel(1)
    setLevelsCompleted(0)
    setTotalEarned(0)
    
    if (gameRef.current) {
      gameRef.current.stop()
      gameRef.current = null
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <Gamepad2 className="w-12 h-12 text-purple-400" />
              Alien Invaders GameFi
            </h1>
            <p className="text-xl text-gray-300">
              Play through 5 levels • Earn 1 OCT per level • 60 seconds each
            </p>
          </div>
          <div className="absolute top-4 right-4">
            <WalletConnect />
          </div>
        </div>

        {/* Game Stats */}
        {hasActiveSession && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 backdrop-blur-lg border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-sm">Level</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {currentLevel} / {MAX_LEVELS}
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-lg border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Time Left</span>
              </div>
              <div className={`text-2xl font-bold ${timeRemaining <= 10 ? 'text-red-400' : 'text-white'}`}>
                {timeRemaining}s
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-lg border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Coins className="w-4 h-4" />
                <span className="text-sm">Earned</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {formatOCT(totalEarned)} OCT
              </div>
            </div>
          </div>
        )}

        {/* Game Canvas Container */}
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl border-4 border-purple-500/50">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full"
          />

          {/* Menu Overlay */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
              <div className="text-center p-8">
                <h2 className="text-4xl font-bold text-white mb-6">Ready to Play?</h2>
                <p className="text-gray-300 mb-8 max-w-md">
                  Destroy all aliens in each level within 60 seconds. 
                  Complete all 5 levels to earn 5 OCT!
                </p>
                <button
                  onClick={startGame}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105"
                >
                  Start Game
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
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  Continue to Level {currentLevel + 1} →
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
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg w-full"
                >
                  Claim Rewards
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
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg w-full"
                    >
                      Claim Rewards
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
              <ul className="space-y-1 text-sm">
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
