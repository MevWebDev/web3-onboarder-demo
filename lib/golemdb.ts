import { 
  createClient, 
  Tagged, 
  Annotation,
  AccountData,
  GolemBaseCreate,
  GolemBaseClient,
  GolemBaseUpdate
} from 'golem-base-sdk'

import { randomUUID } from 'crypto'

let client: GolemBaseClient | null = null
const encoder = new TextEncoder()
const decoder = new TextDecoder()

export async function getGolemDBClient(): Promise<GolemBaseClient> {
  if (client) {
    return client
  }

  const rawKey = process.env.GOLEM_PRIVATE_KEY ?? ''
  if (!rawKey) {
    throw new Error('GOLEM_PRIVATE_KEY environment variable is required')
  }

  const hexKey = rawKey.startsWith('0x') ? rawKey.slice(2) : rawKey
  const key: AccountData = new Tagged(
    "privatekey",
    Buffer.from(hexKey, 'hex')
  )

  const chainId = Number(process.env.GOLEM_CHAIN_ID ?? '60138453033')
  const rpcUrl = process.env.GOLEM_RPC_URL ?? 'https://ethwarsaw.holesky.golemdb.io/rpc'
  const wsUrl = process.env.GOLEM_WS_URL ?? 'wss://ethwarsaw.holesky.golemdb.io/rpc/ws'

  try {
    client = await createClient(chainId, key, rpcUrl, wsUrl)
    console.log('Connected to GolemDB')
    return client
  } catch (error) {
    console.error('Failed to connect to GolemDB:', error)
    throw error
  }
}

export interface TranscriptionData {
  meetId: string
  transcription: string
  participants: string[]
  duration: number
  timestamp: string
  callSummary?: string
  keyInsights?: string[]
}

export class GolemTranscriptionService {
  private client: GolemBaseClient | null = null

  async initialize() {
    this.client = await getGolemDBClient()
  }

  async storeTranscription(data: TranscriptionData): Promise<string> {
    if (!this.client) {
      await this.initialize()
    }

    const transcriptionJson = JSON.stringify(data)
    const encodedData = encoder.encode(transcriptionJson)

    const creates: GolemBaseCreate[] = [{
      data: encodedData,
      btl: 300, // ~10 minutes for testing (use 43200 for production ~24 hours)
      stringAnnotations: [
        new Annotation("type", "transcription"),
        new Annotation("meetId", data.meetId),
        new Annotation("timestamp", data.timestamp),
        new Annotation("id", randomUUID())
      ],
      numericAnnotations: [
        new Annotation("duration", data.duration),
        new Annotation("participantCount", data.participants.length)
      ]
    }]

    const receipts = await this.client!.createEntities(creates)
    console.log(`Stored transcription for meetId ${data.meetId}`)
    return receipts[0].entityKey
  }

  async getTranscriptionByMeetId(meetId: string): Promise<TranscriptionData | null> {
    if (!this.client) {
      await this.initialize()
    }

    const entities = await this.client!.queryEntities(`meetId = "${meetId}"`)
    
    if (entities.length === 0) {
      return null
    }

    const entity = entities[0]
    const decodedData = decoder.decode(entity.storageValue)
    return JSON.parse(decodedData) as TranscriptionData
  }

  async getAllTranscriptions(): Promise<TranscriptionData[]> {
    if (!this.client) {
      await this.initialize()
    }

    const entities = await this.client!.queryEntities('type = "transcription"')
    
    return entities.map(entity => {
      const decodedData = decoder.decode(entity.storageValue)
      return JSON.parse(decodedData) as TranscriptionData
    })
  }

  async getTranscriptionsByParticipant(participantAddress: string): Promise<TranscriptionData[]> {
    if (!this.client) {
      await this.initialize()
    }

    // Get all transcriptions first, then filter in application code
    // GolemDB query syntax may not support LIKE operator
    const entities = await this.client!.queryEntities('type = "transcription"')
    
    return entities
      .map(entity => {
        const decodedData = decoder.decode(entity.storageValue)
        return JSON.parse(decodedData) as TranscriptionData
      })
      .filter(data => data.participants.includes(participantAddress))
  }

  async extendTranscriptionTTL(meetId: string, additionalBlocks: number = 150): Promise<void> {
    if (!this.client) {
      await this.initialize()
    }

    const entities = await this.client!.queryEntities(`meetId = "${meetId}"`)
    
    if (entities.length === 0) {
      throw new Error(`No transcription found for meetId: ${meetId}`)
    }

    const extendRequests = entities.map(entity => ({
      entityKey: entity.entityKey,
      numberOfBlocks: additionalBlocks
    }))

    await this.client!.extendEntities(extendRequests)

    console.log(`Extended TTL for transcription ${meetId} by ${additionalBlocks} blocks`)
  }

  async setupRealTimeMonitoring() {
    if (!this.client) {
      await this.initialize()
    }

    const unwatch = this.client!.watchLogs({
      fromBlock: BigInt(0),
      onCreated: (args) => {
        console.log("New transcription stored:", args.entityKey)
      },
      onUpdated: (args) => {
        console.log("Transcription updated:", args.entityKey)
      },
      onDeleted: (args) => {
        console.log("Transcription expired/deleted:", args.entityKey)
      },
      onExtended: (args) => {
        console.log("Transcription extended:", args.entityKey)
      },
      onError: (error) => {
        console.error("GolemDB watch error:", error)
      }
    })

    return unwatch
  }
}

export const transcriptionService = new GolemTranscriptionService()