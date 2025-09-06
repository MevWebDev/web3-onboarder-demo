import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { getModel } from '@/lib/openrouter/config';
import { logger } from '@/lib/logger/index';
import { 
  detectArchetypeSignals, 
  questionTemplates 
} from '@/lib/interview/questions';
import { InterviewState, InterviewResponse } from '@/lib/types/interview';

// In-memory session storage (in production, use Redis or database)
const sessions = new Map<string, InterviewState>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, message, action, walletAddress } = body;

    logger.info('Interview API called', { sessionId, action, hasMessage: !!message });

    // Handle different actions
    if (action === 'start') {
      return handleStartInterview(sessionId, walletAddress);
    } else if (action === 'respond') {
      return handleResponse(sessionId, message);
    } else if (action === 'complete') {
      return handleComplete(sessionId);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Interview API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleStartInterview(sessionId: string, walletAddress?: string) {
  // Initialize new interview session
  const newSession: InterviewState = {
    sessionId,
    walletAddress,
    currentQuestion: 0,
    maxQuestions: 5,
    responses: [],
    archetypeSignals: {
      investor: 0,
      developer: 0,
      social_user: 0,
    },
    isComplete: false,
    startTime: new Date(),
  };

  sessions.set(sessionId, newSession);

  // Get first question
  const firstQuestion = questionTemplates[0];
  
  logger.info('Starting new interview session', { sessionId, walletAddress });

  return NextResponse.json({
    sessionId,
    question: firstQuestion.prompt,
    questionNumber: 1,
    totalQuestions: 5,
    category: firstQuestion.category,
  });
}

async function handleResponse(sessionId: string, userMessage: string) {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  const currentQuestionTemplate = questionTemplates[session.currentQuestion];
  
  // Detect archetype signals in the response
  const signals = detectArchetypeSignals(
    userMessage,
    currentQuestionTemplate.archetype_signals
  );

  // Update archetype scores
  session.archetypeSignals.investor += signals.investor;
  session.archetypeSignals.developer += signals.developer;
  session.archetypeSignals.social_user += signals.social_user;

  // Store the response
  const response: InterviewResponse = {
    questionNumber: session.currentQuestion + 1,
    question: currentQuestionTemplate.prompt,
    response: userMessage,
    extractedData: {}, // Will be populated during profile generation
    timestamp: new Date(),
  };
  
  session.responses.push(response);
  session.currentQuestion++;

  // Check if interview is complete
  if (session.currentQuestion >= session.maxQuestions) {
    session.isComplete = true;
    sessions.set(sessionId, session);
    
    return NextResponse.json({
      complete: true,
      message: "Great! I have all the information I need. Let me find the perfect mentors for you...",
      shouldGenerateProfile: true,
    });
  }

  // Get next question
  const nextQuestion = questionTemplates[session.currentQuestion];
  
  // Use AI to make the transition natural
  const model = getModel('conversation');
  
  const transitionPrompt = `You are a friendly crypto onboarding specialist conducting an interview.
  
  The user just answered: "${userMessage}"
  
  Your task:
  1. Briefly acknowledge their response positively (1 sentence max)
  2. Naturally transition to asking this next question: "${nextQuestion.prompt}"
  
  Keep it conversational and encouraging. Don't repeat the question word-for-word, but make sure to cover all its key points.`;

  const result = await streamText({
    model,
    prompt: transitionPrompt,
    temperature: 0.7,
  });

  const aiResponse = await result.text;
  
  sessions.set(sessionId, session);

  logger.info('Interview response processed', { 
    sessionId, 
    questionNumber: session.currentQuestion,
    archetypeSignals: session.archetypeSignals 
  });

  return NextResponse.json({
    message: aiResponse,
    questionNumber: session.currentQuestion + 1,
    totalQuestions: session.maxQuestions,
    category: nextQuestion.category,
    complete: false,
  });
}

async function handleComplete(sessionId: string) {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  if (!session.isComplete) {
    return NextResponse.json(
      { error: 'Interview not complete' },
      { status: 400 }
    );
  }

  // Determine primary archetype
  const { investor, developer, social_user } = session.archetypeSignals;
  const total = investor + developer + social_user;
  
  let primaryArchetype: 'investor' | 'developer' | 'social_user' = 'investor';
  let maxScore = investor;
  
  if (developer > maxScore) {
    primaryArchetype = 'developer';
    maxScore = developer;
  }
  if (social_user > maxScore) {
    primaryArchetype = 'social_user';
  }

  const archetypeClassification = {
    primary_archetype: primaryArchetype,
    confidence_scores: {
      investor: total > 0 ? investor / total : 0,
      developer: total > 0 ? developer / total : 0,
      social_user: total > 0 ? social_user / total : 0,
    },
  };

  logger.info('Interview completed', { 
    sessionId, 
    primaryArchetype,
    confidenceScores: archetypeClassification.confidence_scores 
  });

  return NextResponse.json({
    sessionId,
    complete: true,
    archetypeClassification,
    responses: session.responses,
    readyForMatching: true,
  });
}

// GET endpoint to check session status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 400 }
    );
  }

  const session = sessions.get(sessionId);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    sessionId,
    currentQuestion: session.currentQuestion + 1,
    totalQuestions: session.maxQuestions,
    isComplete: session.isComplete,
    archetypeSignals: session.archetypeSignals,
  });
}