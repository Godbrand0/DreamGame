# 🎮 Alien Invaders GameFi - OneChain Play-to-Earn Platform

A decentralized play-to-earn Space Invaders game built on OneChain where players stake OCT tokens to play and earn rewards based on their performance.

## 📋 Overview

**Alien Invaders GameFi** combines classic arcade gameplay with blockchain economics. Players stake OCT tokens to enter games, compete for high scores, and earn rewards from a shared prize pool. The better you play, the more you earn!

### Key Features

- 🎮 **Classic Space Invaders Gameplay**: Nostalgic arcade action
- 💰 **Stake-to-Play**: Stake OCT tokens to enter games
- 🏆 **Score-Based Rewards**: Higher scores = bigger rewards
- 🎯 **Prize Pool System**: Community-funded reward distribution
- 🔒 **Blockchain Verified**: All scores and rewards on-chain
- ⚡ **Instant Payouts**: Claim rewards immediately after games

### Game Economics

| Stake Amount | Entry Fee | Potential Reward Multiplier |
|--------------|-----------|----------------------------|
| 10 OCT       | 1 OCT     | Up to 5x (50 OCT max)     |
| 50 OCT       | 5 OCT     | Up to 10x (500 OCT max)   |
| 100 OCT      | 10 OCT    | Up to 20x (2000 OCT max)  |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME INTERFACE (Next.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Staking    │  │  Game Canvas │  │  Leaderboard │      │
│  │   Section    │  │   + Controls │  │   + Rewards  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │ OneWallet SDK
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   ONECHAIN BLOCKCHAIN                        │
│                      (Move Runtime)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          GAMEFI SMART CONTRACT (Move)                │  │
│  │  • Prize Pool (Community-funded OCT)                 │  │
│  │  • Player Stakes (Individual game entries)           │  │
│  │  • Score Verification & Reward Distribution          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🎮 How to Play

1. **Connect Wallet**: Connect your OneWallet
2. **Stake OCT**: Choose stake amount and enter game
3. **Play**: Destroy aliens, avoid bullets, protect barriers
4. **Earn Rewards**: Higher scores earn bigger rewards
5. **Claim**: Withdraw your stake + rewards

### Scoring System

- **Small Alien (Octopus)**: 10 points
- **Medium Alien (Crab)**: 20 points  
- **Large Alien (Squid)**: 30 points
- **Bonus**: Survival time multiplier

### Reward Calculation

```
Base Reward = Stake Amount
Score Multiplier = (Your Score / Average Score) * Difficulty Modifier
Final Reward = Base Reward * Score Multiplier (capped at max multiplier)
```

## 📁 Project Structure

```
alien-invaders-gamefi/
│
├── move/                           # Smart Contract
│   ├── sources/
│   │   └── GameFi.move            # Main game contract
│   ├── tests/
│   │   └── gamefi_tests.move      # Contract tests
│   └── Move.toml                   # Move configuration
│
├── frontend/                       # Next.js Game Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── providers.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── StakeSection.tsx
│   │   │   ├── GameCanvas.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── RewardClaim.tsx
│   │   ├── game/
│   │   │   ├── Game.ts
│   │   │   ├── Player.ts
│   │   │   ├── Alien.ts
│   │   │   ├── Bullet.ts
│   │   │   └── Barrier.ts
│   │   └── lib/
│   │       ├── formatters.ts
│   │       ├── contractAbi.ts
│   │       └── gameLogic.ts
│   ├── package.json
│   ├── next.config.js
│   └── tailwind.config.js
│
├── docs/
│   ├── GAMEPLAY.md
│   └── TOKENOMICS.md
│
├── .gitignore
├── README.md
└── LICENSE
```

## 🚀 Getting Started

### Prerequisites

**For Smart Contract:**
- OneChain CLI (Move compiler)
- Git

**For Frontend:**
- Node.js 18+ and npm
- OneWallet browser extension

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/alien-invaders-gamefi
cd alien-invaders-gamefi
```

#### 2. Smart Contract Setup

```bash
cd move

# Compile contract
one move build

# Run tests
one move test

# Deploy to testnet
one move publish --profile testnet --gas-budget 50000000

# Initialize prize pool
one client ptb \
  --move-call PACKAGE_ID::GameFi::initialize 10000000000 \
  --gas-budget 20000000
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your contract details

# Start development server
npm run dev
```

Visit `http://localhost:3000` to play!

## 📦 Dependencies

### Smart Contract (Move)

```toml
[dependencies]
One = { git = "https://github.com/one-chain-labs/onechain.git", subdir = "crates/sui-framework/packages/one-framework", rev = "main" }
```

### Frontend (Next.js)

**Core:**
```bash
npm install next@^14.1.0 react@^18.2.0 react-dom@^18.2.0
npm install typescript@^5.3.3
```

**OneChain Integration:**
```bash
npm install @mysten/sui.js@^0.50.1
npm install @mysten/dapp-kit@^0.11.7
npm install @mysten/wallet-standard@^0.10.3
npm install @tanstack/react-query@^5.17.19
```

**Styling:**
```bash
npm install tailwindcss@^3.4.1 autoprefixer@^10.4.17 postcss@^8.4.33
npm install lucide-react@^0.316.0
npm install clsx@^2.1.0
```

**Utilities:**
```bash
npm install date-fns@^3.3.1
```

## 🎯 Game Mechanics

### Entry System
1. Player selects stake amount (10, 50, or 100 OCT)
2. Smart contract locks stake + entry fee
3. Game session begins
4. Score is recorded on-chain

### Reward Distribution
- **Win Condition**: Destroy all aliens
- **Bonus Pool**: 10% of all entry fees
- **Reward Formula**: `(Score / HighScore) * StakeAmount * Multiplier`
- **Maximum Payout**: Based on stake tier

### Anti-Cheat
- Score verification via blockchain
- Time-based validation
- Pattern detection for bot prevention
- Community reporting system

## 🔐 Smart Contract Functions

### Player Functions

```move
// Start a new game session
public entry fun start_game(
    pool: &mut GamePool,
    stake: Coin<OCT>,
    stake_tier: u64,
    ctx: &mut TxContext
)

// Submit score and claim rewards
public entry fun end_game(
    pool: &mut GamePool,
    session: GameSession,
    score: u64,
    ctx: &mut TxContext
)

// Emergency exit (forfeit rewards)
public entry fun forfeit_game(
    pool: &mut GamePool,
    session: GameSession,
    ctx: &TxContext
)
```

### View Functions

```move
// Get pool statistics
public fun get_pool_info(pool: &GamePool): (u64, u64, u64)

// Get player session info
public fun get_session_info(session: &GameSession): (u64, u64, bool)

// Calculate potential reward
public fun calculate_reward(stake: u64, score: u64, tier: u64): u64
```

## 📊 Tokenomics

### Prize Pool Distribution
- **70%**: Player rewards
- **20%**: Prize pool accumulation
- **10%**: Platform maintenance

### Stake Tiers

**Tier 1: Casual (10 OCT)**
- Entry Fee: 1 OCT
- Max Multiplier: 5x
- Max Reward: 50 OCT

**Tier 2: Competitive (50 OCT)**
- Entry Fee: 5 OCT
- Max Multiplier: 10x
- Max Reward: 500 OCT

**Tier 3: Pro (100 OCT)**
- Entry Fee: 10 OCT
- Max Multiplier: 20x
- Max Reward: 2000 OCT

## 🏆 Leaderboard System

- **Daily Rankings**: Top 10 players each day
- **Weekly Champions**: Highest cumulative scores
- **All-Time Records**: Permanent hall of fame
- **Bonus Rewards**: Extra OCT for top performers

## 🧪 Testing

### Smart Contract Tests

```bash
cd move
one move test

# Run specific test
one move test test_start_game

# Verbose output
one move test -v
```

### Frontend Testing

```bash
cd frontend
npm run test
npm run test:e2e
```

## 🔧 Development

### Local Development

```bash
# Terminal 1: Run local OneChain node (if available)
one start --network local

# Terminal 2: Deploy contract
cd move && one move publish --profile local

# Terminal 3: Run frontend
cd frontend && npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_PACKAGE_ID=0x...
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_ONECHAIN_RPC=https://rpc.testnet.onechain.network
NEXT_PUBLIC_MIN_STAKE=10000000
NEXT_PUBLIC_MAX_STAKE=100000000
```

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Current)
- Basic Space Invaders gameplay
- Stake-to-play mechanism
- Simple reward distribution
- Leaderboard system

