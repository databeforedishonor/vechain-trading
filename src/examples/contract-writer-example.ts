import { createTransactionManager } from "../utils/contracts/contract-writer";
import { createSignerFromEnv } from "../utils/wallet-management/key-utils";
import { ERC20_ABI } from "../utils/abis/erc20";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import "../utils/wallet-management/env-loader";

// Example token address (VTHO on Testnet)
const tokenAddress = VTHO_ADDRESS;

// Example spender address (replace with an actual address in real usage)
const spenderAddress = "0xD8B5B792A4C8EecF6830718E7b974a8E09DDC05a"; // Example DEX router

// Get network from environment variable or default to testnet
const network = process.env.NETWORK || "testnet";

/**
 * Example of how to write to a contract using the transaction manager
 */
async function main() {
  try {
    console.log(`Running contract write example on ${network}...`);
    
    // Create transaction manager
    const txManager = createTransactionManager(network);
    
    // Get signer from environment variables
    const { signer, source } = createSignerFromEnv(network);
    if (!signer) {
      console.error("❌ No valid signer found in environment variables");
      console.log("Please set PRIVATE_KEY or MNEMONIC in your .env file");
      return;
    }
    
    // Get wallet address
    const walletAddress = txManager.getWalletAddress(signer);
    console.log(`\nUsing ${source} wallet: ${walletAddress}`);
    
    // Print header
    console.log("\n==== Example Contract Write Operations ====");
    
    // Example 1: Approve VTHO for spending by a DEX
    console.log("\n1. Approving token spending...");
    
    // Amount to approve - 100 VTHO (with 18 decimals)
    const amountToApprove = "100000000000000000000"; // 100 * 10^18
    
    console.log(`Token: VTHO (${tokenAddress})`);
    console.log(`Spender: ${spenderAddress}`);
    console.log(`Amount: ${amountToApprove} (100 VTHO)`);
    
    // Execute approve transaction
    const approveResult = await txManager.approveERC20Token(
      tokenAddress,
      spenderAddress,
      amountToApprove,
      signer,
      {
        waitForReceipt: true,
        gas: 100000
      }
    );
    
    if (approveResult.success) {
      console.log("✅ Approval successful!");
      console.log(`Transaction ID: ${approveResult.transactionId}`);
      if (approveResult.receipt) {
        console.log(`Gas used: ${approveResult.receipt.gasUsed}`);
      }
    } else {
      console.error(`❌ Approval failed: ${approveResult.error}`);
    }
    
    // Example 2: Execute a custom contract transaction
    console.log("\n2. Executing a custom contract transaction...");
    
    // Build a transaction clause (this is another approve with a smaller amount as example)
    const customApproveClause = txManager.buildTransactionClause(
      tokenAddress,
      ERC20_ABI,
      "approve",
      [spenderAddress, "1000000000000000000"] // 1 VTHO
    );
    
    // Execute the transaction
    const customTxResult = await txManager.executeTransaction(
      [customApproveClause],
      signer,
      {
        waitForReceipt: true,
        gas: 100000
      }
    );
    
    if (customTxResult.success) {
      console.log("✅ Custom transaction successful!");
      console.log(`Transaction ID: ${customTxResult.transactionId}`);
      if (customTxResult.receipt) {
        console.log(`Gas used: ${customTxResult.receipt.gasUsed}`);
      }
    } else {
      console.error(`❌ Custom transaction failed: ${customTxResult.error}`);
    }
    
    console.log("\n==== Contract Write Example Complete ====");
  } catch (error) {
    console.error("Error in contract write example:", error);
  }
}

// Run the example if this is the main module
if (require.main === module) {
  main().catch(console.error);
} 