import { getInterviewsByUser } from "@/lib/actions/interview.actions";
import { getUserId } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    // TODO: Add Clerk auth check here before rendering form
    // If not signed in -> redirect("/sign-in");

    const userId = await getUserId();

    if (!userId) {
      redirect("/sign-in");
    }

    const interviews = await getInterviewsByUser(userId)
    console.log(interviews)
    
    return (
      <div className="py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      </div>
    );
  }