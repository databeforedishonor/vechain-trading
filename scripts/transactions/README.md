# VeChain Transaction Scripts

This directory contains TypeScript and JavaScript scripts for interacting with the VeChain blockchain, focusing on sending transactions from a mnemonic wallet.

## Setup

1. Copy `.env.example` to `.env` in the root directory and fill in your values:
   ```
   cp .env.example .env
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Make sure TypeScript and ts-node are installed:
   ```
   npm install -g typescript ts-node
   ```

## Available Scripts

### Simple Transaction Script
The most user-friendly way to send VET or VTHO:

```bash
# Send VET
ts-node scripts/transactions/simple-transaction.ts vet 0.1

# Send VTHO
ts-node scripts/transactions/simple-transaction.ts vtho 10
```

### Individual Transaction Scripts

#### Send VET
```bash
ts-node scripts/transactions/send-from-mnemonic.ts
```

#### Send VTHO Tokens
```bash
ts-node scripts/transactions/send-vtho-from-mnemonic.ts
```

## Environment Variables

Set these in your `.env` file:

- `WALLET_MNEMONIC` - Your 12-word mnemonic phrase (required)
- `VECHAIN_NODE` - VeChain node URL (defaults to testnet)
- `RECIPIENT_ADDRESS` - Recipient address (has a default test address)
- `AMOUNT_VET` - Default amount of VET to send
- `AMOUNT_VTHO` - Default amount of VTHO to send

## Wallet Helper

The scripts use a reusable wallet helper class located at `scripts/utils/wallet-helper.ts`. You can use this in your own code:

```typescript
import { createWallet } from '../utils/wallet-helper';

async function example() {
  // Create a wallet from environment mnemonic
  const wallet = await createWallet();
  
  // Get wallet address
  const address = wallet.getAddress();
  
  // Get balances
  const vetBalance = await wallet.getVETBalance();
  const vthoBalance = await wallet.getVTHOBalance();
  
  // Send VET
  const vetResult = await wallet.transferVET('0x...recipient...', '0.1');
  
  // Send VTHO
  const vthoResult = await wallet.transferVTHO('0x...recipient...', '10');
}
```

## Notes

- These scripts are for demonstration purposes. In production, you should never store your mnemonic in plain text or in your environment variables.
- All scripts default to testnet. To use mainnet, change the `VECHAIN_NODE` value.
- The wallet uses the first account (index 0) derived from your mnemonic by default. 