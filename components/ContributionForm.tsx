// app/ayuuto/components/ContributionForm.tsx
"use client";

import { useState } from "react";

interface ContributionFormProps {
  groupId: string;
  cycleId?: string; // Make cycleId optional
  contributionAmount: number;
}

export default function ContributionForm({ groupId, cycleId, contributionAmount }: ContributionFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If cycleId is undefined, show error message
    if (!cycleId) {
      setError("No active cycle found. Please contact the group administrator.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch(`/api/ayuuto/groups/${groupId}/contributions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: contributionAmount,
          cycleId,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to record contribution");
      }
      
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Record Contribution</h2>
      
      {!cycleId && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          No active cycle available. Please contact the group administrator.
        </div>
      )}
      
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Contribution recorded successfully! It will be verified soon.
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Contribution Amount
              </label>
              <div className="text-3xl font-bold text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                ${contributionAmount.toFixed(2)}
              </div>
            </div>
            
            <div className="mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-2">How verification works</h3>
                <p className="text-blue-700 text-sm">
                  After you record your contribution, at least 2 other members need to verify it. 
                  You can provide proof of payment or arrange for in-person verification.
                </p>
              </div>
            </div>
            
            <div className="flex justify-between pt-2">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
              >
                I&apos;ve already contributed
              </button>
              
              <button
                type="submit"
                disabled={loading || !cycleId}
                className={`bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  (loading || !cycleId) ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Recording...
                  </span>
                ) : (
                  "Record My Contribution"
                )}
              </button>
            </div>
          </form>
        </>
      )}
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Previous Contributions</h3>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-500">Previous contributions will be shown here</p>
        </div>
      </div>
    </div>
  );
}