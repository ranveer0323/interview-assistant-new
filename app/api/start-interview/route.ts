import { generateResponse } from '@/lib/gemini';
import { startInterview } from '@/lib/gemini';
import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

const supabase = createSupabaseClient();

export async function POST(req: Request) {
  try {
    const { interviewId } = await req.json();
    
    let context = {};
    
    // If interviewId is provided, fetch job description and resume from database
    if (interviewId) {
      const { data: interviewData, error } = await supabase
        .from('interviews')
        .select('job_description, resume_text, job_role')
        .eq('id', interviewId)
        .single();
        
      if (error) {
        console.error('Error fetching interview data:', error);
      } else {
        context = {
          jobDescription: interviewData.job_description,
          resumeText: interviewData.resume_text,
          job_role: interviewData.job_role,
          //companyName: interviewData.company_name
        };
      }
    }
    
    const response = await startInterview(context);
    
    return NextResponse.json({
      text: response
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    );
  }
}