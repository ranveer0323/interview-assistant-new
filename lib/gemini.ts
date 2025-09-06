import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});

interface InterviewContext {
  jobDescription?: string;
  resumeText?: string;
  job_role?: string;
  companyName?: string;
}

interface InterviewCallContext {
  jobDescription?: string;
  resumeText?: string;
  job_role?: string;
  companyName?: string;
  chatHistory?: string;
}


function generateSystemPrompt(context: InterviewContext): string {
  const { jobDescription, resumeText, job_role = "Software Engineer Level 1", companyName } = context;
  
  let systemPrompt = `You are a senior software engineer conducting a technical interview for a ${job_role} position`;
  
  if (companyName) {
    systemPrompt += ` at ${companyName}`;
  }
  
  systemPrompt += `.

Your role:
- Ask relevant technical questions about programming fundamentals, data structures, algorithms, and problem-solving
- Evaluate the candidate's responses and ask follow-up questions
- Be professional but friendly
- Progress from basic to more complex topics based on their answers
- Keep responses concise and conversational (2-3 sentences max)
- If this is the start of the interview, begin with a welcoming introduction and an easy warm-up question

Guidelines:
- Ask one question at a time
- Wait for their response before moving to the next topic
- Provide brief feedback on their answers when appropriate
- Adapt difficulty based on their demonstrated knowledge level`;

  if (jobDescription) {
    systemPrompt += `

JOB REQUIREMENTS:
${jobDescription}

Tailor your questions to assess the candidate's fit for these specific requirements. Focus on the technologies, skills, and experience mentioned in the job description.`;
  }

  if (resumeText) {
    systemPrompt += `

CANDIDATE'S BACKGROUND:
${resumeText}

Use this information to:
- Ask about specific projects or technologies mentioned in their resume
- Dive deeper into their claimed experience and skills
- Ask follow-up questions about their work history
- Assess if their background aligns with the job requirements`;
  }

  if (jobDescription && resumeText) {
    systemPrompt += `

INTERVIEW STRATEGY:
- Start with questions about their background and projects from their resume
- Progress to technical questions that align with the job requirements
- Look for gaps between their resume and the job requirements
- Ask scenario-based questions related to the role they're applying for`;
  }

  return systemPrompt;
}

export async function generateResponse(
  message: string, 
  history: Array<{role: string, parts: string}>,
  context?: InterviewContext
) {
  try {
    // Convert history to the format expected by the new API
    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.parts }]
    }));

    // Create a chat with history and enhanced system instruction
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: chatHistory,
      config: {
        systemInstruction: generateSystemPrompt(context || {})
      }
    });

    const response = await chat.sendMessage({
      message: message
    });

    return response.text;
   
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}

// Enhanced function to start the interview with context
export async function startInterview(context?: InterviewContext) {
  try {
    const { job_role = "Software Engineer Level 1", companyName } = context || {};
    
    let startMessage = 'Start the interview now. Introduce yourself and ask the first question.';
    
    if (context?.resumeText) {
      startMessage += ' Reference something specific from their resume to make them feel comfortable and show you\'ve reviewed their background. Briefly mention the job role and start the interview.';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: startMessage,
      config: {
        systemInstruction: generateSystemPrompt(context || {})
      }
    });

    return response.text;
  } catch (error) {
    console.error('Error starting interview:', error);
    throw error;
  }
}

export async function interviewFeedback(context?: InterviewCallContext) {
  try {

    const { job_role = "Software Engineer Level 1", companyName = "Acme Inc", jobDescription, resumeText, chatHistory } = context || {};

    const evaluationPrompt = `
      You are a senior HR executive responsible for evaluating candidate interviews and guide them on improving. 
  
      Based on the provided interview call transcript for the Job: ${job_role} at the Company: ${companyName}.
      
      The job description is:
      ${jobDescription}
      
      Here's is the text from candidate's resume:
      ${resumeText}
      
      Here is the interview transcript:
      ${chatHistory}
      
      Based on these details conduct a thorough evaluation of the candidate across several parameters and give your final evaluation and actionables for the candidate to improve in well formatted text.`

    
    
    let contents = 'Evaluate the candidate interview call';
    
    

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: evaluationPrompt
      }
    });

    return response.text;
  } catch (error) {
    console.error('Error starting interview:', error);
    throw error;
  }
}

// Helper function to extract key information from job description
// export function parseJobDescription(jobDescription: string) {
//   // This can be enhanced with more sophisticated parsing
//   const technologies = [];
//   const skills = [];
//   const experience = [];
  
//   // Simple keyword extraction (can be improved with NLP)
//   const techKeywords = ['javascript', 'typescript', 'react', 'node.js', 'python', 'java', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes'];
//   const skillKeywords = ['problem-solving', 'communication', 'teamwork', 'leadership', 'agile', 'scrum'];
  
//   const lowerJobDesc = jobDescription.toLowerCase();
  
//   techKeywords.forEach(tech => {
//     if (lowerJobDesc.includes(tech)) {
//       technologies.push(tech);
//     }
//   });
  
//   skillKeywords.forEach(skill => {
//     if (lowerJobDesc.includes(skill)) {
//       skills.push(skill);
//     }
//   });
  
//   return { technologies, skills, experience };
// }

// // Helper function to extract key information from resume
// export function parseResume(resumeText: string) {
//   // This can be enhanced with more sophisticated parsing
//   const projects = [];
//   const skills = [];
//   const experience = [];
  
//   // Simple extraction logic (can be improved with NLP)
//   const lines = resumeText.split('\n');
  
//   // Extract sections based on common resume patterns
//   let currentSection = '';
  
//   lines.forEach(line => {
//     const lowerLine = line.toLowerCase().trim();
    
//     if (lowerLine.includes('project') || lowerLine.includes('work experience') || lowerLine.includes('skills')) {
//       currentSection = lowerLine;
//     }
    
//     // Extract relevant information based on current section
//     if (currentSection.includes('project') && line.trim().length > 0) {
//       projects.push(line.trim());
//     } else if (currentSection.includes('skill') && line.trim().length > 0) {
//       skills.push(line.trim());
//     } else if (currentSection.includes('experience') && line.trim().length > 0) {
//       experience.push(line.trim());
//     }
//   });
  
//   return { projects, skills, experience };
// }