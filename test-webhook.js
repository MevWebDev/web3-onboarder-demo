// Test script to simulate GetStream webhook with mocked transcription data
const fs = require('fs');

// Mock transcription data (simulating GetStream JSONL format)
const mockTranscriptionData = `{"text": "Hello, welcome to today's mentoring session.", "speaker": "mentor", "start_time": 0.5, "end_time": 3.2}
{"text": "Hi there! Thanks for meeting with me today.", "speaker": "participant", "start_time": 3.5, "end_time": 6.1}
{"text": "Of course! What would you like to work on today?", "speaker": "mentor", "start_time": 6.3, "end_time": 8.9}
{"text": "I'm struggling with React hooks, especially useEffect.", "speaker": "participant", "start_time": 9.2, "end_time": 12.1}
{"text": "Great question! Let me explain useEffect step by step.", "speaker": "mentor", "start_time": 12.5, "end_time": 15.8}`;

// Create a mock transcription file
fs.writeFileSync('./mock-transcription.jsonl', mockTranscriptionData);
console.log('Mock transcription file created: mock-transcription.jsonl');

// Mock GetStream webhook payload
const webhookPayload = {
  type: "call.transcription_ready",
  call_cid: "default:test_call_123",
  call_transcription: {
    call_cid: "default:test_call_123",
    url: "http://localhost:3000/mock-transcription.jsonl", // We'll serve this locally
    subtitle_url: "http://localhost:3000/mock-transcription.vtt"
  },
  call: {
    id: "test_call_123",
    session_id: "session_456",
    duration_seconds: 300,
    started_at: new Date(Date.now() - 300000).toISOString(),
    ended_at: new Date().toISOString(),
    created_by: {
      id: "mentor_789"
    },
    members: [
      { id: "participant_101" },
      { id: "mentor_789" }
    ]
  }
};

console.log('\n=== MOCK WEBHOOK PAYLOAD ===');
console.log(JSON.stringify(webhookPayload, null, 2));
console.log('============================\n');

// Save payload to file for easy testing
fs.writeFileSync('./webhook-payload.json', JSON.stringify(webhookPayload, null, 2));
console.log('Webhook payload saved to: webhook-payload.json');

console.log('\n=== TEST COMMANDS ===');
console.log('1. Start your Next.js app: npm run dev');
console.log('2. In another terminal, serve the mock file:');
console.log('   npx http-server . -p 8080 --cors');
console.log('3. Update the URL in webhook-payload.json to: http://localhost:8080/mock-transcription.jsonl');
console.log('4. Test the webhook:');
console.log('   curl -X POST http://localhost:3000/api/webhooks/stream-transcription \\');
console.log('        -H "Content-Type: application/json" \\');
console.log('        -d @webhook-payload.json');
console.log('\nOR use the simple test endpoint:');
console.log('   curl -X POST http://localhost:3000/api/test-transcription');
console.log('==================');