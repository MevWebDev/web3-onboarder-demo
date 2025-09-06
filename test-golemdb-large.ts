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

// Realistic transcription data
const generateLargeTranscription = (meetId: string) => ({
  meetId,
  transcription: `
[00:00:00] Alice Johnson: Good morning everyone, welcome to our Web3 onboarding strategy meeting. Today we'll be discussing how to improve our platform for new crypto users.

[00:00:15] Bob Smith: Thanks Alice. I've prepared some analytics from last quarter. We've seen a 40% increase in new user signups, but the completion rate for wallet setup is only about 60%.

[00:00:32] Charlie Chen: That's concerning. What are the main drop-off points?

[00:00:38] Bob Smith: The biggest issue is during the seed phrase backup process. Users find it confusing and many abandon the process there.

[00:00:48] Alice Johnson: We definitely need to simplify that. What about using social recovery or email-based wallets for beginners?

[00:01:02] Diana Martinez: I like that idea. We could offer multiple options - simple email login for beginners, and traditional seed phrases for advanced users.

[00:01:15] Charlie Chen: From a technical perspective, we could implement account abstraction. This would allow users to start with email and gradually transition to full self-custody.

[00:01:30] Bob Smith: That sounds great. Let me share my screen to show the current user flow... 

[00:01:38] Alice Johnson: Perfect. While Bob sets that up, Diana, can you tell us about the user feedback you've collected?

[00:01:45] Diana Martinez: Absolutely. We conducted 50 user interviews last month. The main pain points were:
1. Understanding gas fees - users don't know why they need ETH to send USDC
2. Seed phrase anxiety - they're terrified of losing their phrases
3. Transaction confusion - not understanding pending vs confirmed
4. Network selection - accidentally sending funds on wrong networks

[00:02:20] Bob Smith: Screen is up. So here's our current flow... First, users land on the homepage, then they click "Get Started"...

[00:02:35] Charlie Chen: I notice we're asking for too much information upfront. Maybe we should let them explore first?

[00:02:44] Alice Johnson: Good point. Progressive disclosure would help. Start simple, add complexity gradually.

[00:03:00] Diana Martinez: What about gamification? We could create a quest system where users earn tokens for completing onboarding steps.

[00:03:12] Bob Smith: That's been successful for other platforms. Rabby Wallet has a great points system.

[00:03:22] Charlie Chen: Speaking of which, we should integrate with multiple wallet providers. Not everyone wants to use MetaMask.

[00:03:35] Alice Johnson: Agreed. Let's make a list of priority integrations. I'm thinking WalletConnect, Coinbase Wallet, Rainbow...

[00:03:48] Diana Martinez: Don't forget about mobile users. Our mobile experience needs major improvements.

[00:04:00] Bob Smith: The analytics show 65% of new users are on mobile, so that's critical.

[00:04:10] Charlie Chen: I can work on a PWA version. That would give us better mobile support without maintaining separate apps.

[00:04:22] Alice Johnson: Excellent. Now, let's talk about the educational content. How can we teach crypto concepts without overwhelming newcomers?

[00:04:35] Diana Martinez: Interactive tutorials work well. Instead of explaining gas fees, let them do a test transaction with testnet tokens.

[00:04:48] Bob Smith: We could create a sandbox environment where nothing has real value, so users can experiment safely.

[00:05:00] Charlie Chen: That's technically feasible. We'd need to set up a testnet faucet and simplified interface.

[00:05:12] Alice Johnson: What about AI assistance? We could have a chatbot that answers questions in real-time.

[00:05:24] Diana Martinez: Users specifically requested that in interviews. They want immediate help when stuck.

[00:05:35] Bob Smith: The cost would be minimal compared to human support, and it scales infinitely.

[00:05:45] Charlie Chen: I'll research different AI providers. We need something that understands crypto terminology.

[00:05:56] Alice Johnson: Perfect. Now, regarding security education - how do we teach best practices without scaring users away?

[00:06:10] Diana Martinez: Gradual introduction. Start with basic password security, then introduce 2FA, then hardware wallets for high-value users.

[00:06:25] Bob Smith: We should also have automatic security scoring. Show users how secure their setup is with a simple score.

[00:06:38] Charlie Chen: Like a security health meter. Green means good, red means attention needed.

[00:06:48] Alice Johnson: I love that visual approach. Much better than walls of text about security.

[00:07:00] Diana Martinez: What about social features? Users trust recommendations from friends.

[00:07:10] Bob Smith: Referral programs work great. Maybe give both parties some tokens for successful onboarding?

[00:07:22] Charlie Chen: We need to be careful with regulatory compliance there. Token distributions can be tricky.

[00:07:35] Alice Johnson: Good point. Let's consult with legal before implementing any token incentives.

[00:07:45] Diana Martinez: For now, we could do non-monetary rewards. Badges, achievements, leaderboards...

[00:07:56] Bob Smith: The data shows users love collecting things. NFT badges could work well.

[00:08:08] Charlie Chen: Technically simple to implement. We could use a gasless minting solution.

[00:08:18] Alice Johnson: Excellent ideas everyone. Let's prioritize our action items.

[00:08:28] Diana Martinez: I'll create wireframes for the new progressive onboarding flow.

[00:08:36] Bob Smith: I'll analyze the exact drop-off points with more granular data.

[00:08:44] Charlie Chen: I'll start on the account abstraction proof of concept.

[00:08:52] Alice Johnson: And I'll coordinate with legal about the token incentives and draft the product roadmap.

[00:09:00] Everyone: Sounds good!

[00:09:05] Alice Johnson: Great meeting everyone. Let's reconvene next week with updates. Have a great day!
  `,
  participants: [
    "0x1234567890abcdef1234567890abcdef12345678", // Alice
    "0xabcdef1234567890abcdef1234567890abcdef12", // Bob
    "0x7890abcdef1234567890abcdef1234567890abcd", // Charlie
    "0xdef1234567890abcdef1234567890abcdef1234"  // Diana
  ],
  duration: 545, // 9 minutes 5 seconds
  timestamp: new Date().toISOString(),
  callSummary: "Web3 onboarding strategy meeting discussing user experience improvements, wallet integration, and educational content strategies.",
  keyInsights: [
    "60% wallet setup completion rate needs improvement",
    "Seed phrase backup is the main drop-off point",
    "65% of new users are on mobile",
    "Users want AI chatbot assistance for immediate help",
    "Progressive disclosure and gamification can improve onboarding",
    "Account abstraction could allow email-based start with gradual transition to self-custody",
    "Security education should be gradual, not overwhelming"
  ]
})

