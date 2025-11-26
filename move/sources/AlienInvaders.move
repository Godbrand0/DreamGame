/// Alien Invaders GameFi - Play-to-Earn Space Invaders Game
/// Players progress through 5 levels, earning OCT tokens for each level completed
/// Difficulty increases with each level (more aliens, same time limit)
module gamefi::AlienInvaders;

use one::coin::{Self, Coin};
use one::balance::{Self, Balance};
use one::oct::OCT;

// === Error Codes ===

/// Game session already active
const EGameAlreadyActive: u64 = 0;
/// No active game session
const ENoActiveGame: u64 = 1;
/// Invalid level number
const EInvalidLevel: u64 = 2;
/// Insufficient reward pool
const EInsufficientRewardPool: u64 = 3;
/// Only contract owner can perform this action
const ENotOwner: u64 = 4;
/// Game session has expired
const EGameExpired: u64 = 5;
/// Cannot claim yet - game still active
const EGameStillActive: u64 = 6;

// === Constants ===

/// Reward per level (1 OCT = 1,000,000 in smallest unit, assuming 6 decimals)
const REWARD_PER_LEVEL: u64 = 1000000;

/// Maximum levels in game
const MAX_LEVELS: u64 = 5;

/// Time limit per level in milliseconds (60 seconds)
const TIME_LIMIT_PER_LEVEL: u64 = 60000;

/// Initial number of aliens in level 1
const BASE_ALIEN_COUNT: u64 = 11;

// === Structs ===

/// Global game pool managed by contract owner
public struct GamePool has key {
    id: UID,
    /// Reward pool funded by owner
    reward_pool: Balance<OCT>,
    /// Total games played
    total_games: u64,
    /// Total rewards distributed
    total_rewards_distributed: u64,
    /// Contract owner
    owner: address,
}

/// Individual player game session
public struct GameSession has key {
    id: UID,
    /// Player address
    player: address,
    /// Current level (1-5)
    current_level: u64,
    /// Levels completed successfully
    levels_completed: u64,
    /// Game start timestamp
    start_time: u64,
    /// Level start timestamp
    level_start_time: u64,
    /// Total earned so far
    total_earned: u64,
    /// Game is active
    is_active: bool,
}

// === Public Functions ===

/// Initialize the game pool (called once by contract owner)
public entry fun initialize(
    initial_pool: Coin<OCT>,
    ctx: &mut TxContext
) {
    let pool = GamePool {
        id: object::new(ctx),
        reward_pool: coin::into_balance(initial_pool),
        total_games: 0,
        total_rewards_distributed: 0,
        owner: ctx.sender(),
    };
    
    transfer::share_object(pool);
}

/// Add more OCT to the reward pool (owner only)
public entry fun add_to_pool(
    pool: &mut GamePool,
    additional_funds: Coin<OCT>,
    ctx: &TxContext
) {
    assert!(pool.owner == ctx.sender(), ENotOwner);
    balance::join(&mut pool.reward_pool, coin::into_balance(additional_funds));
}

/// Start a new game session
public entry fun start_game(
    pool: &mut GamePool,
    ctx: &mut TxContext
) {
    // Check if pool has enough rewards for a full game (5 levels)
    let max_possible_reward = REWARD_PER_LEVEL * MAX_LEVELS;
    assert!(
        balance::value(&pool.reward_pool) >= max_possible_reward,
        EInsufficientRewardPool
    );
    
    let current_time = ctx.epoch_timestamp_ms();
    
    let session = GameSession {
        id: object::new(ctx),
        player: ctx.sender(),
        current_level: 1,
        levels_completed: 0,
        start_time: current_time,
        level_start_time: current_time,
        total_earned: 0,
        is_active: true,
    };
    
    pool.total_games = pool.total_games + 1;
    
    transfer::transfer(session, ctx.sender());
}

