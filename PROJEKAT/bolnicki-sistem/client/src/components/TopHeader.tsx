import { Bell, User } from "lucide-react";

interface TopHeaderProps {
  step?: number;
  totalSteps?: number;
}

export default function TopHeader({ step = 1, totalSteps = 5 }: TopHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Left - Empty */}
      <div></div>

      {/* Center - Progress */}
      {step && totalSteps && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-64 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Right - Notifications and Profile */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={24} className="text-gray-700" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Circle */}
        <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold hover:shadow-lg transition-shadow">
          M
        </button>
      </div>
    </div>
  );
}
