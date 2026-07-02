import { useState } from 'react';
import {
  LayoutDashboard, CheckSquare, MessageSquare, CalendarDays,
  MoreHorizontal, Users, CheckCircle, SkipForward, Image, Zap, X,
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

  const NAV_HEIGHT = 68;

  return (
    <>
      {/* More drawer overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-200 ${showMore ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onClick={() => setShowMore(false)}
      >
        {/* Backdrop */}
        <div className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${showMore ? 'opacity-100' : 'opacity-0'}`} />

        {/* Drawer panel */}
        <div
          className={`absolute left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${showMore ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ bottom: NAV_HEIGHT }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle + header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
            <span className="text-sm font-semibold text-gray-700 mt-2">More</span>
            <button onClick={() => setShowMore(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mt-2">
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 px-4 pb-5 pt-1">
            {MORE.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = counts?.[tab.id];
              return (
                <button key={tab.id} onClick={() => { onTabChange(tab.id); setShowMore(false); }}
                  className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl text-xs font-medium transition-all active:scale-95 ${
                    isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}>
                  <div className="relative">
                    <Icon size={22} />
                    {count > 0 && (
                      <span className={`absolute -top-1.5 -right-2.5 text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none font-bold ${isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>{count}</span>
                    )}
                  </div>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: NAV_HEIGHT + 'px' }}
      >
        {PRIMARY.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id];
          return (
            <button key={tab.id} onClick={() => { onTabChange(tab.id); setShowMore(false); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-90 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}>
              <div className="relative">
                <div className={`w-12 h-8 flex items-center justify-center rounded-2xl transition-all duration-200 ${isActive ? 'bg-blue-100' : ''}`}>
                  <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                {count > 0 && (
                  <span className="absolute -top-1 -right-0.5 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none font-bold">{count}</span>
                )}
              </div>
              {tab.label}
            </button>
          );
        })}
        <button onClick={() => setShowMore(v => !v)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-90 ${
            showMore || isMoreActive ? 'text-blue-600' : 'text-gray-400'
          }`}>
          <div className={`w-12 h-8 flex items-center justify-center rounded-2xl transition-all duration-200 ${showMore || isMoreActive ? 'bg-blue-100' : ''}`}>
            <MoreHorizontal size={21} strokeWidth={showMore || isMoreActive ? 2.5 : 1.8} />
          </div>
          More
        </button>
      </nav>
    </>
  );
}
