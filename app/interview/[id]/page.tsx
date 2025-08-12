// app/interview/[id]/page.tsx
import { getInterview } from "@/lib/actions/interview.actions";
import ResumeUpload from "@/components/ResumeUpload";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> }; // params is now async

export default async function InterviewPage({ params }: Props) {
    const { id } = await params; // ✅ Await params
    const interview = await getInterview(id);

    if (!interview) {
        return (
            <main className="p-8">
                <h1 className="text-xl font-semibold">Interview not found</h1>
            </main>
        );
    }

    return (
        <main className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">{interview.title}</h1>
                <p className="text-sm text-gray-600 mt-2">{interview.role}</p>
            </div>

            <section className="mb-6">
                <h3 className="font-medium mb-2">Job Description</h3>
                <div className="p-4 rounded border bg-white whitespace-pre-wrap">
                    {interview.job_description ?? interview.jobDescription}
                </div>
            </section>

            <section className="mb-6">
                <h3 className="font-medium mb-2">Resume</h3>
                <ResumeUpload
                    interviewId={id}
                    existingResumeText={interview.resume_text}
                    existingFileUrl={interview.resume_file_url}
                />
            </section>

            <section className="mt-8">
                {/* No onClick in server component — navigation is handled by Link */}
                <Link
                    href={`/interview/${id}/start`}
                    className="px-4 py-2 bg-blue-600 text-white rounded inline-block"
                >
                    Start Interview
                </Link>
                <div className="text-sm text-gray-500 mt-2">
                    Upload a resume to enable personalized questions. After parsing, press Start Interview to begin the avatar session.
                </div>
            </section>
        </main>
    );
}
