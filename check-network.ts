import { createPublicClient, http, formatEther, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import dotenv from 'dotenv'

dotenv.config()

async function checkNetwork() {
  console.log("🔍 Checking GolemDB Network Status\n")
  
  const rpcUrl = process.env.GOLEM_RPC_URL ?? 'https://ethwarsaw.holesky.golemdb.io/rpc'
  const rawPrivateKey = process.env.GOLEM_PRIVATE_KEY ?? ''
  
  if (!rawPrivateKey || rawPrivateKey === '0x...') {
    console.error("❌ Please set a valid GOLEM_PRIVATE_KEY in .env")
    return
  }
  
  // Ensure proper format
  let privateKey: `0x${string}`
  if (rawPrivateKey.startsWith('0x')) {
    privateKey = rawPrivateKey as `0x${string}`
  } else {
    privateKey = `0x${rawPrivateKey}` as `0x${string}`
  }
  
  // Validate hex string length (should be 64 chars after 0x)
  const hexPart = privateKey.slice(2)
  if (hexPart.length !== 64) {
    console.error(`❌ Invalid private key length. Expected 64 hex characters, got ${hexPart.length}`)
    console.error(`   Your key: ${privateKey.slice(0, 10)}...`)
    return
  }
  
  const account = privateKeyToAccount(privateKey)
  
  const client = createPublicClient({
    transport: http(rpcUrl),
  })
  
  try {
    // 1. Check chain ID
    const chainId = await client.getChainId()
    console.log(`🔗 Chain ID: ${chainId}`)
    console.log(`   Expected: 60138453033`)
    console.log(`   Match: ${chainId === 60138453033 ? '✅' : '❌'}\n`)
    
    // 2. Check balance
    const balance = await client.getBalance({ address: account.address })
    console.log(`💰 Balance for ${account.address}:`)
    console.log(`   ${formatEther(balance)} ETH\n`)
    
    // 3. Check gas price
    const gasPrice = await client.getGasPrice()
    console.log(`⛽ Current gas price: ${formatEther(gasPrice)} ETH`)
    
    // 4. Check block number
    const blockNumber = await client.getBlockNumber()
    console.log(`📦 Current block: ${blockNumber}\n`)
    
    // 5. Estimate simple transaction cost
    try {
      const estimatedGas = await client.estimateGas({
        account: account.address,
        to: '0x0000000000000000000000000000000000000001',
        value: parseEther('0'),
        data: '0x00'
      })
      
      const estimatedCost = estimatedGas * gasPrice
      console.log(`💸 Estimated cost for simple tx:`)
      console.log(`   Gas units: ${estimatedGas}`)
      console.log(`   Cost: ${formatEther(estimatedCost)} ETH\n`)
      
      if (balance < estimatedCost) {
        console.log("❌ Insufficient balance for even simple transactions!")
      } else {
        console.log("✅ Balance should be sufficient for simple transactions")
      }
    } catch (estError: any) {
      console.log("⚠️  Cannot estimate gas:", estError.message)
    }
    
    // 6. Try alternative Holesky RPC
    console.log("\n🔄 Alternative networks to try:")
    console.log("1. Standard Holesky: https://ethereum-holesky-rpc.publicnode.com")
    console.log("2. Ankr Holesky: https://rpc.ankr.com/eth_holesky")
    console.log("\n💡 You might need to:")
    console.log("1. Use standard Holesky faucets for this specific GolemDB network")
    console.log("2. Check if GolemDB requires special gas token or different funding method")
    console.log("3. Contact GolemDB team for testnet tokens specific to their L3")
    
  } catch (error: any) {
    console.error("❌ Error:", error.message)
  }
}

checkNetwork()