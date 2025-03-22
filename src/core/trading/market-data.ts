import { createContractInterface } from '../../utils/contracts/contract-reader';
import { VTHO_ADDRESS } from '@vechain/sdk-core';
import "../../utils/wallet-management/env-loader"; 
import { RouterABI } from '../../utils/abis/router';


// DEX Router contract address (on testnet)
const DEX_ROUTER_ADDRESS = '0x91e42759290239a62ac757cf85bb5b74ace57927';

// VET token address on testnet
const vVET_ADDRESS = '0x86fb5343bbecffc86185c023a2a6ccc76fc0afd8';

// Trading parameters
const TRADE_AMOUNT_VTHO = '10000000000000000000'; // 10 VTHO (with 18 decimals)
const TRADE_PROBABILITY = 0.3; // 30% chance to trade on each block

/**
 * Interface for price ratio data
 */
export interface PriceRatio {
  inputVTHO: number;
  outputVET: number;
  vetPerVtho: number;
  vthoPerVet: number;
}

/**
 * Get the VET/VTHO ratio from the DEX
 * @returns Promise with formatted VET/VTHO ratios
 */
export async function getVETVTHORatio(): Promise<PriceRatio> {
  try {
    // Get the network from environment or default to testnet
    const network = process.env.NETWORK || "testnet";
    
    // Create contract interface for the DEX router
    const RouterContract = createContractInterface(DEX_ROUTER_ADDRESS, RouterABI, network);
    
    // Call the router to get the amount of VET we would receive for VTHO
    const amounts = await RouterContract.callPlain("getAmountsOut", TRADE_AMOUNT_VTHO, [VTHO_ADDRESS, vVET_ADDRESS]);
    
    // Ensure amounts is treated as an array
    const amountsArray = Array.isArray(amounts) ? amounts : [amounts];
    
    // Parse input (VTHO) amount
    const inputAmount = typeof amountsArray[0] === 'string' ? BigInt(amountsArray[0]) : amountsArray[0] as bigint;
    const formattedInputAmount = Number(inputAmount) / Math.pow(10, 18); // 18 decimals for VTHO
    
    // Parse output (VET) amount
    const outputAmount = typeof amountsArray[1] === 'string' ? BigInt(amountsArray[1]) : amountsArray[1] as bigint;
    const formattedOutputAmount = Number(outputAmount) / Math.pow(10, 18); // 18 decimals for VET
    
    // Calculate ratios
    const vetPerVtho = formattedOutputAmount / formattedInputAmount;
    const vthoPerVet = 1 / vetPerVtho;
    
    return {
      inputVTHO: formattedInputAmount,
      outputVET: formattedOutputAmount,
      vetPerVtho,
      vthoPerVet
    };
  } catch (error) {
    console.error('Error getting VET/VTHO ratio:', error);
    return {
      inputVTHO: 0,
      outputVET: 0,
      vetPerVtho: 0,
      vthoPerVet: 0
    };
  }
}

/**
 * Simulate a trade decision based on probability
 * @returns Boolean indicating whether to trade
 */
export function decideToTrade(probability: number = TRADE_PROBABILITY): boolean {
  return Math.random() < probability;
}

/**
 * Format the VET/VTHO ratio for display
 * @param ratio The price ratio object
 * @returns Formatted string with ratio information
 */
export function formatRatioOutput(ratio: PriceRatio): string[] {
  return [
    '\n----- VET/VTHO Ratio -----',
    `${ratio.inputVTHO} VTHO would get: ${ratio.outputVET.toFixed(8)} VET`,
    `1 VTHO = ${ratio.vetPerVtho.toFixed(8)} VET`,
    `1 VET = ${ratio.vthoPerVet.toFixed(8)} VTHO`
  ];
}

/**
 * Get trade parameters
 * @returns Object with trading parameters
 */
export function getTradeParameters() {
  return {
    TRADE_AMOUNT_VTHO,
    TRADE_PROBABILITY,
    DEX_ROUTER_ADDRESS,
    vVET_ADDRESS,
    VTHO_ADDRESS
  };
} 