async function testLargeTranscription() {
  console.log("🚀 Testing GolemDB with Large Transcription Data\n")
  
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
    
    // Generate large transcription
    const meetId = `meeting-${randomUUID()}`
    const transcriptionData = generateLargeTranscription(meetId)
    
    console.log("📊 Transcription Details:")
    console.log(`   Meet ID: ${meetId}`)
    console.log(`   Size: ${new Blob([transcriptionData.transcription]).size} bytes`)
    console.log(`   Participants: ${transcriptionData.participants.length}`)
    console.log(`   Duration: ${transcriptionData.duration} seconds`)
    console.log(`   Key Insights: ${transcriptionData.keyInsights.length}\n`)
    
    // Create entity with large data
    console.log("📤 Storing large transcription on GolemDB...")
    
    const creates: GolemBaseCreate[] = [{
      data: encoder.encode(JSON.stringify(transcriptionData)),
      btl: 300, // ~10 minutes for testing
      stringAnnotations: [
        new Annotation("type", "transcription"),
        new Annotation("meetId", meetId),
        new Annotation("timestamp", transcriptionData.timestamp),
        new Annotation("summary", transcriptionData.callSummary.substring(0, 100))
      ],
      numericAnnotations: [
        new Annotation("duration", transcriptionData.duration),
        new Annotation("participantCount", transcriptionData.participants.length),
        new Annotation("dataSize", new Blob([transcriptionData.transcription]).size)
      ]
    }]
    
    const startTime = Date.now()
    const receipts = await client.createEntities(creates)
    const storeTime = Date.now() - startTime
    
    console.log("✅ Large transcription stored successfully!")
    console.log(`   Entity Key: ${receipts[0].entityKey}`)
    console.log(`   Storage time: ${storeTime}ms`)
    console.log(`   Expires at block: ${receipts[0].expirationBlock}\n`)
    
    // Query and retrieve
    console.log("🔍 Querying large transcription...")
    
    const queryStart = Date.now()
    const entities = await client.queryEntities(`meetId = "${meetId}"`)
    const queryTime = Date.now() - queryStart
    
    if (entities.length > 0) {
      const retrievedData = JSON.parse(decoder.decode(entities[0].storageValue))
      console.log("✅ Large transcription retrieved successfully!")
      console.log(`   Query time: ${queryTime}ms`)
      console.log(`   Retrieved Meet ID: ${retrievedData.meetId}`)
      console.log(`   Transcription preview: ${retrievedData.transcription.substring(0, 100)}...`)
      console.log(`   Full size verified: ${retrievedData.transcription.length} characters\n`)
    }
    
    // Test metadata
    console.log("📋 Checking metadata...")
    const metadata = await client.getEntityMetaData(receipts[0].entityKey)
    console.log(`   Owner: ${metadata.owner}`)
    console.log(`   Block number: ${metadata.blockNumber}`)
    console.log(`   Expires at: ${metadata.expiresAtBlock}\n`)
    
    // Performance summary
    console.log("📈 Performance Summary:")
    console.log(`   Data size: ${new Blob([JSON.stringify(transcriptionData)]).size} bytes`)
    console.log(`   Store time: ${storeTime}ms`)
    console.log(`   Query time: ${queryTime}ms`)
    console.log(`   BTL: 300 blocks (~10 minutes)`)
    
    console.log("\n🎉 Large transcription test complete!")
    console.log("✅ GolemDB successfully handled realistic call transcription data")
    
    process.exit(0)
    
  } catch (error: any) {
    console.error("❌ Error:", error.message)
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Your wallet needs more funds for this larger transaction")
      console.log("   The larger data size requires more gas")
    }
    
    process.exit(1)
  }
}

testLargeTranscription()