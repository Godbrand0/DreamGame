/// Space Invaders GameFi - Play-to-Earn Space Invaders Game
/// Players progress through 5 levels, earning 2 CELO per level completed
/// Converted from Solidity to Move with equivalent functionality
module gamefi::AlienInvaders;

use one::coin::{Self, Coin};
use one::balance::{Self, Balance};
use one::event;
use one::table::{Self, Table};
use one::oct::OCT;

// === Error Codes ===

/// No active game session
const ENoActiveSession: u64 = 0;
/// Session not active
const ESessionNotActive: u64 = 1;
/// Invalid level number
const EInvalidLevel: u64 = 2;
/// Level already completed
const ELevelAlreadyCompleted: u64 = 3;
/// Level time expired
const ELevelTimeExpired: u64 = 4;
/// Invalid level hash
const EInvalidLevelHash: u64 = 5;
/// Level hash already used (replay attack prevention)
const ELevelHashAlreadyUsed: u64 = 6;
/// No rewards to claim
const ENoRewardsToClaim: u64 = 7;
/// Insufficient contract balance
const EInsufficientContractBalance: u64 = 8;
/// Invalid session
const EInvalidSession: u64 = 9;
/// Not session owner
const ENotSessionOwner: u64 = 10;
/// Only contract owner
const ENotOwner: u64 = 11;
/// Contract is paused
const EContractPaused: u64 = 12;

// === Constants ===

/// Reward per level (2 OCT = 2,000,000 in smallest unit, assuming 6 decimals)
const REWARD_PER_LEVEL: u64 = 2000000;

/// Maximum levels in game
const MAX_LEVELS: u64 = 5;

/// Time limit per level in milliseconds (60 seconds)
const LEVEL_DURATION: u64 = 60000;

/// Aliens per row
const ALIENS_PER_ROW: u64 = 11;

// === Structs ===

/// Global game pool managed by contract owner
public struct GamePool has key {
    id: UID,
    /// Reward pool funded by owner (OCT tokens)
    reward_pool: Balance<OCT>,
    /// Total games played
    total_games: u64,
    /// Total rewards distributed
    total_rewards_distributed: u64,
    /// Contract owner
    owner: address,
    /// Game session counter
    game_session_ids: u64,
    /// Mapping of session ID to game sessions
    game_sessions: Table<u64, GameSession>,
    /// Mapping of player to their session IDs
    player_sessions: Table<address, vector<u64>>,
    /// Mapping of player to total rewards earned
    player_total_rewards: Table<address, u64>,
    /// Mapping of level hash to usage status (replay attack prevention)
    level_hash_used: Table<u256, bool>,
    /// Contract paused status
    is_paused: bool,
}

/// Individual player game session
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

// === Events ===

public struct GameStarted has copy, drop {
    session_id: u64,
    player: address,
    start_time: u64,
}

public struct LevelCompleted has copy, drop {
    session_id: u64,
    player: address,
    level: u64,
    level_hash: u256,
}

public struct GameCompleted has copy, drop {
    session_id: u64,
    player: address,
    total_rewards: u64,
}

public struct RewardsClaimed has copy, drop {
    session_id: u64,
    player: address,
    amount: u64,
}

public struct GameAbandoned has copy, drop {
    session_id: u64,
    player: address,
    levels_completed: u64,
    partial_rewards: u64,
}

public struct OwnerWithdraw has copy, drop {
    owner: address,
    amount: u64,
}

public struct ContractFunded has copy, drop {
    funder: address,
    amount: u64,
}

// === Public Functions ===

/// Initialize the game pool (called once by contract owner)
public entry fun initialize(ctx: &mut TxContext) {
    let pool = GamePool {
        id: object::new(ctx),
        reward_pool: balance::zero<OCT>(),
        total_games: 0,
        total_rewards_distributed: 0,
        owner: ctx.sender(),
        game_session_ids: 0,
        game_sessions: table::new(ctx),
        player_sessions: table::new(ctx),
        player_total_rewards: table::new(ctx),
        level_hash_used: table::new(ctx),
        is_paused: false,
    };
    
    transfer::share_object(pool);
}

/// Fund the contract with OCT tokens (owner only)
public entry fun fund_contract(
    pool: &mut GamePool,
    payment: Coin<OCT>,
    ctx: &TxContext
) {
    assert!(pool.owner == ctx.sender(), ENotOwner);
    let amount = coin::value(&payment);
    balance::join(&mut pool.reward_pool, coin::into_balance(payment));
    
    event::emit(ContractFunded {
        funder: ctx.sender(),
        amount,
    });
}

