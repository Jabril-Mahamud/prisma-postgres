"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GroupCard from "@/components/GroupCard";
import LanguageSelector from "@/components/LanguageSelector";
import PendingActions from "@/components/PendingActions";

// Define proper type for groups
interface Group {
  id: string;
  name: string;
  description?: string;
  contributionAmount: number;
  frequency: string;
  currentCycle: number;
  _count: {
    members: number;
  };
}

export default function AyuutoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]); // Properly type the groups array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Allow string or null

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    async function fetchGroups() {
      try {
        const response = await fetch("/api/ayuuto/groups");
        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }
        const data = await response.json();
        setGroups(data);
      } catch (err) {
        setError("Could not load your groups. Please try again later."); // Now properly typed
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchGroups();
    }
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Ayuuto Dashboard</h1>
        <LanguageSelector />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">My Ayuuto Groups</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600 mb-4">You are not part of any Ayuuto groups yet.</p>
            <Link 
              href="/ayuuto/groups/new" 
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Create New Group
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
            <Link href="/ayuuto/groups/new" className="block">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[200px] flex flex-col items-center justify-center p-6 hover:bg-gray-100 transition">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Create New Group</h3>
              </div>
            </Link>
          </div>
        )}
      </div>

      <PendingActions />
    </div>
  );
}