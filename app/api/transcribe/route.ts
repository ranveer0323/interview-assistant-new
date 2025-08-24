import { AssemblyAI, SpeechModel } from 'assemblyai';
import { NextRequest, NextResponse } from 'next/server';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' }, 
        { status: 400 }
      );
    }

    // Validate file size (limit to 25MB for reasonable processing time)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    console.log(`Processing audio file: ${audioFile.name}, Size: ${audioFile.size} bytes`);

    // Upload audio to AssemblyAI
    console.log('Uploading audio to AssemblyAI...');
    const uploadUrl = await client.files.upload(audioBuffer);
    
    if (!uploadUrl) {
      throw new Error('Failed to upload audio file to AssemblyAI');
    }

    console.log('Audio uploaded successfully, starting transcription...');

    // Transcribe with optimized settings for interview/conversation
    const params = {
      audio: uploadUrl,
       // Fastest model, good for real-time applications
      //language_code: 'en', // Specify English for better performance
      //punctuate: true,
      //format_text: true,
      //filter_profanity: false, // Keep original speech for interviews
      //dual_channel: false, // Single channel for most use cases
      // Optional: Add speaker diarization if you expect multiple speakers
      // speaker_labels: true,
      // speakers_expected: 2,
    };

    const transcript = await client.transcripts.transcribe(params);
    
    console.log('Transcription status:', transcript.status);

    if (transcript.status === 'error') {
      console.error('Transcription error:', transcript.error);
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    if (!transcript.text || transcript.text.trim().length === 0) {
      return NextResponse.json({
        text: '',
        confidence: 0,
        message: 'No speech detected in audio'
      });
    }

    console.log('Transcription completed successfully');

    return NextResponse.json({ 
      text: transcript.text.trim(),
      confidence: transcript.confidence || 0.8, // Default confidence if not provided
      duration: transcript.audio_duration || 0,
      words: transcript.words?.length || 0
    });
    
  } catch (error) {
    console.error('Transcription API error:', error);
    
    // Determine error type and return appropriate response
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid AssemblyAI API key configuration' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Network error occurred during transcription' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: `Transcription failed: ${error.message}` }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during transcription' }, 
      { status: 500 }
    );
  }
}