/// Start a new game session
public entry fun start_game(
    pool: &mut GamePool,
    ctx: &mut TxContext
) {
    assert!(!pool.is_paused, EContractPaused);
    
    // Increment session counter
    pool.game_session_ids = pool.game_session_ids + 1;
    let session_id = pool.game_session_ids;
    
    let current_time = ctx.epoch_timestamp_ms();
    
    let session = GameSession {
        session_id,
        player: ctx.sender(),
        current_level: 1,
        levels_completed: 0,
        total_rewards_earned: 0,
        start_time: current_time,
        level_start_time: current_time,
        is_active: true,
        is_completed: false,
        level_hashes: vector::empty(),
    };
    
    // Add session to mappings
    table::add(&mut pool.game_sessions, session_id, session);
    
    // Add session ID to player's sessions
    if (!table::contains(&pool.player_sessions, ctx.sender())) {
        table::add(&mut pool.player_sessions, ctx.sender(), vector::empty());
    };
    let player_session_list = table::borrow_mut(&mut pool.player_sessions, ctx.sender());
    vector::push_back(player_session_list, session_id);
    
    pool.total_games = pool.total_games + 1;
    
    event::emit(GameStarted {
        session_id,
        player: ctx.sender(),
        start_time: current_time,
    });
}

/// Complete a level and award rewards
public entry fun complete_level(
    pool: &mut GamePool,
    session_id: u64,
    level: u64,
    score: u64,
    aliens_destroyed: u64,
    ctx: &mut TxContext
) {
    assert!(!pool.is_paused, EContractPaused);
    assert!(table::contains(&pool.game_sessions, session_id), EInvalidSession);
    
    let session = table::borrow_mut(&mut pool.game_sessions, session_id);
    
    // Validate session owner
    assert!(session.player == ctx.sender(), ENotSessionOwner);
    assert!(session.is_active, ESessionNotActive);
    
    // Validate level
    assert!(level == session.current_level && level <= MAX_LEVELS, EInvalidLevel);
    
    // Check if level time hasn't expired
    let current_time = ctx.epoch_timestamp_ms();
    assert!(current_time <= session.level_start_time + LEVEL_DURATION, ELevelTimeExpired);
    
    // Verify level completion (simplified verification)
    let expected_aliens = get_alien_count_for_level(level);
    assert!(aliens_destroyed == expected_aliens, EInvalidLevelHash);
    
    // Create level hash to prevent replay attacks
    let level_hash = create_level_hash(session_id, level, score, aliens_destroyed, current_time);
    
    assert!(!table::contains(&pool.level_hash_used, level_hash), ELevelHashAlreadyUsed);
    table::add(&mut pool.level_hash_used, level_hash, true);
    vector::push_back(&mut session.level_hashes, level_hash);
    
    // Update session state
    session.levels_completed = session.levels_completed + 1;
    session.total_rewards_earned = session.total_rewards_earned + REWARD_PER_LEVEL;
    session.current_level = session.current_level + 1;
    session.level_start_time = current_time;
    
    event::emit(LevelCompleted {
        session_id,
        player: ctx.sender(),
        level,
        level_hash,
    });
    
    // Check if game is completed
    if (session.current_level > MAX_LEVELS) {
        session.is_active = false;
        session.is_completed = true;
        
        // Update player total rewards
        if (!table::contains(&pool.player_total_rewards, ctx.sender())) {
            table::add(&mut pool.player_total_rewards, ctx.sender(), 0);
        };
        let player_total = table::borrow_mut(&mut pool.player_total_rewards, ctx.sender());
        *player_total = *player_total + session.total_rewards_earned;
        
        event::emit(GameCompleted {
            session_id,
            player: ctx.sender(),
            total_rewards: session.total_rewards_earned,
        });
    };
}

/// Abandon the current game session (called when player quits or loses)
public entry fun abandon_game(
    pool: &mut GamePool,
    session_id: u64,
    ctx: &mut TxContext
) {
    assert!(!pool.is_paused, EContractPaused);
    assert!(table::contains(&pool.game_sessions, session_id), EInvalidSession);
    
    let session = table::borrow_mut(&mut pool.game_sessions, session_id);
    
    assert!(session.player == ctx.sender(), ENotSessionOwner);
    assert!(session.is_active, ESessionNotActive);
    
    session.is_active = false;
    
    let partial_rewards = session.total_rewards_earned;
    
    // Player keeps rewards for any levels they completed before losing/quitting
    if (partial_rewards > 0) {
        if (!table::contains(&pool.player_total_rewards, ctx.sender())) {
            table::add(&mut pool.player_total_rewards, ctx.sender(), 0);
        };
        let player_total = table::borrow_mut(&mut pool.player_total_rewards, ctx.sender());
        *player_total = *player_total + partial_rewards;
    };
    
    event::emit(GameAbandoned {
        session_id,
        player: ctx.sender(),
        levels_completed: session.levels_completed,
        partial_rewards,
    });
}

