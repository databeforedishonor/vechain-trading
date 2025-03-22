import { executeTransaction, createVTHOTransferClause } from './token-transfer';

/**
 * Transfer VTHO tokens to a recipient
 * @param recipientAddress Address to send VTHO to
 * @param amount Amount of VTHO to send
 */
async function sendVTHO(recipientAddress: string, amount: number) {
  console.log(`Starting VTHO transfer of ${amount} VTHO to ${recipientAddress}...`);
  
  // Create VTHO transfer clause
  const clause = createVTHOTransferClause(recipientAddress, amount);
  
  // Execute the transaction
  const receipt = await executeTransaction([clause]);
  
  console.log('VTHO transfer completed successfully!');
  return receipt;
}

// Run directly if this is the main script
if (require.main === module) {
  // Default recipient address
  const recipient = '0xb717b660cd51109334bd10b2c168986055f58c1a';
  
  // Amount to transfer (10 VTHO)
  const amount = 10;
  
  // Execute the VTHO transfer
  sendVTHO(recipient, amount).catch(error => {
    console.error('Error in VTHO transfer:', error);
  });
} 