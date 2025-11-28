# OneChain Deployment - Quick Reference

## 🚀 Deployed## Contract Addresses

- **Package ID:** `0x507b64f3517b3a46cb1f110af6219229c1cdc7dca52cd0b12e15d6fdcad45da0`
- **GamePool ID:** `0x327d185890ea2571c5ffa7702032c7d6b9bfd8962e467197563c3f530f9fa20b`
- **Network:** OneChain Testnet
- **RPC URL:** `https://rpc-testnet.onelabs.cc:443`
- **Deployer Address:** `0xbe4b02b2b2836c1810c96d01441e161ed0ac445c89204fa9ca1f2fc84603a313`

---

## 📝 Environment Variables for Frontend

Add these to your `.env.local`:

```bash
NEXT_PUBLIC_ONECHAIN_PACKAGE_ID=0x97f4a5f123a5e5e202a85c85bca059b54dc33e58044626a2ccb63910ef81bb46
NEXT_PUBLIC_GAMEPOOL_ID=0xb8405d81d3e4653d1f6d10e2fc6d123cafc1caa0a9ee2f4e48ee085fee6fef9c
NEXT_PUBLIC_ONECHAIN_RPC=https://rpc-testnet.onelabs.cc:443
```

---

## 🎮 Quick Commands

### Start a Game
```bash
one client call \
  --package 0x97f4a5f123a5e5e202a85c85bca059b54dc33e58044626a2ccb63910ef81bb46 \
  --module AlienInvaders \
  --function start_game \
  --args 0xb8405d81d3e4653d1f6d10e2fc6d123cafc1caa0a9ee2f4e48ee085fee6fef9c \
  --gas-budget 10000000
```

### Complete Level (Example: Level 1, 11 aliens destroyed)
```bash
one client call \
  --package 0x97f4a5f123a5e5e202a85c85bca059b54dc33e58044626a2ccb63910ef81bb46 \
  --module AlienInvaders \
  --function complete_level \
  --args 0xb8405d81d3e4653d1f6d10e2fc6d123cafc1caa0a9ee2f4e48ee085fee6fef9c <SESSION_ID> 1 <SCORE> 11 \
  --gas-budget 10000000
```

### Claim Rewards
```bash
one client call \
  --package 0x97f4a5f123a5e5e202a85c85bca059b54dc33e58044626a2ccb63910ef81bb46 \
  --module AlienInvaders \
  --function claim_rewards \
  --args 0xb8405d81d3e4653d1f6d10e2fc6d123cafc1caa0a9ee2f4e48ee085fee6fef9c <SESSION_ID> \
  --gas-budget 10000000
```

---

## 💰 Game Economics

- **Reward per Level**: 2 OCT
- **Total Levels**: 5
- **Max Earnings**: 10 OCT per complete game
- **Level Duration**: 60 seconds each

### Alien Count per Level
- Level 1: 11 aliens
- Level 2: 22 aliens
- Level 3: 33 aliens
- Level 4: 44 aliens
- Level 5: 55 aliens

---

## ⚠️ Important Notes

1. **Contract needs funding**: Before players can claim rewards, you need to fund the contract with OCT tokens using the `fund_contract` function.

2. **Session IDs**: Each game creates a new session with a unique ID. Players need this ID to complete levels and claim rewards.

3. **Anti-cheat**: The contract validates:
   - Correct number of aliens destroyed for each level
   - 60-second time limit per level
   - Unique level hashes (prevents replay attacks)

---

## 🔗 Useful Links

- [OneChain Testnet Explorer](https://explorer-testnet.onelabs.cc/)
- [View Package](https://explorer-testnet.onelabs.cc/object/0x97f4a5f123a5e5e202a85c85bca059b54dc33e58044626a2ccb63910ef81bb46)
- [View GamePool](https://explorer-testnet.onelabs.cc/object/0xb8405d81d3e4653d1f6d10e2fc6d123cafc1caa0a9ee2f4e48ee085fee6fef9c)

---

**Deployment Date**: 2025-11-27  
**Status**: ✅ Live on OneChain Testnet
