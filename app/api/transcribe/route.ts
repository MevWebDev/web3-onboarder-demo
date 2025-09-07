import { NextRequest, NextResponse } from 'next/server';

// Schema for mentor analysis (keeping for future use if needed)
// const MentorAnalysisSchema = z.object({
//   overallScore: z.number().min(0).max(10),
//   strengths: z.array(z.string()),
//   areasForImprovement: z.array(z.string()),
//   wasHelpful: z.boolean(),
//   specificExamples: z.array(z.object({
//     quote: z.string(),
//     feedback: z.string(),
//     category: z.enum(['positive', 'negative', 'neutral'])
//   })),
//   recommendations: z.array(z.string()),
//   engagementLevel: z.enum(['high', 'medium', 'low']),
//   communicationClarity: z.number().min(0).max(10),
//   technicalAccuracy: z.number().min(0).max(10),
//   emotionalSupport: z.number().min(0).max(10)
// });

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript) {
      return NextResponse.json({ 
        error: 'No transcript provided' 
      }, { status: 400 });
    }

    console.log('🎙️ Starting transcript analysis process...');
    console.log('Transcript:', transcript);
    
    if (!transcript || transcript.length < 10) {
      return NextResponse.json({ 
        error: 'Transcription failed or audio too short' 
      }, { status: 400 });
    }
    
    // Step 2: Analyze mentor effectiveness using Claude
    console.log('🧠 Analyzing mentor effectiveness...');
    const analysisResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
        'X-Title': 'Web3 Onboarder Demo'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `You are an expert in mentorship and coaching evaluation. Analyze the following transcript of a mentoring session and evaluate the mentor's effectiveness.
            
            Focus on:
            1. Was the mentor helpful and supportive?
            2. Did they provide clear, actionable guidance?
            3. Were they encouraging and positive?
            4. Did they listen effectively and respond to the mentee's needs?
            5. Were their technical explanations accurate and appropriate?
            6. Did they foster a growth mindset?
            
            Be specific and provide examples from the transcript.`
          },
          {
            role: 'user',
            content: `Please analyze this mentoring session transcript and evaluate the mentor's effectiveness:\n\n${transcript}`
          }
        ],
        temperature: 0.3
      })
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('❌ Analysis error:', errorText);
      throw new Error(`Analysis API error: ${analysisResponse.status}`);
    }

    const analysisResult = await analysisResponse.json();
    const analysisText = analysisResult.choices[0]?.message?.content;

    // Parse the response - since we can't use structured output directly, we'll parse manually
    let finalAnalysisResult;
    try {
      // Try to extract structured data from the response
      
      // For now, let's create a simplified analysis and extract helpful/not helpful decision
      const wasHelpfulMatch = analysisText.toLowerCase();
      const wasHelpful = wasHelpfulMatch.includes('helpful') && !wasHelpfulMatch.includes('not helpful');
      
      // Extract a reason (first sentence or paragraph)
      const sentences = analysisText.split('. ');
      const reason = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
      
      finalAnalysisResult = {
        overallScore: wasHelpful ? 7 : 4, // Default scoring based on helpfulness
        strengths: wasHelpful ? ['Provided helpful guidance'] : [],
        areasForImprovement: !wasHelpful ? ['Could provide clearer guidance'] : [],
        wasHelpful,
        specificExamples: [],
        recommendations: ['Continue engaging with clear communication'],
        engagementLevel: 'medium' as const,
        communicationClarity: wasHelpful ? 7 : 4,
        technicalAccuracy: 6,
        emotionalSupport: wasHelpful ? 7 : 4,
        rawAnalysis: analysisText, // Include the full analysis text
        reason: reason
      };
      
    } catch (error) {
      console.error('Error parsing analysis:', error);
      finalAnalysisResult = {
        overallScore: 5,
        strengths: [],
        areasForImprovement: ['Analysis parsing failed'],
        wasHelpful: false,
        specificExamples: [],
        recommendations: [],
        engagementLevel: 'medium' as const,
        communicationClarity: 5,
        technicalAccuracy: 5,
        emotionalSupport: 5,
        rawAnalysis: analysisResponse.text,
        reason: 'Failed to parse analysis properly'
      };
    }

    // Step 3: Log the LLM decision to console as requested  
    console.log('🎯 LLM DECISION ANALYSIS:');
    console.log('Helpful Boolean:', finalAnalysisResult.wasHelpful);
    console.log('Reason from LLM:', finalAnalysisResult.reason);
    console.log('Raw Analysis:', finalAnalysisResult.rawAnalysis);
    
    // Additional detailed console logging
    console.log('='.repeat(50));
    console.log('📊 MENTOR ANALYSIS COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Was Helpful: ${finalAnalysisResult.wasHelpful}`);
    console.log(`📝 LLM Reason: ${finalAnalysisResult.reason}`);
    console.log(`📈 Overall Score: ${finalAnalysisResult.overallScore}/10`);
    console.log('='.repeat(50));
    
    // Step 4: Generate actionable summary
    console.log('📊 Generating summary...');
    const summaryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
        'X-Title': 'Web3 Onboarder Demo'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Create a concise, actionable summary of the mentor analysis for both mentor and mentee.'
          },
          {
            role: 'user',
            content: `Analysis: ${JSON.stringify(finalAnalysisResult)}`
          }
        ],
        temperature: 0.5
      })
    });

    let summaryText = 'Summary generation skipped';
    if (summaryResponse.ok) {
      const summaryResult = await summaryResponse.json();
      summaryText = summaryResult.choices[0]?.message?.content || 'Summary generation failed';
    }
    
    console.log('✅ Transcription and analysis complete!');
    
    // Return complete analysis
    return NextResponse.json({
      transcript,
      analysis: finalAnalysisResult,
      summary: summaryText,
      metadata: {
        transcriptionModel: 'whisper-large',
        analysisModel: 'claude-3.5-sonnet',
        summaryModel: 'gpt-4o-mini',
        timestamp: new Date().toISOString(),
        audioLength: Math.round(audioData.length * 0.75 / 1000) // Approximate size in KB
      }
    });
    
  } catch (error) {
    console.error('❌ Transcription/Analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to process audio',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}