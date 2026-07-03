import { useState } from 'react';
import {
  LayoutDashboard, CheckSquare, CheckCircle, SkipForward,
  MessageSquare, CalendarDays, Zap, Users, Image,
  ChevronDown, X, Menu, ShieldCheck,
} from 'lucide-react';
import AppIcon from './AppIcon';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    section: 'Tasks',
    children: [
      { id: 'active',   label: 'Active',   icon: CheckSquare  },
      { id: 'done',     label: 'Done',     icon: CheckCircle  },
      { id: 'skipped',  label: 'Skipped',  icon: SkipForward  },
    ],
  },
  {
    section: 'Team',
    children: [
      { id: 'updates',    label: 'Team Updates',         icon: MessageSquare },
      { id: 'priorities', label: 'Priorities',           icon: Zap           },
      { id: 'weekend',    label: 'Weekend Availability', icon: CalendarDays  },
      { id: 'workforce',  label: 'Workforce',            icon: Users         },
      { id: 'photos',     label: 'Photos',               icon: Image         },
      { id: 'roles',      label: 'Members & Roles',      icon: ShieldCheck   },
    ],
  },
];

export default function MobileNav({ activeTab, onTabChange, counts }) {
  const [open, setOpen]       = useState(false);
  const [expanded, setExpanded] = useState({ Tasks: true, Team: true });

  const navigate = (id) => { onTabChange(id); setOpen(false); };
  const toggle   = (section) => setExpanded(e => ({ ...e, [section]: !e[section] }));

  return (
    <>
      {/* Hamburger button — rendered into the header via portal-like prop, but we just export a trigger */}
      <button
        id="mobile-hamburger"
        onClick={() => setOpen(true)}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 active:scale-90 transition-all"
        aria-label="Open menu"
      >
        <Menu size={22} strokeWidth={2} />
      </button>

      {/* Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />

        {/* Slide-in panel from right */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-[80vw] max-w-xs bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <AppIcon size={32} />
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">SmartDocs</p>
                <p className="text-xs text-gray-400 leading-tight">Command Center</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-90 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-3 px-3">
            {NAV.map((item, i) => {
              if (item.id) {
                // Top-level single item
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold mb-1 transition-all active:scale-95 ${
                      isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                  </button>
                );
              }

              // Expandable section
              const isOpen = expanded[item.section];
              const anyChildActive = item.children.some(c => c.id === activeTab);
              return (
                <div key={item.section} className="mb-1">
                  <button
                    onClick={() => toggle(item.section)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                      anyChildActive && !isOpen ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <span className="uppercase tracking-wider text-xs">{item.section}</span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2.5}
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="ml-2 space-y-0.5">
                      {item.children.map(child => {
                        const Icon = child.icon;
                        const isActive = activeTab === child.id;
                        const count = counts?.[child.id];
                        return (
                          <button
                            key={child.id}
                            onClick={() => navigate(child.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                              isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="flex-1 text-left">{child.label}</span>
                            {count > 0 && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
