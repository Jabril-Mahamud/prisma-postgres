// app/ayuuto/components/CycleTracker.tsx
interface Member {
  id: string;
  user: {
    id: string;
    name?: string;
  };
  cyclePosition: number;
  role: string;
}

interface CycleProps {
  cycle: {
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
  };
  members: Member[]; // Keep this for future use
}

export default function CycleTracker({ cycle /* members */ }: CycleProps) {
  // We're not using members right now, but may need it for future enhancements
  // So we'll comment it out in the props destructuring to avoid the unused variable warning

  const startDate = new Date(cycle.startDate);
  const endDate = new Date(cycle.endDate);
  const today = new Date();

  // Calculate progress percentage
  const totalDays = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.floor((daysElapsed / totalDays) * 100))
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Current Cycle</h3>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            cycle.status === "active"
              ? "bg-green-100 text-green-800"
              : cycle.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {cycle.status}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-gray-600 mb-1">Current recipient:</p>
        <p className="font-medium text-gray-800">
          {cycle.recipient.user.name || "Unknown"}
        </p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>{startDate.toLocaleDateString()}</span>
          <span>{endDate.toLocaleDateString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Cycle Progress</p>
          <p className="font-medium text-gray-800">{progressPercent}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Days Remaining</p>
          <p className="font-medium text-gray-800">
            {Math.max(0, totalDays - daysElapsed)} days
          </p>
        </div>
      </div>
    </div>
  );
}
