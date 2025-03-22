import { subscriptions, TESTNET_URL, MAINNET_URL } from '@vechain/sdk-network';
import WebSocket from 'isomorphic-ws';
import "../../utils/wallet-management/env-loader"; 
import { displayTradeInformation, simulateTradingDecision, TradeDecision } from '../trading/strategy-simulator';
import { executeTrade } from '../trading/swap-executor';

// Configuration for the block listener
let EXECUTE_REAL_TRADES = true; // Set to true to execute actual trades
const SLIPPAGE_TOLERANCE = 5; // 5% slippage tolerance

/**
 * Initialize the block listener using SDK websocket
 */
function initializeBlockListener() {
  // Get the network from environment or default to testnet
  const network = process.env.NETWORK || "testnet";
  
  // Determine the websocket URL based on network
  const wsURL = subscriptions.getBlockSubscriptionUrl(
    network === "mainnet" ? MAINNET_URL : TESTNET_URL
  );

  console.log(`Connecting to websocket: ${wsURL}`);
  
  // Create the websocket connection
  const ws = new WebSocket(wsURL);

  // Error handling
  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });

  // Connection opened
  ws.on('open', () => {
    console.log('Connected to VeChain block stream');
    console.log('Listening for new blocks...');
  });

  // Connection closed
  ws.on('close', (code: number, reason: string) => {
    console.log(`Disconnected from block stream: ${code} - ${reason}`);
    
    // Reconnect after a delay
    console.log('Reconnecting in 5 seconds...');
    setTimeout(() => initializeBlockListener(), 5000);
  });

  // Message received (new block)
  ws.on('message', async (data: WebSocket.Data) => {
    try {
      // Parse the block data
      const blockData = JSON.parse(data.toString());
      
      console.log('\n----- New Block Received -----');
      console.log(`Block Number: ${blockData.number}`);
      console.log(`Timestamp: ${new Date(blockData.timestamp * 1000).toISOString()}`);
      console.log(`Transactions: ${blockData.transactions?.length || 0}`);
      
      // Simulate a trading decision
      const tradeDecision = await simulateTradingDecision();
      
      // Display the trading information
      displayTradeInformation(tradeDecision);
      
      // If we should execute a real trade and the decision is to trade
      if (EXECUTE_REAL_TRADES && tradeDecision.shouldTrade) {
        await executeRealTrade(tradeDecision);
      }
      
      console.log('-----------------------------\n');
    } catch (error) {
      console.error('Error processing block data:', error);
    }
  });

  return ws;
}

/**
 * Execute a real trade based on the trading decision
 * @param decision The trading decision
 */
async function executeRealTrade(decision: TradeDecision) {
  console.log('\n----- Executing Real Trade -----');
  
  try {
    // Execute the trade with the current price ratio
    const result = await executeTrade(SLIPPAGE_TOLERANCE, decision.ratio);
    
    if (result.success) {
      console.log("\n✅ Trade executed successfully!");
      console.log(`Transaction ID: ${result.transactionId}`);
      console.log(`Gas used: ${result.receipt?.gasUsed || 'unknown'}`);
      
      // Disable trading after a successful trade to prevent unintended multiple trades
      // Comment this line out if you want continuous trading
      EXECUTE_REAL_TRADES = false;
      console.log("⚠️ Trading disabled after successful execution. Set EXECUTE_REAL_TRADES to true to enable again.");
    } else {
      console.error("\n❌ Trade execution failed:", result.error);
      if (result.error && result.error.includes("allowance")) {
        console.log("🔄 This appears to be an allowance issue. Please run the token approval script separately:");
        console.log("npx ts-node scripts/tokens/token-approval.ts");
      }
    }
  } catch (error) {
    console.error('Error executing trade:', error);
    console.log("⚠️ Continuing to monitor blocks while resolving the error...");
  }
}

/**
 * Main function to start the block listener
 */
async function main() {
  try {
    console.log('Starting VeChain block monitor with trading simulator...');
    console.log(`Mode: ${EXECUTE_REAL_TRADES ? 'LIVE TRADING' : 'SIMULATION ONLY'}`);
    if (EXECUTE_REAL_TRADES) {
      console.log(`⚠️ WARNING: REAL TRADES WILL BE EXECUTED`);
      console.log(`Slippage Tolerance: ${SLIPPAGE_TOLERANCE}%`);
    }
    
    // Start the block listener
    const ws = initializeBlockListener();
    
    // Handle script termination
    process.on('SIGINT', () => {
      console.log('Closing connection...');
      ws.close();
      process.exit(0);
    });
    
    console.log('Block monitor running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Error initializing:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error); 