import { useState } from 'react';
import {
  LayoutDashboard, CheckSquare, MessageSquare, CalendarDays,
  MoreHorizontal, Users, CheckCircle, SkipForward, Image, Zap,
} from 'lucide-react';

const PRIMARY = [
  { id: 'dashboard',  label: 'Home',     icon: LayoutDashboard },
  { id: 'active',     label: 'Tasks',    icon: CheckSquare     },
  { id: 'updates',    label: 'Updates',  icon: MessageSquare   },
  { id: 'weekend',    label: 'Weekend',  icon: CalendarDays    },
];

const MORE = [
  { id: 'priorities', label: 'Priorities', icon: Zap         },
  { id: 'done',       label: 'Done',       icon: CheckCircle  },
  { id: 'skipped',    label: 'Skipped',    icon: SkipForward  },
  { id: 'workforce',  label: 'Workforce',  icon: Users        },
  { id: 'photos',     label: 'Photos',     icon: Image        },
];

export default function MobileNav({ activeTab, onTabChange, counts }) {
  const [showMore, setShowMore] = useState(false);
  const isMoreActive = MORE.some(t => t.id === activeTab);

  return (
    <>
      {showMore && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-200 rounded-t-2xl p-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-4 gap-2">
              {MORE.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = counts?.[tab.id];
                return (
                  <button key={tab.id} onClick={() => { onTabChange(tab.id); setShowMore(false); }}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                    }`}>
                    <div className="relative">
                      <Icon size={20} />
                      {count > 0 && <span className="absolute -top-1 -right-2 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none font-bold">{count}</span>}
                    </div>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex">
        {PRIMARY.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id];
          return (
            <button key={tab.id} onClick={() => { onTabChange(tab.id); setShowMore(false); }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors relative ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}>
              <div className="relative">
                <Icon size={20} />
                {count > 0 && <span className="absolute -top-1 -right-2 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none font-bold">{count}</span>}
              </div>
              {tab.label}
              {isActive && <div className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />}
            </button>
          );
        })}
        <button onClick={() => setShowMore(v => !v)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
            isMoreActive ? 'text-blue-600' : 'text-gray-400'
          }`}>
          <MoreHorizontal size={20} />
          More
        </button>
      </nav>
    </>
  );
}
