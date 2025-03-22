import { executeTransaction } from './token-transfer';
import { Clause, Address, TransactionClause } from '@vechain/sdk-core';
import * as path from 'path';
import * as fs from 'fs';

// Load ABIs from config
const ROUTER_ABI_PATH = path.resolve(__dirname, '../../config/abis/router.json');
const ERC20_ABI_PATH = path.resolve(__dirname, '../../config/abis/ERC20.json');
const ROUTER_ABI = JSON.parse(fs.readFileSync(ROUTER_ABI_PATH, 'utf8'));
const ERC20_ABI = JSON.parse(fs.readFileSync(ERC20_ABI_PATH, 'utf8'));

// Contract addresses
const ROUTER_CONTRACT = '0x3a1c392ff36251a9fb6f94c4d478dff50ef7c151'; // Replace with actual router address
const VTHO_CONTRACT = '0x0000000000000000000000000000456E65726779';
const VVET_CONTRACT = '0x0000000000000000000000000000456E65726778'; // Replace with actual VVET address

/**
 * Create an approval clause for token spending by router
 * @param tokenAddress Token contract address
 * @param spender Router address that will spend tokens
 * @param amount Amount to approve (in wei)
 * @returns Transaction clause
 */
function createApprovalClause(
  tokenAddress: string, 
  spender: string, 
  amount: string
): TransactionClause {
  // Find the approve function in ERC20 ABI
  const approveAbi = ERC20_ABI.find(item => 
    item.name === 'approve' && 
    item.type === 'function' && 
    item.inputs && 
    item.inputs.length === 2
  );

  if (!approveAbi) {
    throw new Error('approve function not found in ERC20 ABI');
  }

  // Create ABI encoded call
  const data = {
    function: 'approve',
    params: [spender, amount],
    abi: approveAbi
  };

  // Encode for blockchain transaction
  const encodedData = Clause.encodeAsClauseData(data);

  // Create the clause
  return {
    to: tokenAddress,
    value: '0x0',
    data: encodedData
  };
}

/**
 * Create a clause for swapping exact tokens for ETH (VET)
 * @param amountIn Amount of tokens to swap in
 * @param amountOutMin Minimum amount of VET to receive
 * @param path Array of token addresses in the swap path [tokenIn, ..., WETH]
 * @param to Recipient address
 * @param deadline Timestamp deadline for the swap
 * @returns Transaction clause
 */
function createSwapExactTokensForETHClause(
  amountIn: string,
  amountOutMin: string,
  path: string[],
  to: string,
  deadline: number
): TransactionClause {
  // Find the swapExactTokensForETH function in router ABI
  const swapAbi = ROUTER_ABI.find(item => 
    item.name === 'swapExactTokensForETH' && 
    item.type === 'function' && 
    item.inputs && 
    item.inputs.length === 5
  );

  if (!swapAbi) {
    throw new Error('swapExactTokensForETH function not found in router ABI');
  }

  // Create ABI encoded call
  const data = {
    function: 'swapExactTokensForETH',
    params: [amountIn, amountOutMin, path, to, deadline],
    abi: swapAbi
  };

  // Encode for blockchain transaction
  const encodedData = Clause.encodeAsClauseData(data);

  // Create the clause
  return {
    to: ROUTER_CONTRACT,
    value: '0x0',
    data: encodedData
  };
}

/**
 * Swap exact tokens for ETH (VET)
 * @param tokenIn Token to swap from
 * @param amountIn Amount of tokens to swap
 * @param minAmountOut Minimum amount of VET to receive
 * @param recipient Recipient address for the VET
 */
async function swapTokensForVET(
  tokenIn: string,
  amountIn: string,
  minAmountOut: string,
  recipient: string
) {
  console.log(`Starting token swap on DEX...`);
  console.log(`- Token to swap: ${tokenIn}`);
  console.log(`- Amount in: ${amountIn}`);
  console.log(`- Minimum VET out: ${minAmountOut}`);
  console.log(`- Recipient: ${recipient}`);
  
  // Set deadline to 20 minutes from now
  const deadline = Math.floor(Date.now() / 1000) + 1200;
  
  // Create swap path
  const path = [tokenIn, VVET_CONTRACT];
  
  // Create approval clause - must approve router to spend tokens
  const approvalClause = createApprovalClause(tokenIn, ROUTER_CONTRACT, amountIn);
  
  // Create swap clause
  const swapClause = createSwapExactTokensForETHClause(
    amountIn,
    minAmountOut,
    path,
    recipient,
    deadline
  );
  
  // Execute multi-clause transaction (approve + swap)
  const receipt = await executeTransaction([approvalClause, swapClause]);
  
  console.log('Token swap completed successfully!');
  return receipt;
}

/**
 * Get token price quote via router
 * This is a view function, so it won't create a transaction
 * @param amountIn Amount of input tokens
 * @param path Array of token addresses in the quote path
 * @returns Price quote
 */
function createGetAmountsOutClause(
  amountIn: string,
  path: string[]
): TransactionClause {
  // Find the getAmountsOut function in router ABI
  const getAmountsOutAbi = ROUTER_ABI.find(item => 
    item.name === 'getAmountsOut' && 
    item.type === 'function' && 
    item.inputs && 
    item.inputs.length === 2
  );

  if (!getAmountsOutAbi) {
    throw new Error('getAmountsOut function not found in router ABI');
  }

  // Create ABI encoded call
  const data = {
    function: 'getAmountsOut',
    params: [amountIn, path],
    abi: getAmountsOutAbi
  };

  // Encode for blockchain transaction
  const encodedData = Clause.encodeAsClauseData(data);

  // Create the clause
  return {
    to: ROUTER_CONTRACT,
    value: '0x0',
    data: encodedData
  };
}

// Run directly if this is the main script
if (require.main === module) {
  // Default recipient address (your own address)
  const recipient = '0x350702cf5CF6b0747d846ec04924d51460831B73';
  
  // Amount to swap - 100 VTHO (with 18 decimals)
  const amountIn = '100000000000000000000';
  
  // Minimum amount of VET to receive - 0.01 VET (with 18 decimals)
  const minAmountOut = '10000000000000000';
  
  // Execute the token swap
  swapTokensForVET(VTHO_CONTRACT, amountIn, minAmountOut, recipient).catch(error => {
    console.error('Error in token swap:', error);
  });
} 