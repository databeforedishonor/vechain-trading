import { createTransactionManager } from "../../utils/contracts/contract-writer";
import { createSignerFromEnv } from "../../utils/wallet-management/key-utils";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import { getTradeParameters, PriceRatio } from "./market-data";
import { createContractInterface } from "../../utils/contracts/contract-reader";
import "../../utils/wallet-management/env-loader";
import { RouterABI } from '../../utils/abis/router';
import { checkAndApproveVTHOAllowance } from "../tokens/erc20-approve";


/**
 * Interface for trade execution results
 */
export interface TradeExecutionResult {
  success: boolean;
  transactionId?: string;
  receipt?: any;
  error?: string;
  details?: any;
}

/**
 * Execute swap from VTHO to VET
 * @param slippageTolerance Percentage of slippage tolerance
 * @param expectedRatio Current price ratio from DEX
 * @returns Promise with trade result
 */
export async function executeVTHOtoVETSwap(
  slippageTolerance: number = 5,
  expectedRatio?: PriceRatio
): Promise<TradeExecutionResult> {
  console.log("\n🔄 Preparing VTHO to VET swap...");
  
  try {
    // Get trading parameters
    const { DEX_ROUTER_ADDRESS, TRADE_AMOUNT_VTHO, vVET_ADDRESS, VTHO_ADDRESS } = getTradeParameters();
    
    // Get network from environment
    const network = process.env.NETWORK || "testnet";
    console.log(`Network: ${network}`);
    
    // Get signer from environment variables
    const { signer, source } = createSignerFromEnv(network);
    if (!signer || (!signer.mnemonic && !signer.privateKey)) {
      return { 
        success: false, 
        error: "No valid signer credentials found in environment"
      };
    }
    
    // Create transaction manager
    const txManager = createTransactionManager(network);
    
    // Get wallet address
    const walletAddress = txManager.getWalletAddress(signer);
    console.log(`🔑 Using ${source} wallet: ${walletAddress}`);
    
    // Get current ratio from chain if not provided
    let ratio = expectedRatio;
    if (!ratio) {
      console.log("Getting current VET/VTHO ratio from DEX...");
      
      // Create contract interface for router
      const RouterContract = createContractInterface(DEX_ROUTER_ADDRESS, RouterABI, network);
      
      // Get amounts out
      const amounts = await RouterContract.callPlain("getAmountsOut", TRADE_AMOUNT_VTHO, [VTHO_ADDRESS, vVET_ADDRESS]);
      
      // Parse the output amount
      const amountsArray = Array.isArray(amounts) ? amounts : [amounts];
      const outputAmount = typeof amountsArray[1] === 'string' ? BigInt(amountsArray[1]) : amountsArray[1] as bigint;
      
      // Create a placeholder ratio object
      ratio = {
        inputVTHO: Number(BigInt(TRADE_AMOUNT_VTHO)) / 1e18,
        outputVET: Number(outputAmount) / 1e18,
        vetPerVtho: (Number(outputAmount) / 1e18) / (Number(BigInt(TRADE_AMOUNT_VTHO)) / 1e18),
        vthoPerVet: (Number(BigInt(TRADE_AMOUNT_VTHO)) / 1e18) / (Number(outputAmount) / 1e18)
      };
    }
    
    // Calculate output with slippage tolerance
    const outputAmount = BigInt(Math.floor(ratio.outputVET * 1e18));
    const slippageFactor = 1 - (slippageTolerance / 100);
    const minOutput = BigInt(Math.floor(Number(outputAmount) * slippageFactor));
    
    console.log(`Input Amount: ${TRADE_AMOUNT_VTHO} VTHO (${Number(BigInt(TRADE_AMOUNT_VTHO)) / 1e18} VTHO)`);
    console.log(`Expected Output: ${outputAmount} VET (${ratio.outputVET.toFixed(8)} VET)`);
    console.log(`Minimum Output (with ${slippageTolerance}% slippage): ${minOutput} VET (${Number(minOutput) / 1e18} VET)`);
    
    // Calculate deadline (current time + 5 minutes)
    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
    
    // Create swap transaction
    console.log("Creating swap transaction...");
    
    // Path array for the swap (VTHO -> VET)
    const path = [VTHO_ADDRESS, vVET_ADDRESS];
    
    // Create swap transaction clause
    // Using swapExactTokensForETH which is the correct method for swapping tokens for native VET
    const swapClause = txManager.buildTransactionClause(
      DEX_ROUTER_ADDRESS,
      RouterABI,
      "swapExactTokensForETH", 
      [TRADE_AMOUNT_VTHO, minOutput.toString(), path, walletAddress, deadline]
    );
    
    // Execute the swap transaction
    console.log("Executing swap transaction...");
    const result = await txManager.executeTransaction(
      [swapClause],
      signer,
      {
        waitForReceipt: true,
        gas: 300000,        // Higher gas limit for swap
        gasPriceCoef: 0     // Base gas price
      }
    );
    
    console.log("✅ Swap transaction executed!");
    console.log(`Transaction ID: ${result.transactionId}`);
    
    return {
      success: true,
      transactionId: result.transactionId,
      receipt: result.receipt
    };
  } catch (error) {
    console.error("❌ Error executing swap:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Complete trade flow - handle both approval and swap in sequence
 * @param slippageTolerance Percentage of slippage tolerance
 * @param expectedRatio Current price ratio from DEX
 * @returns Promise with trade result
 */
export async function executeTrade(
  slippageTolerance: number = 5,
  expectedRatio?: PriceRatio
): Promise<TradeExecutionResult> {
  console.log("🚀 Starting complete trade flow (approval + swap)...");
  
  // Get DEX router address and trade amount
  const { DEX_ROUTER_ADDRESS, TRADE_AMOUNT_VTHO } = getTradeParameters();
  const network = process.env.NETWORK || "testnet";
  
  // First, check and approve allowance if needed using the token approval module
  const approvalResult = await checkAndApproveVTHOAllowance(
    DEX_ROUTER_ADDRESS,
    TRADE_AMOUNT_VTHO,
    network
  );
  
  if (!approvalResult.success) {
    return {
      success: false,
      error: `Approval failed: ${approvalResult.error}`
    };
  }
  
  // If approval was successful or not needed, proceed with swap
  console.log("Proceeding with swap execution...");
  return executeVTHOtoVETSwap(slippageTolerance, expectedRatio);
}

// Parse command line arguments for dry run mode
const isDryRun = process.argv.includes('--dry-run');

// Allow direct execution of this file for testing
if (require.main === module) {
  if (isDryRun) {
    console.log("🧪 DRY RUN MODE - No transactions will be sent");
    console.log("Simulating trade execution flow...");
    
    // In dry run mode, just log what would happen
    console.log("1. Would check VTHO allowance");
    console.log("2. Would approve VTHO spending if needed");
    console.log("3. Would execute VTHO to VET swap with 5% slippage tolerance");
    process.exit(0);
  } else {
    executeTrade()
      .then(result => {
        if (result.success) {
          console.log("\n✅ Trade executed successfully!");
          console.log("Transaction ID:", result.transactionId);
          console.log("Receipt:", result.receipt);
        } else {
          console.error("\n❌ Trade execution failed:", result.error);
        }
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error("Unexpected error in trade execution:", error);
        process.exit(1);
      });
  }
} 