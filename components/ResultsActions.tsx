"use client";

import { Button } from "@/components/ui/button";

export function ResultsActions() {
  const handleGoBack = () => {
    window.history.back();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mt-8 text-center space-x-4">
      <Button 
        onClick={handleGoBack}
        variant="outline"
        className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        ← Back to Interview
      </Button>
      <Button 
        onClick={handlePrint}
        className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        Print Results
      </Button>
    </div>
  );
}