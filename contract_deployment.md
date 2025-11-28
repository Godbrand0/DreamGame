# Alien Invaders GameFi - Deployment Information

## Contract Addresses

### Package ID (Main Contract Address)

```
0x1348d5e4db62b5e1cb4a349b5f44bc464a0be81a299dc557d118bdde906563bb
```

### OCT Token Treasury Cap

```
0x16149ccd22e6f6f9b1534589b2eb60ccf15bea1f6d9796c6010f9a42b12a4ab4
```

**Type**: `0x2::coin::TreasuryCap<0x1348d5e4db62b5e1cb4a349b5f44bc464a0be81a299dc557d118bdde906563bb::AlienInvaders::ALIENINVADERS>`

### OCT Token Metadata

```
0x6eb8fed02ff20678300441a870315971757cff30337d84c253a382b17c13d126
```

**Type**: `0x2::coin::CoinMetadata<0x1348d5e4db62b5e1cb4a349b5f44bc464a0be81a299dc557d118bdde906563bb::AlienInvaders::ALIENINVADERS>` (Immutable)

### Upgrade Cap

```
0x75802e4e9befce1dba3e367d8d53092cd1f3a4fa92dd7aec93c101724705633e
```

### Network

**Sui Testnet** (also compatible with OneChain testnet)

### Deployer Address

```
0x28e43abc4f07bef61095787f9a9a660df53e1ccd8c6bcedd93556beb097d9963
```

---

## Contract ABI

### Module Name

`gamefi::AlienInvaders`

### Token Information

- **Symbol**: OCT
- **Name**: Octopus Token
- **Description**: Game reward token for Alien Invaders
- **Decimals**: 6
- **Reward per Level**: 2,000,000 (2 OCT)
- **Max Levels**: 5
- **Level Duration**: 60,000 ms (60 seconds)

---

## Public Entry Functions

### 1. Initialize Game Pool

```move
public entry fun initialize(ctx: &mut TxContext)
```

**Description**: Initialize the game pool (called once by contract owner)

**Parameters**:

- `ctx`: Transaction context

**Creates**: Shared `GamePool` object

---

### 2. Fund Contract

```move
public entry fun fund_contract(
    pool: &mut GamePool,
    payment: Coin<ALIENINVADERS>,
    ctx: &TxContext
)
```

**Description**: Add OCT tokens to the reward pool (owner only)

**Parameters**:

- `pool`: Mutable reference to GamePool
- `payment`: OCT tokens to add
- `ctx`: Transaction context

**Emits**: `ContractFunded` event

---

### 3. Start Game

```move
public entry fun start_game(
    pool: &mut GamePool,
    ctx: &mut TxContext
)
```

**Description**: Start a new game session

**Parameters**:

- `pool`: Mutable reference to GamePool
- `ctx`: Transaction context

**Emits**: `GameStarted` event

**Returns**: Creates a new game session

---

### 4. Complete Level

```move
public entry fun complete_level(
    pool: &mut GamePool,
    session_id: u64,
    level: u64,
    score: u64,
    aliens_destroyed: u64,
    ctx: &mut TxContext
)
```

**Description**: Complete a level and award rewards

**Parameters**:

- `pool`: Mutable reference to GamePool
- `session_id`: ID of the game session
- `level`: Level number (1-5)
- `score`: Player's score
- `aliens_destroyed`: Number of aliens destroyed (must match expected count)
- `ctx`: Transaction context

**Emits**: `LevelCompleted` event, optionally `GameCompleted` event

**Validation**:

- Level must match current level
- Time limit not exceeded
- Aliens destroyed must equal `level * 11`

---

### 5. Abandon Game

```move
public entry fun abandon_game(
    pool: &mut GamePool,
    session_id: u64,
    ctx: &mut TxContext
)
```

**Description**: Abandon the current game session (player quits or loses)

**Parameters**:

- `pool`: Mutable reference to GamePool
- `session_id`: ID of the game session
- `ctx`: Transaction context

**Emits**: `GameAbandoned` event

**Note**: Player keeps rewards for completed levels

---

### 6. Claim Rewards

```move
public entry fun claim_rewards(
    pool: &mut GamePool,
    session_id: u64,
    ctx: &mut TxContext
)
```

