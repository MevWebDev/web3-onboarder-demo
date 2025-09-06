# 🚀 Stream.io Webhook Setup with Vercel

## Overview
Since you're using Vercel, you need to deploy your webhook endpoint and configure it in Stream.io dashboard.

## Step 1: Deploy to Vercel

### 1a. Deploy Your App
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy your app
vercel

# Or if already deployed, redeploy
vercel --prod
```

### 1b. Get Your Vercel URL
After deployment, you'll get a URL like:
- `https://your-app-name.vercel.app`
- `https://web3-onboarder-demo.vercel.app`

### 1c. Test Your Webhook Endpoint
```bash
# Test the webhook endpoint is live
curl https://your-app-name.vercel.app/api/webhooks/test

# Should return:
# {"status":"success","message":"Test webhook is working","timestamp":"..."}
```

## Step 2: Configure Stream.io Dashboard

### 2a. Access Stream.io Dashboard
1. Go to [https://dashboard.getstream.io](https://dashboard.getstream.io)
2. Sign in to your account
3. Select your application (or create one if needed)

### 2b. Navigate to Webhooks
1. In the left sidebar, click **"Webhooks"**
2. Click **"Add Webhook"** or **"New Webhook"**

### 2c. Configure Webhook Settings
Fill in these details:

**Webhook URL:**
```
https://your-app-name.vercel.app/api/webhooks/stream-transcription
```

**Events to Subscribe:**
- ✅ `call.transcription_started`
- ✅ `call.transcription_stopped` 
- ✅ `call.transcription_ready`
- ✅ `call.transcription_failed`

**Other Settings:**
- **Active**: ✅ Enabled
- **Secret**: Leave blank for now (optional)

### 2d. Save the Webhook
Click **"Save"** or **"Create Webhook"**

## Step 3: Get Your Stream.io Credentials

### 3a. Find Your API Credentials
1. In Stream.io dashboard, go to **"App Settings"** or **"Overview"**
2. Note down:
   - **API Key** (public)
   - **API Secret** (private)

### 3b. Update Environment Variables in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```env
# Stream.io Configuration
NEXT_PUBLIC_STREAM_API_KEY=your_api_key_here
STREAM_API_SECRET=your_api_secret_here

# OpenRouter (already exists)
OPENROUTER_API_KEY=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
```

### 3c. Redeploy After Adding Environment Variables
```bash
vercel --prod
```

## Step 4: Generate Proper Token (Replace Hardcoded One)

Create a new API route to generate tokens:

### 4a. Create Token Generation Endpoint
```bash
# This file should already be created if you want to implement it
touch app/api/stream-token/route.ts
```

**Content for `app/api/stream-token/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    // You'll need to install @stream-io/node-sdk
    // npm install @stream-io/node-sdk
    
    const { StreamClient } = require('@stream-io/node-sdk');
    
    const client = new StreamClient(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );
    
    const token = client.createToken(userId, {
      validity_in_seconds: 3600 * 24, // 24 hours
      call_cids: ['default:*'],
      role: 'user',
      // Add transcription permissions
      permissions: [
        'create-call',
        'join-call',
        'start-transcription',
        'stop-transcription',
        'start-closed-captions',
        'stop-closed-captions',
        'read-call'
      ]
    });
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
```

### 4b. Install Stream Node SDK
```bash
npm install @stream-io/node-sdk
```

## Step 5: Test the Complete Flow

### 5a. Test Webhook Connectivity
```bash
# Test your deployed webhook
curl -X POST https://your-app-name.vercel.app/api/webhooks/stream-transcription \
  -H "Content-Type: application/json" \
  -d '{"type":"test","message":"webhook test"}'

# Should see logs in Vercel Functions tab
```

### 5b. Check Webhook Delivery in Stream.io
1. In Stream.io dashboard, go to **Webhooks**
2. Click on your webhook
3. Check **"Recent Deliveries"** or **"Logs"** tab
4. Should show delivery attempts

### 5c. Test Full Transcription Flow
1. Join video call
2. Start transcription
3. Talk for 30+ seconds
4. End call
5. Check Vercel function logs for webhook events

## Step 6: Monitor Logs

### 6a. Vercel Function Logs
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Functions** tab
4. Click on your webhook function to see logs

### 6b. Stream.io Webhook Logs
1. In Stream.io dashboard
2. Go to **Webhooks** 
3. Click your webhook
4. Check delivery status and response codes

## Troubleshooting

### Common Issues:

**1. 404 Not Found**
- Verify webhook URL is exactly: `https://your-domain.vercel.app/api/webhooks/stream-transcription`
- Ensure you deployed after creating the webhook file

**2. 500 Internal Server Error**
- Check Vercel function logs for errors
- Verify environment variables are set
- Check OpenRouter API key is valid

**3. Webhook Not Triggering**
- Verify events are selected in Stream.io dashboard
- Check transcription actually starts (console logs)
- Verify token has transcription permissions

**4. Token Issues**
- Use fresh token with proper permissions
- Check token expiration at jwt.io
- Ensure API secret is correct

### Quick Test Commands:

```bash
# Test webhook endpoint
curl https://your-app.vercel.app/api/webhooks/test

# Test transcription webhook
curl -X POST https://your-app.vercel.app/api/webhooks/stream-transcription \
  -H "Content-Type: application/json" \
  -d '{"type":"call.transcription_ready","call_transcription":{"url":"test","call_cid":"default:test"}}'
```

## Example Vercel URLs

Replace `your-app-name` with your actual Vercel deployment:

- **App URL**: `https://your-app-name.vercel.app`
- **Webhook URL**: `https://your-app-name.vercel.app/api/webhooks/stream-transcription`
- **Test URL**: `https://your-app-name.vercel.app/api/webhooks/test`

Once this is set up, your transcription webhook should work properly with Vercel!