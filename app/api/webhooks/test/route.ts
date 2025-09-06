import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("🧪 TEST WEBHOOK ENDPOINT REACHED");
  return NextResponse.json({ 
    status: "success", 
    message: "Test webhook is working",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("🧪 TEST WEBHOOK POST RECEIVED");
    console.log("Body:", JSON.stringify(body, null, 2));
    
    return NextResponse.json({ 
      status: "success", 
      message: "Test webhook POST is working",
      receivedBody: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ TEST WEBHOOK ERROR:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Test webhook error",
      error: error.message
    }, { status: 500 });
  }
}