import { Poll, TESTNET_URL, ThorClient } from '@vechain/sdk-network';
import { Address, Clause, ERC20_ABI, HexUInt, Mnemonic, networkInfo, Secp256k1, Transaction, TransactionBody, TransactionClause, VTHO, VET } from '@vechain/sdk-core';
import { config } from 'dotenv';

const THOR_SOLO_URL = 'https://sync-testnet.vechain.org';
const VTHO_CONTRACT = '0x0000000000000000000000000000456E65726779';

// Load environment variables
config();

/**
 * Get wallet from mnemonic
 * @param mnemonicPhrase The mnemonic phrase to generate wallet from
 * @returns Wallet object with privateKey and address
 */
export function getWalletFromMnemonic(mnemonicPhrase: string): { privateKey: Uint8Array; address: string } {
  const words = mnemonicPhrase.split(' ');
  console.log(`Found ${words.length} words in mnemonic`);
  
  const wallet = Address.ofMnemonic(words).toString();
  const privateKey = Mnemonic.toPrivateKey(words);
  
  return {
    privateKey,
    address: wallet
  };
}

/**
 * Create a VeChain Thor client
 * @param nodeUrl URL of the VeChain node
 * @param pollingEnabled Whether to enable polling
 * @returns ThorClient instance
 */
export function createThorClient(nodeUrl: string = THOR_SOLO_URL, pollingEnabled: boolean = false): ThorClient {
  return ThorClient.at(nodeUrl, {
    isPollingEnabled: pollingEnabled
  });
}

/**
 * Estimate gas for transaction clauses
 * @param thorClient Thor client instance
 * @param clauses Transaction clauses
 * @param callerAddress Address of the transaction sender
 * @returns Estimated gas
 */
export async function estimateGas(
  thorClient: ThorClient, 
  clauses: TransactionClause[], 
  callerAddress: string
): Promise<number> {
  const gasResult = await thorClient.gas.estimateGas(clauses, callerAddress);
  return Number(gasResult.totalGas);
}

/**
 * Build transaction body
 * @param thorClient Thor client instance
 * @param clauses Transaction clauses
 * @param gas Gas limit
 * @param isTestnet Whether to use testnet chain tag (default: true)
 * @returns Transaction body
 */
export async function buildTransactionBody(
  thorClient: ThorClient,
  clauses: TransactionClause[],
  gas: number,
  isTestnet: boolean = true
): Promise<TransactionBody> {
  const bestBlock = await thorClient.blocks.getBestBlockCompressed();
  const blockRef = bestBlock !== null ? bestBlock.id.slice(0, 18) : '0x0';
  
  return {
    chainTag: isTestnet ? networkInfo.testnet.chainTag : networkInfo.mainnet.chainTag,
    blockRef: blockRef,
    expiration: 32,
    clauses,
    gasPriceCoef: 0,
    gas,
    dependsOn: null,
    nonce: Math.floor(Math.random() * 1000000)
  };
}

/**
 * Sign and send a transaction
 * @param thorClient Thor client instance
 * @param txBody Transaction body
 * @param privateKey Private key for signing
 * @returns Transaction receipt
 */
export async function signAndSendTransaction(
  thorClient: ThorClient,
  txBody: TransactionBody,
  privateKey: Uint8Array
): Promise<any> {
  // Sign transaction
  const signedTransaction = Transaction.of(txBody).sign(privateKey);
  
  // Send transaction
  const sendResult = await thorClient.transactions.sendTransaction(signedTransaction);
  console.log(`Transaction sent! ID: ${sendResult.id}`);
  
  // Wait for receipt
  const receipt = await thorClient.transactions.waitForTransaction(sendResult.id);
  return receipt;
}

/**
 * Create VET transfer clause
 * @param toAddress Recipient address
 * @param amount Amount of VET to transfer
 * @returns Transaction clause
 */
export function createVETTransferClause(toAddress: string, amount: number): TransactionClause {
  return Clause.transferVET(
    Address.of(toAddress),
    VET.of(amount)
  ) as TransactionClause;
}

/**
 * Create VTHO transfer clause
 * @param toAddress Recipient address
 * @param amount Amount of VTHO to transfer
 * @returns Transaction clause
 */
export function createVTHOTransferClause(toAddress: string, amount: number): TransactionClause {
  return Clause.transferVTHOToken(
    Address.of(toAddress),
    VTHO.of(amount)
  ) as TransactionClause;
}

/**
 * Execute a transaction with the given clauses
 * @param clauses Transaction clauses
 * @param privateKey Private key for signing (if not provided, uses mnemonic from env)
 * @param nodeUrl VeChain node URL
 * @param isTestnet Whether to use testnet chain tag
 * @returns Transaction receipt
 */
export async function executeTransaction(
  clauses: TransactionClause[],
  privateKey?: Uint8Array,
  nodeUrl: string = THOR_SOLO_URL,
  isTestnet: boolean = true
): Promise<any> {
  // Get wallet from env if privateKey not provided
  let wallet: { privateKey: Uint8Array; address: string };
  
  if (privateKey) {
    const address = Address.ofPrivateKey(privateKey).toString();
    wallet = { privateKey, address };
    console.log(`Using provided private key, wallet address: ${address}`);
  } else {
    const mnemonicEnv = process.env.MNEMONIC;
    if (!mnemonicEnv) {
      throw new Error('No private key provided and no MNEMONIC found in environment variables');
    }
    wallet = getWalletFromMnemonic(mnemonicEnv);
    console.log(`Using wallet address from mnemonic: ${wallet.address}`);
  }
  
  // Create thor client
  const thorClient = createThorClient(nodeUrl);
  
  // Estimate gas
  console.log('Estimating gas...');
  const gas = await estimateGas(thorClient, clauses, wallet.address);
  console.log(`Estimated gas: ${gas}`);
  
  // Build transaction body
  console.log('Building transaction body...');
  const txBody = await buildTransactionBody(thorClient, clauses, gas, isTestnet);
  
  // Sign and send transaction
  console.log('Signing and sending transaction...');
  const receipt = await signAndSendTransaction(thorClient, txBody, wallet.privateKey);
  
  console.log('Transaction receipt received:');
  console.log(JSON.stringify(receipt, null, 2));
  
  return receipt;
}

// Example usage for VET transfer
async function transferVET(toAddress: string, amount: number) {
  const clause = createVETTransferClause(toAddress, amount);
  return executeTransaction([clause]);
}

// Example usage for VTHO transfer
async function transferVTHO(toAddress: string, amount: number) {
  const clause = createVTHOTransferClause(toAddress, amount);
  return executeTransaction([clause]);
}

// Main function - example usage
async function main() {
  console.log('Starting VeChain transaction script...');
  
  try {
    // Example: Transfer 1 VET
    await transferVET('0xb717b660cd51109334bd10b2c168986055f58c1a', 1);
    console.log('Transaction completed successfully!');
  } catch (error) {
    console.error('Error in transaction:', error);
  }
}

// Execute main function if this script is run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error in main function:', error);
  });
}
