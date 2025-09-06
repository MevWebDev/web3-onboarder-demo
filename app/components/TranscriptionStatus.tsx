import React from 'react';

type TranscriptionStage = 'waiting' | 'fetching' | 'analyzing' | 'complete' | 'error' | 'timeout';

interface TranscriptionStatusProps {
  stage: TranscriptionStage;
  loading: boolean;
  hasAnalysis: boolean;
}

export default function TranscriptionStatus({ stage, loading, hasAnalysis }: TranscriptionStatusProps) {
  const getStageInfo = (currentStage: TranscriptionStage) => {
    switch (currentStage) {
      case 'waiting':
        return {
          icon: '⏳',
          title: 'Waiting for Transcription',
          description: 'Waiting for Stream.io to process the call recording...',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          pulse: true
        };
      case 'fetching':
        return {
          icon: '📝',
          title: 'Fetching Transcript',
          description: 'Downloading and processing the conversation transcript...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          pulse: true
        };
      case 'analyzing':
        return {
          icon: '🤖',
          title: 'Performing AI Analysis',
          description: 'AI is analyzing the conversation to determine if mentorship was helpful...',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          pulse: true
        };
      case 'complete':
        return {
          icon: '✅',
          title: 'AI Judgement Complete',
          description: 'Analysis finished! The AI has evaluated the mentorship session.',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          pulse: false
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Analysis Failed',
          description: 'Something went wrong during the analysis process.',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          pulse: false
        };
      case 'timeout':
        return {
          icon: '⏰',
          title: 'Analysis Timeout',
          description: 'The analysis is taking longer than expected. Please check your webhook configuration.',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          pulse: false
        };
      default:
        return {
          icon: '⏳',
          title: 'Processing...',
          description: 'Working on your transcription...',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          pulse: true
        };
    }
  };

  // Don't show anything if analysis is already complete and not loading
  if (hasAnalysis && !loading) {
    return null;
  }

  const stageInfo = getStageInfo(stage);

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className={`${stageInfo.bgColor} rounded-lg p-6 border-2 border-opacity-50`}>
        <div className="flex items-center justify-center mb-4">
          <div className={`text-4xl ${stageInfo.pulse ? 'animate-pulse' : ''}`}>
            {stageInfo.icon}
          </div>
        </div>
        
        <div className="text-center">
          <h3 className={`text-lg font-semibold mb-2 ${stageInfo.color}`}>
            {stageInfo.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {stageInfo.description}
          </p>
          
          {stageInfo.pulse && (
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className={`w-2 h-2 ${stageInfo.bgColor.replace('bg-', 'bg-opacity-50 bg-')} rounded-full animate-bounce`} style={{animationDelay: '0ms'}}></div>
                <div className={`w-2 h-2 ${stageInfo.bgColor.replace('bg-', 'bg-opacity-50 bg-')} rounded-full animate-bounce`} style={{animationDelay: '150ms'}}></div>
                <div className={`w-2 h-2 ${stageInfo.bgColor.replace('bg-', 'bg-opacity-50 bg-')} rounded-full animate-bounce`} style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          )}
          
          {stage === 'complete' && (
            <div className="mt-2">
              <div className="text-xs text-green-700 font-medium">
                🎉 Ready to view results below!
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="mt-4">
        <div className="flex justify-center space-x-2">
          {(['fetching', 'analyzing', 'complete'] as const).map((step, index) => {
            const stepInfo = getStageInfo(step);
            const isActive = stage === step;
            const isCompleted = stage === 'complete' || 
                             (stage === 'analyzing' && step === 'fetching') || 
                             (stage === 'complete' && ['fetching', 'analyzing'].includes(step));
            
            return (
              <div
                key={step}
                className={`flex items-center ${index > 0 ? 'ml-2' : ''}`}
              >
                {index > 0 && (
                  <div className={`w-4 h-px ${isCompleted || isActive ? 'bg-blue-400' : 'bg-gray-300'} mx-1`} />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                    ${isActive 
                      ? `${stepInfo.color} ${stepInfo.bgColor} border-2 ${stepInfo.color.replace('text-', 'border-')}` 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {isCompleted && !isActive ? '✓' : stepInfo.icon}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-center space-x-6 mt-2">
          <span className="text-xs text-gray-500">Fetch</span>
          <span className="text-xs text-gray-500">Analyze</span>
          <span className="text-xs text-gray-500">Complete</span>
        </div>
      </div>
    </div>
  );
}