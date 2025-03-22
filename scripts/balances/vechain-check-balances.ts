#!/usr/bin/env node

/**
 * VeChain Balance Checker
 * 
 * A utility script to check VET, VTHO, and custom token balances on VeChain networks.
 * Usage: 
 *   ts-node vechain-check-balances.ts [--mainnet] [--token TOKEN_ADDRESS] [--mnemonic "your mnemonic phrase"]
 * 
 * Options:
 *   --mainnet: Use mainnet instead of testnet
 *   --token: Specify a custom token address to check
 *   --mnemonic: Specify a custom mnemonic phrase
 */

import { secp256k1, address } from 'thor-devkit';
import { Driver } from '@vechain/connex-driver';
import { Framework } from '@vechain/connex-framework';
import { SimpleNet } from '@vechain/connex.driver-nodejs/dist/simple-net';
import BigNumber from 'bignumber.js';
import * as bip39 from 'bip39';
import HDKey from 'hdkey';

// Configure BigNumber
BigNumber.config({
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN
});

// Parse command line arguments
const args = process.argv.slice(2);
const useMainnet = args.includes('--mainnet');
const customTokenIndex = args.indexOf('--token');
const customToken = customTokenIndex !== -1 ? args[customTokenIndex + 1] : null;
const mnemonicIndex = args.indexOf('--mnemonic');
const customMnemonic = mnemonicIndex !== -1 ? args.slice(mnemonicIndex + 1).join(' ') : null;

// Network configuration
const NETWORK = {
  MAINNET: {
    url: 'https://mainnet.veblocks.net',
    name: 'Mainnet',
    vtho: '0x0000000000000000000000000000456e65726779'
  },
  TESTNET: {
    url: 'https://testnet.veblocks.net',
    name: 'Testnet',
    vtho: '0x0000000000000000000000000000456e65726779'
  }
};

// Use the selected network
const activeNetwork = useMainnet ? NETWORK.MAINNET : NETWORK.TESTNET;

// Default mnemonic
const DEFAULT_TESTNET_MNEMONIC = "tonight hen excess sister zoo radio wife essence fringe fold wood become";

// Use custom mnemonic if provided, otherwise use default
const useMnemonic = customMnemonic || process.env.VECHAIN_MNEMONIC || DEFAULT_TESTNET_MNEMONIC;

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
];

interface WalletInfo {
  privateKey: Buffer;
  publicKey: Buffer;
  address: string;
}

interface TokenInfo {
  balance: string;
  symbol: string;
  decimals: number;
}

interface TokenResult {
  decoded: [string];
}

interface AccountInfo {
  balance: string;
}

interface ConnexAccount {
  get: () => Promise<AccountInfo>;
  method: (abi: any) => { call: (address?: string) => Promise<any> };
}

interface ConnexFramework {
  thor: {
    account: (address: string) => ConnexAccount;
  };
}

/**
 * Derive wallet from mnemonic phrase
 * @param {string} mnemonicPhrase - The mnemonic phrase
 * @returns {Promise<WalletInfo>} Wallet object with privateKey, publicKey, and address
 */
async function deriveWallet(mnemonicPhrase: string): Promise<WalletInfo> {
  try {
    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonicPhrase)) {
      throw new Error('Invalid mnemonic phrase');
    }
    
    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonicPhrase);
    
    // Create HD wallet
    const hdkey = HDKey.fromMasterSeed(seed);
    
    // Derive private key using VeChain's BIP44 path
    const derivedKey = hdkey.derive("m/44'/818'/0'/0/0");
    
    // Get private key - handle potential null value
    if (!derivedKey.privateKey) {
      throw new Error('Failed to derive private key');
    }
    
    const privateKey = Buffer.from(derivedKey.privateKey);
    
    // Derive public key and address
    const publicKey = secp256k1.derivePublicKey(privateKey);
    const walletAddress = address.fromPublicKey(publicKey);
    
    return {
      privateKey,
      publicKey,
      address: walletAddress
    };
  } catch (error) {
    console.error('Error deriving wallet:', error);
    throw error;
  }
}

/**
 * Get token balance using contract method
 * @param {ConnexFramework} connex - Connex Framework instance
 * @param {string} tokenAddress - Token contract address
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<TokenInfo>} Token balance and info
 */