/// Claim rewards earned from completed levels
public entry fun claim_rewards(
    pool: &mut GamePool,
    session_id: u64,
    ctx: &mut TxContext
) {
    assert!(!pool.is_paused, EContractPaused);
    assert!(table::contains(&pool.game_sessions, session_id), EInvalidSession);
    
    let session = table::borrow_mut(&mut pool.game_sessions, session_id);
    
    assert!(session.player == ctx.sender(), ENotSessionOwner);
    assert!(session.levels_completed > 0, ENoRewardsToClaim);
    
    let rewards_to_claim = session.total_rewards_earned;
    
    // Check contract has sufficient balance
    assert!(balance::value(&pool.reward_pool) >= rewards_to_claim, EInsufficientContractBalance);
    
    // Reset rewards to prevent double claiming
    session.total_rewards_earned = 0;
    
    // Transfer OCT tokens to player
    let reward_balance = balance::split(&mut pool.reward_pool, rewards_to_claim);
    let reward_coin = coin::from_balance(reward_balance, ctx);
    transfer::public_transfer(reward_coin, ctx.sender());
    
    event::emit(RewardsClaimed {
        session_id,
        player: ctx.sender(),
        amount: rewards_to_claim,
    });
}

/// Pause the contract (emergency only, owner only)
public entry fun pause(pool: &mut GamePool, ctx: &TxContext) {
    assert!(pool.owner == ctx.sender(), ENotOwner);
    pool.is_paused = true;
}

/// Unpause the contract (owner only)
public entry fun unpause(pool: &mut GamePool, ctx: &TxContext) {
    assert!(pool.owner == ctx.sender(), ENotOwner);
    pool.is_paused = false;
}

/// Withdraw funds from contract (owner only)
public entry fun withdraw(
    pool: &mut GamePool,
    amount: u64,
    ctx: &mut TxContext
) {
    assert!(pool.owner == ctx.sender(), ENotOwner);
    assert!(balance::value(&pool.reward_pool) >= amount, EInsufficientContractBalance);
    
    let withdrawal_balance = balance::split(&mut pool.reward_pool, amount);
    let withdrawal_coin = coin::from_balance(withdrawal_balance, ctx);
    transfer::public_transfer(withdrawal_coin, pool.owner);
    
    event::emit(OwnerWithdraw {
        owner: pool.owner,
        amount,
    });
}

// === View Functions ===

/// Get game session information
public fun get_session_info(pool: &GamePool, session_id: u64): (
    address,  // player
    u64,      // current_level
    u64,      // levels_completed
    u64,      // total_rewards_earned
    u64,      // start_time
    bool,     // is_active
    bool      // is_completed
) {
    assert!(table::contains(&pool.game_sessions, session_id), EInvalidSession);
    let session = table::borrow(&pool.game_sessions, session_id);
    
    (
        session.player,
        session.current_level,
        session.levels_completed,
        session.total_rewards_earned,
        session.start_time,
        session.is_active,
        session.is_completed
    )
}

/// Get all session IDs for a player
public fun get_player_sessions(pool: &GamePool, player: address): vector<u64> {
    if (table::contains(&pool.player_sessions, player)) {
        *table::borrow(&pool.player_sessions, player)
    } else {
        vector::empty()
    }
}

/// Get remaining time for current level
public fun get_level_time_remaining(pool: &GamePool, session_id: u64, current_time: u64): u64 {
    assert!(table::contains(&pool.game_sessions, session_id), EInvalidSession);
    let session = table::borrow(&pool.game_sessions, session_id);
    
    if (!session.is_active) {
        return 0
    };
    
    let time_elapsed = current_time - session.level_start_time;
    if (time_elapsed >= LEVEL_DURATION) {
        0
    } else {
        LEVEL_DURATION - time_elapsed
    }
}

/// Get contract's OCT token balance
public fun get_contract_balance(pool: &GamePool): u64 {
    balance::value(&pool.reward_pool)
}

/// Get player total rewards
public fun get_player_total_rewards(pool: &GamePool, player: address): u64 {
    if (table::contains(&pool.player_total_rewards, player)) {
        *table::borrow(&pool.player_total_rewards, player)
    } else {
        0
    }
}

