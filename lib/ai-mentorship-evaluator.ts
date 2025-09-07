import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export interface MentorshipEvaluation {
  overallScore: number // 0-100
  categories: {
    knowledgeTransfer: {
      score: number
      feedback: string
    }
    communicationClarity: {
      score: number
      feedback: string
    }
    engagement: {
      score: number
      feedback: string
    }
    problemSolving: {
      score: number
      feedback: string
    }
    encouragement: {
      score: number
      feedback: string
    }
  }
  keyStrengths: string[]
  areasForImprovement: string[]
  specificFeedback: string
  menteeEngagement: {
    questionsAsked: number
    comprehensionLevel: 'high' | 'medium' | 'low'
    participationScore: number
  }
  sessionSummary: string
  recommendedNextSteps: string[]
}

export class MentorshipEvaluator {
  private model = openai('gpt-4o-mini')

  async evaluateTranscription(transcription: string, callDuration: number): Promise<MentorshipEvaluation> {
    console.log('🤖 Starting AI evaluation of mentorship call...')
    
    const evaluationPrompt = `
You are an expert evaluator of mentorship sessions in the Web3/cryptocurrency space. Please analyze the following transcription of a mentorship call and provide a comprehensive evaluation.

TRANSCRIPTION (Duration: ${Math.floor(callDuration / 60)} minutes):
${transcription}

Please provide a detailed evaluation in the following JSON format:

{
  "overallScore": <number 0-100>,
  "categories": {
    "knowledgeTransfer": {
      "score": <number 0-100>,
      "feedback": "<detailed feedback on how well the mentor explained concepts>"
    },
    "communicationClarity": {
      "score": <number 0-100>,
      "feedback": "<feedback on clarity of explanations and use of appropriate language>"
    },
    "engagement": {
      "score": <number 0-100>,
      "feedback": "<feedback on how well the mentor kept the mentee engaged>"
    },
    "problemSolving": {
      "score": <number 0-100>,
      "feedback": "<feedback on how the mentor helped solve problems and answer questions>"
    },
    "encouragement": {
      "score": <number 0-100>,
      "feedback": "<feedback on how supportive and encouraging the mentor was>"
    }
  },
  "keyStrengths": [<array of specific strengths observed>],
  "areasForImprovement": [<array of specific areas that could be improved>],
  "specificFeedback": "<paragraph of specific actionable feedback for the mentor>",
  "menteeEngagement": {
    "questionsAsked": <count of questions the mentee asked>,
    "comprehensionLevel": "<high/medium/low based on mentee responses>",
    "participationScore": <number 0-100 based on how engaged the mentee was>
  },
  "sessionSummary": "<2-3 sentence summary of what was covered>",
  "recommendedNextSteps": [<array of recommended follow-up actions>]
}

Evaluation Criteria:
- Knowledge Transfer: Did the mentor effectively explain Web3 concepts, provide practical examples, and ensure understanding?
- Communication Clarity: Was the mentor clear, used appropriate terminology, and adapted to the mentee's level?
- Engagement: Did the mentor keep the conversation interactive and interesting?
- Problem Solving: How well did the mentor address questions and help with practical issues?
- Encouragement: Was the mentor supportive, patient, and encouraging?

Focus on practical Web3/crypto mentoring effectiveness. Be constructive but honest in your evaluation.
`

    try {
      const { text } = await generateText({
        model: this.model,
        prompt: evaluationPrompt,
        temperature: 0.3, // Lower temperature for consistent evaluations
        maxTokens: 2000,
      })

      // Parse the JSON response
      const evaluation: MentorshipEvaluation = JSON.parse(text)
      
      // Validate and sanitize the evaluation
      const sanitizedEvaluation = this.sanitizeEvaluation(evaluation)
      
      console.log(`✅ AI evaluation completed with overall score: ${sanitizedEvaluation.overallScore}/100`)
      
      return sanitizedEvaluation
      
    } catch (error) {
      console.error('❌ Failed to evaluate transcription:', error)
      
      // Return a default evaluation in case of error
      return this.getDefaultEvaluation()
    }
  }

