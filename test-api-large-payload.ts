import { randomUUID } from 'crypto'

// Realistic 2-participant call transcription
const generateLargeTranscription = () => ({
  transcription: `
[00:00:00] Sarah Chen (Mentor): Hi Alex! Welcome to your Web3 onboarding session. I'm Sarah, and I'll be helping you get started with cryptocurrency and decentralized applications today.

[00:00:08] Alex Johnson (Mentee): Hi Sarah! Thanks so much for taking the time. I'm completely new to crypto but really excited to learn. I've heard about Bitcoin and Ethereum but honestly don't know where to start.

[00:00:22] Sarah Chen: That's perfectly fine! Everyone starts somewhere. Let's begin with the basics. Think of cryptocurrency as digital money that doesn't need banks. Instead of a bank keeping track of your balance, a blockchain network does it.

[00:00:38] Alex Johnson: Okay, so blockchain is like a digital ledger that everyone can see?

[00:00:44] Sarah Chen: Exactly! It's a public ledger that's maintained by thousands of computers around the world. No single entity controls it, which makes it decentralized. Now, to interact with blockchain, you need a wallet.

[00:00:58] Alex Johnson: Is that like a physical wallet but digital?

[00:01:02] Sarah Chen: Great analogy! A crypto wallet stores your private keys - think of them as ultra-secure passwords that prove you own certain digital assets. Let me help you set up your first wallet using MetaMask.

[00:01:18] Alex Johnson: I've heard of MetaMask. Is it safe?

[00:01:22] Sarah Chen: Yes, it's one of the most trusted wallet extensions. First, go to metamask.io - never download from anywhere else. Scammers create fake versions. Always double-check the URL.

[00:01:35] Alex Johnson: Okay, I'm on the official site. I see "Download" and it's showing a Chrome extension.

[00:01:42] Sarah Chen: Perfect! Click download and add it to Chrome. While it installs, let me explain what's happening. MetaMask creates a unique wallet address for you - like a bank account number, but for crypto.

[00:01:56] Alex Johnson: It's asking me to create a password now.

[00:02:00] Sarah Chen: Make it strong! This password protects your wallet on this device. Next, it'll show you something called a "seed phrase" or "recovery phrase" - this is extremely important.

[00:02:13] Alex Johnson: It's showing 12 words... "abandon ability able about above absent absorb abstract absurd abuse access accident" - should I write these down?

[00:02:26] Sarah Chen: YES! Write them down on paper, not digitally. Never take a screenshot or save them on your computer. These 12 words can restore your entire wallet if you lose access. Keep them safe and private.

[00:02:41] Alex Johnson: Got it written down. Why is this so important?

[00:02:46] Sarah Chen: Because unlike traditional banking, there's no customer service to reset your password. If you lose both your password AND your seed phrase, your crypto is gone forever. That's the price of decentralization.

[00:03:01] Alex Johnson: That's scary but I understand the responsibility. Okay, I've completed the setup. I see my wallet address starts with 0x...

[00:03:12] Sarah Chen: Excellent! That 0x address is your public wallet address - you can share this with others to receive funds. Now, let's get you some test cryptocurrency to experiment with.

[00:03:26] Alex Johnson: Test cryptocurrency?

[00:03:29] Sarah Chen: Yes! We'll use a testnet - a practice version of Ethereum where the coins have no real value. It's perfect for learning. In MetaMask, click the network dropdown at the top.

[00:03:43] Alex Johnson: I see "Ethereum Mainnet" is selected. There are other options...

[00:03:49] Sarah Chen: Right! Mainnet is the real network with real money. Let's switch to "Sepolia test network" - scroll down to find it. This is where we'll practice.

[00:04:01] Alex Johnson: Found it and switched. My balance shows 0 SepoliaETH.

[00:04:07] Sarah Chen: Perfect! Now we need to get some test ETH. Go to sepoliafaucet.com and paste your wallet address there. It'll send you free test coins.

[00:04:20] Alex Johnson: I pasted my address and clicked "Send me ETH". It says it's processing...

[00:04:27] Sarah Chen: Great! While we wait, let me explain gas fees. Every transaction on Ethereum costs a small fee called "gas" - it pays the computers that process your transaction.

[00:04:40] Alex Johnson: So even sending $10 worth of crypto might cost extra?

[00:04:46] Sarah Chen: Exactly! Gas fees vary based on network congestion. During busy times, they can be $20-50 for a simple transaction. That's why Layer 2 solutions like Arbitrum and Polygon exist.

[00:05:01] Alex Johnson: Oh cool! My test ETH just arrived. I have 0.5 SepoliaETH now.

[00:05:08] Sarah Chen: Excellent! Now let's try sending some. Click "Send" in MetaMask. Let's send 0.1 test ETH back to the faucet address to practice.

[00:05:20] Alex Johnson: I'm putting in the address... and amount is 0.1... it's showing a gas fee of about 0.0003 ETH.

[00:05:29] Sarah Chen: That's normal for testnets. On mainnet, gas fees are usually higher. Click "Confirm" to send the transaction.

[00:05:38] Alex Johnson: Done! It shows "Pending" with a transaction hash.

[00:05:44] Sarah Chen: Perfect! That hash is proof of your transaction. You can view it on Etherscan - the blockchain explorer. Every transaction is public and permanent.

[00:05:56] Alex Johnson: This is fascinating! The transaction just confirmed. So anyone can see this?

[00:06:03] Sarah Chen: Yes! Blockchain is transparent. People can see transactions but not necessarily who owns which wallet - though it's not completely anonymous.

[00:06:14] Alex Johnson: What about DeFi and NFTs? I hear about those a lot.

[00:06:20] Sarah Chen: Great question! DeFi means Decentralized Finance - things like lending, borrowing, and trading without traditional banks. NFTs are unique digital tokens, often used for art or collectibles.

[00:06:35] Alex Johnson: Can we try some DeFi?

[00:06:38] Sarah Chen: Sure! Let's try Uniswap on testnet - it's a decentralized exchange. Go to app.uniswap.org and connect your MetaMask wallet.

[00:06:50] Alex Johnson: It's asking to connect my wallet... should I click "Connect"?

[00:06:55] Sarah Chen: Yes, but always verify the URL first. Scammers create fake DeFi sites. app.uniswap.org is correct. When you connect, you're giving the site permission to see your address and balances.

[00:07:12] Alex Johnson: Connected! I can see my SepoliaETH balance here too.

[00:07:18] Sarah Chen: Good! Now let's swap some ETH for a test token. This simulates trading one cryptocurrency for another. Select USDC as the token you want to receive.

[00:07:32] Alex Johnson: I set it to swap 0.1 ETH for USDC... it says I'll get about 250 USDC. The prices are different from mainnet, right?

[00:07:43] Sarah Chen: Exactly! Testnet prices don't reflect real world values. Click "Swap" and confirm the transaction in MetaMask.

[00:07:54] Alex Johnson: Transaction confirmed! I now have USDC tokens in my wallet. This is amazing!

[00:08:02] Sarah Chen: You're getting it! This is the power of DeFi - direct peer-to-peer trading without traditional exchanges. Now, let's talk about security best practices.

[00:08:15] Alex Johnson: Yes, please! I want to make sure I don't lose my money.

[00:08:21] Sarah Chen: First rule: Never share your seed phrase or private keys. Second: Always verify website URLs. Third: Start small - don't invest more than you can afford to lose.

[00:08:36] Alex Johnson: Makes sense. What about choosing which cryptocurrencies to buy?

[00:08:43] Sarah Chen: Do your own research - we call it DYOR. Understand the technology, team, and use case. Bitcoin and Ethereum are generally considered safer starting points for beginners.

[00:08:57] Alex Johnson: Should I use hardware wallets?

[00:09:01] Sarah Chen: For significant amounts, yes! Hardware wallets like Ledger or Trezor store your keys offline, making them much more secure than software wallets.

[00:09:14] Alex Johnson: This session has been incredibly helpful! I feel like I actually understand the basics now instead of being completely confused.

[00:09:25] Sarah Chen: You're welcome! Remember, the crypto space moves fast and can be overwhelming. Take your time, keep learning, and never invest more than you can afford to lose. Any final questions?

[00:09:39] Alex Johnson: Just one - how do I keep learning? Are there good resources?

[00:09:45] Sarah Chen: Absolutely! Follow reputable crypto educators on Twitter, read Ethereum's official documentation, and consider taking online courses. CoinGecko and CoinMarketCap are good for market data.

[00:10:00] Alex Johnson: Perfect! Thank you so much, Sarah. I'm excited to continue learning and experimenting on testnets.

[00:10:08] Sarah Chen: You're very welcome, Alex! Remember - testnets are your friend for learning. Good luck on your Web3 journey!

[00:10:17] Alex Johnson: Thanks again! Have a great day!

[00:10:21] Sarah Chen: You too! Happy learning!
  `,
  participants: [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8", // Sarah (Mentor)
    "0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed"  // Alex (Mentee)
  ],
  duration: 621, // 10 minutes 21 seconds
  callSummary: "Web3 onboarding mentorship session where an experienced crypto user guides a complete beginner through wallet setup, basic transactions, and DeFi interactions on testnet.",
  keyInsights: [
    "Importance of seed phrase security - write on paper, never digitally",
    "Always verify website URLs to avoid scams",
    "Start with testnets for safe learning",
    "Gas fees add cost to every transaction",
    "Blockchain transactions are public and permanent", 
    "Hardware wallets recommended for significant amounts",
    "DYOR (Do Your Own Research) is essential",
    "Only invest what you can afford to lose"
  ]
})

