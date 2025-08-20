import { InterviewAvatar } from "@/components/InterviewAvatar";

export default function start() {
    // TODO: Add Clerk auth check here before rendering form
    // If not signed in -> redirect("/sign-in");
  
    return (
      <div className="py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Start Interview</h1>
        <InterviewAvatar/>
      </div>
    );
  }