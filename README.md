# 🎮 Alien Invaders GameFi - OneChain Play-to-Earn Platform

A decentralized play-to-earn Space Invaders game built on OneChain where players earn OCT tokens based on their performance.

[![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](https://dream-game-nine.vercel.app/)


## 📋 Overview

**Alien Invaders GameFi** combines classic arcade gameplay with blockchain economics. Players enter games for free, compete for high scores, and earn rewards from a shared prize pool. The better you play, the more you earn!

### Key Features

- 🎮 **Classic Space Invaders Gameplay**: Nostalgic arcade action with 5 increasingly difficult levels.
- 💰 **Play-to-Earn**: Earn OCT tokens for every level completed.
- 🆓 **Free-to-Play**: No staking or entry fees required. Just connect and play.
- 🔒 **Secure Smart Contracts**: Game logic and rewards are managed by a Move smart contract on OneChain.
- ⚡ **Instant Rewards**: Claim your earnings immediately after the game.
- 🌐 **Web3 Integration**: Seamless wallet connection using OneWallet.

## 🎮 How to Play

1. **Connect Wallet**: Connect your OneWallet to the application.
2. **Start Game**: Click "Start Game" to begin a new session. This initiates a transaction on the blockchain.
3. **Play**:
   - Use **Arrow Keys** to move left and right.
   - Press **Spacebar** to shoot.
   - Destroy all aliens to advance to the next level.
   - You have 60 seconds per level.
4. **Earn**:
   - Complete Level 1: Earn 2 OCT
   - Complete Level 2: Earn 4 OCT
   - ...up to 10 OCT for completing all 5 levels.
5. **Claim**: After the game ends (victory or game over), click "Claim Rewards" to withdraw your earnings to your wallet.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4, Lucide React
- **Blockchain**: OneChain (Sui-based)
- **Smart Contract**: Move Language
- **SDK**: @mysten/dapp-kit, @mysten/sui

## 🚀 Deployment Information

The smart contract is deployed on the **OneChain Testnet**.

- **Package ID:** `0x507b64f3517b3a46cb1f110af6219229c1cdc7dca52cd0b12e15d6fdcad45da0`
- **GamePool ID:** `0x327d185890ea2571c5ffa7702032c7d6b9bfd8962e467197563c3f530f9fa20b`
- **Network:** OneChain Testnet
- **RPC URL:** `https://rpc-testnet.onelabs.cc:443`

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+
- OneChain Wallet (e.g., OneWallet)

### 1. Clone the Repository

```bash
git clone https://github.com/Godbrand0/DreamGame.git
cd DreamGame
```

### 2. Install Dependencies

```bash
cd front
npm install
```

### 3. Configure Environment

Create a `.env.local` file in the `front` directory with the following variables:

```env
NEXT_PUBLIC_PACKAGE_ID=0x507b64f3517b3a46cb1f110af6219229c1cdc7dca52cd0b12e15d6fdcad45da0
NEXT_PUBLIC_GAMEPOOL_ID=0x327d185890ea2571c5ffa7702032c7d6b9bfd8962e467197563c3f530f9fa20b
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_ONECHAIN_RPC=https://rpc-testnet.onelabs.cc:443
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Smart Contract Architecture

The game is powered by the `AlienInvaders` Move module.

### Key Functions

- `start_game`: Initializes a new game session.
- `complete_level`: Verifies level completion and updates session state.
- `claim_rewards`: Distributes earned OCT tokens to the player.
- `fund_contract`: Allows the admin to deposit OCT into the reward pool.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
