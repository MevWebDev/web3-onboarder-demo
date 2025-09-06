import { NextRequest, NextResponse } from "next/server"
import { transcriptionService } from "@/lib/golemdb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const participant = searchParams.get("participant")
    
    let transcriptions
    if (participant) {
      transcriptions = await transcriptionService.getTranscriptionsByParticipant(participant)
    } else {
      transcriptions = await transcriptionService.getAllTranscriptions()
    }
    
    return NextResponse.json({
      transcriptions,
      count: transcriptions.length
    })
  } catch (error) {
    console.error("Failed to get transcriptions:", error)
    return NextResponse.json(
      { error: "Failed to retrieve transcriptions" },
      { status: 500 }
    )
  }
}