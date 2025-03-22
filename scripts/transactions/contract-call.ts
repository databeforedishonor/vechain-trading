import { executeTransaction } from './token-transfer';
import { Clause, Address, TransactionClause } from '@vechain/sdk-core';
import * as path from 'path';
import * as fs from 'fs';

// Load ERC-20 ABI from config
const ERC20_ABI_PATH = path.resolve(__dirname, '../../config/abis/ERC20.json');
const ERC20_ABI = JSON.parse(fs.readFileSync(ERC20_ABI_PATH, 'utf8'));

// VTHO token contract address
const VTHO_CONTRACT = '0x0000000000000000000000000000456E65726779';

/**
 * Create a clause for an ERC-20 token transfer
 * @param tokenAddress Address of the ERC-20 token contract
 * @param recipientAddress Recipient address
 * @param amount Amount of tokens to transfer (in token decimals)
 * @returns Transaction clause
 */
function createERC20TransferClause(
  tokenAddress: string,
  recipientAddress: string,
  amount: string
): TransactionClause {
  // Find the transfer function ABI
  const transferAbi = ERC20_ABI.find(item => 
    item.name === 'transfer' && 
    item.type === 'function' && 
    item.inputs && 
    item.inputs.length === 2
  );

  if (!transferAbi) {
    throw new Error('Transfer function not found in ERC20 ABI');
  }

  // Create ABI encoded call for ERC-20 transfer(address _to, uint256 _value)
  const data = {
    function: 'transfer',
    params: [recipientAddress, amount],
    abi: transferAbi
  };

  // Encode for blockchain transaction
  const encodedData = Clause.encodeAsClauseData(data);

  // Create the clause
  return {
    to: tokenAddress,
    value: '0x0', // No VET being transferred, just token
    data: encodedData
  };
}

/**
 * Transfer ERC-20 tokens to a recipient
 * @param tokenAddress Address of the ERC-20 token contract
 * @param recipientAddress Address to send tokens to
 * @param amount Amount of tokens to send (in token decimals)
 */
async function transferERC20(tokenAddress: string, recipientAddress: string, amount: string) {
  console.log(`Starting ERC-20 token transfer from ${tokenAddress}...`);
  console.log(`- Recipient: ${recipientAddress}`);
  console.log(`- Amount: ${amount} tokens`);
  
  // Create ERC-20 transfer clause
  const clause = createERC20TransferClause(tokenAddress, recipientAddress, amount);
  
  // Execute the transaction
  const receipt = await executeTransaction([clause]);
  
  console.log('ERC-20 token transfer completed successfully!');
  return receipt;
}

/**
 * Create a token balance check clause (view function)
 * @param tokenAddress Address of the ERC20 token contract
 * @param ownerAddress Address to check balance for
 * @returns Transaction clause for balance check
 */
function createTokenBalanceClause(
  tokenAddress: string,
  ownerAddress: string
): TransactionClause {
  // Find the balanceOf function ABI
  const balanceOfAbi = ERC20_ABI.find(item => 
    item.name === 'balanceOf' && 
    item.type === 'function' && 
    item.inputs && 
    item.inputs.length === 1
  );

  if (!balanceOfAbi) {
    throw new Error('balanceOf function not found in ERC20 ABI');
  }

  // Create ABI encoded call
  const data = {
    function: 'balanceOf',
    params: [ownerAddress],
    abi: balanceOfAbi
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

// Run directly if this is the main script
if (require.main === module) {
  // Default recipient address
  const recipient = '0xb717b660cd51109334bd10b2c168986055f58c1a';
  
  // Amount to transfer - 1e18 (1 token with 18 decimals)
  const amount = '1000000000000000000';
  
  // Execute the ERC-20 token transfer
  transferERC20(VTHO_CONTRACT, recipient, amount).catch(error => {
    console.error('Error in ERC-20 token transfer:', error);
  });
} 