  async generateMentorFeedbackSummary(evaluation: MentorshipEvaluation): Promise<string> {
    const summaryPrompt = `
Based on the following mentorship evaluation, create a concise but comprehensive feedback summary for the mentor:

Overall Score: ${evaluation.overallScore}/100

Category Scores:
- Knowledge Transfer: ${evaluation.categories.knowledgeTransfer.score}/100
- Communication Clarity: ${evaluation.categories.communicationClarity.score}/100
- Engagement: ${evaluation.categories.engagement.score}/100
- Problem Solving: ${evaluation.categories.problemSolving.score}/100
- Encouragement: ${evaluation.categories.encouragement.score}/100

Key Strengths: ${evaluation.keyStrengths.join(', ')}
Areas for Improvement: ${evaluation.areasForImprovement.join(', ')}

Create a professional, constructive summary that:
1. Acknowledges strong performance areas
2. Provides specific improvement suggestions
3. Encourages continued mentoring
4. Is approximately 150-200 words

Format as a friendly but professional message that could be sent to the mentor.
`

    try {
      const { text } = await generateText({
        model: this.model,
        prompt: summaryPrompt,
        temperature: 0.5,
        maxTokens: 300,
      })

      return text.trim()
      
    } catch (error) {
      console.error('❌ Failed to generate mentor feedback summary:', error)
      return this.getDefaultFeedbackSummary(evaluation)
    }
  }

  private sanitizeEvaluation(evaluation: MentorshipEvaluation): MentorshipEvaluation {
    // Ensure all scores are within 0-100 range
    const clampScore = (score: number) => Math.max(0, Math.min(100, score || 0))
    
    return {
      ...evaluation,
      overallScore: clampScore(evaluation.overallScore),
      categories: {
        knowledgeTransfer: {
          ...evaluation.categories.knowledgeTransfer,
          score: clampScore(evaluation.categories.knowledgeTransfer.score)
        },
        communicationClarity: {
          ...evaluation.categories.communicationClarity,
          score: clampScore(evaluation.categories.communicationClarity.score)
        },
        engagement: {
          ...evaluation.categories.engagement,
          score: clampScore(evaluation.categories.engagement.score)
        },
        problemSolving: {
          ...evaluation.categories.problemSolving,
          score: clampScore(evaluation.categories.problemSolving.score)
        },
        encouragement: {
          ...evaluation.categories.encouragement,
          score: clampScore(evaluation.categories.encouragement.score)
        }
      },
      menteeEngagement: {
        ...evaluation.menteeEngagement,
        questionsAsked: Math.max(0, evaluation.menteeEngagement.questionsAsked || 0),
        participationScore: clampScore(evaluation.menteeEngagement.participationScore),
        comprehensionLevel: evaluation.menteeEngagement.comprehensionLevel || 'medium'
      },
      keyStrengths: evaluation.keyStrengths || [],
      areasForImprovement: evaluation.areasForImprovement || [],
      recommendedNextSteps: evaluation.recommendedNextSteps || []
    }
  }

  private getDefaultEvaluation(): MentorshipEvaluation {
    return {
      overallScore: 50,
      categories: {
        knowledgeTransfer: {
          score: 50,
          feedback: "Unable to evaluate due to processing error"
        },
        communicationClarity: {
          score: 50,
          feedback: "Unable to evaluate due to processing error"
        },
        engagement: {
          score: 50,
          feedback: "Unable to evaluate due to processing error"
        },
        problemSolving: {
          score: 50,
          feedback: "Unable to evaluate due to processing error"
        },
        encouragement: {
          score: 50,
          feedback: "Unable to evaluate due to processing error"
        }
      },
      keyStrengths: ["Call completed successfully"],
      areasForImprovement: ["Technical evaluation was unavailable"],
      specificFeedback: "We encountered a technical issue during evaluation. Please contact support for a manual review.",
      menteeEngagement: {
        questionsAsked: 0,
        comprehensionLevel: 'medium',
        participationScore: 50
      },
      sessionSummary: "Mentorship session completed, but detailed evaluation was unavailable due to technical issues.",
      recommendedNextSteps: ["Schedule follow-up session", "Contact support for manual evaluation"]
    }
  }

  private getDefaultFeedbackSummary(evaluation: MentorshipEvaluation): string {
    return `Thank you for completing your mentorship session! Your overall performance score was ${evaluation.overallScore}/100. We appreciate your dedication to helping others learn Web3 and cryptocurrency concepts. Keep up the great work in guiding newcomers through their blockchain journey!`
  }
}

export const mentorshipEvaluator = new MentorshipEvaluator()