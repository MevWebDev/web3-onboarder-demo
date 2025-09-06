# Transcription Testing Guide

## Fixed Issues

1. **Auto-join removed**: Call no longer starts automatically when component loads
2. **Manual call start**: Added "Join Video Call" button to explicitly start the call
3. **Clearer transcription flow**: Better status messages and visual feedback
4. **Proper call cleanup**: Ensures transcription stops before leaving call

## Testing Steps

### 1. Start the Application
```bash
npm run dev
```

### 2. Set Up Webhook (Local Testing)
```bash
# In a new terminal
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

### 3. Configure Stream.io Dashboard
1. Go to [Stream Dashboard](https://dashboard.getstream.io)
2. Select your app
3. Go to **Webhooks**
4. Add webhook URL: `https://your-ngrok-url.ngrok.io/api/webhooks/stream-transcription`
5. Enable events:
   - `call.transcription_ready`
   - `call.transcription_started`
   - `call.transcription_stopped`

### 4. Test the Flow

1. **Open the app**: Navigate to the component with VideoCallComponent
2. **Click "Join Video Call"**: This starts the video call
3. **Wait for connection**: You should see the video interface
4. **Click "🔴 Start Transcription"**: Button should change to "Recording..."
5. **Have a conversation**: Talk for at least 30 seconds
6. **Click "🛑 End Call & Stop Transcription"**: This will:
   - Stop the transcription
   - Leave the call
   - Show the review screen with loading indicator
7. **Wait for analysis**: Should take 10-30 seconds
8. **View results**: You'll see:
   - HELPFUL/NOT HELPFUL badge
   - Boolean value (true/false)
   - Reason from AI
   - JSON response

## Troubleshooting

### "No transcription was created"
- Ensure you clicked "Start Transcription" BEFORE ending the call
- Check console for errors about permissions
- Verify webhook is configured correctly

### Transcription not starting
- Check browser console for errors
- Verify the token has transcription permissions
- Ensure Stream.io API key is valid

### Analysis not appearing
- Check webhook logs in Stream dashboard
- Verify ngrok is running and URL is correct
- Check server console for webhook receipt
- Ensure OpenRouter API key is valid

## Console Debugging

Add these to monitor the flow:
1. Browser console: Check for transcription start/stop events
2. Server console: Look for "Received Stream.io webhook" messages
3. Network tab: Monitor API calls to `/api/transcription-result/[callId]`

## Important Notes

- Transcription requires at least a few seconds of audio
- The current token expires in 7 days (check expiration)
- Free tier includes transcription features
- Processing time varies (typically 10-30 seconds after call ends)