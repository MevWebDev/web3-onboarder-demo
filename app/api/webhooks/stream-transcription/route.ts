import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

interface TranscriptionSegment {
  text: string;
  speaker: string;
  start_time: number;
  end_time: number;
}

interface MentorshipAnalysis {
  decision: boolean;
  reason: string;
}

async function analyzeTranscription(
  transcriptionText: string
): Promise<MentorshipAnalysis> {
  try {
    const systemMessage = `You are an AI assistant that analyzes mentor-mentee conversations to determine if the mentor was helpful.

Analyze the following transcription and determine:
1. Was the mentor helpful to the mentee? (true/false)
2. Provide a brief reason (1-2 sentences) explaining your decision.

Consider factors like:
- Did the mentor provide clear guidance or answers?
- Was the mentor engaged and responsive?
- Did the mentor offer practical advice or solutions?
- Was the conversation productive and on-topic?

Return your analysis as a JSON object with:
- decision: boolean (true if helpful, false if not)
- reason: string (brief explanation)`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: `Transcription to analyze:\n\n${transcriptionText}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    return {
      decision: analysis.decision,
      reason: analysis.reason,
    };
  } catch (error) {
    console.error("Error analyzing transcription:", error);
    return {
      decision: false,
      reason: "Failed to analyze transcription due to an error",
    };
  }
}

async function fetchTranscription(transcriptionUrl: string): Promise<string> {
  try {
    const response = await fetch(transcriptionUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch transcription: ${response.statusText}`);
    }
    
    const jsonlData = await response.text();
    const lines = jsonlData.trim().split("\n");
    
    // Parse JSONL and format as readable text
    let formattedTranscription = "";
    for (const line of lines) {
      if (line) {
        try {
          const segment: TranscriptionSegment = JSON.parse(line);
          formattedTranscription += `${segment.speaker}: ${segment.text}\n`;
        } catch (e) {
          console.error("Error parsing JSONL line:", e);
        }
      }
    }
    
    return formattedTranscription;
  } catch (error) {
    console.error("Error fetching transcription:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get headers for signature verification
    const signature = request.headers.get('x-signature');
    const webhookId = request.headers.get('x-webhook-id');
    const apiKey = request.headers.get('x-api-key');
    
    console.log("\n=== STREAM.IO WEBHOOK RECEIVED ===");
    console.log("Webhook ID:", webhookId);
    console.log("API Key:", apiKey);
    console.log("Signature:", signature ? "✅ Present" : "❌ Missing");
    
    const body = await request.json();
    console.log("Event Type:", body.type);
    console.log("Full Webhook Body:", JSON.stringify(body, null, 2));
    console.log("==================================\n");

    // Handle all transcription-related events for debugging
    if (body.type === "call.transcription_started") {
      console.log("✅ Transcription STARTED for call:", body.call_cid);
      return NextResponse.json({ success: true, message: "Transcription started" });
    }

    if (body.type === "call.transcription_stopped") {
      console.log("⏹️ Transcription STOPPED for call:", body.call_cid);
      return NextResponse.json({ success: true, message: "Transcription stopped" });
    }

    if (body.type === "call.transcription_failed") {
      console.error("❌ Transcription FAILED for call:", body.call_cid);
      console.error("Failure reason:", body);
      return NextResponse.json({ success: false, message: "Transcription failed" });
    }

    // Handle transcription ready event
    if (body.type === "call.transcription_ready") {
      console.log("📝 Transcription READY for call:", body.call_cid);
      const { call_transcription } = body;
      
      if (!call_transcription?.url) {
        return NextResponse.json(
          { error: "No transcription URL provided" },
          { status: 400 }
        );
      }

      // Extract the actual call ID from the cid (format: "default:callId")
      const callId = call_transcription.call_cid.split(":")[1] || call_transcription.call_cid;

      // Import status update function
      const { updateTranscriptionStatus } = await import("../../transcription-result/[callId]/route");

      // Update status to fetching
      updateTranscriptionStatus(callId, 'fetching');

      // Fetch the transcription from Stream's S3
      const transcriptionText = await fetchTranscription(call_transcription.url);
      
      if (!transcriptionText) {
        updateTranscriptionStatus(callId, 'error');
        return NextResponse.json(
          { error: "Transcription is empty" },
          { status: 400 }
        );
      }

      // Update status to analyzing
      updateTranscriptionStatus(callId, 'analyzing');

      try {
        // Analyze the transcription with LLM
        const analysis = await analyzeTranscription(transcriptionText);
        
        // Log the analysis result
        console.log("Mentorship Analysis:", {
          callId: callId,
          ...analysis,
        });

        // Store the result for retrieval (this also updates status to 'complete')
        const { storeTranscriptionResult } = await import("../../transcription-result/[callId]/route");
        storeTranscriptionResult(callId, analysis);
      } catch (error) {
        console.error("❌ Analysis failed for call:", callId, error);
        updateTranscriptionStatus(callId, 'error');
        return NextResponse.json(
          { error: "Failed to analyze transcription", details: error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        callId: callId,
        analysis,
      });
    }

    // Log any other webhook types
    console.log(`⚠️ Unhandled webhook type: ${body.type}`);
    return NextResponse.json({ success: true, message: `Webhook received: ${body.type}` });
  } catch (error) {
    console.error("❌ WEBHOOK PROCESSING ERROR:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to process webhook", details: error },
      { status: 500 }
    );
  }
}