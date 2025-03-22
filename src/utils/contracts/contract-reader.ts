import { ThorClient } from "@vechain/sdk-network";
import { TESTNET_URL, MAINNET_URL } from "@vechain/sdk-network";
import "../../utils/wallet-management/env-loader"; // This automatically loads environment variables

/**
 * Creates a contract interface to interact with any contract on VeChain
 * @param contractAddress The address of the contract to interact with
 * @param abi The ABI of the contract
 * @param network The network to connect to (defaults to testnet)
 * @returns An object with methods to interact with the contract
 */
export function createContractInterface(
  contractAddress: string, 
  abi: any, 
  network: string = "testnet"
) {
  // Set network URL based on parameter or environment variable
  let networkUrl: string;
  
  if (network === "testnet" || network === TESTNET_URL) {
    networkUrl = TESTNET_URL;
  } else if (network === "mainnet" || network === MAINNET_URL) {
    networkUrl = MAINNET_URL;
  } else {
    // If a custom URL is provided, use it directly
    networkUrl = network;
  }

  // Create Thor client with the specified network
  const thorClient = ThorClient.at(networkUrl);
  const contract = thorClient.contracts.load(contractAddress, abi);
  
  return {
    /**
     * Execute a single method call on the contract
     * @param methodName The name of the method to call
     * @param params The parameters to pass to the method
     * @returns The result of the method call
     */
    call: async (methodName: string, ...params: any[]) => {
      const clause = contract.clause[methodName](...params);
      const result = await thorClient.contracts.executeMultipleClausesCall([clause]);
      return result[0];
    },
    
    /**
     * Execute a single method call and return just the plain result value
     * @param methodName The name of the method to call
     * @param params The parameters to pass to the method
     * @returns The plain result value
     */
    callPlain: async (methodName: string, ...params: any[]) => {
      const clause = contract.clause[methodName](...params);
      const result = await thorClient.contracts.executeMultipleClausesCall([clause]);
      return result[0].result.plain;
    },
    
    /**
     * Execute a single method call for a number and return as a JavaScript number
     * @param methodName The name of the method to call
     * @param params The parameters to pass to the method
     * @returns The result as a number
     */
    callNumber: async (methodName: string, ...params: any[]) => {
      const clause = contract.clause[methodName](...params);
      const result = await thorClient.contracts.executeMultipleClausesCall([clause]);
      const value = result[0].result.plain;
      return typeof value === 'bigint' ? Number(value) : 
             typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : 
             value;
    },
    
    /**
     * Execute multiple method calls on the contract in a single transaction
     * @param methodCalls Array of method call objects, each with methodName and params
     * @returns The results of all method calls
     */
    multiCall: async (methodCalls: {methodName: string, params?: any[]}[]) => {
      const clauses = methodCalls.map(call => {
        return contract.clause[call.methodName](...(call.params || []));
      });
      
      const results = await thorClient.contracts.executeMultipleClausesCall(clauses);
      return results;
    },
    
    /**
     * Execute multiple method calls and return just the plain results
     * @param methodCalls Array of method call objects, each with methodName and params
     * @returns Array of plain result values
     */
    multiCallPlain: async (methodCalls: {methodName: string, params?: any[]}[]) => {
      const clauses = methodCalls.map(call => {
        return contract.clause[call.methodName](...(call.params || []));
      });
      
      const results = await thorClient.contracts.executeMultipleClausesCall(clauses);
      return results.map(result => result.result.plain);
    },
    
    /**
     * Get the raw contract instance for advanced operations
     */
    getContract: () => contract,
    
    /**
     * Get the Thor client instance
     */
    getThorClient: () => thorClient
  };
}
