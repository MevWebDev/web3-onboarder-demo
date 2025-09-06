import { NextRequest, NextResponse } from "next/server"
import { transcriptionService, type TranscriptionData } from "@/lib/golemdb"
import { randomUUID } from "crypto"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action") || "test"
  const meetId = searchParams.get("meetId")

  try {
    switch (action) {
      case "store": {
        // Generate mock transcription data
        const mockMeetId = meetId || `meet-${randomUUID()}`
        const mockData: TranscriptionData = {
          meetId: mockMeetId,
          transcription: "This is a test transcription. Alice: Hello everyone, welcome to our meeting. Bob: Thanks for joining. Let's discuss the project updates. Alice: Great, I'll start with the development progress...",
          participants: ["0x1234...alice", "0x5678...bob"],
          duration: 1800, // 30 minutes
          timestamp: new Date().toISOString(),
          callSummary: "Test meeting to verify GolemDB integration",
          keyInsights: [
            "GolemDB integration successful",
            "Data stored on testnet",
            "BTL set to 24 hours"
          ]
        }

        const entityKey = await transcriptionService.storeTranscription(mockData)
        
        return NextResponse.json({
          success: true,
          message: "Test transcription stored successfully",
          meetId: mockMeetId,
          entityKey,
          btl: "43200 blocks (~24 hours)",
          network: "GolemDB Holesky Testnet",
          retrieveUrl: `/api/test/golemdb?action=retrieve&meetId=${mockMeetId}`
        })
      }

      case "retrieve": {
        if (!meetId) {
          return NextResponse.json(
            { error: "meetId parameter required for retrieve action" },
            { status: 400 }
          )
        }

        const transcription = await transcriptionService.getTranscriptionByMeetId(meetId)
        
        if (!transcription) {
          return NextResponse.json({
            success: false,
            message: "No transcription found for this meetId",
            meetId,
            tip: "Try storing a test transcription first: /api/test/golemdb?action=store"
          })
        }

        return NextResponse.json({
          success: true,
          message: "Transcription retrieved successfully",
          data: transcription,
          network: "GolemDB Holesky Testnet"
        })
      }

      case "list": {
        const allTranscriptions = await transcriptionService.getAllTranscriptions()
        
        return NextResponse.json({
          success: true,
          message: `Found ${allTranscriptions.length} transcriptions`,
          transcriptions: allTranscriptions,
          network: "GolemDB Holesky Testnet"
        })
      }

      case "extend": {
        if (!meetId) {
          return NextResponse.json(
            { error: "meetId parameter required for extend action" },
            { status: 400 }
          )
        }

        await transcriptionService.extendTranscriptionTTL(meetId, 21600) // Add 12 hours
        
        return NextResponse.json({
          success: true,
          message: "TTL extended successfully",
          meetId,
          additionalTime: "21600 blocks (~12 hours)",
          network: "GolemDB Holesky Testnet"
        })
      }

      case "monitor": {
        // Start monitoring (this will run until the process stops)
        const unwatch = await transcriptionService.setupRealTimeMonitoring()
        
        // For demo, stop monitoring after 30 seconds
        setTimeout(() => {
          unwatch()
          console.log("Stopped monitoring GolemDB events")
        }, 30000)

        return NextResponse.json({
          success: true,
          message: "Started monitoring GolemDB events for 30 seconds",
          tip: "Check server console for event logs",
          network: "GolemDB Holesky Testnet"
        })
      }

      default: {
        return NextResponse.json({
          message: "GolemDB Test Endpoint",
          network: "Holesky Testnet",
          availableActions: {
            store: "/api/test/golemdb?action=store - Store a test transcription",
            retrieve: "/api/test/golemdb?action=retrieve&meetId=YOUR_MEET_ID - Retrieve by meetId",
            list: "/api/test/golemdb?action=list - List all transcriptions",
            extend: "/api/test/golemdb?action=extend&meetId=YOUR_MEET_ID - Extend TTL",
            monitor: "/api/test/golemdb?action=monitor - Monitor events for 30 seconds"
          },
          testFlow: [
            "1. Store: GET /api/test/golemdb?action=store",
            "2. Copy the meetId from response",
            "3. Retrieve: GET /api/test/golemdb?action=retrieve&meetId=YOUR_MEET_ID",
            "4. List all: GET /api/test/golemdb?action=list",
            "5. Extend TTL: GET /api/test/golemdb?action=extend&meetId=YOUR_MEET_ID"
          ]
        })
      }
    }
  } catch (error) {
    console.error("GolemDB test error:", error)
    return NextResponse.json(
      { 
        error: "GolemDB operation failed",
        details: error instanceof Error ? error.message : String(error),
        tip: "Check that GOLEM_PRIVATE_KEY is set in .env file"
      },
      { status: 500 }
    )
  }
}