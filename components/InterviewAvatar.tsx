"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskMode, TaskType } from '@heygen/streaming-avatar';

type InterviewAvatarProps = {
  avatarName?: string;
  interviewId?: string;
  onReady?: () => void;
  onDisconnected?: () => void;
  onInterviewComplete?: () => void;
  className?: string;
};

interface Message {
  role: 'user' | 'model';
  parts: string;
}

async function fetchAccessToken() {
  try {
    const response = await fetch("/api/get-access-token", {
      method: "POST",
    });
    const token = await response.text();
    return token;
  } catch (error) {
    console.error("Error fetching access token:", error);
    throw error;
  }
}

export function InterviewAvatar({
  avatarName = 'Wayne_20240711',
  interviewId,
  onReady,
  onDisconnected,
  onInterviewComplete,
  className = '',
}: InterviewAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const avatarRef = useRef<StreamingAvatar | null>(null);
  const sessionDataRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // Start voice recording
  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Stop voice recording and process
  const stopRecording = async () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);

      // Process the transcript
      if (transcript.trim()) {
        await processVoiceInput(transcript);
        setTranscript('');
      }
    }
  };

  // Process voice input through Gemini
  const processVoiceInput = async (voiceText: string) => {
    if (!voiceText.trim() || !isConnected || isLoading || isAvatarSpeaking) return;

    setIsLoading(true);

    try {
      // Add user message to history
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user' as const, parts: voiceText }
      ];
      setConversationHistory(updatedHistory);

      // Get response from Gemini with interview context
      console.log('Sending request to /api/gemini with interviewId:', interviewId);
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: voiceText,
          history: updatedHistory,
          interviewId // Include interview ID for context
        })
      });
      console.log('Received response from /api/gemini:', response.status);

      if (!response.ok) throw new Error('Failed to get response');

      const { text } = await response.json();

      // Add assistant response to history
      const finalHistory = [
        ...updatedHistory,
        { role: 'model' as const, parts: text }
      ];
      setConversationHistory(finalHistory);

      // Send to HeyGen with REPEAT task
      if (avatarRef.current) {
        await avatarRef.current.speak({
          text: text,
          task_type: TaskType.REPEAT,
          taskMode: TaskMode.SYNC
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !isConnected || isLoading || isAvatarSpeaking) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);

    try {
      // Add user message to history
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user' as const, parts: userMessage }
      ];
      setConversationHistory(updatedHistory);

      // Get response from Gemini with interview context
      console.log('Sending request to /api/gemini with interviewId:', interviewId);
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: updatedHistory,
          interviewId // Include interview ID for context
        })
      });
      console.log('Received response from /api/gemini:', response.status);

      if (!response.ok) throw new Error('Failed to get response');

      const { text } = await response.json();

      // Add assistant response to history
      const finalHistory = [
        ...updatedHistory,
        { role: 'model' as const, parts: text }
      ];
      setConversationHistory(finalHistory);

      // Send to HeyGen with REPEAT task
      if (avatarRef.current) {
        await avatarRef.current.speak({
          text: text,
          task_type: TaskType.REPEAT,
          taskMode: TaskMode.SYNC
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start the interview automatically after connecting with context
  const startInterview = async () => {
    try {
      const response = await fetch('/api/start-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId // Include interview ID for context
        })
      });

      if (!response.ok) throw new Error('Failed to start interview');

      const { text } = await response.json();

      // Add opening message to history
      setConversationHistory([{ role: 'model', parts: text }]);

      // Make avatar speak the opening
      if (avatarRef.current) {
        await avatarRef.current.speak({
          text: text,
          task_type: TaskType.REPEAT,
          taskMode: TaskMode.SYNC
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  // Initialize the avatar session
  const initializeAvatar = async () => {
    if (isConnected || !videoRef.current) return;

    setIsLoading(true);
    try {
      const token = await fetchAccessToken();

      avatarRef.current = new StreamingAvatar({ token });

      // Stream ready event
      avatarRef.current.on(StreamingEvents.STREAM_READY, async (event: any) => {
        if (event.detail && videoRef.current) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.onloadedmetadata = async () => {
            videoRef.current?.play().catch(console.error);
            setIsConnected(true);
            onReady?.();
            // Auto-start the interview with context
            await startInterview();
          };
        }
      });

      // Stream disconnected event
      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setIsConnected(false);
        onDisconnected?.();
      });

      // Avatar speaking events
      avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        setIsAvatarSpeaking(true);
      });

      avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        setIsAvatarSpeaking(false);
      });

      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('Stream has been disconnected');
        setIsAvatarSpeaking(false); // ensure UI doesn't get stuck in "speaking" state
        // optionally clean up or attempt reconnect
      });

      // Start the avatar session
      sessionDataRef.current = await avatarRef.current.createStartAvatar({
        quality: AvatarQuality.Medium,
        avatarName,
        // Don't use knowledgeBase since we're controlling via Gemini
      });

    } catch (error) {
      console.error('Failed to initialize avatar:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopInterview = async () => {
    setIsSaving(true);

    try {
      // Save conversation to database before stopping (only if we have conversation data)
      if (conversationHistory.length > 0 && interviewId) {
        console.log('Saving conversation to database...');

        const saveResponse = await fetch(`/api/interview/${interviewId}/save-conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationHistory,
            completedAt: new Date().toISOString(),
            avatarName,
            totalMessages: conversationHistory.length
          })
        });

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.error('Failed to save conversation:', saveResponse.status, errorText);
          // You could show a toast notification here
          alert('Warning: Failed to save interview conversation');
        } else {
          console.log('Conversation saved successfully');
        }
      }

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }

      // Stop avatar
      if (avatarRef.current) {
        // Close voice chat if running
        await avatarRef.current.closeVoiceChat().catch(() => { });
        // Stop avatar session
        await avatarRef.current.stopAvatar();
      }

      // Reset all states
      setIsConnected(false);
      setIsAvatarSpeaking(false);
      setTranscript('');
      console.log("Interview stopped successfully.");

      // Navigate to results page after successful cleanup
      if (onInterviewComplete) {
        onInterviewComplete();
      }

    } catch (err) {
      console.error("Error stopping interview:", err);

      // Even if saving fails, we should still try to stop the avatar
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsRecording(false);
        }
        if (avatarRef.current) {
          await avatarRef.current.stopAvatar();
        }
        setIsConnected(false);
        setIsAvatarSpeaking(false);

        if (onInterviewComplete) {
          onInterviewComplete();
        }

      } catch (stopErr) {
        console.error("Error in cleanup:", stopErr);
      }
    } finally {
      setIsSaving(false);
    }
  };


  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (avatarRef.current && sessionDataRef.current) {
        avatarRef.current.stopAvatar().catch(console.error);
      }
    };
  }, []);

  // Handle key press for message input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Interview Info Display */}
      {interviewId && (
        <div className="w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Interview Session:</strong> {interviewId}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            This interview is tailored based on your resume and the job requirements.
          </p>
        </div>
      )}

      <div className="relative w-full max-w-2xl aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 text-white">
            {isLoading ? 'Connecting...' : 'Avatar Disconnected'}
          </div>
        )}
        {isAvatarSpeaking && (
          <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
            Speaking...
          </div>
        )}
        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
            🎤 Listening...
          </div>
        )}
        {isLoading && (
          <div className="absolute bottom-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
            Processing...
          </div>
        )}
      </div>

      {/* Input Mode Toggle */}
      {isConnected && (
        <div className="flex space-x-2">
          <Button
            onClick={() => setInputMode('text')}
            variant={inputMode === 'text' ? 'default' : 'outline'}
            disabled={isLoading}
          >
            Text Mode
          </Button>
          <Button
            onClick={() => setInputMode('voice')}
            variant={inputMode === 'voice' ? 'default' : 'outline'}
            disabled={isLoading || !recognitionRef.current}
          >
            Voice Mode
          </Button>
        </div>
      )}

      <div className="w-full max-w-2xl flex flex-col space-y-2">
        {/* Text Input (only show in text mode) */}
        {inputMode === 'text' && (
          <div className="flex space-x-2">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={!isConnected || isLoading || isAvatarSpeaking}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || !message.trim() || isLoading || isAvatarSpeaking}
            >
              {isLoading ? 'Processing...' : 'Send'}
            </Button>
          </div>
        )}

        {/* Voice Input (only show in voice mode) */}
        {inputMode === 'voice' && (
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isConnected || isLoading || isAvatarSpeaking || !recognitionRef.current}
                className={`flex-1 ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                {isRecording ? '🛑 Stop Recording' : '🎤 Start Recording'}
              </Button>
            </div>
            {transcript && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-600 mb-1">Live Transcript:</p>
                <p className="text-gray-900">{transcript}</p>
              </div>
            )}
          </div>
        )}

        {/* {!isConnected && (
          <Button
            onClick={initializeAvatar}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Start Interview'}
          </Button>
        )} */}
      </div>

      {/* Start / Stop button */}
      <div className="w-full max-w-2xl">
        {!isConnected ? (
          <Button
            onClick={initializeAvatar}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Connecting...' : 'Start Interview'}
          </Button>
        ) : (
          <Button
            onClick={stopInterview}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Stop Interview
          </Button>
        )}
      </div>


      {/* Browser compatibility warning */}
      {inputMode === 'voice' && !recognitionRef.current && (
        <div className="w-full max-w-2xl p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Voice input requires Chrome/Edge browser with Web Speech API support.
          </p>
        </div>
      )}

      {/* Conversation History Display */}
      {conversationHistory.length > 0 && (
        <div className="w-full max-w-2xl bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
          <h3 className="font-semibold mb-2 text-gray-700">Conversation History:</h3>
          <div className="space-y-2">
            {conversationHistory.map((msg, index) => (
              <div key={index} className={`p-3 rounded-lg ${msg.role === 'user'
                ? 'bg-blue-100 ml-4 border-l-4 border-blue-500'
                : 'bg-green-100 mr-4 border-l-4 border-green-500'
                }`}>
                <div className="flex items-start space-x-2">
                  <span className="text-xs font-semibold text-gray-600 mt-1">
                    {msg.role === 'user' ? 'You:' : 'Interviewer:'}
                  </span>
                  <p className="text-sm text-gray-800 flex-1">{msg.parts}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Tips */}
      {isConnected && conversationHistory.length === 1 && (
        <div className="w-full max-w-2xl p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">💡 Interview Tips:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Take your time to think before answering</li>
            <li>• Ask for clarification if you don't understand a question</li>
            <li>• Explain your thought process when solving problems</li>
            <li>• Use specific examples from your experience when possible</li>
          </ul>
        </div>
      )}
    </div>
  );
}