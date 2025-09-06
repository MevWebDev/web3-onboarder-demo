# 🐛 Transcription Debugging Guide

## Current Issue
Getting `202` responses but webhook never receives transcription data. Let's debug step by step.

## Step 1: Test Webhook Connectivity

First, verify your webhook endpoint is reachable:

### 1a. Test Local Endpoint
```bash
# Test local server is running
curl http://localhost:3000/api/webhooks/test

# Should return: {"status":"success","message":"Test webhook is working"}
```

### 1b. Test ngrok Tunnel (if using)
```bash
# Start ngrok
ngrok http 3000

# Test the HTTPS URL
curl https://your-ngrok-id.ngrok.io/api/webhooks/test

# Should return the same success message
```

### 1c. Test POST to Webhook
```bash
curl -X POST https://your-ngrok-id.ngrok.io/api/webhooks/stream-transcription \
  -H "Content-Type: application/json" \
  -d '{"type":"test","message":"hello"}'

# Should see webhook logs in your server console
```

## Step 2: Check Stream.io Dashboard Configuration

1. Go to [Stream Dashboard](https://dashboard.getstream.io)
2. Navigate to your app
3. Go to **Webhooks** section
4. Verify webhook is configured:
   - URL: `https://your-ngrok-id.ngrok.io/api/webhooks/stream-transcription`
   - Events enabled:
     - ✅ `call.transcription_started`
     - ✅ `call.transcription_stopped`
     - ✅ `call.transcription_ready`
     - ✅ `call.transcription_failed`

## Step 3: Check Token Permissions

The hardcoded token might be expired or lack permissions:

```javascript
// Current token in your code (line 18)
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Decode this token at https://jwt.io to check:
// 1. Expiration date (exp field)
// 2. Permissions/role
```

### Generate New Token (if needed)
If token is expired, generate a new one with transcription permissions:

```javascript
// Server-side token generation
const client = new StreamClient(apiKey, apiSecret);
const token = client.createToken(userId, {
  validity_in_seconds: 3600,
  call_cids: ['default:*'],
  permissions: [
    'create-call',
    'join-call',
    'start-transcription',
    'stop-transcription',
    'read-call'
  ]
});
```

## Step 4: Debug Transcription Start

### 4a. Check Console Logs
When you click "Start Transcription", look for these logs:

```
▶️ STARTING TRANSCRIPTION
Call ID: Uy9X6AfT85NKpAtyI5qfh
Call object: [object Object]
✅ Transcription start result: [result object]
```

### 4b. Common Start Errors
- **Permission denied**: Token lacks transcription permissions
- **Call not found**: Call ID issues
- **Invalid state**: Call not properly joined

## Step 5: Monitor Webhook Reception

### 5a. Expected Webhook Flow
When transcription works, you should see these webhooks in order:

```bash
# 1. Transcription starts
=== STREAM.IO WEBHOOK RECEIVED ===
Event Type: call.transcription_started
Call CID: default:Uy9X6AfT85NKpAtyI5qfh

# 2. Transcription stops (when call ends)
=== STREAM.IO WEBHOOK RECEIVED ===
Event Type: call.transcription_stopped
Call CID: default:Uy9X6AfT85NKpAtyI5qfh

# 3. Transcription ready (after processing)
=== STREAM.IO WEBHOOK RECEIVED ===
Event Type: call.transcription_ready
Call CID: default:Uy9X6AfT85NKpAtyI5qfh
Transcription URL: [S3 URL]
```

### 5b. If No Webhooks Received
- ❌ Webhook URL not configured in Stream dashboard
- ❌ ngrok not running or wrong URL
- ❌ Firewall blocking webhook calls
- ❌ Transcription never actually started

## Step 6: Alternative Debug - Manual Check

Add a test endpoint to check if transcription is running:

```typescript
// Add this to VideoCallComponent after starting transcription
useEffect(() => {
  if (isTranscribing && call) {
    // Check transcription status every 5 seconds
    const interval = setInterval(async () => {
      try {
        const transcriptions = await call.listTranscriptions();
        console.log("📋 Current transcriptions:", transcriptions);
      } catch (error) {
        console.error("Error listing transcriptions:", error);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }
}, [isTranscribing, call]);
```

## Step 7: Quick Fixes to Try

### Fix 1: Use Different Call ID
```javascript
// Try with a fresh call ID
const callId = `test-${Date.now()}`;
```

### Fix 2: Add Call Type Configuration
```javascript
// Before joining, configure call type for transcription
const call = client.call("default", callId);
await call.getOrCreate({
  data: {
    created_by_id: user.id,
    settings_override: {
      transcription: {
        mode: "available"
      }
    }
  }
});
```

### Fix 3: Test with Different Model
```javascript
// Try different transcription settings
await call.startTranscription({ 
  language: "en",
  transcription_external_storage: false
});
```

## Expected Behavior Timeline

1. **0:00** - Click "Start Transcription" → See start logs
2. **0:02** - Webhook receives `call.transcription_started`
3. **1:00** - Talk for at least 30 seconds
4. **1:30** - Click "End Call" → See stop logs
5. **1:32** - Webhook receives `call.transcription_stopped`  
6. **1:45** - Webhook receives `call.transcription_ready` (processing time varies)
7. **1:46** - Component shows analysis result

## If Still Not Working

1. **Check Stream.io Status**: Visit Stream.io status page
2. **Try Different Browser**: Clear cache/cookies
3. **Use Real Stream.io Account**: Not demo/test credentials
4. **Check API Limits**: Ensure account has credits
5. **Contact Stream.io**: If everything looks correct

## Logs to Share

If you need help, share these logs:
- Browser console output (full transcription flow)
- Server console output (webhook reception)
- ngrok logs
- Stream.io dashboard webhook delivery status