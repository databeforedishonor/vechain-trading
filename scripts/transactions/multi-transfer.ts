import { executeTransaction, createVETTransferClause, createVTHOTransferClause } from './token-transfer';
import { TransactionClause } from '@vechain/sdk-core';

/**
 * Send both VET and VTHO to a recipient in a single transaction
 * @param recipientAddress Address to send tokens to
 * @param vetAmount Amount of VET to send
 * @param vthoAmount Amount of VTHO to send
 */
async function sendMultipleTokens(recipientAddress: string, vetAmount: number, vthoAmount: number) {
  console.log(`Starting multi-token transfer to ${recipientAddress}...`);
  console.log(`- VET amount: ${vetAmount}`);
  console.log(`- VTHO amount: ${vthoAmount}`);
  
  // Create an array of clauses for the transaction
  const clauses: TransactionClause[] = [];
  
  // Add VET transfer clause
  clauses.push(createVETTransferClause(recipientAddress, vetAmount));
  
  // Add VTHO transfer clause
  clauses.push(createVTHOTransferClause(recipientAddress, vthoAmount));
  
  // Execute multi-clause transaction
  const receipt = await executeTransaction(clauses);
  
  console.log('Multi-token transfer completed successfully!');
  return receipt;
}

// Run directly if this is the main script
if (require.main === module) {
  // Default recipient address
  const recipient = '0xb717b660cd51109334bd10b2c168986055f58c1a';
  
  // Amounts to transfer
  const vetAmount = 0.5;  // 0.5 VET
  const vthoAmount = 5;   // 5 VTHO
  
  // Execute the multi-token transfer
  sendMultipleTokens(recipient, vetAmount, vthoAmount).catch(error => {
    console.error('Error in multi-token transfer:', error);
  });
} 