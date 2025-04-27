// app/ayuuto/components/PendingActions.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PendingAction {
  id: string;
  type: "verification" | "payment" | "invitation";
  groupId: string;
  groupName: string;
  message: string;
  date: string;
}

export default function PendingActions() {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch from an API endpoint
    // This is just mock data for demonstration
    setTimeout(() => {
      setActions([
        {
          id: "1",
          type: "verification",
          groupId: "group1",
          groupName: "Family Savings",
          message: "Verify Farah's contribution of $100",
          date: "2023-05-15",
        },
        {
          id: "2",
          type: "payment",
          groupId: "group2",
          groupName: "Business Group",
          message: "Your contribution of $200 is due",
          date: "2023-05-18",
        },
        {
          id: "3",
          type: "invitation",
          groupId: "group3",
          groupName: "Community Fund",
          message: "Hassan invited you to join this group",
          date: "2023-05-12",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Pending Actions</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Pending Actions</h2>
      {actions.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No pending actions</p>
      ) : (
        <div className="space-y-4">
          {actions.map((action) => (
            <Link 
              key={action.id} 
              href={`/ayuuto/groups/${action.groupId}`}
              className="block"
            >
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition flex justify-between items-center">
                <div>
                  <div className="flex items-center mb-1">
                    <span className={`
                      h-2 w-2 rounded-full mr-2
                      ${action.type === "verification" ? "bg-yellow-500" : 
                        action.type === "payment" ? "bg-red-500" : "bg-green-500"}
                    `}></span>
                    <span className="text-sm text-gray-500">{action.groupName}</span>
                  </div>
                  <p className="text-gray-800">{action.message}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(action.date).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}