"use client";

import { InterviewAvatar } from "@/components/InterviewAvatar";
import { useParams, useRouter } from "next/navigation";

export default function StartPage() {
  // TODO: Add Clerk auth check here before rendering form
  // If not signed in -> redirect("/sign-in");

  const params = useParams();
  const router = useRouter();
  const interviewId = Array.isArray(params.id) ? params.id[0] : params.id;

  console.log("Interview Id: ", interviewId);

  // Function to handle interview completion and navigate to results
  const handleInterviewComplete = () => {
    if (interviewId) {
      // Navigate to results page
      router.push(`/results/${interviewId}`);
    } else {
      console.error("No interview ID found");
    }
  };

  return (
    <div className="py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Start Interview</h1>
      <InterviewAvatar 
        interviewId={interviewId || undefined}
        onInterviewComplete={handleInterviewComplete}
      />
    </div>
  );
}