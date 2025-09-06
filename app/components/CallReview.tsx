import React, { useState } from 'react';

interface CallReviewProps {
  onReviewSubmit?: (isPositive: boolean) => void;
}

export default function CallReview({ onReviewSubmit }: CallReviewProps) {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewValue, setReviewValue] = useState<boolean | null>(null);

  const handleReview = (isPositive: boolean) => {
    setReviewValue(isPositive);
    setHasReviewed(true);
    
    // Log to console as requested
    console.log(JSON.stringify({ helpful: isPositive }));
    
    // Call the optional callback
    onReviewSubmit?.(isPositive);
  };

  if (hasReviewed) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-xl border border-green-200 dark:border-green-800">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">{reviewValue ? '👍' : '👎'}</span>
        </div>
        <h3 className="text-xl font-semibold text-green-700 dark:text-green-300 mb-2">
          Thank you for your feedback!
        </h3>
        <p className="text-sm text-green-600 dark:text-green-400 text-center">
          Your review helps us improve the call experience
        </p>
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
      
      <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-sm">
        Your feedback helps us understand if the call was helpful and improve the experience
      </p>
      
      <div className="flex gap-6">
        <button
          onClick={() => handleReview(true)}
          className="group flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-2xl border-2 border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
        >
          <div className="w-14 h-14 bg-green-500 group-hover:bg-green-600 rounded-full flex items-center justify-center mb-3 transition-colors">
            <span className="text-white text-3xl">👍</span>
          </div>
          <span className="text-green-700 dark:text-green-300 font-semibold text-lg">
            Helpful
          </span>
          <span className="text-green-600 dark:text-green-400 text-sm text-center mt-1">
            The call was useful
          </span>
        </button>
        
        <button
          onClick={() => handleReview(false)}
          className="group flex flex-col items-center justify-center p-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-2xl border-2 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
        >
          <div className="w-14 h-14 bg-red-500 group-hover:bg-red-600 rounded-full flex items-center justify-center mb-3 transition-colors">
            <span className="text-white text-3xl">👎</span>
          </div>
          <span className="text-red-700 dark:text-red-300 font-semibold text-lg">
            Not Helpful
          </span>
          <span className="text-red-600 dark:text-red-400 text-sm text-center mt-1">
            The call wasn&apos;t useful
          </span>
        </button>
      </div>
      
      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
        Your review will be logged for analysis
      </div>
    </div>
  );
}