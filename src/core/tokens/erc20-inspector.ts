import { createContractInterface } from "../../utils/contracts/contract-reader";
import { VTHO_ADDRESS, ERC20_ABI } from "@vechain/sdk-core";
import "../../utils/wallet-management/env-loader"; // This automatically loads environment variables


// Default wallet address - override with command line argument
const DEFAULT_WALLET_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Get token balance and information
 * @param tokenAddress The token contract address to check balance for
 * @param walletAddress The wallet address to check balance for
 * @param network The network to use (testnet or mainnet)
 */
async function getTokenInfo(tokenAddress: string, walletAddress: string, network: string = "testnet") {
  console.log(`🔍 Querying token information for ${tokenAddress}...`);
  console.log(`Wallet: ${walletAddress}`);
  console.log(`Network: ${network}`);
  
  try {
    // Create a contract interface for the token
    const tokenContract = createContractInterface(tokenAddress, ERC20_ABI, network);
    
    // Query token information
    console.log("Fetching token details...");
    
    // Run multiple calls to get token information
    const [name, symbol, decimals, totalSupply] = await tokenContract.multiCallPlain([
      {methodName:"name"},
      {methodName:"symbol"},
      {methodName:"decimals"},
      {methodName:"totalSupply"}
    ]);
    
    // Format and display the token information
    console.log("\n=== Token Information ===");
    console.log(`Token Name: ${name}`);
    console.log(`Token Symbol: ${symbol}`);
    console.log(`Decimals: ${decimals}`);
    
    // Handle totalSupply with proper type handling
    const supplyBigInt = typeof totalSupply === 'string' ? BigInt(totalSupply) : totalSupply as bigint;
    console.log(`Total Supply: ${supplyBigInt.toString()}`);
    
    // Format the total supply for human-readable display
    const formattedSupply = Number(supplyBigInt) / Math.pow(10, decimals as number);
    console.log(`Total Supply (formatted): ${formattedSupply.toLocaleString()} ${symbol}`);
    
    console.log(`Contract Address: ${tokenAddress}`);
    console.log(`Network: ${network}`);
     
    console.log("\n=== Token Balance Info ===");
    console.log(`Wallet Address: ${walletAddress}`);
    
    // Get token balance for the wallet
    try {
      const balance = await tokenContract.callPlain("balanceOf", walletAddress);
      const balanceBigInt = typeof balance === 'string' ? BigInt(balance) : balance as bigint;
      const formattedBalance = Number(balanceBigInt) / Math.pow(10, decimals as number);
      
      console.log(`Balance: ${formattedBalance.toLocaleString()} ${symbol}`);
      console.log(`Raw Balance: ${balanceBigInt.toString()}`);
    } catch (error) {
      console.error(`Error fetching balance: ${error}`);
    }
    
  } catch (error) {
    console.error("❌ Error fetching token information:", error);
    console.log("\n📋 Troubleshooting:");
    console.log("1. Check that your .env file contains a valid NETWORK setting (testnet/mainnet)");
    console.log("2. Verify you have a working internet connection");
    console.log("3. Ensure the token address is valid and implements the ERC20 interface");
    console.log("4. Check that the VeChain node for your selected network is accessible");
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

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  }); 