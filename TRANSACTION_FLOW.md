# 🎮 Transaction Flow & UI Updates

## ✅ Updated UI Behavior

### 1. **Level Complete Modal**
When a player completes a level (destroys all aliens):
- ✅ Shows **only "Continue to Level X"** button
- ✅ Displays amount earned this level (+1 OCT)
- ✅ Shows total accumulated earnings
- ✅ **Requires wallet signature** to proceed
- ✅ Note displayed: "(Requires wallet signature)"

**Why signature is required:**
- Calls `complete_level()` on smart contract
- Awards 1 OCT to the session
- Updates session state to next level
- Modifies blockchain state = requires signature

### 2. **Victory Modal** (After Level 5)
When a player completes all 5 levels:
- ✅ Shows **only "Claim Rewards"** button
- ✅ Prominently displays total rewards (5 OCT) in large green box
- ✅ **Requires wallet signature** to claim
- ✅ Redirects to home/menu after successful claim
- ✅ Resets all game state

### 3. **Game Over Modal** (Time Expires or Hit by Alien)
When a player loses before completing all levels:
- ✅ Shows **only "Claim Rewards"** button if earnings > 0
- ✅ Prominently displays earned rewards in large green box
- ✅ **Requires wallet signature** to claim
- ✅ Redirects to home/menu after successful claim
- ✅ If no earnings (lost on level 1), shows "Try Again" button instead

## 🔐 Transaction Signatures Required

### Transaction 1: Start Game
**Function:** `start_game()`
**When:** Player clicks "Start Game" button
**What it does:**
- Creates a new GameSession object
- Validates reward pool has enough funds
- Increments total games counter
**Signature:** ✅ Required

### Transaction 2: Complete Level
**Function:** `complete_level()`
**When:** Player clicks "Continue to Level X" after completing a level
**What it does:**
- Awards 1 OCT to the session
- Increments levels_completed counter
- Updates total_earned
- Moves to next level (or ends game if level 5)
**Signature:** ✅ Required

### Transaction 3: End Game (Optional)
**Function:** `end_game()`
**When:** Player loses (time expires or hit by alien)
**What it does:**
- Sets session.is_active = false
- Allows player to claim accumulated rewards
**Signature:** ✅ Required (auto-called by frontend)

### Transaction 4: Claim Rewards
**Function:** `claim_rewards()`
**When:** Player clicks "Claim Rewards" button
**What it does:**
- Transfers accumulated OCT from pool to player's wallet
- Deletes the GameSession object
- Updates total rewards distributed counter
**Signature:** ✅ Required

## 📊 Game Flow with Signatures

```
START GAME (Sign) 
    ↓
Level 1 - Play
    ↓
Complete Level 1
    ↓
COMPLETE LEVEL (Sign) → Awards 1 OCT
    ↓
Level 2 - Play
    ↓
Complete Level 2
    ↓
COMPLETE LEVEL (Sign) → Awards 1 OCT
    ↓
... (repeat for levels 3, 4, 5)
    ↓
Complete Level 5
    ↓
COMPLETE LEVEL (Sign) → Awards 1 OCT, Game Ends
    ↓
Victory Modal Shows: "5 OCT"
    ↓
CLAIM REWARDS (Sign) → Transfer 5 OCT to wallet
    ↓
Redirect to Home
```

## 🎯 Example Scenarios

### Scenario 1: Complete All 5 Levels
1. **Start Game** (Sign) - Create session
2. **Complete Level 1** (Sign) - Award 1 OCT
3. **Complete Level 2** (Sign) - Award 1 OCT
4. **Complete Level 3** (Sign) - Award 1 OCT
5. **Complete Level 4** (Sign) - Award 1 OCT
6. **Complete Level 5** (Sign) - Award 1 OCT, end game
7. **Claim 5 OCT** (Sign) - Transfer to wallet
8. **Redirect to home**

**Total Signatures:** 7

### Scenario 2: Lose at Level 3
1. **Start Game** (Sign) - Create session
2. **Complete Level 1** (Sign) - Award 1 OCT
3. **Complete Level 2** (Sign) - Award 1 OCT
4. **Lose at Level 3** (Auto end_game)
5. **Claim 2 OCT** (Sign) - Transfer to wallet
6. **Redirect to home**

**Total Signatures:** 4

### Scenario 3: Lose at Level 1 (No Earnings)
1. **Start Game** (Sign) - Create session
2. **Lose at Level 1** (Auto end_game)
3. **No claim button** - Shows "Try Again" instead
4. **Click Try Again** - Returns to menu

**Total Signatures:** 1

## 🔄 Auto-Called Transactions

The frontend automatically calls `end_game()` when:
- Time expires on any level
- Player is hit by an alien bullet
- Aliens reach the bottom

This sets `is_active = false` and allows the player to claim their accumulated rewards.

## 💡 Key Points

1. **Every level completion requires a signature** - This is necessary because each level awards 1 OCT on-chain

2. **Claim always redirects to home** - After claiming rewards, the player is returned to the main menu

3. **No "Try Again" with earnings** - If the player has earned any OCT, they must claim it first (can't restart without claiming)

4. **Clear signature indicators** - All buttons that require signatures show "(Requires wallet signature)" below them

5. **Prominent reward display** - The claim modals show the reward amount in a large, highlighted box so players know exactly what they're claiming

## 🎨 UI Improvements Made

- ✅ Removed "Claim" option from level complete modal (only "Next Level")
- ✅ Removed "Try Again" option when player has earnings (only "Claim Rewards")
- ✅ Added large, highlighted reward boxes on claim modals
- ✅ Added signature requirement notes
- ✅ Added emoji indicators (🎉 for victory, 💥 for game over)
- ✅ Made claim buttons full-width for emphasis
- ✅ Added proper redirect to home after claiming

## 📝 Implementation Notes

The current implementation has placeholder comments for blockchain integration:

```typescript
// TODO: Sign transaction to call complete_level() on smart contract
// await signAndExecuteTransaction({ ... complete_level ... })

// TODO: Sign transaction to call claim_rewards() on smart contract
// await signAndExecuteTransaction({ ... claim_rewards ... })
```

When integrating with the actual blockchain:
1. Import Sui wallet hooks from `@mysten/dapp-kit`
2. Build transaction blocks for each function
3. Call `signAndExecuteTransaction` with proper parameters
4. Handle success/error states
5. Update UI based on transaction results
