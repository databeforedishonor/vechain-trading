# VeChain DEX Trader

A JavaScript library for interacting with decentralized exchanges (DEXes) on the VeChain blockchain.

## Overview

This project provides tools for:

1. Querying price quotes from VeChain DEXes using the `getAmountsIn` and `getAmountsOut` functions
2. Comparing rates across multiple DEXes to find the best price
3. Executing swaps between VET, VTHO, and other tokens
4. Finding active DEX contracts on the VeChain network

The implementation is based on Uniswap V2 architecture, which is used by most DEXes on VeChain.

## Project Structure

The project is organized into the following directories:

```
vechain-ai-trading-repo/
├── config/             # ABI files and configuration
├── docs/               # Documentation and reports
│   └── reports/        # Analysis reports and summaries
├── examples/           # Example usage scripts
├── scripts/            # Categorized scripts
│   ├── balances/       # Balance checking utilities
│   ├── contracts/      # Contract interaction utilities
│   ├── queries/        # Blockchain query scripts
│   ├── quotes/         # Price quote utilities
│   ├── swaps/          # Token swap scripts
│   ├── tests/          # Test scripts
│   └── utils/          # General utility scripts
└── src/                # Core source code
    ├── api/            # API implementations
    ├── core/           # Core functionality
    └── utils/          # Utility functions
```

## Components

### 1. Price Quote Utilities (`scripts/quotes/`)

Tools for getting price quotes from VeChain DEXes:

- `vechain-dex-quote.js`: Core module with quote functions
- `price-quotes.js`: Example script showing price quote usage

Key functions:
- `getExactInputQuote`: Get the expected output amount for a given input amount
- `getExactOutputQuote`: Get the required input amount for a desired output amount
- `getBestQuote`: Compare rates across multiple DEXes to find the best price

### 2. Swap Scripts (`scripts/swaps/`)

Scripts for executing token swaps on VeChain:

- `vet-vtho-swap.js`: Swap between VET and VTHO tokens
- `vechain-vet-vtho-swap.js`: Alternative implementation for VET/VTHO swaps

### 3. Blockchain Query Tools (`scripts/queries/`)

Tools for scanning and querying the VeChain blockchain:

- `find-dex-contracts.js`: Scan for active DEX contracts
- `query-testnet.js`: Query the VeChain testnet for information

### 4. Balance Utilities (`scripts/balances/`)

Scripts for checking token balances:

- `vechain-check-balances.js`: Check VET and VTHO balances
- `get-balances.js`: Simple balance checker
- `get-vet-vtho-amounts.js`: Get detailed VET/VTHO amounts

### 5. Testing Scripts (`scripts/tests/`)

Various test scripts for different components:

- `test-router-quotes.js`: Test DEX router quote functions
- `test-verocket.js`: Test VeRocket DEX functionality
- `test-wallet.js`: Test wallet generation and management

## Technical Details

### Function Signatures

The implementation uses the standard Uniswap V2 function signatures:

```
getAmountsOut(uint amountIn, address[] memory path) returns (uint[] memory amounts)
// Function signature: 0xd06ca61f

getAmountsIn(uint amountOut, address[] memory path) returns (uint[] memory amounts)
// Function signature: 0x1f00ca74
```

### ABI Encoding/Decoding

The library includes utilities for:

1. Encoding function calls according to the Ethereum ABI specification
2. Decoding returned arrays of token amounts
3. Handling contract call errors gracefully

## Usage Examples

### Getting a Price Quote

```javascript
const { getExactInputQuote, ADDRESSES } = require('./scripts/quotes/vechain-dex-quote');

async function getQuote() {
  // Get quote for 1 vVET to VTHO
  const amountIn = '1000000000000000000'; // 1 vVET (18 decimals)
  const path = [ADDRESSES.vVET, ADDRESSES.VTHO];
  
  const quote = await getExactInputQuote(ADDRESSES.VEROCKET_ROUTER, amountIn, path);
  console.log(`Quote: ${quote.formatted}`);
  console.log(`Price: ${quote.priceFormatted}`);
}
```

### Checking Balances

```javascript
// Import the balance checker
const checkBalances = require('./scripts/balances/get-balances');

// Check balances for an address
const address = '0x7567D83b7b8d80ADdCb281A71d54Fc7B3364ffed';
checkBalances(address).then(balances => {
  console.log(`VET: ${balances.vet}`);
  console.log(`VTHO: ${balances.vtho}`);
});
```

### Executing a Swap

```javascript
// Import the swap script
const { executeSwap } = require('./scripts/swaps/vet-vtho-swap');

// Execute a swap from VET to VTHO
const wallet = { /* wallet details */ };
const amountIn = '1000000000000000000'; // 1 VET
executeSwap(connex, wallet, ADDRESSES.VET, ADDRESSES.VTHO, amountIn)
  .then(receipt => {
    console.log(`Swap completed. Transaction ID: ${receipt.id}`);
  });
```

## Resources

- [VeChain Documentation](https://docs.vechain.org/)
- [VeChain Thor Devkit](https://github.com/vechain/thor-devkit.js)
- [Connex Framework](https://github.com/vechain/connex)

## License

This project is licensed under the MIT License. 