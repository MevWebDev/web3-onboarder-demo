import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream.io credentials not configured" },
        { status: 500 }
      );
    }

    if (!callId) {
      return NextResponse.json(
        { error: "Call ID is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching transcriptions for call: ${callId}`);

    // Initialize Stream client
    const client = new StreamClient(apiKey, apiSecret);

    // Generate server token for API calls - use a consistent user ID
    const serverToken = client.generateUserToken({ user_id: "system" });

    // Call the ListTranscriptions API directly
    const apiUrl = `https://video.stream-io-api.com/api/v2/video/call/default/${callId}/transcriptions`;
    
    console.log(`🔗 Calling Stream API: ${apiUrl}`);
    console.log(`🔑 Using API Key: ${apiKey}`);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": serverToken,
        "stream-auth-type": "jwt", 
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      // Add query parameter
    });

    console.log(`📊 ListTranscriptions API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ListTranscriptions API error: ${errorText}`);
      return NextResponse.json(
        { 
          error: "Failed to fetch transcriptions", 
          status: response.status,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const transcriptionData = await response.json();
    console.log(`✅ Found ${transcriptionData.transcriptions?.length || 0} transcriptions`);

    // If transcriptions exist, process the first one (most recent)
    if (transcriptionData.transcriptions && transcriptionData.transcriptions.length > 0) {
      const transcription = transcriptionData.transcriptions[0];
      
      // Fetch the transcription file content
      if (transcription.url) {
        console.log("📝 Fetching transcription content...");
        const transcriptResponse = await fetch(transcription.url);
        
        if (transcriptResponse.ok) {
          const transcriptText = await transcriptResponse.text();
          
          // Process the transcription (same logic as webhook)
          console.log("🤖 Analyzing transcription with AI...");
          
          // Import and use the analysis function from webhook
          try {
            const webhookModule = await import("../../../webhooks/stream-transcription/route");
            const analysis = await webhookModule.analyzeTranscription(transcriptText);
            
            console.log("✅ AI Analysis complete:", analysis);
            
            // Store the result
            const resultModule = await import("../../../transcription-result/[callId]/route");
            resultModule.storeTranscriptionResult(callId, analysis);
            
            return NextResponse.json({
              success: true,
              hasTranscription: true,
              analysis,
              transcriptionUrl: transcription.url,
              transcriptionId: transcription.id,
            });
          } catch (analysisError) {
            console.error("❌ Analysis failed:", analysisError);
            // Return transcription data without analysis
            return NextResponse.json({
              success: true,
              hasTranscription: true,
              transcriptionUrl: transcription.url,
              transcriptionId: transcription.id,
              analysisError: analysisError instanceof Error ? analysisError.message : String(analysisError)
            });
          }
        } else {
          console.error("❌ Failed to fetch transcription content");
        }
      }
    }

    return NextResponse.json({
      success: true,
      hasTranscription: false,
      transcriptionCount: transcriptionData.transcriptions?.length || 0,
      message: "No transcriptions available yet",
    });

  } catch (error) {
    console.error("❌ Error fetching transcriptions:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch transcriptions", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}