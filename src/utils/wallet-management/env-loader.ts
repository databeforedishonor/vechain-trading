import dotenv from "dotenv";
import * as fs from 'fs';
import * as path from 'path';

/**
 * Enhanced environment loading with detailed logging
 * @param quiet Optional flag to suppress console output
 * @returns Object with loaded env files and status
 */
export function loadEnvFiles(quiet: boolean = false) {
  if (!quiet) {
    console.log("🔄 Attempting to load environment variables...");
  }
  
  // Keep track of which env files were found
  const foundEnvFiles: string[] = [];
  
  // Current directory
  const currentDirEnv = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(currentDirEnv)) {
    if (!quiet) console.log(`Found .env file in current directory: ${currentDirEnv}`);
    dotenv.config({ path: currentDirEnv });
    foundEnvFiles.push(currentDirEnv);
  }
  
  // Project root (two levels up)
  const rootEnvPath = path.resolve(process.cwd(), '../../.env');
  if (fs.existsSync(rootEnvPath)) {
    if (!quiet) console.log(`Found .env file in project root: ${rootEnvPath}`);
    dotenv.config({ path: rootEnvPath });
    foundEnvFiles.push(rootEnvPath);
  }
  
  // One level up (scripts folder)
  const scriptsEnvPath = path.resolve(process.cwd(), '../.env');
  if (fs.existsSync(scriptsEnvPath)) {
    if (!quiet) console.log(`Found .env file in scripts directory: ${scriptsEnvPath}`);
    dotenv.config({ path: scriptsEnvPath });
    foundEnvFiles.push(scriptsEnvPath);
  }

  // Explicit path for the transactions folder
  const transactionsEnvPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(transactionsEnvPath)) {
    if (!quiet) console.log(`Found .env file in transactions directory: ${transactionsEnvPath}`);
    dotenv.config({ path: transactionsEnvPath });
    foundEnvFiles.push(transactionsEnvPath);
  }
  
  // Report status
  if (foundEnvFiles.length === 0) {
    if (!quiet) {
      console.warn("⚠️ No .env files found in any directory");
      console.log("Current directory:", process.cwd());
      console.log("Script directory:", __dirname);
    }
    return { success: false, files: [] };
  } else {
    if (!quiet) {
      console.log(`✅ Loaded ${foundEnvFiles.length} .env file(s)`);
      
      // Check if critical env vars are present
      if (!process.env.MNEMONIC && !process.env.PRIVATE_KEY &&
          !process.env.TESTNET_MNEMONIC && !process.env.TESTNET_PRIVATE_KEY &&
          !process.env.MAINNET_MNEMONIC && !process.env.MAINNET_PRIVATE_KEY) {
        console.warn("⚠️ No wallet credentials found in environment variables");
      } else {
        if (process.env.MNEMONIC) console.log("✅ Found generic MNEMONIC in environment");
        if (process.env.PRIVATE_KEY) console.log("✅ Found generic PRIVATE_KEY in environment");
        if (process.env.TESTNET_MNEMONIC) console.log("✅ Found TESTNET_MNEMONIC in environment");
        if (process.env.TESTNET_PRIVATE_KEY) console.log("✅ Found TESTNET_PRIVATE_KEY in environment");
        if (process.env.MAINNET_MNEMONIC) console.log("✅ Found MAINNET_MNEMONIC in environment");
        if (process.env.MAINNET_PRIVATE_KEY) console.log("✅ Found MAINNET_PRIVATE_KEY in environment");
      }
    }
    return { success: true, files: foundEnvFiles };
  }
}

/**
 * Checks if required environment variables are present
 * @returns Object indicating if required variables are available
 */
export function checkRequiredEnvVars() {
  return {
    // Generic credentials
    hasMnemonic: !!process.env.MNEMONIC,
    hasPrivateKey: !!process.env.PRIVATE_KEY,
    hasRecipient: !!process.env.RECIPIENT_ADDRESS,
    hasNetwork: !!process.env.NETWORK,
    hasAnyCredentials: !!(
      process.env.MNEMONIC || 
      process.env.PRIVATE_KEY ||
      process.env.TESTNET_MNEMONIC ||
      process.env.TESTNET_PRIVATE_KEY ||
      process.env.MAINNET_MNEMONIC ||
      process.env.MAINNET_PRIVATE_KEY
    ),
    
    // Testnet specific credentials
    hasTestnetMnemonic: !!process.env.TESTNET_MNEMONIC,
    hasTestnetPrivateKey: !!process.env.TESTNET_PRIVATE_KEY,
    hasTestnetRecipient: !!process.env.TESTNET_RECIPIENT_ADDRESS,
    
    // Mainnet specific credentials
    hasMainnetMnemonic: !!process.env.MAINNET_MNEMONIC,
    hasMainnetPrivateKey: !!process.env.MAINNET_PRIVATE_KEY,
    hasMainnetRecipient: !!process.env.MAINNET_RECIPIENT_ADDRESS
  };
}

/**
 * Provides troubleshooting help for env variable issues
 */
export function printEnvTroubleshootingHelp() {
  console.log("\n📋 Please make sure your .env file contains appropriate credentials:");
  
  console.log("\n=== Network Selection ===");
  console.log("- NETWORK=testnet|mainnet");
  
  console.log("\n=== Generic Credentials (used for both networks) ===");
  console.log("- MNEMONIC=\"your twelve word mnemonic phrase here\"");
  console.log("- PRIVATE_KEY=0xyourprivatekeyinhexformat");
  
  console.log("\n=== Network-Specific Credentials ===");
  console.log("- TESTNET_MNEMONIC=\"your testnet mnemonic phrase here\"");
  console.log("- TESTNET_PRIVATE_KEY=0xyourtestnetprivatekeyinhexformat");
  console.log("- MAINNET_MNEMONIC=\"your mainnet mnemonic phrase here\"");
  console.log("- MAINNET_PRIVATE_KEY=0xyourmainnetprivatekeyinhexformat");
  
  console.log("\n🔍 Troubleshooting:");
  console.log("1. Check that your .env file exists in one of these locations:");
  console.log(`   - Current directory: ${process.cwd()}`);
  console.log(`   - Script directory: ${__dirname}`);
  console.log("2. Verify the .env file has the correct format (no spaces around = sign)");
  console.log("3. Make sure there are no extra quotes or formatting issues");
  console.log("4. Try running the script with the environment variable directly:");
  console.log('   NETWORK=testnet MNEMONIC="your phrase here" node scripts/transactions/example-transaction.js');
}

// Automatically load environment variables when this module is imported
loadEnvFiles(); 