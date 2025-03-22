# VeChain DEX Trading Bot Framework

A TypeScript/JavaScript framework for building automated trading bots on the VeChain blockchain. This project provides the infrastructure and examples to help teams quickly implement DEX trading strategies.

## Overview

This framework provides tools for:

1. Real-time blockchain monitoring for trading opportunities
2. Creating trading strategies with custom decision algorithms
3. Executing trades across VeChain DEX (based on Uniswap V2 architecture)
4. Token approvals, swap execution, and balance management 
5. Price comparison across multiple DEXes to find the best execution price

## Bot Architecture

The trading bot consists of the following key components:

```
vechain-ai-trading-repo/
├── config/                 # Configuration files and ABIs
├── src/
│   ├── core/               # Core trading functionality
│   │   ├── monitoring/     # Blockchain monitoring components
│   │   │   └── trading-bot.ts     # Main trading bot implementation
│   │   ├── tokens/         # Token management (balances, approvals)
│   │   │   ├── token-balances.ts  # Check token balances
│   │   │   └── erc20-approve.ts   # Approve tokens for trading
│   │   └── trading/        # Trading strategies and execution
│   │       ├── market-data.ts     # Price monitoring and ratio calculation
│   │       ├── swap-executor.ts   # Trade execution logic
│   │       └── strategy-simulator.ts # Trade decision simulation
│   ├── examples/           # Example implementations
│   │   ├── contract-reader-example.ts # Example of reading contract data
│   │   └── contract-writer-example.ts # Example of writing to contracts
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
│       ├── contracts/      # Contract interaction utilities
│       │   ├── contract-reader.ts # Read from contracts
│       │   └── contract-writer.ts # Write to contracts
│       └── wallet-management/     # Wallet management utilities
│           └── env-loader.ts      # Environment configuration
└── scripts/                # Legacy scripts (being migrated)
```

## Quick Start

### 1. Environment Setup

Create a `.env` file with the following parameters:

```
NETWORK=testnet        # or mainnet
PRIVATE_KEY=your_private_key_here  # OR
MNEMONIC=your_seed_phrase_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Trading Bot

```bash
# Start the trading bot with automatic monitoring and trading
npm run start-trading-bot
# OR
npm run bot:start
```

## Bot Components

### 1. Trading Bot (`src/core/monitoring/trading-bot.ts`)

The core of the trading bot that:
- Connects to VeChain blockchain
- Monitors for new blocks
- Triggers trading decisions on each new block
- Executes trades when decision criteria are met

Configuration options:
```typescript
// Configure at the top of trading-bot.ts
let EXECUTE_REAL_TRADES = true;   // Set to false for simulation only
const SLIPPAGE_TOLERANCE = 5;     // Slippage tolerance percentage
```

### 2. Market Data (`src/core/trading/market-data.ts`)

Monitors DEX prices and ratios:
- Retrieves real-time token pricing from DEXes
- Calculates trading ratios
- Provides price data for decision making

### 3. Trade Decision Engine (`src/core/trading/strategy-simulator.ts`)

Determines whether to execute a trade based on:
- Current market conditions
- Custom trading strategy logic
- Configurable probability parameters

To customize the trade decision logic:
1. Modify the `simulateTradingDecision()` function
2. Implement your own strategy in place of the `decideToTrade()` function
3. Adjust trading parameters in `market-data.ts`

### 4. Trading Executor (`src/core/trading/swap-executor.ts`)

Handles the execution flow:
1. Token approvals (when needed)
2. Slippage protection
3. Transaction submission and monitoring
4. Error handling and reporting

## Token Management

### Token Balances (`src/core/tokens/token-balances.ts`)

Check token balances for any ERC20 tokens or native VET/VTHO:

```bash
# Check token balance
npm run token:balance -- [wallet_address] [token_address]
# OR 
npx ts-node src/core/tokens/token-balances.ts [wallet_address] [token_address]
```

### Token Approvals (`src/core/tokens/erc20-approve.ts`)

Before trading, tokens must be approved for DEX router contracts:

```bash
# Run token approval script directly
npm run token:approve -- [spender_address] [amount]
# OR
npx ts-node src/core/tokens/erc20-approve.ts [spender_address] [amount]
```

## Contract Interaction Utilities

### Contract Reader (`src/utils/contracts/contract-reader.ts`)

The contract reader allows you to:
1. Create reusable contract interfaces for reading data
2. Make method calls to view/pure functions
3. Retrieve token balances and other contract data

Example:
```bash
# Run example contract read operations
npm run contract:read
# OR
npx ts-node src/examples/contract-reader-example.ts
```

### Contract Writer (`src/utils/contracts/contract-writer.ts`)

The contract writer allows you to:
1. Create transaction clauses for contract interactions
2. Execute transactions with proper signing
3. Approve tokens and execute swaps

Example:
```bash
# Run example contract write operations
npm run contract:write
# OR
npx ts-node src/examples/contract-writer-example.ts
```

## Customizing the Trading Bot

### Trading Parameters

Modify the following parameters in `src/core/trading/market-data.ts` to adjust trading behavior:

```typescript
// DEX Router address (update for your target DEX)
const DEX_ROUTER_ADDRESS = '0x91e42759290239a62ac757cf85bb5b74ace57927';

// Token addresses
const vVET_ADDRESS = '0x86fb5343bbecffc86185c023a2a6ccc76fc0afd8';

// Trading parameters
const TRADE_AMOUNT_VTHO = '10000000000000000000'; // 10 VTHO
const TRADE_PROBABILITY = 0.3; // 30% chance to trade on each block
```

### Custom Trading Strategy

To implement your own trading strategy:

1. Create a new module in `src/core/trading/strategies/` folder
2. Implement your decision algorithm that returns a boolean (trade/no trade)
3. Integrate your strategy in `strategy-simulator.ts`

Example custom strategy integration:

```typescript
// In your custom strategy file
export function myCustomStrategy(priceRatio: PriceRatio): boolean {
  // Implement your logic here
  return priceRatio.vetPerVtho > 0.1; // Example threshold
}

// In strategy-simulator.ts
import { myCustomStrategy } from './strategies/my-strategy';

// Replace this line:
const shouldTrade = decideToTrade(ratio);
// With:
const shouldTrade = myCustomStrategy(ratio);
```

### Continuous Trading

By default, the bot disables trading after a successful trade. To enable continuous trading:

1. Open `src/core/monitoring/trading-bot.ts`
2. Find the line: `EXECUTE_REAL_TRADES = false;`  
3. Comment out this line to allow continuous trading

## Testing and Simulation

Run in simulation mode to test without executing real trades:

```bash
# Modify the EXECUTE_REAL_TRADES flag in trading-bot.ts
let EXECUTE_REAL_TRADES = false;

# Then run the trading bot
npm run bot:start
```

Test individual components:
```bash
# Test price monitoring
npm run market:data
# OR
npx ts-node src/core/trading/market-data.ts

# Test trading decision simulation
npm run strategy:test
# OR
npx ts-node src/core/trading/strategy-simulator.ts
```

## Security Best Practices

1. Never hardcode private keys in your code
2. Use environment variables for sensitive data
3. Test extensively on testnet before mainnet deployment
4. Implement circuit breakers and safety thresholds
5. Start with small trade amounts and gradually increase

## Resources
- [VeChain Documentation](https://docs.vechain.org/)
- [VeChain GitHub](https://github.com/vechain)