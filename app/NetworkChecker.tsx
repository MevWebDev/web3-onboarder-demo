// Network Checker - Verify you're on Base Sepolia

import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

const CONTRACT_ADDRESS = '0x6b3398c941887a28c994802f6b22a84cc0a9322b' as const;
const REQUIRED_CHAIN_ID = baseSepolia.id; // Base Sepolia = 84532

export function NetworkChecker() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isCorrectNetwork = chainId === REQUIRED_CHAIN_ID;

  console.log('🌐 Network Debug:', {
    connected: isConnected,
    currentChainId: chainId,
    requiredChainId: REQUIRED_CHAIN_ID,
    isCorrectNetwork,
    baseSepolia: baseSepolia,
    contractAddress: CONTRACT_ADDRESS
  });

  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: REQUIRED_CHAIN_ID });
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: `2px solid ${isCorrectNetwork ? '#4caf50' : '#f44336'}`,
      borderRadius: '12px',
      margin: '10px',
      background: isCorrectNetwork ? '#e8f5e8' : '#ffebee'
    }}>
      <h3 style={{ margin: '0 0 15px 0' }}>🌐 Network Status</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Wallet:</strong> {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not connected'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current Chain:</strong> {chainId} {getChainName(chainId)}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Required Chain:</strong> {REQUIRED_CHAIN_ID} (Base Sepolia)
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Contract:</strong> {CONTRACT_ADDRESS}
      </div>

      {!isConnected && (
        <div style={{ 
          padding: '12px', 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '6px',
          marginBottom: '10px'
        }}>
          ⚠️ <strong>Please connect your wallet first</strong>
        </div>
      )}

      {isConnected && !isCorrectNetwork && (
        <div style={{ 
          padding: '12px', 
          background: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '6px',
          marginBottom: '10px'
        }}>
          ❌ <strong>Wrong Network!</strong> You're on chain {chainId} but need Base Sepolia ({REQUIRED_CHAIN_ID})
        </div>
      )}

      {isConnected && isCorrectNetwork && (
        <div style={{ 
          padding: '12px', 
          background: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '6px',
          marginBottom: '10px'
        }}>
          ✅ <strong>Correct Network!</strong> You're connected to Base Sepolia
        </div>
      )}

      {isConnected && !isCorrectNetwork && (
        <button
          onClick={handleSwitchNetwork}
          disabled={isPending}
          style={{
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isPending ? '🔄 Switching...' : '🔀 Switch to Base Sepolia'}
        </button>
      )}

      <div style={{ 
        marginTop: '15px',
        fontSize: '12px',
        color: '#666',
        background: '#f8f9fa',
        padding: '10px',
        borderRadius: '6px'
      }}>
        <strong>Base Sepolia Details:</strong><br/>
        • Chain ID: {REQUIRED_CHAIN_ID}<br/>
        • RPC: https://sepolia.base.org<br/>
        • Explorer: https://sepolia.basescan.org<br/>
        • Contract: <a href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer">
          View on BaseScan
        </a>
      </div>
    </div>
  );
}

function getChainName(chainId: number): string {
  switch (chainId) {
    case 1: return '(Ethereum Mainnet)';
    case 11155111: return '(Sepolia)';
    case 8453: return '(Base Mainnet)';
    case 84532: return '(Base Sepolia) ✅';
    case 137: return '(Polygon)';
    case 42161: return '(Arbitrum One)';
    case 10: return '(Optimism)';
    default: return '(Unknown)';
  }
}

// Quick contract existence checker
export function ContractExistenceChecker() {
  const chainId = useChainId();
  
  const checkContract = async () => {
    try {
      const response = await fetch(`https://api-sepolia.basescan.org/api?module=proxy&action=eth_getCode&address=${CONTRACT_ADDRESS}&tag=latest&apikey=YourApiKeyToken`);
      const data = await response.json();
      
      console.log('📋 Contract existence check:', {
        address: CONTRACT_ADDRESS,
        chainId,
        hasCode: data.result !== '0x',
        result: data.result
      });
      
      if (data.result === '0x') {
        alert('❌ No contract found at this address on current network!');
      } else {
        alert('✅ Contract exists!');
      }
    } catch (error) {
      console.error('Contract check failed:', error);
    }
  };

  return (
    <button 
      onClick={checkContract}
      style={{
        padding: '8px 16px',
        background: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: 'pointer'
      }}
    >
      🔍 Check if Contract Exists
    </button>
  );
}

