import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});

export async function generateResponse(
  message: string, 
  history: Array<{role: string, parts: string}>
) {
  try {
    // Convert history to the format expected by the new API
    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.parts }]
    }));

    // Create a chat with history and system instruction
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: chatHistory,
      config: {
        systemInstruction: `You are a senior software engineer conducting a technical interview for a Software Engineer Level 1 (SWE 1) position.

Your role:
- Ask relevant technical questions about programming fundamentals, data structures, algorithms, and problem-solving
- Evaluate the candidate's responses and ask follow-up questions
- Be professional but friendly
- Progress from basic to more complex topics based on their answers
- Focus on full-stack development concepts since that's your specialty
- Keep responses concise and conversational (2-3 sentences max)
- If this is the start of the interview, begin with a welcoming introduction and an easy warm-up question

Guidelines:
- Ask one question at a time
- Wait for their response before moving to the next topic
- Provide brief feedback on their answers when appropriate
- Adapt difficulty based on their demonstrated knowledge level`
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

// Function to start the interview with an opening question
export async function startInterview() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Start the interview now. Introduce yourself and ask the first question.',
      config: {
        systemInstruction: `You are a senior software engineer conducting a technical interview for a Software Engineer Level 1 position. Start the interview with a warm, professional greeting and an easy introductory question to help the candidate feel comfortable. Keep it brief and welcoming.`
      }
    });

    return response.text;
  } catch (error) {
    console.error('Error starting interview:', error);
    throw error;
  }
}