/// Get pool information
public fun get_pool_info(pool: &GamePool): (u64, u64, u64) {
    (
        balance::value(&pool.reward_pool),
        pool.total_games,
        pool.total_rewards_distributed
    )
}

/// Calculate alien count for a given level
public fun get_alien_count_for_level(level: u64): u64 {
    if (level < 1 || level > MAX_LEVELS) {
        return 0
    };
    level * ALIENS_PER_ROW
}

/// Calculate total reward for N levels
public fun calculate_total_reward(levels_completed: u64): u64 {
    levels_completed * REWARD_PER_LEVEL
}

// === Helper Functions ===

/// Create a level hash for replay attack prevention
fun create_level_hash(
    session_id: u64,
    level: u64,
    score: u64,
    aliens_destroyed: u64,
    timestamp: u64
): u256 {
    use std::hash;
    use std::bcs;
    
    let mut data = vector::empty<u8>();
    vector::append(&mut data, bcs::to_bytes(&session_id));
    vector::append(&mut data, bcs::to_bytes(&level));
    vector::append(&mut data, bcs::to_bytes(&score));
    vector::append(&mut data, bcs::to_bytes(&aliens_destroyed));
    vector::append(&mut data, bcs::to_bytes(&timestamp));
    
    let hash_bytes = hash::sha2_256(data);
    bytes_to_u256(hash_bytes)
}

/// Convert bytes to u256
fun bytes_to_u256(bytes: vector<u8>): u256 {
    let mut result: u256 = 0;
    let len = vector::length(&bytes);
    let mut i = 0;
    
    while (i < len && i < 32) {
        let byte = *vector::borrow(&bytes, i);
        result = result * 256 + (byte as u256);
        i = i + 1;
    };
    
    result
}

// === Tests ===

#[test_only]
use sui::test_scenario::{Self as ts, Scenario};
#[test_only]
use sui::test_utils;

#[test_only]
const ADMIN: address = @0xAD;
#[test_only]
const PLAYER1: address = @0xCAFE;

#[test]
fun test_initialize() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        initialize(ts::ctx(&mut scenario));
    };
    
    scenario.next_tx(ADMIN);
    {
        let pool = ts::take_shared<GamePool>(&scenario);
        let (reward_balance, total_games, total_rewards) = get_pool_info(&pool);
        
        assert!(reward_balance == 0, 0);
        assert!(total_games == 0, 1);
        assert!(total_rewards == 0, 2);
        
        ts::return_shared(pool);
    };
    
    scenario.end();
}

#[test]
fun test_start_game() {
    let mut scenario = ts::begin(ADMIN);
    
    // Initialize pool
    {
        initialize(ts::ctx(&mut scenario));
    };
    
    // Player starts game
    scenario.next_tx(PLAYER1);
    {
        let mut pool = ts::take_shared<GamePool>(&scenario);
        start_game(&mut pool, ts::ctx(&mut scenario));
        ts::return_shared(pool);
    };
    
    // Check session created
    scenario.next_tx(PLAYER1);
    {
        let pool = ts::take_shared<GamePool>(&scenario);
        let (player, level, completed, earned, _time, active, is_completed) = get_session_info(&pool, 1);
        
        assert!(player == PLAYER1, 0);
        assert!(level == 1, 1);
        assert!(completed == 0, 2);
        assert!(earned == 0, 3);
        assert!(active, 4);
        assert!(!is_completed, 5);
        
        ts::return_shared(pool);
    };
    
    scenario.end();
}

#[test]
fun test_alien_count_scaling() {
    // Level 1: 11 aliens
    assert!(get_alien_count_for_level(1) == 11, 0);
    
    // Level 2: 22 aliens
    assert!(get_alien_count_for_level(2) == 22, 1);
    
    // Level 3: 33 aliens
    assert!(get_alien_count_for_level(3) == 33, 2);
    
    // Level 4: 44 aliens
    assert!(get_alien_count_for_level(4) == 44, 3);
    
    // Level 5: 55 aliens
    assert!(get_alien_count_for_level(5) == 55, 4);
}

#[test]
fun test_reward_calculation() {
    // 1 level = 2 OCT
    assert!(calculate_total_reward(1) == 2000000, 0);
    
    // 3 levels = 6 OCT
    assert!(calculate_total_reward(3) == 6000000, 1);
    
    // 5 levels = 10 OCT
    assert!(calculate_total_reward(5) == 10000000, 2);
}
