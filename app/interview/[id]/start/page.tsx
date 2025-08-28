"use client";

import { InterviewAvatar } from "@/components/InterviewAvatar";
import { useParams } from "next/navigation";

export default function start() {
  // TODO: Add Clerk auth check here before rendering form
  // If not signed in -> redirect("/sign-in");

  const params = useParams();
  const interviewId = Array.isArray(params.id) ? params.id[0] : params.id;

  console.log("Interview Id: ", interviewId)

  return (
    <div className="py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Start Interview</h1>
      <InterviewAvatar interviewId={interviewId || undefined} />
    </div>
  );
}