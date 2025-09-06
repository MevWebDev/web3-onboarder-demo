import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error("Missing Stream.io credentials in environment variables");
      return NextResponse.json(
        { error: "Stream.io credentials not configured" },
        { status: 500 }
      );
    }

    // Initialize Stream server client
    const client = new StreamClient(apiKey, apiSecret);

    // Generate user token
    const token = client.generateUserToken({ user_id: userId });

    console.log(`✅ Generated token for user: ${userId}`);

    return NextResponse.json({
      token,
      apiKey,
      userId,
    });
  } catch (error) {
    console.error("❌ Error generating Stream token:", error);
    return NextResponse.json(
      { error: "Failed to generate token", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}