import React, { useState } from 'react';
import { useReviewSubmitter } from './hooks/useReviewSubmitter'; // We'll create this hook

interface CallReviewProps {
  onReviewSubmit?: (isPositive: boolean) => void;
}

export default function CallReview({ onReviewSubmit }: CallReviewProps) {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewValue, setReviewValue] = useState<boolean | null>(null);
  
  // Use the smart contract hook
  const {
    submitReview,
    isSubmitting,
    isSuccess,
    error,
    currentMeetId,
    transactionHash,
    isReadLoading,
  } = useReviewSubmitter();

  const handleReview = async (isPositive: boolean) => {
    setReviewValue(isPositive);
    
    // Log to console as requested
    console.log(JSON.stringify({ helpful: isPositive }));
    
    try {
      // Submit to smart contract
      await submitReview(isPositive);
      
      // Call the optional callback
      onReviewSubmit?.(isPositive);
      
      setHasReviewed(true);
    } catch (error) {
      console.error('Failed to submit review:', error);
      // Reset on error so user can try again
      setReviewValue(null);
    }
  };

  // Show success state after blockchain submission is complete
  if (hasReviewed && isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-xl border border-green-200 dark:border-green-800">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">{reviewValue ? '👍' : '👎'}</span>
        </div>
        <h3 className="text-xl font-semibold text-green-700 dark:text-green-300 mb-2">
          Thank you for your feedback!
        </h3>
        <p className="text-sm text-green-600 dark:text-green-400 text-center mb-2">
          Your review has been recorded on the blockchain
        </p>
        {transactionHash && (
          <a 
            href={`https://sepolia.basescan.org/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Transaction
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
        <span className="text-white text-2xl">💭</span>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3 text-center">
        How was your call?
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 text-center mb-2 max-w-sm">
        Your feedback helps us understand if the call was helpful and improve the experience
      </p>

      {currentMeetId !== null && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6">
          Meeting ID: {currentMeetId}
        </p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-md max-w-sm">
          <p className="text-sm text-red-700 dark:text-red-400 text-center">
            Error submitting review. Please try again.
          </p>
        </div>
      )}
      
      <div className="flex gap-6">
        <button
          onClick={() => handleReview(true)}
          disabled={isSubmitting || isReadLoading}
          className="group flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-2xl border-2 border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="w-14 h-14 bg-green-500 group-hover:bg-green-600 rounded-full flex items-center justify-center mb-3 transition-colors">
            {isSubmitting && reviewValue === true ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isReadLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-white text-3xl">👍</span>
            )}
          </div>
          <span className="text-green-700 dark:text-green-300 font-semibold text-lg">
            {isReadLoading ? 'Loading...' : (isSubmitting && reviewValue === true ? 'Submitting...' : 'Helpful')}
          </span>
          <span className="text-green-600 dark:text-green-400 text-sm text-center mt-1">
            The call was useful
          </span>
        </button>
        
        <button
          onClick={() => handleReview(false)}
          disabled={isSubmitting || isReadLoading}
          className="group flex flex-col items-center justify-center p-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-2xl border-2 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="w-14 h-14 bg-red-500 group-hover:bg-red-600 rounded-full flex items-center justify-center mb-3 transition-colors">
            {isSubmitting && reviewValue === false ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isReadLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-white text-3xl">👎</span>
            )}
          </div>
          <span className="text-red-700 dark:text-red-300 font-semibold text-lg">
            {isReadLoading ? 'Loading...' : (isSubmitting && reviewValue === false ? 'Submitting...' : 'Not Helpful')}
          </span>
          <span className="text-red-600 dark:text-red-400 text-sm text-center mt-1">
            The call wasn&apos;t useful
          </span>
        </button>
      </div>
      
      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
        Your review will be logged and recorded on the blockchain
      </div>
    </div>
  );
}