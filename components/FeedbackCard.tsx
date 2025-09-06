"use client"

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type FeedbackProps = {
  interviewId?: string;
}

const FeedbackCard = ({ interviewId }: FeedbackProps) => {
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);

  const generateInterviewFeedback = async () => {
    if (!interviewId) {
      setError('Interview ID is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/evaluate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch interview evaluation');
      }

      const { text } = await response.json();
      setFeedback(text);
      setHasEvaluated(true);
      
    } catch (error) {
      console.error('Error generating interview feedback:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate feedback when component mounts
  useEffect(() => {
    if (interviewId) {
      generateInterviewFeedback();
    }
  }, [interviewId]);

  const formatFeedback = (feedbackText: string) => {
    // Split by markdown headers and format nicely
    const sections = feedbackText.split(/(?=##\s)/);
    
    return sections.map((section, index) => {
      if (section.trim().startsWith('##')) {
        const [title, ...content] = section.split('\n');
        return (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-1">
              {title.replace('##', '').trim()}
            </h3>
            <div className="text-gray-700 whitespace-pre-wrap">
              {content.join('\n').trim()}
            </div>
          </div>
        );
      }
      return (
        <div key={index} className="text-gray-700 whitespace-pre-wrap mb-4">
          {section.trim()}
        </div>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Interview Evaluation
              </CardTitle>
              <CardDescription>
                AI-powered assessment based on interview transcript and candidate background
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Analyzing interview transcript...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
              </div>
            </div>
          )}

          {/* Feedback Content */}
          {!loading && feedback && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Interview Assessment Complete</h4>
                <p className="text-blue-800 text-sm">
                  The evaluation below is based on the candidate's interview performance, 
                  resume, and job requirements.
                </p>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                {formatFeedback(feedback)}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !feedback && !error && (
            <div className="text-center p-8 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-2">No evaluation generated yet</p>
              <p className="text-sm">
                {interviewId 
                  ? "Click 'Generate Feedback' to start the evaluation process" 
                  : "Interview ID is required to generate feedback"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackCard;