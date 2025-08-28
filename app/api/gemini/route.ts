import { generateResponse } from '@/lib/gemini';
import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

const supabase = createSupabaseClient();

export async function POST(req: Request) {
  try {
    console.log('--- New Gemini API Request ---');
    const { message, history = [], interviewId } = await req.json();
    console.log('Received request with interviewId:', interviewId);
    
    let context = {};
    
    // If interviewId is provided, fetch job description and resume from database
    if (interviewId) {
      console.log('Fetching interview data for ID:', interviewId);
      const { data: interviewData, error } = await supabase
        .from('interviews')
        .select('job_description, resume_text, job_role')
        .eq('id', interviewId)
        .single();
      
      if (error) {
        console.error(' Error fetching interview data:', error);
      } else {
        context = {
          jobDescription: interviewData.job_description,
          resumeText: interviewData.resume_text,
          job_role: interviewData.job_role,
          //companyName: interviewData.company_name
        };
        console.log(' Fetched interview context:', {
          hasJobDescription: !!interviewData.job_description,
          hasResumeText: !!interviewData.resume_text,
          jobRole: interviewData.job_role,
          contextKeys: Object.keys(context)
        });
      }
    } else {
      console.log(' No interviewId provided, using empty context');
    }
    
    console.log('Generating response with context and history length:', history.length);
    const response = await generateResponse(message, history, context);
    
    console.log('--- Gemini API Response Generated ---');
    return NextResponse.json({
      text: response
    });
  } catch (error) {
    console.error(' API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}