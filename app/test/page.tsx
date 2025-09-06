'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger/index';

export default function TestPage() {
  const [testResults, setTestResults] = useState<{
    openrouter: string;
    pinecone: string;
    embeddings: string;
    logger: string;
  }>({
    openrouter: 'Not tested',
    pinecone: 'Not tested',
    embeddings: 'Not tested',
    logger: 'Not tested',
  });

  const testLogger = () => {
    try {
      logger.debug('Debug message test');
      logger.info('Info message test');
      logger.warn('Warning message test');
      logger.error('Error message test', new Error('Test error'));
      logger.logApiRequest('GET', '/api/test', { param: 'value' });
      logger.logApiResponse('GET', '/api/test', 200, { result: 'success' });
      
      setTestResults(prev => ({ ...prev, logger: '✅ Logger working' }));
      return true;
    } catch (error) {
      setTestResults(prev => ({ ...prev, logger: `❌ Error: ${error}` }));
      return false;
    }
  };

  const testOpenRouter = async () => {
    try {
      const response = await fetch('/api/test/openrouter', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setTestResults(prev => ({ ...prev, openrouter: '✅ OpenRouter connected' }));
      } else {
        setTestResults(prev => ({ ...prev, openrouter: `❌ Error: ${data.error}` }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, openrouter: `❌ Error: ${error}` }));
    }
  };

  const testPinecone = async () => {
    try {
      const response = await fetch('/api/test/pinecone', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setTestResults(prev => ({ ...prev, pinecone: '✅ Pinecone connected' }));
      } else {
        setTestResults(prev => ({ ...prev, pinecone: `❌ Error: ${data.error}` }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, pinecone: `❌ Error: ${error}` }));
    }
  };

  const testEmbeddings = async () => {
    try {
      const response = await fetch('/api/test/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Test embedding generation' }),
      });
      const data = await response.json();
      
      if (data.success) {
        setTestResults(prev => ({ ...prev, embeddings: `✅ Embeddings working (dims: ${data.dimensions})` }));
      } else {
        setTestResults(prev => ({ ...prev, embeddings: `❌ Error: ${data.error}` }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, embeddings: `❌ Error: ${error}` }));
    }
  };

  const runAllTests = async () => {
    console.log('Starting tests...');
    
    // Test logger first
    testLogger();
    
    // Test API connections
    await testOpenRouter();
    await testPinecone();
    await testEmbeddings();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Crypto Mentor Matchmaker - System Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className="space-y-2 text-sm font-mono">
            <p>NODE_ENV: {process.env.NODE_ENV}</p>
            <p>APP_URL: {process.env.NEXT_PUBLIC_APP_URL}</p>
            <p>OpenRouter API: {process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Not set'}</p>
            <p>Pinecone API: {process.env.PINECONE_API_KEY ? '✅ Set' : '❌ Not set'}</p>
            <p>OpenAI API: {process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Tests</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Logger System:</span>
              <span className="text-sm">{testResults.logger}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">OpenRouter Connection:</span>
              <span className="text-sm">{testResults.openrouter}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Pinecone Connection:</span>
              <span className="text-sm">{testResults.pinecone}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">OpenAI Embeddings:</span>
              <span className="text-sm">{testResults.embeddings}</span>
            </div>
          </div>
        </div>

        <button
          onClick={runAllTests}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Run All Tests
        </button>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Check the console and logs/app-*.log file for detailed logging output.
            Make sure to add your API keys to the .env.local file before running tests.
          </p>
        </div>
      </div>
    </div>
  );
}