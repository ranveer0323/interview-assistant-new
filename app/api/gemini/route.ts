import { generateResponse } from '@/lib/gemini';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json();
    
    const response = await generateResponse(message, history);
    
    return NextResponse.json({ 
      text: response 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}