"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gray-50 pt-32">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Mockify</h1>
      <p className="text-gray-600 mb-8 text-center max-w-lg text-xl">
        Practice and prepare for your next job interview with our AI-powered
        interactive avatar.
      </p>

      <Button>
        <Link
          href="/create-interview"
          //className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          Start Now
        </Link>
      </Button>
      
    </main>
  );
}
