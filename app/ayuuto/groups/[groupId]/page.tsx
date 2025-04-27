// app/ayuuto/groups/[groupId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MembersList from "../../../../components/MembersList";
import CycleTracker from "../../../../components/CycleTracker";
import ContributionForm from "../../../../components/ContributionForm";


interface Cycle {
    id: string;
    cycleNumber: number;
    startDate: string;
    endDate: string;
    status: string;
    recipient: {
      user: {
        name: string;
      };
    };
  }
  
  interface Member {
    id: string;
    user: {
      id: string;
      name?: string;
      email: string;
    };
    role: string;
    cyclePosition: number;
  }
  
  interface Group {
    id: string;
    name: string;
    description?: string;
    contributionAmount: number;
    frequency: string;
    currentCycle: number;
    totalMembers: number;
    members: Member[];
    cycles?: Cycle[];
    admin: {
      id: string;
    };
  }

  export default function GroupDetail({ params }: { params: { groupId: string } }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(null); // Properly typed
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    
    async function fetchGroupDetails() {
      try {
        const response = await fetch(`/api/ayuuto/groups/${params.groupId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch group details");
        }
        const data = await response.json();
        setGroup(data);
      } catch (err) {
        setError("Could not load group details. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (session) {
      fetchGroupDetails();
    }
  }, [params.groupId, session, status, router]);
  
  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link href="/ayuuto/dashboard" className="text-blue-500 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }
  
  if (!group) {
    return null;
  }
  
  const isAdmin = group.admin.id === session?.user.id;
  const currentMember = group?.members.find((m) => m.user.id === session?.user?.id);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/ayuuto/dashboard" className="text-blue-500 hover:underline block mb-4">
        ← Back to Dashboard
      </Link>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
              {group.description && <p className="text-blue-100">{group.description}</p>}
            </div>
            {isAdmin && (
              <Link 
                href={`/ayuuto/groups/${params.groupId}/settings`}
                className="bg-white text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
              >
                Manage Group
              </Link>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex border-b">
            <button
              className={`py-2 px-4 ${
                activeTab === "overview" 
                  ? "border-b-2 border-blue-500 text-blue-500" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === "members" 
                  ? "border-b-2 border-blue-500 text-blue-500" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("members")}
            >
              Members
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === "contribute" 
                  ? "border-b-2 border-blue-500 text-blue-500" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("contribute")}
            >
              Contribute
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === "messages" 
                  ? "border-b-2 border-blue-500 text-blue-500" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("messages")}
            >
              Messages
            </button>
          </div>
          
          <div className="py-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm text-gray-500 mb-1">Contribution</h3>
                    <p className="text-2xl font-semibold">${group.contributionAmount}</p>
                    <p className="text-gray-500 text-sm">{group.frequency}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm text-gray-500 mb-1">Members</h3>
                    <p className="text-2xl font-semibold">{group.members.length}</p>
                    <p className="text-gray-500 text-sm">of {group.totalMembers}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm text-gray-500 mb-1">Current Cycle</h3>
                    <p className="text-2xl font-semibold">{group.currentCycle - 1}</p>
                    <p className="text-gray-500 text-sm">of {group.totalMembers}</p>
                  </div>
                </div>
                
                {group.cycles && group.cycles.length > 0 && (
                  <CycleTracker cycle={group.cycles[0]} members={group.members} />
                )}
                
                {currentMember && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Your Position</h3>
                    <p className="text-blue-700">
                      You are member #{currentMember.cyclePosition} in the rotation. 
                      {currentMember.cyclePosition === 1 ? (
                        " You are first to receive funds."
                      ) : (
                        ` You will receive funds in cycle ${currentMember.cyclePosition}.`
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "members" && (
              <MembersList 
                groupId={params.groupId} 
                members={group.members} 
                isAdmin={isAdmin} 
              />
            )}
            
            {activeTab === "contribute" && (
              <ContributionForm 
                groupId={params.groupId} 
                cycleId={group.cycles?.[0]?.id} 
                contributionAmount={group.contributionAmount}
              />
            )}
            
            {activeTab === "messages" && (
              <div className="text-center py-10">
                <p className="text-gray-500">Message functionality will be implemented here</p>
                {/* This would be implemented with a real messaging component */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}