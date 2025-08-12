"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

type Props = {
    interviewId: string;
    existingResumeText?: string | null;
    existingFileUrl?: string | null;
};

export default function ResumeUpload({ interviewId, existingResumeText, existingFileUrl }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [parsedText, setParsedText] = useState<string | null>(existingResumeText ?? null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const f = e.target.files?.[0] ?? null;
        setFile(f);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Please pick a resume file (PDF)");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const fd = new FormData();
            fd.append("resume", file);

            console.log(interviewId);
            const res = await fetch(`/api/interview/${interviewId}/resume`, {
                method: "POST",
                body: fd,
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json?.error ?? "Upload failed");
                setUploading(false);
                return;
            }

            setParsedText(json.parsedText);
            // refresh server data or navigate as necessary
            router.refresh();
        } catch (err: any) {
            console.error(err);
            setError(err?.message ?? "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleUpload} encType="multipart/form-data" className="flex flex-col gap-3">
                <label className="text-sm font-medium">Upload Resume (PDF or DOCX)</label>
                <Input type="file" name="resume" accept=".pdf, .doc, .docx, application/pdf" onChange={handleFileChange} />
                <div className="flex gap-2">
                    <Button type="submit" disabled={uploading || !file}>{uploading ? 'Uploading…' : 'Upload & Parse'}</Button>
                </div>
            </form>

            {error && <div className="text-red-600">{error}</div>}

            {parsedText ? (
                <div className="rounded border p-4 bg-white">
                    <h4 className="font-medium mb-2">Parsed resume preview</h4>
                    <div className="text-sm max-h-40 overflow-auto whitespace-pre-wrap">{parsedText.slice(0, 5000)}</div>
                    <div className="mt-2 text-xs text-gray-500">Showing a snippet — full parsed text saved in DB.</div>
                    {existingFileUrl && (
                        <div className="mt-2">
                            <a href={existingFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View uploaded PDF</a>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-sm text-gray-600">No resume uploaded yet.</div>
            )}
        </div>
    );
}


