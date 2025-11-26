# 🎮 Alien Invaders GameFi - Setup Complete!

## ✅ What Was Created

### 1. Smart Contract (Move) - `/move/`
- **AlienInvaders.move** - Complete GameFi contract with:
  - 5-level progression system
  - 1 OCT reward per level completed
  - 60-second timer per level
  - Increasing difficulty (11, 22, 33, 44, 55 aliens per level)
  - Start game, complete level, end game, and claim rewards functions
  - Comprehensive test suite

### 2. Game Engine - `/front/lib/game/`
- **Player.ts** - Player ship with movement and shooting
- **Alien.ts** - Animated aliens with 3 types (octopus, crab, squid)
- **Bullet.ts** - Player and alien projectiles
- **Barrier.ts** - Destructible barriers
- **Game.ts** - Main game loop with:
  - 5-level progression
  - 60-second timer per level
  - Increasing alien count per level
  - Level completion callbacks
  - Game over detection

### 3. Frontend - `/front/app/`
- **page.tsx** - Main game page with:
  - Canvas-based gameplay
  - Level stats display
  - Menu, level complete, victory, and game over overlays
  - Claim rewards functionality
  - Instructions

### 4. Utilities - `/front/lib/`
- **contractAbi.ts** - Contract interaction utilities

## 🎮 Game Mechanics

### Level System
- **Level 1**: 11 aliens (1 row × 11)
- **Level 2**: 22 aliens (2 rows × 11)
- **Level 3**: 33 aliens (3 rows × 11)
- **Level 4**: 44 aliens (4 rows × 11)
- **Level 5**: 55 aliens (5 rows × 11)

### Rewards
- **1 OCT per level** completed
- **Maximum**: 5 OCT (all 5 levels)
- **Claim anytime**: After losing or completing all levels
- **Example**: Lose at level 3 = Claim 2 OCT

### Timer
- **60 seconds per level** (same for all levels)
- Game over if time runs out
- Difficulty increases with more aliens, not less time

## 🚀 How to Run

### 1. Start the Frontend

```bash
cd front
npm run dev
```

Visit `http://localhost:3000` to play!

### 2. Deploy Smart Contract (when ready)

```bash
cd move

# Compile
one move build

# Test
one move test

# Deploy to testnet
one move publish --profile testnet --gas-budget 50000000

# Initialize reward pool (10 OCT for testing)
one client ptb \
  --move-call PACKAGE_ID::AlienInvaders::initialize 10000000 \
  --gas-budget 20000000
```

### 3. Configure Frontend

After deploying the contract, update `front/env.example`:

```env
NEXT_PUBLIC_PACKAGE_ID=<your-deployed-package-id>
NEXT_PUBLIC_NETWORK=testnet
```

Then rename to `.env.local`

## 🎯 Game Flow

1. **Player clicks "Start Game"**
   - Frontend calls `start_game()` on contract
   - Contract creates GameSession
   - Game begins at Level 1

2. **Player completes Level 1**
   - All 11 aliens destroyed within 60 seconds
   - Frontend calls `complete_level()` on contract
   - Contract awards 1 OCT
   - Player can continue to Level 2 or claim 1 OCT

3. **Player continues through levels**
   - Each level adds 11 more aliens
   - Same 60-second timer
   - Earn 1 OCT per level

4. **Player loses or completes all 5 levels**
   - Frontend calls `end_game()` on contract
   - Player clicks "Claim Rewards"
   - Frontend calls `claim_rewards()` on contract
   - Player receives accumulated OCT

## 🎮 Controls

- **Arrow Left/Right**: Move player ship
- **Spacebar**: Shoot
- **Objective**: Destroy all aliens before time runs out

## 📝 Smart Contract Functions

### Player Functions

```move
// Start a new game (creates session)
public entry fun start_game(pool: &mut GamePool, ctx: &mut TxContext)

// Complete current level (awards 1 OCT)
public entry fun complete_level(pool: &mut GamePool, session: &mut GameSession, ctx: &TxContext)

// End game (player loses or quits)
public entry fun end_game(session: &mut GameSession, ctx: &TxContext)

// Claim accumulated rewards
public entry fun claim_rewards(pool: &mut GamePool, session: GameSession, ctx: &mut TxContext)
```

### View Functions

```move
// Get session info
public fun get_session_info(session: &GameSession): (u64, u64, u64, u64, bool)

// Get pool info
public fun get_pool_info(pool: &GamePool): (u64, u64, u64)

// Get alien count for level
public fun get_alien_count_for_level(level: u64): u64
```

## 🔧 Next Steps (Integration)

### Frontend Integration with Contract

Update `front/app/page.tsx` to add actual blockchain calls:

1. **Start Game** - Call `start_game()` transaction
2. **Complete Level** - Call `complete_level()` transaction  
3. **Claim Rewards** - Call `claim_rewards()` transaction

### Install Sui SDK (if not already)

```bash
cd front
npm install @mysten/sui.js @mysten/dapp-kit @mysten/wallet-standard @tanstack/react-query
```

## 🎨 Features

✅ **No Staking Required** - Just play and earn
✅ **5 Progressive Levels** - Increasing difficulty
✅ **1 OCT per Level** - Clear rewards
✅ **60-Second Timer** - Consistent challenge
✅ **Claim Anytime** - After losing or winning
✅ **Retro Graphics** - Classic Space Invaders style
✅ **Smooth Gameplay** - Canvas-based rendering
✅ **Blockchain Verified** - All rewards on-chain

## 📊 Example Scenarios

**Scenario 1: Complete All Levels**
- Play through all 5 levels
- Earn 5 OCT total
- Claim 5 OCT

**Scenario 2: Lose at Level 3**
- Complete levels 1 and 2
- Lose at level 3 (time runs out or hit by alien)
- Earned 2 OCT
- Claim 2 OCT

**Scenario 3: Quit After Level 2**
- Complete levels 1 and 2
- Click "Claim Rewards" instead of continuing
- Claim 2 OCT

## 🐛 Testing

The game is fully playable right now in demo mode. To test:

```bash
cd front
npm run dev
```

Then:
1. Click "Start Game"
2. Use arrow keys to move, spacebar to shoot
3. Try to complete levels
4. Test the claim functionality

## 🎯 Contract Testing

```bash
cd move
one move test

# Should see all tests pass:
# ✓ test_initialize
# ✓ test_start_game
# ✓ test_complete_levels
# ✓ test_claim_rewards
# ✓ test_alien_count_scaling
# ✓ test_reward_calculation
```

## 📚 File Structure

```
DreamGame/
├── move/
│   ├── Move.toml
│   └── sources/
│       └── AlienInvaders.move
│
├── front/
│   ├── app/
│   │   ├── page.tsx (Main game page)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── game/
│   │   │   ├── Game.ts
│   │   │   ├── Player.ts
│   │   │   ├── Alien.ts
│   │   │   ├── Bullet.ts
│   │   │   └── Barrier.ts
│   │   └── contractAbi.ts
│   ├── package.json
│   └── env.example
│
└── README.md
```

## 🎉 Ready to Play!

The game is complete and playable! Just run:

```bash
cd front
npm run dev
```

Then open `http://localhost:3000` and start playing!

---

**🎮 Play. Earn. Repeat. 🚀**
