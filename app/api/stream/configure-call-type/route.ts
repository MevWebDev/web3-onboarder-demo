import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream.io credentials not configured" },
        { status: 500 }
      );
    }

    // Initialize Stream server client
    const client = new StreamClient(apiKey, apiSecret);

    console.log("🔧 Configuring call type with transcription enabled...");

    // First, let's get the current call type to see its configuration
    let currentCallType;
    try {
      currentCallType = await client.video.getCallType("default");
      console.log("📋 Current call type config:", JSON.stringify(currentCallType, null, 2));
    } catch (error) {
      console.log("❌ Could not fetch call type:", error);
    }

    // Use a simpler approach - just update the transcription setting
    const response = await client.video.updateCallType("default", {
      settings: {
        transcription: {
          mode: "available", // Allow transcription to be started
        },
      },
    });
    
    console.log("✅ Call type updated with transcription enabled");

    console.log("✅ Call type configured successfully:", response);

    return NextResponse.json({
      success: true,
      message: "Call type configured with transcription enabled",
      settings: response.settings,
    });
  } catch (error) {
    console.error("❌ Error configuring call type:", error);
    return NextResponse.json(
      { 
        error: "Failed to configure call type", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}