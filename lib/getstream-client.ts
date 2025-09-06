import { StreamVideoClient } from '@stream-io/video-react-sdk';

/**
 * Initialize GetStream Video client for transcription operations
 */
export function initializeStreamClient(apiKey: string, userId: string, userToken: string) {
  const client = new StreamVideoClient({
    apiKey,
    user: {
      id: userId,
    },
    token: userToken,
  });

  return client;
}

/**
 * Enable transcription for a call
 */
export async function enableCallTranscription(
  client: StreamVideoClient,
  callType: string,
  callId: string
) {
  try {
    const call = client.call(callType, callId);
    
    // Start transcription with settings
    await call.update({
      settings_override: {
        transcription: {
          mode: 'auto_on', // Automatically start transcription
          audio_only: false, // Include video if needed
        },
      },
    });

    console.log(`Transcription enabled for call ${callId}`);
    return true;
  } catch (error) {
    console.error('Error enabling transcription:', error);
    return false;
  }
}

/**
 * Get transcription status for a call
 */
export async function getTranscriptionStatus(
  client: StreamVideoClient,
  callType: string,
  callId: string
) {
  try {
    const call = client.call(callType, callId);
    const callData = await call.get();
    
    return {
      transcribing: callData.call.transcribing,
      transcription: callData.call.transcription,
    };
  } catch (error) {
    console.error('Error getting transcription status:', error);
    return null;
  }
}

/**
 * Stop transcription for a call
 */
export async function stopCallTranscription(
  client: StreamVideoClient,
  callType: string,
  callId: string
) {
  try {
    const call = client.call(callType, callId);
    
    await call.stopTranscription();
    console.log(`Transcription stopped for call ${callId}`);
    return true;
  } catch (error) {
    console.error('Error stopping transcription:', error);
    return false;
  }
}