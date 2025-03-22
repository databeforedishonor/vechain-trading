import { TransactionSigner } from "../contracts/contract-writer";


/**
 * Creates a TransactionSigner from environment variables
 * @param networkType The network type (mainnet or testnet)
 * @returns TransactionSigner object and source information
 */
export function createSignerFromEnv(networkType: string = "testnet"): { signer: TransactionSigner; source: string } {
  let signer: TransactionSigner = {};
  let source = "";
  const isMainnet = networkType === "mainnet";
  
  // Check for network-specific credentials first
  if (isMainnet) {
    // Mainnet credentials
    if (process.env.MAINNET_MNEMONIC) {
      const mnemonic = process.env.MAINNET_MNEMONIC.trim().split(" ");
      console.log(`Using mainnet mnemonic from environment (${mnemonic.length} words)`);
      signer.mnemonic = mnemonic;
      source = "mainnet mnemonic";
      return { signer, source };
    } 
    
    if (process.env.MAINNET_PRIVATE_KEY) {
      console.log("Using mainnet private key from environment");
      const privateKey = parsePrivateKey(process.env.MAINNET_PRIVATE_KEY);
      signer.privateKey = privateKey;
      source = "mainnet private key";
      return { signer, source };
    }
  } else {
    // Testnet credentials
    if (process.env.TESTNET_MNEMONIC) {
      const mnemonic = process.env.TESTNET_MNEMONIC.trim().split(" ");
      console.log(`Using testnet mnemonic from environment (${mnemonic.length} words)`);
      signer.mnemonic = mnemonic;
      source = "testnet mnemonic";
      return { signer, source };
    }
    
    if (process.env.TESTNET_PRIVATE_KEY) {
      console.log("Using testnet private key from environment");
      const privateKey = parsePrivateKey(process.env.TESTNET_PRIVATE_KEY);
      signer.privateKey = privateKey;
      source = "testnet private key";
      return { signer, source };
    }
  }
  
  // Fall back to generic credentials if no network-specific ones found
  if (process.env.MNEMONIC) {
    const mnemonic = process.env.MNEMONIC.trim().split(" ");
    console.log(`Using generic mnemonic from environment (${mnemonic.length} words)`);
    signer.mnemonic = mnemonic;
    source = "generic mnemonic";
  } 
  else if (process.env.PRIVATE_KEY) {
    console.log("Using generic private key from environment");
    const privateKey = parsePrivateKey(process.env.PRIVATE_KEY);
    signer.privateKey = privateKey;
    source = "generic private key";
  } else {
    // Last attempt - try direct environment variable check
    console.log("🔄 Attempting to access environment variables directly...");
    
    // Node's process.env direct access as a fallback
    const directMnemonic = process.env.MNEMONIC;
    if (directMnemonic) {
      console.log("Found MNEMONIC through direct process.env access");
      const mnemonic = directMnemonic.trim().split(" ");
      signer.mnemonic = mnemonic;
      source = "direct mnemonic";
    } else {
      throw new Error(`No credentials found for ${networkType}. Please set MNEMONIC, PRIVATE_KEY, ${isMainnet ? 'MAINNET_MNEMONIC, or MAINNET_PRIVATE_KEY' : 'TESTNET_MNEMONIC, or TESTNET_PRIVATE_KEY'} in your .env file.`);
    }
  }
  
  return { signer, source };
}

/**
 * Helper function to parse a private key string to Uint8Array
 * @param privateKeyString Private key as hex string
 * @returns Private key as Uint8Array
 */
function parsePrivateKey(privateKeyString: string): Uint8Array {
  // Handle private key with or without 0x prefix
  const pkHex = privateKeyString.startsWith('0x') 
    ? privateKeyString.slice(2) 
    : privateKeyString;
  
  // Convert hex string to Uint8Array
  const privateKeyBytes = new Uint8Array(
    pkHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  
  if (privateKeyBytes.length !== 32) {
    throw new Error(`Invalid private key length: expected 32 bytes but got ${privateKeyBytes.length}`);
  }
  
  return privateKeyBytes;
}

/**
 * Gets a recipient address from environment or uses a default
 * @param networkType The network type (mainnet or testnet)
 * @param defaultAddress Default address to use if none in environment
 * @returns Recipient address to use for transactions
 */
export function getRecipientAddress(networkType: string = "testnet", defaultAddress: string = "0xb717b660cd51109334bd10b2c168986055f58c1a"): string {
  if (networkType === "mainnet" && process.env.MAINNET_RECIPIENT_ADDRESS) {
    return process.env.MAINNET_RECIPIENT_ADDRESS;
  } else if (networkType === "testnet" && process.env.TESTNET_RECIPIENT_ADDRESS) {
    return process.env.TESTNET_RECIPIENT_ADDRESS;
  }
  
  return process.env.RECIPIENT_ADDRESS || defaultAddress;
}

/**
 * Gets the network setting from environment or uses a default
 * @param defaultNetwork Default network to use if none in environment
 * @returns Network name to use for connections
 */
export function getNetwork(defaultNetwork: string = "testnet"): string {
  return process.env.NETWORK || defaultNetwork;
} 