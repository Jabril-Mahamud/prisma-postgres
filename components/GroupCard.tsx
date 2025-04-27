// app/ayuuto/components/GroupCard.tsx
import Link from "next/link";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string;
    contributionAmount: number;
    frequency: string;
    currentCycle: number;
    _count: {
      members: number;
    };
  };
}

export default function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/ayuuto/groups/${group.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold text-gray-800">{group.name}</h3>
            <div className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
              Cycle {group.currentCycle}
            </div>
          </div>
          
          {group.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>
          )}
          
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Members</span>
            <span className="font-medium">{group._count.members}</span>
          </div>
          
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>Contribution</span>
            <span className="font-medium">${group.contributionAmount} {group.frequency}</span>
          </div>
          
          <div className="flex justify-end mt-3">
            <span className="text-blue-500 text-sm">View Details →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}