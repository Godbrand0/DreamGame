# OneChain Smart Contract Development Guide

This comprehensive guide covers how to write, test, and deploy smart contracts on the OneChain blockchain using the Move programming language.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Move Language Basics](#move-language-basics)
4. [Project Structure](#project-structure)
5. [Writing Your First Contract](#writing-your-first-contract)
6. [Testing Your Contract](#testing-your-contract)
7. [Deploying to OneChain](#deploying-to-onechain)
8. [Advanced Concepts](#advanced-concepts)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)

## Prerequisites

Before you start developing OneChain smart contracts, ensure you have:

### Required Tools

- **OneChain CLI**: Install using cargo
  ```bash
  cargo install --locked --git https://github.com/one-chain-labs/onechain.git one_chain --features tracing
  mv ~/.cargo/bin/one_chain ~/.cargo/bin/one
  ```

- **Rust and Cargo**: Latest stable version
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  rustup update stable
  ```

### System Requirements

**Linux/Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install curl git cmake gcc libssl-dev libclang-dev libpq-dev build-essential
```

**macOS:**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install curl cmake libpq git
```

## Getting Started

### 1. Configure OneChain Client

First, set up your OneChain client to connect to the network:

```bash
# Check if client is configured
one client envs

# If not configured, set up a new environment
one client new-env --alias devnet --rpc https://rpc-devnet.onelabs.cc:443

# Switch to devnet
one client switch --env devnet
```

### 2. Get Test Tokens

Request test OCT tokens for development:

```bash
# Get tokens for active address
one client faucet

# Check your balance
one client gas
```

### 3. Create a New Move Project

```bash
# Create a new Move package
one move new my_first_contract

# Navigate to the project directory
cd my_first_contract
```

## Move Language Basics

### Key Concepts

**Objects**: Everything in OneChain is an object with unique ID
- **Owned Objects**: Controlled by a single address
- **Shared Objects**: Accessible by anyone with proper permissions

**Abilities**: Define what operations are allowed on types
- `key`: Can be transferred between addresses
- `store`: Can be stored in other objects
- `drop`: Can be discarded/destroyed

**Addresses**: 32-byte identifiers (0x-prefixed hex)

### Basic Syntax

```move
module my_module::my_contract;

// Import dependencies
use one::object::{Self, UID};
use one::transfer;
use one::tx_context::TxContext;

// Struct definition with abilities
public struct MyAsset has key, store {
    id: UID,
    value: u64,
    owner: address,
}

// Function definition
public fun create_asset(value: u64, ctx: &mut TxContext): MyAsset {
    MyAsset {
        id: object::new(ctx),
        value,
        owner: ctx.sender(),
    }
}

// Accessor function
public fun get_value(asset: &MyAsset): u64 {
    asset.value
}
```

## Project Structure

A standard OneChain Move project has this structure:

```
my_first_contract/
├── Move.toml              # Package configuration
├── sources/
│   └── my_contract.move   # Your Move source files
└── tests/
    └── my_contract_tests.move  # Unit tests
```

### Move.toml Configuration

```toml
[package]
name = "my_first_contract"
edition = "2024.beta"
license = "MIT"
authors = ["Your Name <your.email@example.com>"]

[dependencies]
One = { git = "https://github.com/one-chain-labs/onechain.git", subdir = "crates/sui-framework/packages/one-framework", rev = "main" }

[addresses]
my_first_contract = "0x0"

[dev-addresses]
my_first_contract = "0x0"
```

## Writing Your First Contract

Let's create a simple NFT contract as an example:

### 1. Define the NFT Structure

```move
module my_first_contract::nft;

use one::object::{Self, UID};
use one::transfer;
use one::tx_context::{Self, TxContext};
use one::display::{Self, Display};

public struct NFT has key, store {
    id: UID,
    name: String,
    description: String,
    creator: address,
    minted_at: u64,
}

// Module initializer - runs once when published
fun init(ctx: &mut TxContext) {
    let admin = NFTCollection {
        id: object::new(ctx),
        total_supply: 0,
        next_token_id: 1,
    };
    
    transfer::transfer(admin, ctx.sender());
}
```

### 2. Add Minting Functionality

```move
public struct NFTCollection has key {
    id: UID,
    total_supply: u64,
    next_token_id: u64,
}

public fun mint_nft(
    collection: &mut NFTCollection,
    name: String,
    description: String,
    ctx: &mut TxContext
): NFT {
    let token_id = collection.next_token_id;
    collection.next_token_id = token_id + 1;
    collection.total_supply = collection.total_supply + 1;
    
    NFT {
        id: object::new(ctx),
        name,
        description,
        creator: ctx.sender(),
        minted_at: ctx.epoch_timestamp_ms(),
    }
}
```

### 3. Add Transfer Functionality

```move
public fun transfer_nft(
    nft: NFT,
    to: address,
    ctx: &mut TxContext
) {
    transfer::public_transfer(nft, to);
}
```

### 4. Add Query Functions

```move
public fun get_name(nft: &NFT): String {
    nft.name
}

public fun get_creator(nft: &NFT): address {
    nft.creator
}

public fun get_minted_at(nft: &NFT): u64 {
    nft.minted_at
}
```

## Testing Your Contract

### 1. Basic Unit Tests

```move
#[test]
fun test_mint_nft() {
    let mut ctx = tx_context::dummy();
    
    // Create collection
    let collection = NFTCollection {
        id: object::new(&mut ctx),
        total_supply: 0,
        next_token_id: 1,
    };
    
    // Mint NFT
    let nft = mint_nft(
        &mut collection,
        string::utf8(b"Test NFT"),
        string::utf8(b"A test NFT for demonstration"),
        &mut ctx
    );
    
    // Verify properties
    assert!(get_name(&nft) == string::utf8(b"Test NFT"));
    assert!(get_creator(&nft) == @0x0);
    
    // Clean up
    transfer::public_transfer(nft, @0x1);
}
```

### 2. Integration Tests with Test Scenario

```move
#[test]
fun test_nft_transfer() {
    use one::test_scenario;
    
    let alice = @0xA;
    let bob = @0xB;
    
    // Alice creates collection
    let mut scenario = test_scenario::begin(alice);
    {
        init(scenario.ctx());
    };
    
    // Alice mints NFT
    scenario.next_tx(alice);
    {
        let mut collection = scenario.take_from_sender<NFTCollection>();
        let nft = collection.mint_nft(
            string::utf8(b"Alice's NFT"),
            string::utf8(b"Created by Alice"),
            scenario.ctx()
        );
        transfer::public_transfer(nft, alice);
        scenario.return_to_sender(collection);
    };
    
    // Alice transfers to Bob
    scenario.next_tx(alice);
    {
        let nft = scenario.take_from_sender<NFT>();
        transfer_nft(nft, bob, scenario.ctx());
    };
    
    // Bob verifies ownership
    scenario.next_tx(bob);
    {
        let nft = scenario.take_from_sender<NFT>();
        assert!(get_creator(&nft) == alice);
        scenario.return_to_sender(nft);
    };
    
    scenario.end();
}
```

### 3. Running Tests

```bash
# Run all tests
one move test

# Run specific test
one move test nft

# Run with coverage
one move test --coverage
```

## Deploying to OneChain

### 1. Build Your Contract

```bash
# Build the package
one move build

# Check for bytecode metering
one client verify-bytecode-meter
```

### 2. Publish to Network

```bash
# Publish to devnet
one client publish --gas-budget 10000000 .

# The output will show:
# - Package ID
# - Created objects (NFTCollection admin object)
# - Upgrade capability
```

### 3. Interact with Deployed Contract

```bash
# Get your objects
one client objects

# Call contract function using PTB
one client ptb \
  --assign collection @<COLLECTION_ID> \
  --move-call <PACKAGE_ID>::nft::mint_nft collection "My NFT" "My description" \
  --assign nft \
  --transfer-objects "[nft]" @<YOUR_ADDRESS> \
  --gas-budget 5000000
```

## Advanced Concepts

### 1. Dynamic Fields

Use dynamic fields for flexible data storage:

```move
public struct FlexibleStorage has key {
    id: UID,
}

// Add dynamic field
public fun add_field(
    storage: &mut FlexibleStorage,
    key: String,
    value: String,
    ctx: &mut TxContext
) {
    use one::dynamic_field;
    
    dynamic_field::add(
        &mut storage.id,
        key,
        value,
        ctx
    );
}
```

### 2. Events

Emit events for off-chain monitoring:

```move
use one::event;

public struct NFTMinted has copy, drop {
    nft_id: UID,
    creator: address,
    name: String,
}

public fun mint_with_event(
    collection: &mut NFTCollection,
    name: String,
    description: String,
    ctx: &mut TxContext
): NFT {
    let nft = mint_nft(collection, name, description, ctx);
    
    event::emit(NFTMinted {
        nft_id: object::id(&nft),
        creator: nft.creator,
        name: nft.name,
    });
    
    nft
}
```

### 3. Access Control

Implement role-based access control:

```move
public struct AdminCap has key {
    id: UID,
}

public fun admin_only_function(
    _cap: &AdminCap,
    ctx: &TxContext
): address {
    ctx.sender() // Only admin can call this
}
```

### 4. Upgradeable Contracts

Design contracts for future upgrades:

```move
public struct UpgradeCap has key {
    id: UID,
    version: u64,
}

// In your init function
fun init(ctx: &mut TxContext) {
    let upgrade_cap = UpgradeCap {
        id: object::new(ctx),
        version: 1,
    };
    
    transfer::transfer(upgrade_cap, ctx.sender());
}
```

## Best Practices

### 1. Security Considerations

- **Validate Inputs**: Always validate function parameters
- **Use Access Control**: Implement proper authorization checks
- **Prevent Reentrancy**: Be careful with external calls
- **Handle Errors Gracefully**: Use proper error codes

```move
// Example of input validation
public fun safe_mint(
    collection: &mut NFTCollection,
    name: String,
    ctx: &mut TxContext
): NFT {
    // Validate name length
    assert!(string::length(&name) <= 100, 1001);
    
    // Validate collection exists
    assert!(collection.total_supply < 10000, 1002);
    
    mint_nft(collection, name, string::utf8(b""), ctx)
}
```

### 2. Gas Optimization

- **Minimize Storage**: Store only essential data
- **Batch Operations**: Use PTBs for multiple operations
- **Efficient Data Types**: Choose appropriate data types

```move
// Efficient batch operation
public fun batch_mint(
    collection: &mut NFTCollection,
    names: vector<String>,
    ctx: &mut TxContext
): vector<NFT> {
    let mut nfts = vector::empty<NFT>();
    
    while (!vector::is_empty(&names)) {
        let name = vector::pop_back(&mut names);
        let nft = mint_nft(collection, *name, ctx);
        vector::push_back(&mut nfts, nft);
    };
    
    nfts
}
```

### 3. Code Organization

- **Single Responsibility**: Each function should do one thing well
- **Clear Naming**: Use descriptive function and variable names
- **Documentation**: Add comments for complex logic

```move
/// Mints a new NFT with the given name and description
/// 
/// # Arguments
/// * `collection` - Mutable reference to the NFT collection
/// * `name` - Name of the NFT (max 100 characters)
/// * `description` - Description of the NFT
/// * `ctx` - Transaction context
/// 
/// # Returns
/// * NFT - The newly minted NFT
/// 
/// # Aborts
/// * 1001 if name is too long
/// * 1002 if collection is at capacity
public fun mint_nft(
    collection: &mut NFTCollection,
    name: String,
    description: String,
    ctx: &mut TxContext
): NFT {
    // Implementation...
}
```

## Common Patterns

### 1. Factory Pattern

Create a factory for deploying multiple instances:

```move
public struct Factory has key {
    id: UID,
    template_count: u64,
}

public fun create_instance(
    factory: &mut Factory,
    template_id: u64,
    ctx: &mut TxContext
): Instance {
    assert!(template_id < factory.template_count, 3001);
    
    Instance {
        id: object::new(ctx),
        template_id,
        creator: ctx.sender(),
    }
}
```

### 2. Registry Pattern

Implement a registry for tracking items:

```move
public struct Registry has key {
    id: UID,
    items: vector<String>,
}

public fun register_item(
    registry: &mut Registry,
    item: String,
    ctx: &mut TxContext
) {
    vector::push_back(&mut registry.items, item);
}
```

### 3. State Machine Pattern

Implement state transitions:

```move
public enum State has copy, drop {
    Created,
    Active,
    Completed,
    Cancelled
}

public struct StateMachine has key {
    id: UID,
    state: State,
}

public fun transition_to_active(
    machine: &mut StateMachine,
    ctx: &TxContext
) {
    assert!(machine.state == State::Created, 4001);
    machine.state = State::Active;
}
```

### 4. Proxy Pattern

Create proxy contracts for upgradeability:

```move
public struct Proxy has key {
    id: UID,
    implementation: address,
}

public fun upgrade_implementation(
    proxy: &mut Proxy,
    new_implementation: address,
    ctx: &TxContext
) {
    proxy.implementation = new_implementation;
}
```

## Debugging and Troubleshooting

### 1. Using Debug Module

```move
use std::debug;

public fun debug_function(value: u64) {
    debug::print(&value);
    debug::print_stack_trace();
}
```

### 2. Common Error Codes

```move
// Define custom error codes
const E_INSUFFICIENT_PERMISSIONS: u64 = 1001;
const E_INVALID_STATE: u64 = 1002;
const E_COLLECTION_FULL: u64 = 1003;

// Use in functions with descriptive messages
assert!(has_permission, E_INSUFFICIENT_PERMISSIONS);
```

### 3. Testing Strategies

- **Unit Tests**: Test individual functions
- **Integration Tests**: Test full workflows
- **Property Tests**: Verify invariants
- **Fuzz Testing**: Test edge cases

## Resources and Further Learning

### Official Documentation

- [OneChain Developer Portal](https://developers.onechain.cc)
- [Move Language Book](https://move-book.com/)
- [OneChain Framework Reference](https://docs.onechain.cc/framework)

### Community Resources

- [Discord Community](https://discord.gg/onechain)
- [GitHub Discussions](https://github.com/one-chain-labs/onechain/discussions)
- [Example Projects](https://github.com/one-chain-labs/examples)

### Tools and Utilities

- [OneChain Explorer](https://explorer.onechain.cc)
- [Move IDE](https://move-ide.com/)
- [Contract Verifier](https://verifier.onechain.cc/)

## Conclusion

This guide provides a comprehensive foundation for developing smart contracts on OneChain. Key takeaways:

1. **Start Simple**: Begin with basic contracts and gradually add complexity
2. **Test Thoroughly**: Use both unit and integration tests
3. **Follow Patterns**: Leverage proven design patterns
4. **Stay Secure**: Always prioritize security in your implementations
5. **Engage Community**: Learn from others and share your knowledge

As you become more comfortable with Move and OneChain, explore advanced topics like:
- Cross-contract interactions
- Complex access control mechanisms
- Gas optimization techniques
- Upgrade strategies
- DeFi protocol development

Happy building on OneChain! 🚀