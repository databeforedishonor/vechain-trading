import { 
  Address, 
  Clause, 
  ERC20_ABI, 
  Transaction, 
  TransactionBody, 
  TransactionClause, 
  VTHO, 
  VET,
  VTHO_ADDRESS,
  HexUInt,
  Mnemonic,
  ABIContract,
  ABIFunction
} from "@vechain/sdk-core";

import { ThorClient, TESTNET_URL, MAINNET_URL, network, TransactionBodyOptions } from "@vechain/sdk-network";
import { createContractInterface } from "./contract-reader";
import { ClauseOptions } from "@vechain/sdk-core";



/**
 * Options for transaction signing
 */
export type TransactionSigner = {
  /**
   * Private key as a Uint8Array
   */
  privateKey?: Uint8Array;
  /**
   * Mnemonic phrase (list of words)
   */
  mnemonic?: string[];
};

/**
 * Options for transaction execution
 */
export type TransactionExecutionOptions = TransactionBodyOptions & {
  /**
   * Whether to wait for transaction receipt
   */
  waitForReceipt?: boolean;
};

/**
 * Creates a transaction manager for signing and sending transactions on VeChain
 * @param network The network URL to connect to (defaults to testnet)
 * @returns An object with methods for transaction building and signing
 */
export function createTransactionManager(network:string) {
    if(network === "mainnet"){
        network = MAINNET_URL;
    }else{
        network = TESTNET_URL;
    }
  const thorClient = ThorClient.at(network);
  
  const manager = {


    buildTransactionClause: (
      contractAddress: string, 
      abi: any, 
      functionName: string, 
      params: unknown[], 
      value?: number,
      clauseOptions?: ClauseOptions
    ): TransactionClause => {
      // Convert contract address to Address type
      const addressObj = Address.of(contractAddress);
      
      // Create contract interface and get function ABI
      const contractInterface = ABIContract.ofAbi(abi);
      const functionAbi = contractInterface.getFunction(functionName);
      
      // Build amount of VET to send (default to 0)
      const vetAmount = value ? VET.of(value) : undefined;
      
      // Call the function using Clause.callFunction
      return Clause.callFunction(
        addressObj,
        functionAbi,
        params,
        vetAmount,
        clauseOptions
      );
    },



    /**
     * Builds a transaction with the given clauses
     * @param clauses Array of transaction clauses
     * @param options Additional transaction options
     * @returns Transaction body object
     */
    buildTransaction: async (
      clauses: TransactionClause[],
      options?: TransactionBodyOptions  
    ) => {
      // Estimate gas for the transaction
      const gasResult = await thorClient.gas.estimateGas(
        clauses      
    );
      
      // Get transaction body using the SDK method
      return await thorClient.transactions.buildTransactionBody(
        clauses,
        gasResult.totalGas,
        options
      );
    },
    
    /**
     * Signs a transaction using the provided private key
     * @param txBody Transaction body
     * @param privateKey Private key for signing
     * @returns Signed transaction
     */
    signTransaction: async (txBody: TransactionBody, privateKey: Uint8Array) => {
        const tx = Transaction.of(txBody);
        const signedTx = tx.sign(privateKey);
        return signedTx;
    },
    
    /**
     * Sends a signed transaction to the network
     * @param signedTx Signed transaction
     * @returns Transaction result
     */
    sendTransaction: async (signedTx: Transaction) => {
      return await thorClient.transactions.sendTransaction(signedTx);
    },
    
    /**
     * Waits for a transaction to be confirmed
     * @param txId Transaction ID
     * @returns Transaction receipt
     */
    waitForTransaction: async (txId: string) => {
      return await thorClient.transactions.waitForTransaction(txId);
    },
    
    /**
     * Gets a private key from either a private key or mnemonic
     * @param signer Transaction signer options 
     * @returns Private key as Uint8Array
     */
    getPrivateKey: (signer: TransactionSigner): Uint8Array => {
      if (signer.privateKey) {
        return signer.privateKey;
      } else if (signer.mnemonic) {
        try {
          // Validate mnemonic has enough words
          if (!signer.mnemonic.length || signer.mnemonic.length < 12) {
            throw new Error(`Invalid mnemonic: expected at least 12 words but got ${signer.mnemonic.length}`);
          }
          return Mnemonic.toPrivateKey(signer.mnemonic);
        } catch (error) {
          console.error("Error generating private key from mnemonic:", error);
          throw new Error(`Failed to generate private key from mnemonic: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      throw new Error('Either privateKey or mnemonic must be provided');
    },
    
    /**
     * Gets wallet address from either a private key or mnemonic
     * @param signer Transaction signer options
     * @returns Wallet address
     */
    getWalletAddress: (signer: TransactionSigner): string => {
      if (signer.privateKey) {
        return Address.ofPrivateKey(signer.privateKey).toString();
      } else if (signer.mnemonic) {
        try {
          // Validate mnemonic has enough words
          if (!signer.mnemonic.length || signer.mnemonic.length < 12) {
            throw new Error(`Invalid mnemonic: expected at least 12 words but got ${signer.mnemonic.length}`);
          }
          return Address.ofMnemonic(signer.mnemonic).toString();
        } catch (error) {
          console.error("Error generating address from mnemonic:", error);
          throw new Error(`Failed to generate address from mnemonic: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      throw new Error('Either privateKey or mnemonic must be provided');
    },
    
    /**
     * Builds, signs, and sends a transaction in one operation
     * @param clauses Array of transaction clauses
     * @param signer Either a private key or mnemonic for signing
     * @param options Additional transaction options
     * @returns Transaction result
     */
    executeTransaction: async (
      clauses: TransactionClause[],
      signer: TransactionSigner,
      options?: TransactionExecutionOptions
    ) => {
    
      // Set default options if not provided
      options = {
        expiration: 32, // Default expiration of 32 blocks
        gasPriceCoef: 127, // Default gas price coefficient
        ...options
      };
      
      // Default to waiting for receipt if not specified
      const waitForReceipt = options?.waitForReceipt ?? true;
      
      // Get private key from signer options
      const privateKey = manager.getPrivateKey(signer);
        
      // 1. Build transaction
      const txBody = await manager.buildTransaction(clauses, options);
      
      // 2. Sign transaction
      const signedTx = await manager.signTransaction(txBody, privateKey);
      
      // 3. Send transaction
      const sendResult = await manager.sendTransaction(signedTx);
      
      // 4. Wait for receipt if requested
      if (waitForReceipt) {
        const receipt = await manager.waitForTransaction(sendResult.id);
        return {
          transactionId: sendResult.id,
          receipt
        };
      }
      return {
        transactionId: sendResult.id
      };
    },
    
    /**
     * Create a VET transfer clause
     * @param toAddress Recipient address
     * @param amount Amount of VET to transfer
     * @returns Transaction clause
     */
    vetTransferClause: (toAddress: string, amount: number) => {
      return Clause.transferVET(
        Address.of(toAddress),
        VET.of(amount)
      ) as TransactionClause;
    },
    
    /**
     * Create a VTHO transfer clause
     * @param toAddress Recipient address
     * @param amount Amount of VTHO to transfer
     * @returns Transaction clause
     */
    vthoTransferClause: (toAddress: string, amount: number) => {
      return Clause.transferVTHOToken(
        Address.of(toAddress),
        VTHO.of(amount)
      ) as TransactionClause;
    },
    
    /**
     * Create an ERC20 token transfer clause
     * @param toAddress Recipient address
     * @param amount Amount to transfer
     * @param tokenAddress Token contract address
     * @param decimals Token decimals (defaults to 18)
     * @returns Transaction clause
     */
    tokenTransferClause: async (toAddress: string, amount: number, tokenAddress: string, decimals?: number) => {
      // Handle VTHO tokens with their built-in support
      if (tokenAddress.toLowerCase() === VTHO_ADDRESS.toLowerCase()) {
        return Clause.transferVTHOToken(
          Address.of(toAddress),
          VTHO.of(amount)
        ) as TransactionClause;
      }
      
      // For ERC20 tokens, use the contract directly
      const tokenContract = thorClient.contracts.load(tokenAddress, ERC20_ABI);
      
      // Get decimals from the contract if not provided
      let tokenDecimals = decimals ?? 18; // Default to 18 if not provided
      if (decimals === undefined) {
        try {
          const contractInterface = createContractInterface(tokenAddress, ERC20_ABI, network);
          const fetchedDecimals = await contractInterface.callNumber("decimals");
          if (typeof fetchedDecimals === 'number') {
            tokenDecimals = fetchedDecimals;
          }
        } catch (error) {
          console.warn(`Failed to get decimals for token ${tokenAddress}, using default of 18:`, error);
          // Keep using the default of 18
        }
      }
      
      // Convert amount to wei based on decimals (10^decimals)
      const amountInWei = (amount * Math.pow(10, tokenDecimals)).toString();
      return tokenContract.clause.transfer(toAddress, amountInWei);
    },
    
    /**
     * Create an NFT transfer clause
     * @param contractAddress NFT contract address
     * @param senderAddress Current owner address
     * @param receiverAddress New owner address
     * @param tokenId NFT token ID
     * @returns Transaction clause
     */
    nftTransferClause: (contractAddress: string, senderAddress: string, receiverAddress: string, tokenId: number) => {
      return Clause.transferNFT(
        Address.of(contractAddress),
        Address.of(senderAddress),
        Address.of(receiverAddress),
        HexUInt.of(tokenId)
      ) as TransactionClause;
    },

    /**
     * Get Thor client contract loader
     * @param contractAddress The contract address
     * @param abi Contract ABI array
     * @returns Contract instance from Thor client
     */
    getContractInstance: (contractAddress: string, abi: any[]) => {
      return thorClient.contracts.load(contractAddress, abi);
    },
    
    /**
     * Get the Thor client instance
     */
    getThorClient: () => thorClient
  };
  
  return manager;
}

