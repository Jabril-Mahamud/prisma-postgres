// app/ayuuto/components/MembersList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface Member {
  id: string;
  role: string;
  cyclePosition: number;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

interface MembersListProps {
  groupId: string;
  members: Member[];
  isAdmin: boolean;
}

export default function MembersList({ groupId, members, isAdmin }: MembersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredMembers = members.filter(member => 
    member.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sortedMembers = [...filteredMembers].sort((a, b) => a.cyclePosition - b.cyclePosition);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Members</h2>
        
        {isAdmin && (
          <Link
            href={`/ayuuto/groups/${groupId}/invite`}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            Invite Members
          </Link>
        )}
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="bg-gray-50 rounded-lg">
        {sortedMembers.length === 0 ? (
          <p className="text-center py-6 text-gray-500">No members found</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedMembers.map((member) => (
              <li key={member.id} className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                    {member.cyclePosition}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {member.user.name || member.user.email}
                    </h3>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    member.role === "admin" 
                      ? "bg-red-100 text-red-800" 
                      : member.role === "elder"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                  }`}>
                    {member.role}
                  </span>
                  
                  {isAdmin && member.role !== "admin" && (
                    <button className="ml-2 text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}