async function getTokenBalance(connex: ConnexFramework, tokenAddress: string, walletAddress: string): Promise<TokenInfo> {
  try {
    const tokenContract = connex.thor.account(tokenAddress);
    const balanceMethod = tokenContract.method(ERC20_ABI[0]);
    const result = await balanceMethod.call(walletAddress);
    const balance = result.decoded[0];
    
    // Try to get token symbol and decimals
    let symbol = '';
    let decimals = 18;
    
    try {
      // Get symbol
      const symbolMethod = tokenContract.method(ERC20_ABI[1]);
      const symbolResult = await symbolMethod.call();
      symbol = symbolResult.decoded[0];
      
      // Get decimals
      const decimalsMethod = tokenContract.method(ERC20_ABI[2]);
      const decimalsResult = await decimalsMethod.call();
      decimals = parseInt(decimalsResult.decoded[0]);
    } catch (error) {
      // If we can't get the symbol or decimals, use fallbacks
      if (tokenAddress.toLowerCase() === activeNetwork.vtho.toLowerCase()) {
        symbol = 'VTHO';
      } else {
        symbol = 'Unknown';
      }
    }
    
    return { balance, symbol, decimals };
  } catch (error) {
    console.error(`Error getting balance for token ${tokenAddress}:`, error);
    return { balance: '0', symbol: 'Error', decimals: 18 };
  }
}

/**
 * Get native VET balance
 * @param {ConnexFramework} connex - Connex Framework instance
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<TokenInfo>} VET balance info
 */
async function getNativeVETBalance(connex: ConnexFramework, walletAddress: string): Promise<TokenInfo> {
  try {
    const account = await connex.thor.account(walletAddress).get();
    return { 
      balance: account.balance, 
      symbol: 'VET', 
      decimals: 18 
    };
  } catch (error) {
    console.error('Error getting native VET balance:', error);
    return { balance: '0', symbol: 'VET', decimals: 18 };
  }
}

/**
 * Format amount for display
 * @param {string} amount - Amount in smallest unit
 * @param {number} decimals - Number of decimals
 * @returns {string} Formatted amount
 */
function formatAmount(amount: string, decimals = 18): string {
  return new BigNumber(amount)
    .div(new BigNumber(10).pow(decimals))
    .toFormat();
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log(`\n=== VeChain ${activeNetwork.name} Balance Checker ===\n`);
    
    // Derive wallet from mnemonic
    console.log('Deriving wallet from mnemonic...');
    const wallet = await deriveWallet(useMnemonic);
    console.log(`Wallet address: ${wallet.address}`);
    
    // Connect to VeChain network
    console.log(`\nConnecting to VeChain ${activeNetwork.name}...`);
    const driver = await Driver.connect(new SimpleNet(activeNetwork.url));
    const connex: ConnexFramework = new Framework(driver);
    console.log('Connected successfully!');
    
    // Array to store balance results
    let balances: TokenInfo[] = [];
    
    // Always fetch the native VET balance (works on both mainnet and testnet)
    console.log('\nFetching token balances...');
    const vetInfo = await getNativeVETBalance(connex, wallet.address);
    balances.push(vetInfo);
    
    // Fetch VTHO balance
    const vthoInfo = await getTokenBalance(connex, activeNetwork.vtho, wallet.address);
    balances.push(vthoInfo);
    
    // Fetch custom token balance if specified
    if (customToken) {
      console.log(`Checking custom token at ${customToken}...`);
      const customTokenInfo = await getTokenBalance(connex, customToken, wallet.address);
      balances.push(customTokenInfo);
    }
    
    // Calculate table width
    const maxSymbolLength = Math.max(...balances.map(b => b.symbol.length), 5);
    const tableWidth = maxSymbolLength + 26;
    
    // Display balances in a formatted table
    console.log('\n' + '-'.repeat(tableWidth));
    console.log(`| Token${' '.repeat(maxSymbolLength - 5)} | Balance${' '.repeat(14)} |`);
    console.log('|' + '-'.repeat(maxSymbolLength + 1) + '|' + '-'.repeat(24) + '|');
    
    for (const { symbol, balance, decimals } of balances) {
      const formattedBalance = formatAmount(balance, decimals);
      const paddedSymbol = symbol.padEnd(maxSymbolLength);
      const paddedBalance = formattedBalance.padStart(22);
      console.log(`| ${paddedSymbol} | ${paddedBalance} |`);
    }
    
    console.log('-'.repeat(tableWidth));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Execute the main function
main().catch(console.error); 