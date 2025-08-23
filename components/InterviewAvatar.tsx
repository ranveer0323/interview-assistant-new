"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskMode, TaskType } from '@heygen/streaming-avatar';

type InterviewAvatarProps = {
  avatarName?: string;
  onReady?: () => void;
  onDisconnected?: () => void;
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

    console.log("Access Token:", token);
    return token;
  } catch (error) {
    console.error("Error fetching access token:", error);
    throw error;
  }
}

export function InterviewAvatar({
  avatarName = 'Wayne_20240711',
  onReady,
  onDisconnected,
  className = '',
}: InterviewAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const sessionDataRef = useRef<any>(null);

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

      // Get response from Gemini
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const { text } = await response.json();

      // Add assistant response to history
      const finalHistory = [
        ...updatedHistory,
        { role: 'model' as const, parts: text }
      ];
      setConversationHistory(finalHistory);

      // Send to HeyGen with REPEAT task (fixed property names)
      if (avatarRef.current) {
        await avatarRef.current.speak({
          text: text,
          task_type: TaskType.REPEAT,  // Fixed: was taskType
          taskMode: TaskMode.SYNC  // Added: specify sync mode
        });
      }
    } catch (error) {
      console.error('Error:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  // Start the interview automatically after connecting
  const startInterview = async () => {
    try {
      const response = await fetch('/api/start-interview', {
        method: 'POST',
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
            // Auto-start the interview
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

      // Start the avatar session
      sessionDataRef.current = await avatarRef.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName,
        knowledgeBase: "You are a senior software engineer specialising in fullstack development. You are conducting an interview for the position of SWE 1. Ask relevant interview questions."
      });

    } catch (error) {
      console.error('Failed to initialize avatar:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (avatarRef.current && sessionDataRef.current) {
        avatarRef.current.stopAvatar().catch(console.error);
      }
    };
  }, []);

  // Handle key press for message input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(); // Fixed: was calling handleSpeak
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
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
      </div>

      <div className="w-full max-w-2xl flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
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
        {!isConnected && (
          <Button
            onClick={initializeAvatar}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Connect Avatar'}
          </Button>
        )}
      </div>

      {/* Conversation History Display (Optional) */}
      {conversationHistory.length > 0 && (
        <div className="w-full max-w-2xl bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
          <h3 className="font-semibold mb-2">Conversation History:</h3>
          {conversationHistory.map((msg, index) => (
            <div key={index} className={`mb-2 p-2 rounded ${
              msg.role === 'user' ? 'bg-blue-100 ml-4' : 'bg-green-100 mr-4'
            }`}>
              <strong>{msg.role === 'user' ? 'You: ' : 'Interviewer: '}</strong>
              {msg.parts}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}