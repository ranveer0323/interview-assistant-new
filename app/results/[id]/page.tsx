import FeedbackCard from '@/components/FeedbackCard';
import { ResultsActions } from '@/components/ResultsActions';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// This is how you get the dynamic route parameter in Next.js 15+ App Router
interface ResultsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Results
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your AI-powered interview evaluation is ready. Review the detailed 
            assessment below to understand your performance and areas for improvement.
          </p>
        </div>

        {/* Feedback Card with Suspense for loading */}
        <Suspense 
          fallback={
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading your interview results...</p>
              </div>
            </div>
          }
        >
          <FeedbackCard interviewId={id} />
        </Suspense>

        {/* Optional: Additional actions */}
        <ResultsActions />
      </div>
    </div>
  );
}