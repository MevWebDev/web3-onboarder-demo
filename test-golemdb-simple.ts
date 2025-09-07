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

async function testGolemDBSimple() {
  console.log("🚀 Simple GolemDB Test\n")
  
  // Connection
  const rawKey = process.env.GOLEM_PRIVATE_KEY ?? ''
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
    
    // Create MINIMAL entity
    const testId = randomUUID()
    console.log("Creating minimal test entity...")
    
    const creates: GolemBaseCreate[] = [{
      data: encoder.encode("test"), // Very small data
      btl: 100, // ~3 minutes - reasonable for testing
      stringAnnotations: [
        new Annotation("id", testId)
      ],
      numericAnnotations: []
    }]
    
    const receipts = await client.createEntities(creates)
    console.log("✅ Entity created successfully!")
    console.log(`   Entity Key: ${receipts[0].entityKey}`)
    console.log(`   Test ID: ${testId}`)
    console.log(`   Expires at block: ${receipts[0].expirationBlock}\n`)
    
    // Try to retrieve it
    console.log("Retrieving entity...")
    const entities = await client.queryEntities(`id = "${testId}"`)
    
    if (entities.length > 0) {
      const data = decoder.decode(entities[0].storageValue)
      console.log(`✅ Retrieved data: "${data}"`)
    }
    
    console.log("\n🎉 Test successful! GolemDB is working.")
    process.exit(0)
    
  } catch (error: any) {
    console.error("❌ Error:", error.message)
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Tips:")
      console.log("- Your balance might be too low for this network")
      console.log("- Try getting more test ETH from faucets")
    }
    
    process.exit(1)
  }
}

testGolemDBSimple()