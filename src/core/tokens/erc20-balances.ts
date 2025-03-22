import { createContractInterface } from "../../utils/contracts/contract-reader";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import { ERC20_ABI } from "../../utils/abis/erc20";
import "../../utils/wallet-management/env-loader";

// Default wallet address - override with command line argument
const DEFAULT_WALLET_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Get token balance and information
 * @param tokenAddress The token contract address to check balance for
 * @param walletAddress The wallet address to check balance for
 * @param network The network to use (testnet or mainnet)
 */
export async function getTokenInfo(tokenAddress: string, walletAddress: string, network: string = "testnet") {
  console.log(`🔍 Querying token information for ${tokenAddress}...`);
  console.log(`Wallet: ${walletAddress}`);
  console.log(`Network: ${network}`);
  
  try {
    // Create a contract interface for the token
    const tokenContract = createContractInterface(tokenAddress, ERC20_ABI, network);
    
    // Query token information
    console.log("Fetching token details...");
    
    // Get token information
    const tokenInfo = await tokenContract.getTokenInfo();
    
    // Get token balance
    const balance = await tokenContract.balanceOf(walletAddress);
    
    // Get total supply
    const totalSupply = await tokenContract.call("totalSupply");
    
    // Format values for display
    const balanceValue = Number(balance) / Math.pow(10, tokenInfo.decimals);
    const totalSupplyValue = Number(totalSupply) / Math.pow(10, tokenInfo.decimals);
    
    // Format and display the token information
    console.log("\n=== Token Information ===");
    console.log(`Token Name: ${tokenInfo.name}`);
    console.log(`Token Symbol: ${tokenInfo.symbol}`);
    console.log(`Decimals: ${tokenInfo.decimals}`);
    console.log(`Total Supply: ${totalSupply.toString()}`);
    console.log(`Total Supply (formatted): ${totalSupplyValue.toLocaleString()} ${tokenInfo.symbol}`);
    console.log(`Contract Address: ${tokenAddress}`);
    console.log(`Network: ${network}`);
     
    console.log("\n=== Token Balance Info ===");
    console.log(`Wallet Address: ${walletAddress}`);
    console.log(`Balance: ${balanceValue.toLocaleString()} ${tokenInfo.symbol}`);
    console.log(`Raw Balance: ${balance.toString()}`);
    
    // Return token information and balance
    return {
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
      totalSupply: totalSupply.toString(),
      balance: balance.toString(),
      formattedBalance: balanceValue,
      formattedTotalSupply: totalSupplyValue
    };
  } catch (error) {
    console.error("❌ Error fetching token information:", error);
    console.log("\n📋 Troubleshooting:");
    console.log("1. Check that your .env file contains a valid NETWORK setting (testnet/mainnet)");
    console.log("2. Verify you have a working internet connection");
    console.log("3. Ensure the token address is valid and implements the ERC20 interface");
    console.log("4. Check that the VeChain node for your selected network is accessible");
    
    throw error;
  }
}

/**
 * Main function that parses arguments and runs the token query
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Get wallet address from arguments or environment
  const walletAddress = args[0] || process.env.WALLET_ADDRESS || DEFAULT_WALLET_ADDRESS;
  
  // Get token address from arguments or default to VTHO
  const tokenAddress = args[1] || VTHO_ADDRESS;
  
  // Get network from environment or default to testnet
  const network = process.env.NETWORK || "testnet";
  
  // Get token info and balance
  await getTokenInfo(tokenAddress, walletAddress, network);
}

// Run the script if this is the main module
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error("Unexpected error:", error);
      process.exit(1);
    });
} 