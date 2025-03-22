import { subscriptions, TESTNET_URL } from '@vechain/sdk-network';
import WebSocket from 'isomorphic-ws';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { Framework } from '@vechain/connex-framework';
import { Driver } from '@vechain/connex-driver';
import { SimpleNet } from '@vechain/connex.driver-nodejs/dist/simple-net';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Block Event listener for VeChain that monitors VET/VTHO ratio
 * and makes random trading decisions
 */

// Configure BigNumber
BigNumber.config({
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN
});

// DEX Router contract address (DEX on testnet)
const DEX_ROUTER_ADDRESS = '0x91e42759290239a62ac757cf85bb5b74ace57927';

// VET and VTHO token addresses
const vVET_ADDRESS = '0x86fb5343bbecffc86185c023a2a6ccc76fc0afd8';
const VTHO_ADDRESS = '0x0000000000000000000000000000456e65726779';

// Trading parameters
const TRADE_AMOUNT_VTHO = '10000000000000000000'; // 10 VTHO (with 18 decimals)
const TRADE_PROBABILITY = 0.3; // 30% chance to trade on each block

// Load router ABI from JSON file
const routerAbiPath = path.join(__dirname, '../../config/abis/router.json');
const routerABI = JSON.parse(fs.readFileSync(routerAbiPath, 'utf8'));

// Setup Connex
let connex: Framework;

/**
 * Initialize Connex connection
 */
async function initConnex(): Promise<Framework> {
  console.log(`Connecting to VeChain network: ${TESTNET_URL}`);
  const driver = await Driver.connect(new SimpleNet(TESTNET_URL));
  return new Framework(driver);
}

/**
 * Get the current exchange rate between VET and VTHO using contract call
 * @returns Promise with the VET/VTHO ratio
 */
async function getVETVTHORatio(): Promise<{ ratio: BigNumber, vetPerVtho: string, vthoPerVet: string }> {
  try {
    if (!connex) {
      throw new Error('Connex not initialized');
    }

    // Get the router contract
    const routerContract = connex.thor.account(DEX_ROUTER_ADDRESS);
    
    // Find getAmountsOut ABI
    const getAmountsOutAbi = routerABI.find((abi: any) => abi.name === 'getAmountsOut');
    
    if (!getAmountsOutAbi) {
      throw new Error('getAmountsOut ABI not found');
    }
    
    // Create method call
    const getAmountsOutMethod = routerContract.method(getAmountsOutAbi);
    
    // Call getAmountsOut with 10 VTHO -> VET path
    const result = await getAmountsOutMethod.call(
      TRADE_AMOUNT_VTHO,
      [VTHO_ADDRESS, vVET_ADDRESS]
    );
    
    // Get the amounts array from the result
    const amounts = result.decoded.amounts;
    
    if (!amounts || amounts.length < 2) {
      throw new Error('Invalid amounts returned from getAmountsOut');
    }
    
    // Get the VET amount (second element in the array)
    const vetAmount = amounts[1];
    
    // Calculate the ratios for 1 VTHO
    const vthoAmount = new BigNumber(TRADE_AMOUNT_VTHO);
    const oneVTHO = new BigNumber('1000000000000000000'); // 1 VTHO with 18 decimals
    
    // Calculate VET per 1 VTHO
    const vetPerVtho = new BigNumber(vetAmount)
      .multipliedBy(oneVTHO)
      .dividedBy(vthoAmount)
      .dividedBy(1e18)
      .toString();
    
    // Calculate VTHO per 1 VET
    const vthoPerVet = new BigNumber(1)
      .dividedBy(new BigNumber(vetPerVtho))
      .toString();
    
    return {
      ratio: new BigNumber(vetAmount).dividedBy(vthoAmount),
      vetPerVtho,
      vthoPerVet
    };
  } catch (error) {
    console.error('Error getting VET/VTHO ratio:', error);
    return {
      ratio: new BigNumber(0),
      vetPerVtho: '0',
      vthoPerVet: '0'
    };
  }
}

/**
 * Simulate a trade decision based on probability
 * @returns Boolean indicating whether to trade
 */
function decideToTrade(): boolean {
  return Math.random() < TRADE_PROBABILITY;
}

/**
 * Create and initialize the websocket for listening to block events
 */
function initializeBlockListener(): WebSocket {
  // The URL for subscribing to the block
  const wsURL = subscriptions.getBlockSubscriptionUrl(TESTNET_URL);

  console.log(`Connecting to websocket: ${wsURL}`);
  
  // Create the websocket connection
  const ws = new WebSocket(wsURL);

  // Set up event handlers
  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('open', () => {
    console.log('Connected to VeChain block stream');
    console.log('Listening for new blocks...');
  });

  ws.on('close', (code: number, reason: string) => {
    console.log(`Disconnected from block stream: ${code} - ${reason}`);
    
    // Reconnect after a delay
    console.log('Reconnecting in 5 seconds...');
    setTimeout(() => initializeBlockListener(), 5000);
  });

  ws.on('message', async (data: WebSocket.Data) => {
    try {
      // Parse the block data
      const blockData = JSON.parse(data.toString());
      
      console.log('\n----- New Block Received -----');
      console.log(`Block Number: ${blockData.number}`);
      console.log(`Timestamp: ${new Date(blockData.timestamp * 1000).toISOString()}`);
      console.log(`Transactions: ${blockData.transactions?.length || 0}`);
      console.log(`Gas Used: ${blockData.gasUsed}`);
      console.log(`Size: ${blockData.size} bytes`);
      
      // Get the current VET/VTHO ratio
      const ratio = await getVETVTHORatio();
      console.log('\n----- VET/VTHO Ratio -----');
      console.log(`10 VTHO would get: ${new BigNumber(ratio.vetPerVtho).multipliedBy(10).toString()} VET`);
      console.log(`1 VTHO = ${ratio.vetPerVtho} VET`);
      console.log(`1 VET = ${ratio.vthoPerVet} VTHO`);
      
      // Make a random trading decision
      const shouldTrade = decideToTrade();
      console.log('\n----- Trading Decision -----');
      
      if (shouldTrade) {
        console.log(`✅ TRADE EXECUTED: Swapping 10 VTHO for VET`);
        // TODO: Implement actual trading logic here
        // This would involve creating and broadcasting a transaction to the DEX
      } else {
        console.log('❌ NO TRADE: Waiting for next block');
      }
      
      console.log('-----------------------------\n');
    } catch (error) {
      console.error('Error processing block data:', error);
    }
  });

  return ws;
}

// Initialize Connex and start the block listener
async function main() {
  try {
    // Initialize Connex
    connex = await initConnex();
    console.log('Connex initialized successfully');
    
    // Start the block listener
    const ws = initializeBlockListener();
    
    // Handle script termination
    process.on('SIGINT', () => {
      console.log('Closing connection...');
      ws.close();
      process.exit(0);
    });
    
    console.log('VET/VTHO ratio monitor running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Error initializing:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error); 