**Description**: Claim accumulated rewards from completed levels

**Parameters**:

- `pool`: Mutable reference to GamePool
- `session_id`: ID of the game session
- `ctx`: Transaction context

**Emits**: `RewardsClaimed` event

**Transfers**: OCT tokens to player

---

### 7. Pause Contract

```move
public entry fun pause(pool: &mut GamePool, ctx: &TxContext)
```

**Description**: Pause the contract (emergency only, owner only)

**Parameters**:

- `pool`: Mutable reference to GamePool
- `ctx`: Transaction context

---

### 8. Unpause Contract

```move
public entry fun unpause(pool: &mut GamePool, ctx: &TxContext)
```

**Description**: Unpause the contract (owner only)

**Parameters**:

- `pool`: Mutable reference to GamePool
- `ctx`: Transaction context

---

### 9. Withdraw Funds

```move
public entry fun withdraw(
    pool: &mut GamePool,
    amount: u64,
    ctx: &mut TxContext
)
```

**Description**: Withdraw funds from contract (owner only)

**Parameters**:

- `pool`: Mutable reference to GamePool
- `amount`: Amount to withdraw (in smallest unit)
- `ctx`: Transaction context

**Emits**: `OwnerWithdraw` event

---

## View Functions (Read-Only)

### 1. Get Session Info

```move
public fun get_session_info(pool: &GamePool, session_id: u64): (
    address,  // player
    u64,      // current_level
    u64,      // levels_completed
    u64,      // total_rewards_earned
    u64,      // start_time
    bool,     // is_active
    bool      // is_completed
)
```

### 2. Get Player Sessions

```move
public fun get_player_sessions(pool: &GamePool, player: address): vector<u64>
```

### 3. Get Level Time Remaining

```move
public fun get_level_time_remaining(
    pool: &GamePool,
    session_id: u64,
    current_time: u64
): u64
```

### 4. Get Contract Balance

```move
public fun get_contract_balance(pool: &GamePool): u64
```

### 5. Get Player Total Rewards

```move
public fun get_player_total_rewards(pool: &GamePool, player: address): u64
```

### 6. Get Pool Info

```move
public fun get_pool_info(pool: &GamePool): (u64, u64, u64)
// Returns: (reward_pool_balance, total_games, total_rewards_distributed)
```

### 7. Get Alien Count for Level

```move
public fun get_alien_count_for_level(level: u64): u64
```

**Returns**: `level * 11` aliens

### 8. Calculate Total Reward

```move
public fun calculate_total_reward(levels_completed: u64): u64
```

**Returns**: `levels_completed * 2,000,000` (in smallest unit)

---

## Events

### GameStarted

```move
public struct GameStarted has copy, drop {
    session_id: u64,
    player: address,
    start_time: u64,
}
```

### LevelCompleted

```move
public struct LevelCompleted has copy, drop {
    session_id: u64,
    player: address,
    level: u64,
    level_hash: u256,
}
```

### GameCompleted

```move
public struct GameCompleted has copy, drop {
    session_id: u64,
    player: address,
    total_rewards: u64,
}
```

### RewardsClaimed

```move
public struct RewardsClaimed has copy, drop {
    session_id: u64,
    player: address,
    amount: u64,
}
```

### GameAbandoned

```move
public struct GameAbandoned has copy, drop {
    session_id: u64,
    player: address,
    levels_completed: u64,
    partial_rewards: u64,
}
```

### OwnerWithdraw

```move
public struct OwnerWithdraw has copy, drop {
    owner: address,
    amount: u64,
}
```

### ContractFunded

```move
public struct ContractFunded has copy, drop {
    funder: address,
    amount: u64,
}
```

---

## Error Codes

