'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { logger } from '@/lib/logger/index';

// Smart contract details
const CONTRACT_ADDRESS = '0x6b3398c941887a28c994802f6b22a84cc0a9322b' as const;

// Your complete contract ABI
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "initialOwner", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "meetId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "sender", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "receiver", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "MeetingCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "previousOwner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "meetId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "sender", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "PaymentRefunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "meetId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "receiver", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "PaymentReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "meetId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "reviewer", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "positive", "type": "bool"}
    ],
    "name": "ReviewSubmitted",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "address", "name": "_receiver", "type": "address"}],
    "name": "createMeeting",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "meetings",
    "outputs": [
      {"internalType": "address", "name": "sender", "type": "address"},
      {"internalType": "address", "name": "receiver", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "bool", "name": "isReleased", "type": "bool"},
      {"internalType": "bool", "name": "userReviewed", "type": "bool"},
      {"internalType": "bool", "name": "mentorReviewed", "type": "bool"},
      {"internalType": "bool", "name": "aiReviewed", "type": "bool"},
      {"internalType": "uint8", "name": "positiveReviews", "type": "uint8"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextMeetId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_meetId", "type": "uint256"},
      {"internalType": "bool", "name": "_positive", "type": "bool"}
    ],
    "name": "submitReview",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export function useReviewSubmitter() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address } = useAccount();

  // Read the current nextMeetId from the contract
  const { 
    data: nextMeetId, 
    error: readError, 
    isLoading: isReadLoading,
    isSuccess: isReadSuccess 
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'nextMeetId',
  });

  // Also try to read the owner to test if contract is accessible
  const { data: contractOwner, error: ownerError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  });

  // Write contract hook for submitting review
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate current meetId (nextMeetId - 1)
  const currentMeetId = nextMeetId ? Number(nextMeetId) - 1 : null;

  // Enhanced debug logging
  console.log('🔍 Enhanced Debug - useReviewSubmitter:', {
    // Contract connection
    contractAddress: CONTRACT_ADDRESS,
    walletAddress: address,
    
    // Read state
    isReadLoading,
    isReadSuccess,
    nextMeetId: nextMeetId ? Number(nextMeetId) : nextMeetId,
    currentMeetId,
    readError: readError?.message,
    
    // Contract owner test (to verify contract is accessible)
    contractOwner,
    ownerError: ownerError?.message,
    
    // Calculations
    nextMeetIdType: typeof nextMeetId,
    nextMeetIdRaw: nextMeetId,
  });

  const submitReview = async (isPositive: boolean, customMeetId?: number) => {
    if (!address) {
      throw new Error('No wallet connected');
    }

    // Wait for contract data to load if it's still loading
    if (isReadLoading && customMeetId === undefined) {
      console.log('⏳ Waiting for contract data to load...');
      // Wait up to 10 seconds for the contract read to complete
      let attempts = 0;
      while (isReadLoading && attempts < 50) { // 50 * 200ms = 10 seconds
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
      
      if (isReadLoading) {
        throw new Error('Timeout waiting for contract data. Please check your network connection and try again.');
      }
    }

    // Use custom meetId if provided, otherwise calculate from nextMeetId
    let meetIdToUse: number;
    
    if (customMeetId !== undefined) {
      meetIdToUse = customMeetId;
      console.log('🎯 Using custom meeting ID:', customMeetId);
    } else {
      // Better validation with more specific error messages
      if (nextMeetId === undefined || nextMeetId === null) {
        throw new Error('Unable to read meeting ID from contract. Please check your network connection and try again.');
      }

      const nextMeetIdNum = Number(nextMeetId);
      meetIdToUse = nextMeetIdNum - 1;
      
      console.log('🧮 Meeting ID calculation:', {
        nextMeetId: nextMeetIdNum,
        calculatedMeetId: meetIdToUse,
        isValid: meetIdToUse >= 0
      });

      if (meetIdToUse < 0) {
        throw new Error(`No meetings available for review. Next meeting ID is ${nextMeetIdNum}, which means no meetings have been created yet. Please create a meeting first.`);
      }
    }

    try {
      setIsSubmitting(true);

      console.log('📝 Submitting review to blockchain:', {
        meetId: meetIdToUse,
        positive: isPositive,
        contractAddress: CONTRACT_ADDRESS,
        functionName: 'submitReview',
        args: [meetIdToUse, isPositive]
      });

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'submitReview',
        args: [BigInt(meetIdToUse), isPositive],
      });

      logger.info('Review submission initiated', {
        meetId: meetIdToUse,
        positive: isPositive,
      });

    } catch (error) {
      setIsSubmitting(false);
      console.error('❌ Review submission failed:', error);
      throw error;
    }
  };

  // Reset submitting state when transaction completes
  useEffect(() => {
    if (isSuccess || writeError) {
      setIsSubmitting(false);
      if (isSuccess) {
        console.log('✅ Review submitted successfully!', { hash });
      }
      if (writeError) {
        console.error('❌ Transaction failed:', writeError);
      }
    }
  }, [isSuccess, writeError, hash]);

  return {
    submitReview,
    isSubmitting: isSubmitting || isTransactionLoading,
    isSuccess,
    error: readError || writeError,
    currentMeetId,
    nextMeetId: nextMeetId ? Number(nextMeetId) : null,
    transactionHash: hash,
    isConnected: !!address,
    
    // Additional debug info
    isReadLoading,
    isReadSuccess,
    contractOwner,
    canReadContract: !!contractOwner || isReadSuccess,
  };
}