// app/api/interviews/[id]/save-conversation/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface Message {
    role: 'user' | 'model';
    parts: string;
}

interface SaveConversationRequest {
    conversationHistory: Message[];
    completedAt: string;
    avatarName?: string;
    totalMessages: number;
}

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: interviewId } = await context.params;
        const {
            conversationHistory,
            completedAt,
            avatarName,
            totalMessages
        }: SaveConversationRequest = await req.json();

        // Validate required fields
        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return NextResponse.json(
                { error: 'Missing required field: conversationHistory' },
                { status: 400 }
            );
        }

        const supabase = createSupabaseClient();

        // Update the interview record with conversation history and completion info
        const { data: updated, error: updateError } = await supabase
            .from('interviews')
            .update({
                interview_chat_history: JSON.stringify(conversationHistory),
                completed_at: completedAt,
                interview_status: 'completed',
                // Optional: you could also update duration if you track start time
                // duration: startTime ? Math.floor((new Date(completedAt).getTime() - new Date(startTime).getTime()) / 1000) : null
            })
            .eq('id', interviewId)
            .select()
            .single();

        if (updateError) {
            console.error('Database update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to save conversation', details: updateError.message },
                { status: 500 }
            );
        }

        console.log('Conversation saved successfully for interview:', interviewId);
        return NextResponse.json({
            success: true,
            message: 'Conversation saved successfully',
            interview: updated,
            totalMessages
        });

    } catch (error: unknown) {
        console.error('Error saving conversation:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}