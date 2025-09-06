import { NextRequest, NextResponse } from "next/server";
import { TranscriptionService } from "@/lib/transcription-service";
import type { TranscriptionData, TranscriptionSegment as SupabaseSegment } from "@/types/supabase";

interface TranscriptionSegment {
  text: string;
  speaker: string;
  start_time: number;
  end_time: number;
}

async function fetchTranscription(transcriptionUrl: string): Promise<{ 
  formattedText: string; 
  segments: SupabaseSegment[];
  wordCount: number;
}> {
  try {
    const response = await fetch(transcriptionUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch transcription: ${response.statusText}`);
    }
    
    const jsonlData = await response.text();
    const lines = jsonlData.trim().split("\n");
    
    // Parse JSONL and format as readable text + structured data
    let formattedTranscription = "";
    const segments: SupabaseSegment[] = [];
    let wordCount = 0;
    
    for (const line of lines) {
      if (line) {
        try {
          const segment: TranscriptionSegment = JSON.parse(line);
          formattedTranscription += `${segment.speaker}: ${segment.text}\n`;
          
          // Convert to Supabase segment format
          segments.push({
            start_time: segment.start_time.toString(),
            end_time: segment.end_time.toString(),
            speaker_id: segment.speaker,
            text: segment.text,
            confidence: 1.0 // GetStream doesn't provide confidence scores
          });
          
          // Count words
          wordCount += segment.text.split(/\s+/).length;
        } catch (e) {
          console.error("Error parsing JSONL line:", e);
        }
      }
    }
    
    return {
      formattedText: formattedTranscription,
      segments,
      wordCount
    };
  } catch (error) {
    console.error("Error fetching transcription:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("\n=== STREAM.IO WEBHOOK RECEIVED ===");
    console.log("Event Type:", body.type);
    console.log("Full Webhook Body:", JSON.stringify(body, null, 2));
    console.log("==================================\n");

    // Handle all transcription-related events for debugging
    if (body.type === "call.transcription_started") {
      console.log("Transcription STARTED for call:", body.call_cid);
      return NextResponse.json({ success: true, message: "Transcription started" });
    }

    if (body.type === "call.transcription_stopped") {
      console.log("Transcription STOPPED for call:", body.call_cid);
      return NextResponse.json({ success: true, message: "Transcription stopped" });
    }

    if (body.type === "call.transcription_failed") {
      console.error("Transcription FAILED for call:", body.call_cid);
      console.error("Failure reason:", body);
      return NextResponse.json({ success: false, message: "Transcription failed" });
    }

    // Handle transcription ready event
    if (body.type === "call.transcription_ready") {
      console.log("Transcription READY for call:", body.call_cid);
      const { call_transcription, call } = body;
      
      if (!call_transcription?.url) {
        return NextResponse.json(
          { error: "No transcription URL provided" },
          { status: 400 }
        );
      }

      // Fetch the transcription from Stream's S3
      const transcriptionData = await fetchTranscription(call_transcription.url);
      
      if (!transcriptionData.formattedText) {
        return NextResponse.json(
          { error: "Transcription is empty" },
          { status: 400 }
        );
      }
      
      // Extract the actual call ID from the cid (format: "default:callId")
      const callId = call_transcription.call_cid.split(":")[1] || call_transcription.call_cid;
      
      // Create transcription data object for Supabase
      const supabaseTranscriptionData: TranscriptionData = {
        segments: transcriptionData.segments,
        transcript_txt_url: call_transcription.url,
        transcript_vtt_url: call_transcription.subtitle_url || undefined,
        duration_seconds: call?.duration_seconds || undefined,
        language: "en", // Default to English
        word_count: transcriptionData.wordCount,
        summary: undefined, // No AI analysis
        keywords: [] 
      };

      // Prepare data for Supabase storage
      const transcriptionRecord = {
        call_id: callId,
        session_id: call?.session_id || null,
        mentor_id: call?.created_by?.id || "unknown",
        participant_id: call?.members?.[0]?.id || "unknown", 
        transcript_txt_url: call_transcription.url,
        transcript_vtt_url: call_transcription.subtitle_url || null,
        transcription_data: supabaseTranscriptionData,
        call_duration_seconds: call?.duration_seconds || null,
        call_started_at: call?.started_at || new Date().toISOString(),
        call_ended_at: call?.ended_at || new Date().toISOString(),
        transcription_ready_at: new Date().toISOString(),
        metadata: {
          stream_call_cid: call_transcription.call_cid,
          webhook_processed_at: new Date().toISOString()
        }
      };

      // Store transcription in Supabase
      try {
        const savedTranscription = await TranscriptionService.saveOrUpdateTranscription(transcriptionRecord);
        
        if (savedTranscription) {
          console.log("Transcription saved to Supabase:", savedTranscription.id);
          console.log("Segments stored:", transcriptionData.segments.length);
          console.log("Word count:", transcriptionData.wordCount);
        } else {
          console.error("Failed to save transcription to Supabase");
        }
      } catch (error) {
        console.error("Error saving transcription to Supabase:", error);
      }

      return NextResponse.json({
        success: true,
        callId: callId,
        segments: transcriptionData.segments.length,
        wordCount: transcriptionData.wordCount,
        stored: true
      });
    }

    // Log any other webhook types
    console.log(`Unhandled webhook type: ${body.type}`);
    return NextResponse.json({ success: true, message: `Webhook received: ${body.type}` });
  } catch (error) {
    console.error("WEBHOOK PROCESSING ERROR:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to process webhook", details: error },
      { status: 500 }
    );
  }
}