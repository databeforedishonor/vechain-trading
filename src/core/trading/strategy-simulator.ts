import { getVETVTHORatio, decideToTrade, formatRatioOutput, getTradeParameters, PriceRatio } from './market-data';

/**
 * Interface for trade decision result
 */
export interface TradeDecision {
  shouldTrade: boolean;
  ratio: PriceRatio;
  tradingMessage: string;
}

/**
 * Simulate a trading decision based on current market conditions
 * @returns Promise with trading decision and details
 */
export async function simulateTradingDecision(): Promise<TradeDecision> {
  // Get current VET/VTHO ratio
  const ratio = await getVETVTHORatio();
  
  // Make trading decision
  const { TRADE_PROBABILITY } = getTradeParameters();
  const shouldTrade = decideToTrade(TRADE_PROBABILITY);
  
  // Create trading message
  let tradingMessage = '';
  if (shouldTrade) {
    tradingMessage = `✅ TRADE SIMULATION: Would swap 10 VTHO for ${ratio.outputVET.toFixed(8)} VET`;
  } else {
    tradingMessage = '❌ NO TRADE: Waiting for next block';
  }
  
  return {
    shouldTrade,
    ratio,
    tradingMessage
  };
}

/**
 * Display trading information based on a trade decision
 * @param decision The trade decision object
 */
export function displayTradeInformation(decision: TradeDecision): void {
  // Display the ratio information
  const ratioOutput = formatRatioOutput(decision.ratio);
  ratioOutput.forEach(line => console.log(line));
  
  // Display trading decision
  console.log('\n----- Trading Decision -----');
  console.log(decision.tradingMessage);
}

/**
 * Execute a stand-alone trading simulation
 * This can be called directly for testing purposes
 */
export async function runStandaloneTradingSimulation(): Promise<void> {
  console.log('Running stand-alone trading simulation...');
  
  try {
    const decision = await simulateTradingDecision();
    displayTradeInformation(decision);
    
    // Additional trading data that could be useful for analytics
    console.log('\n----- Trading Data -----');
    console.log(`Probability of trade: ${getTradeParameters().TRADE_PROBABILITY * 100}%`);
    console.log(`Decision made: ${decision.shouldTrade ? 'TRADE' : 'WAIT'}`);
    console.log(`VET/VTHO ratio: ${decision.ratio.vetPerVtho.toFixed(8)}`);
  } catch (error) {
    console.error('Error in trading simulation:', error);
  }
}

// Allow direct execution of this file for testing
if (require.main === module) {
  runStandaloneTradingSimulation()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Trading simulation failed:', error);
      process.exit(1);
    });
} 