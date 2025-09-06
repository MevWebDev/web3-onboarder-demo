'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger/index';

interface InterviewChatProps {
  walletAddress?: string;
  onComplete: (profile: any) => void;
}

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export default function InterviewChat({ walletAddress, onComplete }: InterviewChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions] = useState(5);
  const [isComplete, setIsComplete] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [archetypeClassification, setArchetypeClassification] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start the interview when component mounts
    startInterview();
  }, []);

  const startInterview = async () => {
    try {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      setIsLoading(true);

      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSessionId,
          action: 'start',
          walletAddress,
        }),
      });

      const data = await response.json();
      
      setMessages([{
        id: uuidv4(),
        role: 'assistant',
        content: data.question,
        timestamp: new Date(),
      }]);

      logger.info('Interview started', { sessionId: newSessionId });
    } catch (error) {
      logger.error('Failed to start interview:', error);
      setMessages([{
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error starting the interview. Please refresh and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isComplete) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    // Store the input before clearing it
    const userInput = input;
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'respond',
          message: userInput,
        }),
      });

      const data = await response.json();

      if (data.complete) {
        // Interview is complete, get full session data
        await handleInterviewComplete();
      } else {
        // Add AI response
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        }]);

        setCurrentQuestion(data.questionNumber || currentQuestion + 1);
      }
    } catch (error) {
      logger.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterviewComplete = async () => {
    try {
      setIsComplete(true);
      
      // Get complete session data
      const completeResponse = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'complete',
        }),
      });

      const completeData = await completeResponse.json();
      setResponses(completeData.responses);
      setArchetypeClassification(completeData.archetypeClassification);

      // Show completion message
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: `Excellent! Based on our conversation, I can see you're primarily a **${completeData.archetypeClassification.primary_archetype}** type. Let me generate your profile and find the perfect mentors for you...`,
        timestamp: new Date(),
      }]);

      // Generate profile
      setTimeout(async () => {
        await generateProfile(completeData);
      }, 2000);
    } catch (error) {
      logger.error('Failed to complete interview:', error);
    }
  };

  const generateProfile = async (sessionData: any) => {
    try {
      const profileResponse = await fetch('/api/profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          responses: sessionData.responses,
          archetypeClassification: sessionData.archetypeClassification,
          walletAddress,
        }),
      });

      const profileData = await profileResponse.json();

      if (profileData.success) {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          content: '✨ Your profile has been created! Now searching for the best mentors...',
          timestamp: new Date(),
        }]);

        // Trigger the onComplete callback to show matches
        setTimeout(() => {
          onComplete(profileData.profile);
        }, 1500);
      }
    } catch (error) {
      logger.error('Failed to generate profile:', error);
    }
  };

  const getArchetypeColor = (archetype: string) => {
    switch (archetype) {
      case 'investor': return 'text-green-600';
      case 'developer': return 'text-blue-600';
      case 'social_user': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-lg">
      {/* Header with progress */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Crypto Mentor Matching Interview</h3>
          {!isComplete && (
            <span className="text-sm text-gray-600">
              Question {currentQuestion} of {totalQuestions}
            </span>
          )}
        </div>
        {!isComplete && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
            />
          </div>
        )}
        {isComplete && archetypeClassification && (
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">Your Archetype:</span>
            <span className={`font-bold ${getArchetypeColor(archetypeClassification.primary_archetype)}`}>
              {archetypeClassification.primary_archetype.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-gray-500">
              ({Math.round(archetypeClassification.confidence_scores[archetypeClassification.primary_archetype] * 100)}% confidence)
            </span>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isComplete ? "Interview complete!" : "Type your response..."}
            disabled={isLoading || isComplete}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-black bg-white disabled:text-gray-600"
          />
          <button
            type="submit"
            disabled={isLoading || isComplete || !input.trim()}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}