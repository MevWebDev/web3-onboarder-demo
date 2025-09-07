import React from 'react';

interface AIAnalysisResultProps {
  isLoading: boolean;
  analysis?: {
    wasHelpful: boolean;
    reason: string;
    rawAnalysis?: string;
    overallScore?: number;
  };
}

export default function AIAnalysisResult({ isLoading, analysis }: AIAnalysisResultProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">
          Waiting for AI Analysis
        </h3>
        <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
          AI is analyzing the conversation transcript...
        </p>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-xl border ${
      analysis.wasHelpful 
        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
    }`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        analysis.wasHelpful 
          ? 'bg-green-100 dark:bg-green-900/30'
          : 'bg-red-100 dark:bg-red-900/30'
      }`}>
        <span className="text-2xl">{analysis.wasHelpful ? '✅' : '❌'}</span>
      </div>
      
      <h3 className={`text-xl font-semibold mb-2 ${
        analysis.wasHelpful 
          ? 'text-green-700 dark:text-green-300'
          : 'text-red-700 dark:text-red-300'
      }`}>
        AI Analysis Complete
      </h3>
      
      <div className={`p-4 rounded-lg mb-4 w-full ${
        analysis.wasHelpful 
          ? 'bg-green-100 dark:bg-green-900/20'
          : 'bg-red-100 dark:bg-red-900/20'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-semibold ${
            analysis.wasHelpful 
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            {analysis.wasHelpful ? 'Helpful Mentor' : 'Not Helpful Mentor'}
          </span>
          {analysis.overallScore && (
            <span className={`text-sm px-2 py-1 rounded ${
              analysis.wasHelpful 
                ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
            }`}>
              Score: {analysis.overallScore}/10
            </span>
          )}
        </div>
        
        <p className={`text-sm ${
          analysis.wasHelpful 
            ? 'text-green-700 dark:text-green-300'
            : 'text-red-700 dark:text-red-300'
        }`}>
          <strong>Reason:</strong> {analysis.reason}
        </p>
      </div>
      
      {analysis.rawAnalysis && (
        <details className="w-full">
          <summary className={`cursor-pointer text-sm font-medium mb-2 ${
            analysis.wasHelpful 
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            View Full AI Analysis
          </summary>
          <div className={`text-xs p-3 rounded border-l-4 ${
            analysis.wasHelpful 
              ? 'bg-green-50 border-green-400 text-green-700 dark:bg-green-950/50 dark:text-green-300'
              : 'bg-red-50 border-red-400 text-red-700 dark:bg-red-950/50 dark:text-red-300'
          }`}>
            {analysis.rawAnalysis}
          </div>
        </details>
      )}
      
      <p className={`text-xs text-center mt-4 ${
        analysis.wasHelpful 
          ? 'text-green-500 dark:text-green-400'
          : 'text-red-500 dark:text-red-400'
      }`}>
        Analysis powered by Claude 3.5 Sonnet via OpenRouter
      </p>
    </div>
  );
}