### 🔄 Phase 2: Enhanced Gaming (Q1 2026)
- Multiple difficulty levels
- Power-ups and special weapons
- Tournament mode
- Team battles

### 📅 Phase 3: Social Features (Q2 2026)
- Friend challenges
- Guild system
- Spectator mode
- Live streaming integration

### 🚀 Phase 4: Ecosystem Expansion (Q3 2026)
- NFT aliens (collectibles)
- Seasonal events
- Cross-game rewards
- Mobile app

## 🎨 Game Controls

- **Arrow Left/Right**: Move player
- **Spacebar**: Shoot
- **P**: Pause game
- **R**: Restart (after game over)

## 📚 Resources

- **OneChain Official**: https://onelabs.cc/
- **Telegram Community**: https://t.me/hello_onechain
- **GitHub**: https://github.com/one-chain-labs
- **Move Language**: https://move-language.github.io/move/
- **Game Design Doc**: [docs/GAMEPLAY.md](docs/GAMEPLAY.md)
- **Tokenomics**: [docs/TOKENOMICS.md](docs/TOKENOMICS.md)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 👥 Team

**[Your Name]** - Full Stack Blockchain Game Developer
- Smart Contract Development (Move)
- Game Development (TypeScript)
- OneChain Integration

## 🎉 Acknowledgments

- OneChain team for blockchain infrastructure
- OneHack organizers
- Space Invaders (Taito, 1978) for inspiration
- Move language community

## 📞 Contact

- **Telegram**: @your_handle
- **Email**: your.email@example.com
- **Twitter**: @your_twitter
- **Discord**: YourName#1234

---

**🎮 Play. Stake. Earn. Repeat. 🚀**

**Built with ❤️ on OneChain for OneHack**
