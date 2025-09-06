import { NextRequest, NextResponse } from 'next/server';
import { TranscriptionService } from '@/lib/transcription-service';

export async function POST(request: NextRequest) {
  try {
    const { callId, s3Url } = await request.json();

    if (!callId || !s3Url) {
      return NextResponse.json(
        { error: 'Missing callId or s3Url' },
        { status: 400 }
      );
    }

    // Update the S3 URL in the database
    const success = await TranscriptionService.updateS3Url(callId, s3Url);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update S3 URL' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'S3 URL updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating S3 URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}