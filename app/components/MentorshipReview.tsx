import React from "react";

interface MentorshipAnalysis {
  decision: boolean;
  reason: string;
}

interface MentorshipReviewProps {
  analysis: MentorshipAnalysis | null;
  loading: boolean;
  callId?: string;
}

export function MentorshipReview({ analysis, loading, callId }: MentorshipReviewProps) {
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-50 rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Processing transcription and analyzing conversation...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg border-2 border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        📊 Mentorship Session Review
      </h2>
      
      <div className="space-y-6">
        {/* Visual Boolean Result */}
        <div className="text-center">
          <div className={`inline-flex items-center px-6 py-3 rounded-full text-white font-bold text-lg ${
            analysis.decision ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {analysis.decision ? '✅ HELPFUL' : '❌ NOT HELPFUL'}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Boolean Result: <code className="bg-gray-100 px-2 py-1 rounded">{analysis.decision.toString()}</code>
          </p>
        </div>

        {/* Reason */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Analysis Reason:</h3>
          <p className="text-gray-600 italic">"{analysis.reason}"</p>
        </div>

        {/* JSON Display */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
          <h3 className="text-white font-semibold mb-2">JSON Response:</h3>
          <pre className="text-sm">
            <code>{JSON.stringify({ decision: analysis.decision, reason: analysis.reason }, null, 2)}</code>
          </pre>
        </div>

        {/* Technical Details */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Call ID:</span>
              <span className="ml-2 font-mono text-xs">{callId || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Analysis Type:</span>
              <span className="ml-2">AI-Powered (Claude 3.5)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}