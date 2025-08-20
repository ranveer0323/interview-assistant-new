"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import StreamingAvatar, { AvatarQuality, StreamingEvents } from '@heygen/streaming-avatar';

type InterviewAvatarProps = {
  avatarName?: string;
  onReady?: () => void;
  onDisconnected?: () => void;
  className?: string;
};


async function fetchAccessToken() {
  try {
    const response = await fetch("/api/get-access-token", {
      method: "POST",
    });
    const token = await response.text();

    console.log("Access Token:", token); // Log the token to verify

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
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const sessionDataRef = useRef<any>(null);

  // Initialize the avatar session
  const initializeAvatar = async () => {
    if (isConnected || !videoRef.current) return;

    setIsLoading(true);
    try {
      const token = await fetchAccessToken();
      
      avatarRef.current = new StreamingAvatar({ token });
      
      avatarRef.current.on(StreamingEvents.STREAM_READY, (event: any) => {
        if (event.detail && videoRef.current) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
            setIsConnected(true);
            onReady?.();
          };
        }
      });

      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setIsConnected(false);
        onDisconnected?.();
      });

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

  // Function to make the avatar speak
  const handleSpeak = async () => {
    if (!avatarRef.current || !message.trim()) return;
    
    try {
      await avatarRef.current.speak({
        text: message,
      });
      setMessage('');
    } catch (error) {
      console.error('Error making avatar speak:', error);
    }
  };

  // Handle key press for message input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSpeak();
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
      </div>

      <div className="w-full max-w-2xl flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={!isConnected}
            className="flex-1"
          />
          <Button onClick={handleSpeak} disabled={!isConnected || !message.trim()}>
            Send
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
    </div>
  );
}


