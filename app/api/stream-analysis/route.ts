import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript) {
      return new Response('No transcript provided', { status: 400 });
    }

    console.log('🌊 Starting analysis for transcript chunk...');
    console.log('Transcript length:', transcript.length);
    
    // Get real-time feedback using OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
        'X-Title': 'Web3 Onboarder Demo'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [
          {
            role: 'system',
            content: `You are a real-time mentorship coach providing immediate feedback.
            Analyze the ongoing conversation and provide brief, actionable feedback.
            Focus on:
            - Is the mentor being clear and helpful?
            - Are there missed opportunities to provide better guidance?
            - Quick tips for improvement
            Keep feedback concise (2-3 sentences max per point).`
          },
          {
            role: 'user',
            content: `Analyze this part of the mentoring conversation:\n${transcript}`
          }
        ],
        temperature: 0.4
      })
    });

    if (!response.ok) {
      return new Response('Failed to get analysis', { status: 500 });
    }

    const result = await response.json();
    const feedback = result.choices[0]?.message?.content || 'No feedback available';
    
    // Return the feedback as plain text
    return new Response(feedback, {
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('❌ Streaming analysis error:', error);
    return new Response('Failed to stream analysis', { status: 500 });
  }
}