/// Complete a level successfully
public entry fun complete_level(
    pool: &mut GamePool,
    session: &mut GameSession,
    ctx: &TxContext
) {
    // Validate session is active
    assert!(session.is_active, ENoActiveGame);
    assert!(session.player == ctx.sender(), ENotOwner);
    
    // Check if level time limit exceeded
    let current_time = ctx.epoch_timestamp_ms();
    let time_elapsed = current_time - session.level_start_time;
    assert!(time_elapsed <= TIME_LIMIT_PER_LEVEL, EGameExpired);
    
    // Award reward for completing level
    session.levels_completed = session.levels_completed + 1;
    session.total_earned = session.total_earned + REWARD_PER_LEVEL;
    
    // Check if game is complete (all 5 levels done)
    if (session.levels_completed >= MAX_LEVELS) {
        session.is_active = false;
    } else {
        // Move to next level
        session.current_level = session.current_level + 1;
        session.level_start_time = current_time;
    };
}

/// End game (player loses or quits)
public entry fun end_game(
    session: &mut GameSession,
    ctx: &TxContext
) {
    assert!(session.is_active, ENoActiveGame);
    assert!(session.player == ctx.sender(), ENotOwner);
    
    session.is_active = false;
}

/// Claim accumulated rewards
public entry fun claim_rewards(
    pool: &mut GamePool,
    session: GameSession,
    ctx: &mut TxContext
) {
    // Validate session belongs to sender
    assert!(session.player == ctx.sender(), ENotOwner);
    
    // Game must be ended
    assert!(!session.is_active, EGameStillActive);
    
    let GameSession {
        id,
        player,
        current_level: _,
        levels_completed: _,
        start_time: _,
        level_start_time: _,
        total_earned,
        is_active: _,
    } = session;
    
    // Transfer rewards if any earned
    if (total_earned > 0) {
        let reward_balance = balance::split(&mut pool.reward_pool, total_earned);
        let reward_coin = coin::from_balance(reward_balance, ctx);
        transfer::public_transfer(reward_coin, player);
        
        pool.total_rewards_distributed = pool.total_rewards_distributed + total_earned;
    };
    
    object::delete(id);
}

// === View Functions ===

/// Get game session information
public fun get_session_info(session: &GameSession): (u64, u64, u64, u64, bool) {
    (
        session.current_level,
        session.levels_completed,
        session.total_earned,
        session.level_start_time,
        session.is_active
    )
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
    // Level 1: 11 aliens
    // Level 2: 22 aliens
    // Level 3: 33 aliens
    // Level 4: 44 aliens
    // Level 5: 55 aliens
    BASE_ALIEN_COUNT * level
}

/// Get reward for completing N levels
public fun calculate_total_reward(levels_completed: u64): u64 {
    levels_completed * REWARD_PER_LEVEL
}

/// Check if level time limit exceeded
public fun is_level_expired(session: &GameSession, current_time: u64): bool {
    let time_elapsed = current_time - session.level_start_time;
    time_elapsed > TIME_LIMIT_PER_LEVEL
}

// === Tests ===

#[test_only]
use one::test_scenario::{Self as ts, Scenario};
#[test_only]
use one::test_utils;

#[test_only]
const ADMIN: address = @0xAD;
#[test_only]
const PLAYER1: address = @0xCAFE;
#[test_only]
const PLAYER2: address = @0xFACE;

#[test_only]
fun create_test_coin(amount: u64, scenario: &mut Scenario): Coin<OCT> {
    coin::mint_for_testing<OCT>(amount, ts::ctx(scenario))
}

