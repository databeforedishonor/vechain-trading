import { createTransactionManager } from "../../utils/contracts/contract-writer";
import { createSignerFromEnv } from "../../utils/wallet-management/key-utils";
import { VTHO_ADDRESS, Address, Clause,ERC20_ABI } from "@vechain/sdk-core";
import { createContractInterface } from "../../utils/contracts/contract-reader";
import "../../utils/wallet-management/env-loader";

/**
 * Interface for token approval result
 */
export interface TokenApprovalResult {
  success: boolean;
  approved: boolean;
  transactionId?: string;
  error?: string;
  allowance?: string;
  spender?: string;
}

/**
 * Check and approve token allowance for a spender
 * @param tokenAddress The token contract address
 * @param spenderAddress The address that will spend the tokens (e.g. DEX router)
 * @param requiredAmount The amount that needs to be approved
 * @param network The network to use (testnet or mainnet)
 * @returns Promise with approval status
 */
export async function checkAndApproveTokenAllowance(
  tokenAddress: string,
  spenderAddress: string,
  requiredAmount: string, 
  network: string = "testnet"
): Promise<TokenApprovalResult> {
  try {
    console.log(`\n🔍 Checking token allowance for ${tokenAddress}`);
    
    // Create transaction manager
    const txManager = createTransactionManager(network);
    
    // Get signer from environment
    const { signer, source } = createSignerFromEnv(network);
    if (!signer || (!signer.mnemonic && !signer.privateKey)) {
      return { 
        success: false, 
        approved: false,
        error: "No valid signer credentials found in environment"
      };
    }
    
    // Get wallet address
    const walletAddress = txManager.getWalletAddress(signer);
    console.log(`🔑 Using ${source} wallet: ${walletAddress}`);
    
    // Create a contract interface for the token
    const tokenInterface = createContractInterface(tokenAddress, ERC20_ABI, network);
    
    // Check current allowance
    console.log(`Checking current allowance for spender: ${spenderAddress}...`);
    try {
      const allowance = await tokenInterface.callPlain("allowance", walletAddress, spenderAddress);
      
      // Convert to bigint for comparison
      const allowanceBigInt = typeof allowance === 'string' ? BigInt(allowance) : (allowance as bigint);
      const requiredAmountBigInt = BigInt(requiredAmount);
      
      console.log(`Current allowance: ${allowanceBigInt.toString()}`);
      console.log(`Required amount: ${requiredAmountBigInt.toString()}`);
      
      // If allowance is sufficient, return success
      if (allowanceBigInt >= requiredAmountBigInt) {
        console.log(`✅ Token allowance already sufficient: ${allowanceBigInt.toString()}`);
        return {
          success: true,
          approved: true,
          allowance: allowanceBigInt.toString(),
          spender: spenderAddress
        };
      }
    } catch (error) {
      console.error("Error checking allowance:", error);
      return {
        success: false,
        approved: false,
        error: `Failed to check allowance: ${error instanceof Error ? error.message : String(error)}`,
        spender: spenderAddress
      };
    }
    
    // Need to approve - approve a large amount to avoid frequent approvals
    const approveAmount = "115792089237316195423570985008687907853269984665640564039457584007913129639935"; // uint256 max
    
    console.log(`⚠️ Token allowance insufficient`);
    console.log(`🔐 Approving token spending for address: ${spenderAddress}`);
    
    try {
      // Use the transaction manager to build a proper transaction clause
      console.log("⏳ Creating approval transaction...");
      
      // Build the transaction clause using the manager's buildTransactionClause
      const approveClause = txManager.buildTransactionClause(
        tokenAddress,
        ERC20_ABI,
        "approve",
        [spenderAddress, approveAmount]
      );
      
      // Execute transaction with fixed gas parameters to avoid estimation issues
      console.log("⏳ Sending approval transaction...");
      const result = await txManager.executeTransaction(
        [approveClause],
        signer,
        { 
          waitForReceipt: true,
          gas: 100000,        // Fixed gas limit
          gasPriceCoef: 0     // Use base gas price
        }
      );
      
      console.log(`✅ Token approval successful!`);
      console.log(`Transaction ID: ${result.transactionId}`);
      
      return {
        success: true,
        approved: true,
        transactionId: result.transactionId,
        spender: spenderAddress
      };
    } catch (error) {
      console.error("❌ Approval transaction error:", error);
      return {
        success: false,
        approved: false,
        error: `Approval transaction failed: ${error instanceof Error ? error.message : String(error)}`,
        spender: spenderAddress
      };
    }
  } catch (error) {
    console.error("❌ Unexpected approval error:", error);
    return {
      success: false,
      approved: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      spender: spenderAddress
    };
  }
}

/**
 * Check and approve VTHO token allowance for a spender (convenience function)
 * @param spenderAddress The address that will spend the VTHO (e.g. DEX router)
 * @param requiredAmount The amount that needs to be approved
 * @param network The network to use (testnet or mainnet)
 * @returns Promise with approval status
 */
export async function checkAndApproveVTHOAllowance(
  spenderAddress: string,
  requiredAmount: string,
  network: string = "testnet"
): Promise<TokenApprovalResult> {
  return checkAndApproveTokenAllowance(
    VTHO_ADDRESS,
    spenderAddress,
    requiredAmount, 
    network
  );
}

// Allow direct execution of this file for testing
if (require.main === module) {
  // Example usage when script is run directly
  const isDryRun = process.argv.includes('--dry-run');
  
  if (isDryRun) {
    console.log("🧪 DRY RUN MODE - Token approval simulation");
    console.log("Would check VTHO allowance and approve if necessary");
    process.exit(0);
  } else {
    // Get arguments from command line or use defaults
    const spender = process.argv[2] || "0x91e42759290239a62ac757cf85bb5b74ace57927"; // Default to DEX Router
    const amount = process.argv[3] || "10000000000000000000"; // Default to 10 VTHO
    const network = process.env.NETWORK || "testnet";
    
    console.log(`Running token approval for VTHO with:`);
    console.log(`- Spender: ${spender}`);
    console.log(`- Amount: ${amount}`);
    console.log(`- Network: ${network}`);
    
    checkAndApproveVTHOAllowance(spender, amount, network)
      .then(result => {
        if (result.success) {
          console.log("\n✅ VTHO approval completed successfully!");
          if (result.transactionId) {
            console.log(`Transaction ID: ${result.transactionId}`);
          }
        } else {
          console.error("\n❌ VTHO approval failed:", result.error);
        }
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error("Unexpected error in VTHO approval:", error);
        process.exit(1);
      });
  }
} 