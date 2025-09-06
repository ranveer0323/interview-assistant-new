import { interviewFeedback, startInterview } from '@/lib/gemini';
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
        .select('job_description, resume_text, job_role, interview_chat_history')
        .eq('id', interviewId)
        .single();
        
      if (error) {
        console.error('Error fetching interview data:', error);
      } else {
        context = {
          jobDescription: interviewData.job_description,
          resumeText: interviewData.resume_text,
          job_role: interviewData.job_role,
          chatHistory: interviewData.interview_chat_history
          //companyName: interviewData.company_name
        };
      }
    }
    
    const response = await interviewFeedback(context);

    // Update the interview record with the feedback
    if (interviewId) {
      const { error: updateError } = await supabase
        .from('interviews')
        .update({ interview_feedback: response })
        .eq('id', interviewId);
      
      if (updateError) {
        console.error('Error updating interview feedback:', updateError);
        // Don't fail the request, just log the error
      }
    }
    
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