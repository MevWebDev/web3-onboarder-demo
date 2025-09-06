/**
 * GOLEMDB CONFIGURATION
 * 
 * This file handles all the settings needed to connect to the GolemDB blockchain.
 * Think of it like setting up your WiFi connection - you need the right network name,
 * password, and settings to connect.
 * 
 * For beginners: This file reads settings from environment variables (like secret config files)
 * and prepares them for use by our conversation storage system.
 */

// Import the types we need
import { GolemDBConfig } from './types';
import { Tagged, AccountData } from 'golem-base-sdk';

// ============================================================================
// STEP 1: PREPARE THE PRIVATE KEY
// ============================================================================

/**
 * Get the private key from environment variables and format it properly
 * 
 * Environment variables are like "secret configuration files" that store sensitive information.
 * The private key is your "secret password" to write to the blockchain.
 */

// Get the private key from environment variables (it might be empty if not set)
const rawPrivateKey = process.env.GOLEMDB_PRIVATE_KEY ?? '';

// Remove the "0x" prefix if it exists (blockchain keys sometimes have this prefix)
// For example: "0x1234abcd" becomes "1234abcd"
const cleanPrivateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey.slice(2) : rawPrivateKey;

// ============================================================================
// STEP 2: MAIN CONFIGURATION FUNCTION
// ============================================================================

/**
 * getGolemDBConfig: Creates the configuration object for connecting to GolemDB
 * 
 * This function reads settings from environment variables and packages them
 * into a format that our conversation system can use.
 * 
 * @returns GolemDBConfig - All the settings needed to connect to GolemDB
 */
export const getGolemDBConfig = (): GolemDBConfig => {
  // Create the configuration object
  const config: GolemDBConfig = {
    // BLOCKCHAIN NETWORK ADDRESS
    // This is like the "web address" of the GolemDB blockchain
    // We try environment variables first, then fall back to a default
    rpcUrl: process.env.GOLEMDB_RPC_URL || 
            process.env.NEXT_PUBLIC_GOLEMDB_RPC_URL || 
            'https://ethwarsaw.holesky.golemdb.io/rpc',

    // BLOCKCHAIN NETWORK ID
    // This is like a "zip code" that identifies which blockchain network to use
    // Convert the string to a number (parseInt means "parse integer")
    chainId: parseInt(
      process.env.GOLEMDB_CHAIN_ID || 
      process.env.NEXT_PUBLIC_GOLEMDB_CHAIN_ID || 
      '60138453033', 
      10  // Use base-10 numbers (normal counting: 0,1,2,3...)
    ),

    // PRIVATE KEY (SECRET CREDENTIALS)
    // Only create this if we have a private key
    // The "?" after privateKey in the type means it's optional
    privateKey: cleanPrivateKey ? createAccountData(cleanPrivateKey) : undefined,

    // DEBUG LOGGING
    // Should we print helpful debug messages?
    // Turn on automatically in development, or if explicitly requested
    enableLogging: process.env.NODE_ENV === 'development' || 
                   process.env.GOLEMDB_ENABLE_LOGGING === 'true'
  };

  return config;
};

// ============================================================================
// STEP 3: HELPER FUNCTIONS
// ============================================================================

/**
 * createAccountData: Convert a private key string into GolemDB AccountData format
 * 
 * GolemDB requires private keys in a special format called "Tagged".
 * This function converts a regular private key string into that format.
 * 
 * @param privateKeyHex - The private key as a hex string (without 0x prefix)
 * @returns AccountData - The private key in GolemDB's required format
 */
function createAccountData(privateKeyHex: string): AccountData {
  try {
    // Convert the hex string to a Buffer (a way to represent binary data)
    const keyBuffer = Buffer.from(privateKeyHex, 'hex');
    
    // Wrap it in GolemDB's "Tagged" format
    // "privatekey" is the tag that tells GolemDB this is a private key
    const accountData = new Tagged("privatekey", keyBuffer);
    
    return accountData as AccountData;
  } catch (error) {
    throw new Error(`Invalid private key format. Make sure your GOLEMDB_PRIVATE_KEY is a valid hex string. Error: ${error}`);
  }
}

/**
 * validateConfig: Check that all required settings are valid
 * 
 * This function acts like a "safety check" to make sure all our settings
 * are correct before we try to connect to the blockchain.
 * 
 * @param config - The configuration object to validate
 * @throws Error if any settings are invalid
 */
export const validateConfig = (config: GolemDBConfig): void => {
  // CHECK RPC URL
  if (!config.rpcUrl) {
    throw new Error(
      'GolemDB RPC URL is required. Please set the GOLEMDB_RPC_URL environment variable. ' +
      'This is the web address needed to connect to the GolemDB blockchain.'
    );
  }

  // CHECK CHAIN ID
  if (!config.chainId || isNaN(config.chainId)) {
    throw new Error(
      'Valid GolemDB Chain ID is required. Please set the GOLEMDB_CHAIN_ID environment variable. ' +
      'This is a number that identifies which blockchain network to use.'
    );
  }

  // CHECK URL FORMAT
  try {
    new URL(config.rpcUrl);  // This will throw an error if the URL is invalid
  } catch (error) {
    throw new Error(
      `Invalid RPC URL format: ${config.rpcUrl}. ` +
      'Please provide a valid web address like "https://example.com/rpc"'
    );
  }

  // PRIVATE KEY WARNING (not an error, just a warning)
  if (!config.privateKey) {
    console.warn(
      'WARNING: No private key provided. You will only be able to read data, not write to the blockchain. ' +
      'To enable writing, set the GOLEMDB_PRIVATE_KEY environment variable.'
    );
  }
};

// ============================================================================
// STEP 4: PREDEFINED NETWORK CONFIGURATIONS
// ============================================================================

/**
 * GOLEMDB_TESTNET_CONFIG: Default settings for the GolemDB test network
 * 
 * This is like a "preset" configuration for the GolemDB test network.
 * Test networks are safe places to experiment without using real money.
 * 
 * The "as const" tells TypeScript these values should never change.
 */
export const GOLEMDB_TESTNET_CONFIG = {
  name: 'GolemDB Testnet',
  rpcUrl: 'https://ethwarsaw.holesky.golemdb.io/rpc',
  chainId: 60138453033,
  
  // Information about the network's native currency (what you pay gas fees with)
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,  // How many decimal places the currency has
  },
  
  // Where you can view transactions on this network (like a receipt viewer)
  blockExplorerUrls: ['https://ethwarsaw.holesky.golemdb.io/rpc'],
} as const;  // "as const" means these values cannot be changed