import { LayoutDashboard, CheckSquare, CheckCircle, SkipForward, Image, Users } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'active',    label: 'Active',    icon: CheckSquare     },
  { id: 'done',      label: 'Done',      icon: CheckCircle     },
  { id: 'skipped',   label: 'Skipped',   icon: SkipForward     },
  { id: 'photos',    label: 'Photos',    icon: Image           },
  { id: 'workforce', label: 'Workforce', icon: Users           },
];

export default function TabBar({ activeTab, onTabChange, counts }) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto flex overflow-x-auto scrollbar-hide">
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          const count = counts[tab.id];
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[72px] flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm whitespace-nowrap border-b-2 transition-colors relative ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{tab.label}</span>
              {count != null && count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
