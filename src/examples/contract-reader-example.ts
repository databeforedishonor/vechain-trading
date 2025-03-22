import { createContractInterface } from "../utils/contracts/contract-reader";
import { ERC20_ABI } from "../utils/abis/erc20";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import "../utils/wallet-management/env-loader"; // This automatically loads environment variables

// Example token address (VTHO on Testnet)
const tokenAddress = VTHO_ADDRESS;

// Get network from environment variable or default to testnet
const network = process.env.NETWORK || "testnet";

/**
 * Example of how to read from a contract using the contract interface
 */
async function main() {
  try {
    console.log(`Running contract read example on ${network}...`);
    
    // Create contract interface for token
    const tokenContract = createContractInterface(
      tokenAddress,
      ERC20_ABI,
      network
    );
    
    // Print header
    console.log("\n==== Example Contract Read Operations ====");
    
    // Get and display token information
    console.log("\n1. Reading token information...");
    const tokenInfo = await tokenContract.getTokenInfo();
    console.log(`Token Name: ${tokenInfo.name}`);
    console.log(`Token Symbol: ${tokenInfo.symbol}`);
    console.log(`Token Decimals: ${tokenInfo.decimals}`);
    
    // Read total supply of the token
    console.log("\n2. Reading token total supply...");
    const totalSupply = await tokenContract.call("totalSupply");
    console.log(`Total Supply: ${totalSupply.toString()}`);
    console.log(`Formatted Total Supply: ${Number(totalSupply) / Math.pow(10, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    
    // Read balance of a specific address
    // Example address - replace with your own address for real usage
    const walletAddress = "0x7567d83b7b8d80addcb281a71d54fc7b3364ffed";
    
    console.log(`\n3. Reading token balance for address: ${walletAddress}...`);
    const balance = await tokenContract.balanceOf(walletAddress);
    console.log(`Balance: ${balance}`);
    console.log(`Formatted Balance: ${Number(balance) / Math.pow(10, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    
    // Read allowance for a specific spender
    // Example spender address - replace with real spender like DEX router
    const spenderAddress = "0xD8B5B792A4C8EecF6830718E7b974a8E09DDC05a"; // Example - a DEX router
    
    console.log(`\n4. Reading token allowance for spender: ${spenderAddress}...`);
    const allowance = await tokenContract.allowance(walletAddress, spenderAddress);
    console.log(`Allowance: ${allowance}`);
    console.log(`Formatted Allowance: ${Number(allowance) / Math.pow(10, tokenInfo.decimals)} ${tokenInfo.symbol}`);
    
    console.log("\n==== Contract Read Example Complete ====");
  } catch (error) {
    console.error("Error in contract read example:", error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
} 