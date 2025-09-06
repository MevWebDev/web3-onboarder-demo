# Stream.io Webhook Configuration

## Setup Instructions

### 1. Configure Webhook in Stream.io Dashboard

1. Go to your [Stream.io Dashboard](https://dashboard.getstream.io)
2. Select your app
3. Navigate to **Webhooks** section
4. Add a new webhook endpoint:
   - **URL**: `https://your-domain.com/api/webhooks/stream-transcription`
   - For local development with ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/stream-transcription`
5. Select the following events:
   - `call.transcription_ready`
   - `call.transcription_started` (optional)
   - `call.transcription_stopped` (optional)
   - `call.transcription_failed` (optional)

### 2. Local Development Setup (with ngrok)

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Copy the HTTPS URL and use it in Stream dashboard
```

### 3. Environment Variables

Make sure you have these in your `.env.local`:

```env
# Stream.io (already configured)
STREAM_API_KEY=your_api_key
STREAM_API_SECRET=your_api_secret

# OpenRouter (already configured)
OPENROUTER_API_KEY=your_openrouter_key
```

### 4. Testing the Flow

1. Start a video call in your app
2. Click "Start Transcription" button
3. Have a conversation for at least 30 seconds
4. Click "Stop Call & End Transcription"
5. Stream.io will process and send the transcription to your webhook
6. Check your server logs for the analysis result

### 5. Production Considerations

- **Security**: Add webhook signature verification
- **Storage**: Store analysis results in a database
- **Error Handling**: Implement retry logic for failed webhook deliveries
- **Rate Limiting**: Implement rate limiting on your webhook endpoint

## Webhook Response Format

The webhook endpoint returns:

```json
{
  "success": true,
  "callId": "default:call-id-here",
  "analysis": {
    "decision": true,
    "reason": "The mentor provided clear explanations and practical advice on the topic."
  }
}
```

## Troubleshooting

- **Webhook not receiving events**: Check Stream.io dashboard for webhook delivery status
- **Transcription not starting**: Ensure user has proper permissions in token
- **LLM analysis failing**: Check OpenRouter API key and credits
- **Empty transcription**: Ensure conversation lasted long enough (minimum ~10 seconds)