#[test]
fun test_initialize() {
    let mut scenario = ts::begin(ADMIN);
    
    {
        let pool_coin = create_test_coin(10000000, &mut scenario); // 10 OCT
        initialize(pool_coin, ts::ctx(&mut scenario));
    };
    
    scenario.next_tx(ADMIN);
    {
        let pool = ts::take_shared<GamePool>(&scenario);
        let (reward_balance, total_games, total_rewards) = get_pool_info(&pool);
        
        assert!(reward_balance == 10000000, 0);
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
        let pool_coin = create_test_coin(10000000, &mut scenario);
        initialize(pool_coin, ts::ctx(&mut scenario));
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
        let session = ts::take_from_sender<GameSession>(&scenario);
        let (level, completed, earned, _time, active) = get_session_info(&session);
        
        assert!(level == 1, 0);
        assert!(completed == 0, 1);
        assert!(earned == 0, 2);
        assert!(active, 3);
        
        ts::return_to_sender(&scenario, session);
    };
    
    scenario.end();
}

#[test]
fun test_complete_levels() {
    let mut scenario = ts::begin(ADMIN);
    
    // Initialize pool
    {
        let pool_coin = create_test_coin(10000000, &mut scenario);
        initialize(pool_coin, ts::ctx(&mut scenario));
    };
    
    // Player starts game
    scenario.next_tx(PLAYER1);
    {
        let mut pool = ts::take_shared<GamePool>(&scenario);
        start_game(&mut pool, ts::ctx(&mut scenario));
        ts::return_shared(pool);
    };
    
    // Complete level 1
    scenario.next_tx(PLAYER1);
    {
        let mut pool = ts::take_shared<GamePool>(&scenario);
        let mut session = ts::take_from_sender<GameSession>(&scenario);
        
        complete_level(&mut pool, &mut session, ts::ctx(&mut scenario));
        
        let (level, completed, earned, _time, active) = get_session_info(&session);
        assert!(level == 2, 0);
        assert!(completed == 1, 1);
        assert!(earned == REWARD_PER_LEVEL, 2);
        assert!(active, 3);
        
        ts::return_to_sender(&scenario, session);
        ts::return_shared(pool);
    };
    
    scenario.end();
}

#[test]
fun test_claim_rewards() {
    let mut scenario = ts::begin(ADMIN);
    
    // Initialize pool
    {
        let pool_coin = create_test_coin(10000000, &mut scenario);
        initialize(pool_coin, ts::ctx(&mut scenario));
    };
    
    // Player starts and completes 2 levels
    scenario.next_tx(PLAYER1);
    {
        let mut pool = ts::take_shared<GamePool>(&scenario);
        start_game(&mut pool, ts::ctx(&mut scenario));
        ts::return_shared(pool);
    };
    
    scenario.next_tx(PLAYER1);
    {
        let mut pool = ts::take_shared<GamePool>(&scenario);
        let mut session = ts::take_from_sender<GameSession>(&scenario);
        
        complete_level(&mut pool, &mut session, ts::ctx(&mut scenario));
        complete_level(&mut pool, &mut session, ts::ctx(&mut scenario));
        
        // End game
        end_game(&mut session, ts::ctx(&mut scenario));
        
        ts::return_to_sender(&scenario, session);
        ts::return_shared(pool);
    };
    
    // Claim rewards
    scenario.next_tx(PLAYER1);
    {
        let mut pool = ts::take_shared<GamePool>(&scenario);
        let session = ts::take_from_sender<GameSession>(&scenario);
        
        claim_rewards(&mut pool, session, ts::ctx(&mut scenario));
        
        ts::return_shared(pool);
    };
    
    // Check player received rewards
    scenario.next_tx(PLAYER1);
    {
        let coin = ts::take_from_sender<Coin<OCT>>(&scenario);
        assert!(coin::value(&coin) == REWARD_PER_LEVEL * 2, 0);
        ts::return_to_sender(&scenario, coin);
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
    // 1 level = 1 OCT
    assert!(calculate_total_reward(1) == 1000000, 0);
    
    // 3 levels = 3 OCT
    assert!(calculate_total_reward(3) == 3000000, 1);
    
    // 5 levels = 5 OCT
    assert!(calculate_total_reward(5) == 5000000, 2);
}