| Code | Name                           | Description                                        |
| ---- | ------------------------------ | -------------------------------------------------- |
| 0    | `ENoActiveSession`             | No active game session                             |
| 1    | `ESessionNotActive`            | Session not active                                 |
| 2    | `EInvalidLevel`                | Invalid level number                               |
| 3    | `ELevelAlreadyCompleted`       | Level already completed                            |
| 4    | `ELevelTimeExpired`            | Level time expired                                 |
| 5    | `EInvalidLevelHash`            | Invalid level hash                                 |
| 6    | `ELevelHashAlreadyUsed`        | Level hash already used (replay attack prevention) |
| 7    | `ENoRewardsToClaim`            | No rewards to claim                                |
| 8    | `EInsufficientContractBalance` | Insufficient contract balance                      |
| 9    | `EInvalidSession`              | Invalid session                                    |
| 10   | `ENotSessionOwner`             | Not session owner                                  |
| 11   | `ENotOwner`                    | Only contract owner                                |
| 12   | `EContractPaused`              | Contract is paused                                 |

---

## Structs

### GamePool (Shared Object)

```move
public struct GamePool has key {
    id: UID,
    reward_pool: Balance<ALIENINVADERS>,
    total_games: u64,
    total_rewards_distributed: u64,
    owner: address,
    game_session_ids: u64,
    game_sessions: Table<u64, GameSession>,
    player_sessions: Table<address, vector<u64>>,
    player_total_rewards: Table<address, u64>,
    level_hash_used: Table<u256, bool>,
    is_paused: bool,
}
```

### GameSession

```move
public struct GameSession has store {
    session_id: u64,
    player: address,
    current_level: u64,
    levels_completed: u64,
    total_rewards_earned: u64,
    start_time: u64,
    level_start_time: u64,
    is_active: bool,
    is_completed: bool,
    level_hashes: vector<u256>,
}
```

---

## Game Mechanics

### Level Progression

- **Level 1**: 11 aliens
- **Level 2**: 22 aliens
- **Level 3**: 33 aliens
- **Level 4**: 44 aliens
- **Level 5**: 55 aliens

### Rewards

- **Per Level**: 2 OCT (2,000,000 in smallest unit)
- **Total for 5 Levels**: 10 OCT (10,000,000 in smallest unit)

### Time Limits

- Each level must be completed within 60 seconds
- Timer resets for each new level

### Anti-Cheat

- Level hashes prevent replay attacks
- Alien count validation ensures proper gameplay
- Session ownership verification

---

## Deployment Transaction

**Digest**: `34v6YM42RU3NbV64B3mmxSuL5Q3KbDcxepWERik9oBYa`  
**Timestamp**: 1764274873975 (2025-11-27)  
**Gas Used**: 47,134,280 MIST (0.047 SUI)

---

## Usage Example

### TypeScript/JavaScript (using @mysten/sui.js)

```typescript
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";

const PACKAGE_ID =
  "0x1348d5e4db62b5e1cb4a349b5f44bc464a0be81a299dc557d118bdde906563bb";
const GAME_POOL_ID = "<shared_game_pool_object_id>"; // Created after calling initialize

// Start a game
const tx = new TransactionBlock();
tx.moveCall({
  target: `${PACKAGE_ID}::AlienInvaders::start_game`,
  arguments: [tx.object(GAME_POOL_ID)],
});

// Complete a level
tx.moveCall({
  target: `${PACKAGE_ID}::AlienInvaders::complete_level`,
  arguments: [
    tx.object(GAME_POOL_ID),
    tx.pure(sessionId, "u64"),
    tx.pure(level, "u64"),
    tx.pure(score, "u64"),
    tx.pure(aliensDestroyed, "u64"),
  ],
});

// Claim rewards
tx.moveCall({
  target: `${PACKAGE_ID}::AlienInvaders::claim_rewards`,
  arguments: [tx.object(GAME_POOL_ID), tx.pure(sessionId, "u64")],
});
```

---

## Next Steps

1. **Initialize the Game Pool**: Call `initialize()` to create the shared GamePool object
2. **Mint OCT Tokens**: Use the TreasuryCap to mint OCT tokens for the reward pool
3. **Fund the Contract**: Call `fund_contract()` with minted OCT tokens
4. **Integrate Frontend**: Use the package ID and ABI to build your game frontend
5. **Test Gameplay**: Start games, complete levels, and claim rewards

---

## Support

For issues or questions, refer to the contract source code or Sui documentation:

- [Sui Documentation](https://docs.sui.io/)
- [Sui Move by Example](https://examples.sui.io/)
