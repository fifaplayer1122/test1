import {
  LayoutDashboard, CheckSquare, CheckCircle, SkipForward,
  Image, Users, CalendarDays, MessageSquare, LogOut, Zap,
} from 'lucide-react';
import { logout, getAccount, CLIENT_ID } from '../lib/auth';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',          icon: LayoutDashboard },
  { section: 'Tasks' },
  { id: 'active',    label: 'Active',              icon: CheckSquare     },
  { id: 'done',      label: 'Done',                icon: CheckCircle     },
  { id: 'skipped',   label: 'Skipped',             icon: SkipForward     },
  { section: 'Team' },
  { id: 'updates',   label: 'Team Updates',        icon: MessageSquare   },
  { id: 'priorities',label: 'Priorities',          icon: Zap             },
  { id: 'weekend',   label: 'Weekend Availability',icon: CalendarDays    },
  { id: 'workforce', label: 'Workforce',           icon: Users           },
  { id: 'photos',    label: 'Photos',              icon: Image           },
];


export default function Sidebar({ activeTab, onTabChange, counts }) {
  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  const account = authEnabled ? getAccount() : null;
  const displayName = account?.name || 'Ravi Shankar';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 min-h-screen flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-7 border-b border-gray-100">
        <img src="/logo.svg" alt="SmartDocs" className="h-24 w-auto" />
        <p className="text-xs text-gray-400 mt-2 font-medium tracking-wide">Command Center</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {NAV.map((item, i) => {
          if (item.section) {
            return <p key={i} className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-5 pb-1.5">{item.section}</p>;
          }
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const count = counts?.[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span className="flex-1 text-left leading-snug">{item.label}</span>
              {count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{displayName}</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
          {account && (
            <button onClick={logout} title="Sign out" className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
