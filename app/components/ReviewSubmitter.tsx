'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { logger } from '@/lib/logger/index';

// Smart contract details
const CONTRACT_ADDRESS = '0x6b3398c941887a28c994802f6b22a84cc0a9322b' as const;

// Contract ABI for reading nextMeetId and submitting review
const CONTRACT_ABI = [
  {
    inputs: [],
    name: 'nextMeetId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_meetId',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: '_positive',
        type: 'bool',
      },
    ],
    name: 'submitReview',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ===================================
// HOOK: useReviewSubmitter
// ===================================

export function useReviewSubmitter() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address } = useAccount();

  // Read the current nextMeetId from the contract
  const { data: nextMeetId, error: readError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'nextMeetId',
  });

  // Write contract hook for submitting review
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate current meetId (nextMeetId - 1)
  const currentMeetId = nextMeetId ? Number(nextMeetId) - 1 : null;

  const submitReview = async (isPositive: boolean) => {
    if (!address) {
      throw new Error('No wallet connected');
    }

    if (currentMeetId === null || currentMeetId < 0) {
      throw new Error('Invalid meeting ID');
    }

    try {
      setIsSubmitting(true);

      logger.info('Submitting review on blockchain', {
        meetId: currentMeetId,
        positive: isPositive,
        nextMeetId: nextMeetId?.toString(),
      });

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'submitReview',
        args: [BigInt(currentMeetId), isPositive],
      });
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  };

  // Reset submitting state when transaction completes
  useEffect(() => {
    if (isSuccess || writeError) {
      setIsSubmitting(false);
    }
  }, [isSuccess, writeError]);

  return {
    submitReview,
    isSubmitting: isSubmitting || isTransactionLoading,
    isSuccess,
    error: readError || writeError,
    currentMeetId,
    nextMeetId: nextMeetId ? Number(nextMeetId) : null,
    transactionHash: hash,
    isConnected: !!address,
  };
}

// ===================================
// COMPONENT: ReviewSubmitter (Modal)
// ===================================

interface ReviewSubmitterProps {
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

export default function ReviewSubmitter({ onReviewSubmitted, onCancel }: ReviewSubmitterProps) {
  const [selectedReview, setSelectedReview] = useState<boolean | null>(null);
  
  const {
    submitReview,
    isSubmitting,
    isSuccess,
    error,
    currentMeetId,
    nextMeetId,
    transactionHash,
    isConnected
  } = useReviewSubmitter();

  const handleSubmitReview = async (isPositive: boolean) => {
    try {
      setSelectedReview(isPositive);
      await submitReview(isPositive);
    } catch (error) {
      logger.error('Failed to submit review:', error);
      setSelectedReview(null);
    }
  };

  // Handle successful transaction
  if (isSuccess) {
    logger.info('Review submitted successfully', { hash: transactionHash });
    onReviewSubmitted();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Rate Your Call Experience
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          How was your video call experience? Your feedback helps improve the platform.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-md">
            <p className="text-sm text-red-700">
              Error: {error.message || 'Failed to submit review'}
            </p>
          </div>
        )}

        {!isConnected && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md">
            <p className="text-sm text-yellow-700">
              Please connect your wallet to submit a review
            </p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-4">
            Meeting ID: {currentMeetId !== null ? currentMeetId : 'Loading...'}
          </p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleSubmitReview(true)}
              disabled={isSubmitting || !isConnected || currentMeetId === null}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                selectedReview === true && isSubmitting
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedReview === true && isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="text-2xl mr-2">👍</span>
                  Thumbs Up
                </div>
              )}
            </button>

            <button
              onClick={() => handleSubmitReview(false)}
              disabled={isSubmitting || !isConnected || currentMeetId === null}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                selectedReview === false && isSubmitting
                  ? 'bg-red-500 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedReview === false && isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="text-2xl mr-2">👎</span>
                  Thumbs Down
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip Review
          </button>
        </div>

        {transactionHash && (
          <div className="mt-4 p-3 bg-blue-100 border border-blue-400 rounded-md">
            <p className="text-sm text-blue-700">
              Review submitted! 
              <a 
                href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                View on Explorer
              </a>
            </p>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>Contract: {CONTRACT_ADDRESS}</p>
          <p>Network: Base Sepolia</p>
          <p>Next Meet ID: {nextMeetId?.toString() || 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
}