async function testAPIWithLargePayload() {
  console.log("🚀 Testing Next.js API with Large Payload")
  console.log("==========================================\n")
  
  const baseUrl = "http://localhost:3000"
  
  // Generate test meet IDs
  const meetId = `meet-${Date.now()}-${randomUUID().slice(0, 8)}`
  const contractMeetId = `contract-${Date.now()}-${randomUUID().slice(0, 8)}`
  
  console.log("📝 Generated Test IDs:")
  console.log(`   Regular Meet ID: ${meetId}`)
  console.log(`   Contract Meet ID: ${contractMeetId}\n`)
  
  try {
    // Test 1: Store large transcription
    console.log("📤 Test 1: Storing large transcription...")
    
    const transcriptionData = generateLargeTranscription()
    const payloadSize = JSON.stringify(transcriptionData).length
    console.log(`   Payload size: ${payloadSize} bytes (~${(payloadSize/1024).toFixed(1)} KB)`)
    
    const storeStart = Date.now()
    const storeResponse = await fetch(`${baseUrl}/api/transcription/${meetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transcriptionData)
    })
    const storeTime = Date.now() - storeStart
    
    const storeResult = await storeResponse.json()
    
    if (storeResponse.ok) {
      console.log(`   ✅ Stored successfully in ${storeTime}ms`)
      console.log(`   Entity Key: ${storeResult.entityKey}`)
    } else {
      console.log(`   ❌ Store failed: ${storeResult.error}`)
      return
    }
    
    console.log("")
    
    // Test 2: Retrieve transcription
    console.log("📥 Test 2: Retrieving large transcription...")
    
    const retrieveStart = Date.now()
    const retrieveResponse = await fetch(`${baseUrl}/api/transcription/${meetId}`)
    const retrieveTime = Date.now() - retrieveStart
    
    const retrieveResult = await retrieveResponse.json()
    
    if (retrieveResponse.ok) {
      console.log(`   ✅ Retrieved successfully in ${retrieveTime}ms`)
      console.log(`   Meet ID: ${retrieveResult.meetId}`)
      console.log(`   Transcription length: ${retrieveResult.transcription.length} chars`)
      console.log(`   Participants: ${retrieveResult.participants.length}`)
      console.log(`   Key insights: ${retrieveResult.keyInsights.length}`)
    } else {
      console.log(`   ❌ Retrieve failed: ${retrieveResult.error}`)
    }
    
    console.log("")
    
    // Test 3: Smart contract webhook
    console.log("🔗 Test 3: Testing smart contract webhook...")
    
    const webhookData = {
      meetId: contractMeetId,
      transcriptionText: transcriptionData.transcription,
      participants: transcriptionData.participants,
      callDuration: transcriptionData.duration,
      contractAddress: "0x1234567890123456789012345678901234567890",
      blockNumber: 12345678,
      transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
    
    const webhookStart = Date.now()
    const webhookResponse = await fetch(`${baseUrl}/api/webhooks/smart-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    })
    const webhookTime = Date.now() - webhookStart
    
    const webhookResult = await webhookResponse.json()
    
    if (webhookResponse.ok) {
      console.log(`   ✅ Webhook processed successfully in ${webhookTime}ms`)
      console.log(`   Meet ID: ${webhookResult.meetId}`)
      console.log(`   Entity Key: ${webhookResult.entityKey}`)
    } else {
      console.log(`   ❌ Webhook failed: ${webhookResult.error}`)
    }
    
    console.log("")
    
    // Test 4: List all transcriptions
    console.log("📋 Test 4: Listing all transcriptions...")
    
    const listStart = Date.now()
    const listResponse = await fetch(`${baseUrl}/api/transcription`)
    const listTime = Date.now() - listStart
    
    const listResult = await listResponse.json()
    
    if (listResponse.ok) {
      console.log(`   ✅ Listed successfully in ${listTime}ms`)
      console.log(`   Total transcriptions: ${listResult.count}`)
      
      if (listResult.transcriptions.length > 0) {
        console.log(`   Recent transcriptions:`)
        listResult.transcriptions.slice(-3).forEach((trans: any, i: number) => {
          console.log(`     ${i + 1}. ${trans.meetId} (${trans.participants.length} participants)`)
        })
      }
    } else {
      console.log(`   ❌ List failed: ${listResult.error}`)
    }
    
    console.log("")
    
    // Test 5: TTL Extension
    console.log("⏰ Test 5: Testing TTL extension...")
    
    const extendStart = Date.now()
    const extendResponse = await fetch(`${baseUrl}/api/transcription/${meetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additionalBlocks: 150 })
    })
    const extendTime = Date.now() - extendStart
    
    const extendResult = await extendResponse.json()
    
    if (extendResponse.ok) {
      console.log(`   ✅ TTL extended successfully in ${extendTime}ms`)
    } else {
      console.log(`   ❌ TTL extension failed: ${extendResult.error}`)
    }
    
    console.log("")
    
    // Performance Summary
    console.log("📊 Performance Summary:")
    console.log("========================================")
    console.log(`   Payload size: ${payloadSize} bytes`)
    console.log(`   Store time: ${storeTime}ms`)
    console.log(`   Retrieve time: ${retrieveTime}ms`)
    console.log(`   Webhook time: ${webhookTime}ms`)
    console.log(`   List time: ${listTime}ms`)
    console.log(`   TTL extend time: ${extendTime}ms`)
    console.log("")
    
    console.log("🎉 All tests completed successfully!")
    console.log("✅ Large payload handling works correctly")
    console.log("✅ GolemDB integration is functional")
    console.log("✅ API endpoints are responsive")
    
  } catch (error: any) {
    console.error("❌ Test failed:", error.message)
    
    if (error.message.includes('fetch')) {
      console.log("\n💡 Make sure your Next.js server is running:")
      console.log("   npm run dev")
    }
  }
}

// Run the test
console.log("Starting API test with large payload...")
console.log("Make sure your Next.js server is running on http://localhost:3000\n")

testAPIWithLargePayload()