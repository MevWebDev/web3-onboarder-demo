import { 
  createClient, 
  Tagged, 
  Annotation 
} from 'golem-base-sdk'
import type {
  AccountData,
  GolemBaseCreate,
  GolemBaseClient
} from 'golem-base-sdk'
import dotenv from 'dotenv'
import { randomUUID } from 'crypto'

dotenv.config()

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// Generate transcription of specific size
const generateTranscriptionOfSize = (targetSizeKB: number) => {
  const targetBytes = targetSizeKB * 1024
  
  // Base transcription template
  const baseTranscription = `
[00:00:00] Sarah Chen (Mentor): Welcome to this extended Web3 onboarding session!
[00:00:05] Alex Johnson (Mentee): Thanks! I'm ready for a deep dive into crypto.
  `
  
  // Filler content to reach target size
  let filler = ""
  const fillerChunk = "[00:XX:XX] Sarah: This is extended educational content about blockchain technology, decentralized applications, smart contracts, and cryptocurrency fundamentals. "
  
  while ((baseTranscription + filler).length < targetBytes) {
    filler += fillerChunk
  }
  
  const finalTranscription = baseTranscription + filler
  
  return {
    meetId: `size-test-${targetSizeKB}kb-${randomUUID().slice(0, 8)}`,
    transcription: finalTranscription.slice(0, targetBytes), // Exact size
    participants: [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8", // Sarah
      "0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed"  // Alex
    ],
    duration: Math.floor(targetSizeKB * 10), // Estimate duration based on size
    timestamp: new Date().toISOString(),
    callSummary: `Extended ${targetSizeKB}KB transcription for payload testing`,
    keyInsights: ["Testing large payload limits", "GolemDB capacity analysis"]
  }
}

async function testMaxPayload() {
  console.log("🧪 Testing GolemDB Maximum Payload Limits")
  console.log("==========================================\n")
  
  const rawKey = process.env.GOLEM_PRIVATE_KEY ?? ''
  if (!rawKey) {
    console.error("❌ GOLEM_PRIVATE_KEY not found in .env")
    return
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
    const client = await createClient(chainId, key, rpcUrl, wsUrl)
    console.log("✅ Connected to GolemDB")
    
    const ownerAddress = await client.getOwnerAddress()
    console.log(`📍 Address: ${ownerAddress}\n`)
    
    // Test different payload sizes
    const testSizes = [1, 5, 10, 25, 50, 100, 200, 500] // KB
    const results: any[] = []
    
    for (const sizeKB of testSizes) {
      console.log(`📤 Testing ${sizeKB}KB payload...`)
      
      try {
        const testData = generateTranscriptionOfSize(sizeKB)
        const jsonData = JSON.stringify(testData)
        const actualSize = new Blob([jsonData]).size
        
        console.log(`   Actual size: ${actualSize} bytes (${(actualSize/1024).toFixed(1)} KB)`)
        
        const creates: GolemBaseCreate[] = [{
          data: encoder.encode(jsonData),
          btl: 100, // Short TTL for testing
          stringAnnotations: [
            new Annotation("type", "size-test"),
            new Annotation("meetId", testData.meetId),
            new Annotation("size", `${sizeKB}kb`)
          ],
          numericAnnotations: [
            new Annotation("targetSizeKB", sizeKB),
            new Annotation("actualSizeBytes", actualSize)
          ]
        }]
        
        const startTime = Date.now()
        const receipts = await client.createEntities(creates)
        const storeTime = Date.now() - startTime
        
        console.log(`   ✅ SUCCESS - Stored in ${storeTime}ms`)
        console.log(`   Entity Key: ${receipts[0].entityKey}`)
        
        // Test retrieval
        const retrieveStart = Date.now()
        const entities = await client.queryEntities(`meetId = "${testData.meetId}"`)
        const retrieveTime = Date.now() - retrieveStart
        
        if (entities.length > 0) {
          const retrieved = JSON.parse(decoder.decode(entities[0].storageValue))
          console.log(`   ✅ RETRIEVED in ${retrieveTime}ms - Data intact: ${retrieved.meetId === testData.meetId}`)
        }
        
        results.push({
          sizeKB,
          actualSizeBytes: actualSize,
          storeTime,
          retrieveTime,
          success: true,
          entityKey: receipts[0].entityKey
        })
        
      } catch (error: any) {
        console.log(`   ❌ FAILED: ${error.message}`)
        
        results.push({
          sizeKB,
          success: false,
          error: error.message
        })
        
        // If we hit the limit, stop testing larger sizes
        if (error.message.includes('gas') || error.message.includes('size') || error.message.includes('too large')) {
          console.log(`   🛑 Hit payload limit at ${sizeKB}KB`)
          break
        }
      }
      
      console.log("")
      
      // Wait between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Summary
    console.log("📊 Test Results Summary:")
    console.log("========================")
    
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    if (successful.length > 0) {
      const maxSuccessful = Math.max(...successful.map(r => r.sizeKB))
      console.log(`✅ Maximum successful payload: ${maxSuccessful}KB`)
      
      console.log("\n📈 Performance by size:")
      successful.forEach(r => {
        console.log(`   ${r.sizeKB}KB: Store ${r.storeTime}ms, Retrieve ${r.retrieveTime}ms`)
      })
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ Failed payloads: ${failed.map(r => r.sizeKB + 'KB').join(', ')}`)
      console.log("\n🚨 Error analysis:")
      failed.forEach(r => {
        console.log(`   ${r.sizeKB}KB: ${r.error}`)
      })
    }
    
    console.log("\n💡 Recommendations:")
    if (successful.length > 0) {
      const recommended = Math.max(...successful.map(r => r.sizeKB))
      if (recommended >= 100) {
        console.log(`   ✅ GolemDB can handle payloads up to ${recommended}KB`)
        console.log(`   💰 For cost optimization, keep payloads under 50KB`)
      } else {
        console.log(`   ⚠️  Payload limit appears to be ${recommended}KB`)
        console.log(`   💡 Consider data compression or chunking for larger transcriptions`)
      }
    }
    
    process.exit(0)
    
  } catch (error: any) {
    console.error("❌ Test setup failed:", error.message)
    process.exit(1)
  }
}

testMaxPayload()