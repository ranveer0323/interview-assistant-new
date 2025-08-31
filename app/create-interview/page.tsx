import CreateInterviewForm from "@/components/CreateInterviewForm";

export default function CreateInterviewPage() {
  // TODO: Add Clerk auth check here before rendering form
  // If not signed in -> redirect("/sign-in");

  return (
    <div className="py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Set Up Your Interview</h1>
      <CreateInterviewForm />
    </div>
  );
}