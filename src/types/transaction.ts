
/**
 * Options for `buildTransactionBody` method.
 */
export interface TransactionBodyOptions {
   /**
    * 8 bytes prefix of some block's ID
    */
   blockRef?: string;

   /**
    * Last byte of genesis block ID
    */
   chainTag?: number;

   /**
    * The ID of the transaction that this transaction depends on.
    */
   dependsOn?: string;

   /**
    * The expiration time of the transaction.
    * The transaction will expire after the number of blocks specified by this value.
    */
   expiration?: number;

   /**
    * Transaction gas.
    */
   gas?: string | number;

   /**
    *  The maximum amount of gas to allow this transaction to consume.
    */
   gasLimit?: string;

   /**
    *  The gas price to use for legacy transactions or transactions on
    *  legacy networks.
    *
    *  Most of the time the ``max*FeePerGas`` is preferred.
    */
   gasPrice?: string;

   /**
    * Coefficient used to calculate the gas price for the transaction.
    * Value must be between 0 and 255.
    */
   gasPriceCoef?: number;

   /**
    * Whether the transaction is delegated to another account for gas payment.
    */
   isDelegated?: boolean;

   /**
    * Nonce value for various purposes.
    * Basic is to prevent replay attack by make transaction unique.
    * Every transaction with same chainTag, blockRef, ... must have different nonce.
    */
   nonce?: string | number;
}