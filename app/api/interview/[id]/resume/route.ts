// app/api/interviews/[id]/resume/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import PDFParser from 'pdf2json';

export const runtime = 'nodejs';

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> } // 👈 Updated type
) {
    try {
        const { id: interviewId } = await context.params; // 👈 Added await
        const formData = await req.formData();
        const file = formData.get('resume') as File | null;

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json({ error: 'Only PDF resumes are accepted' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // --- PDF Parsing Logic with pdf2json ---
        let parsedText = '';
        try {
            const pdfParser = new PDFParser();

            const parsePromise = new Promise<string>((resolve, reject) => {
                pdfParser.on("pdfParser_dataError", (errData) => {
                    console.error("PDF parsing error with pdf2json:", errData.parserError);
                    reject(errData.parserError || new Error('PDF parsing failed'));
                });

                pdfParser.on("pdfParser_dataReady", (pdfData) => {
                    const pages = pdfData.Pages.map((page: any) =>
                        page.Texts.map((text: any) =>
                            decodeURIComponent(text.R[0].T)
                        ).join(' ')
                    );
                    resolve(pages.join('\n'));
                });

                pdfParser.parseBuffer(buffer);
            });

            parsedText = await parsePromise;
            console.log('PDF extracted successfully with pdf2json, text length:', parsedText.length);

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("PDF parsing failed with pdf2json:", error.message);
            } else {
                console.error("An unknown error occurred during PDF parsing.");
            }
            parsedText = 'PDF uploaded successfully but text parsing failed';
        }
        // --- End of PDF Parsing Logic ---

        const supabase = createSupabaseClient();

        const filename = `${Date.now()}-${file.name}`.replace(/\s+/g, '_');
        const path = `${interviewId}/${filename}`;

        const { data: uploadedFile, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(path, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error', uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('resumes')
            .createSignedUrl(path, 60 * 60 * 24 * 7);

        if (signedUrlError || !signedUrlData?.signedUrl) {
            console.error('Failed to create signed URL:', signedUrlError);
            return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
        }

        const signedUrl = signedUrlData.signedUrl;

        if (parsedText.length === 0) {
            parsedText = 'PDF uploaded successfully but no text content was extractable';
        }

        // 👈 Updated column names - check your actual database schema
        const { data: updated, error: updateError } = await supabase
            .from('interviews')
            .update({
                resume_file_url: signedUrl,        // 👈 Changed from resume_file_url
                resume_text: parsedText,
            })
            .eq('id', interviewId)
            .select()
            .single();

        if (updateError) {
            console.error('DB update error', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, parsedText, interview: updated });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
    }
}