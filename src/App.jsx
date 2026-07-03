import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import AddTaskForm from './components/AddTaskForm';
import TaskTable from './components/TaskTable';
import PhotoGallery from './components/PhotoGallery';
import WorkforceTab from './components/WorkforceTab';
import WeekendAvailability from './components/WeekendAvailability';
import TeamUpdates from './components/TeamUpdates';
import Dashboard from './components/Dashboard';
import TeamRoles from './components/TeamRoles';
import Approvals from './components/Approvals';
import AuthGate from './components/AuthGate';
import Spinner from './components/Spinner';
import AppIcon from './components/AppIcon';
import { getTasks } from './lib/storage';
import { CLIENT_ID, getAccount } from './lib/auth';
import { ADMINS, getIdentity } from './lib/teamStorage';

const queryClient = new QueryClient();

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  active:     'Active Tasks',
  done:       'Completed',
  skipped:    'Skipped',
  photos:     'Photos',
  workforce:  'Team Report',
  weekend:    'Weekend Availability',
  priorities: 'Team Priorities',
  updates:    'Team Updates',
  roles:      'Members & Roles',
  approvals:  'Approval Requests',
};

// Tabs only admins (Ravi, Pranesh) can access
const ADMIN_ONLY_TABS = new Set(['dashboard', 'active', 'done', 'skipped', 'photos', 'workforce', 'roles']);

function resolveIdentity() {
  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  if (authEnabled) {
    const account = getAccount();
    if (account) return (account.name || account.username || '').split(' ')[0];
  }
  return getIdentity();
}

function AppInner() {
  const identity = resolveIdentity();
  const isAdmin  = ADMINS.includes(identity);

  const defaultTab = isAdmin ? 'dashboard' : 'updates';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // If identity changes (e.g. after picking name) ensure they land on allowed tab
  useEffect(() => {
    if (!isAdmin && ADMIN_ONLY_TABS.has(activeTab)) {
      setActiveTab('updates');
    }
  }, [identity, isAdmin, activeTab]);

  const navigateTo = (tab) => {
    if (!isAdmin && ADMIN_ONLY_TABS.has(tab)) return; // silently block
    setActiveTab(tab);
  };

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
    retry: 1,
    enabled: isAdmin, // members never fetch tasks
  });

  const activeTasks  = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
  const doneTasks    = tasks.filter(t => t.status === 'done');
  const skippedTasks = tasks.filter(t => t.status === 'skip');

  const counts   = { active: activeTasks.length, done: doneTasks.length, skipped: skippedTasks.length };
  const tabTasks = { active: activeTasks, done: doneTasks, skipped: skippedTasks };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={navigateTo} counts={counts} isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-20">
          <div className="md:hidden flex items-center gap-2 flex-shrink-0">
            <AppIcon size={28} />
          </div>
          <h1 className="hidden md:block text-sm font-semibold text-gray-800 flex-1">{PAGE_TITLES[activeTab] || 'Dashboard'}</h1>
          <span className="md:hidden flex-1 text-center text-sm font-semibold text-gray-700">{PAGE_TITLES[activeTab] || 'Dashboard'}</span>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-400 font-medium">Connected</span>
          </div>
          <MobileNav activeTab={activeTab} onTabChange={navigateTo} counts={counts} isAdmin={isAdmin} />
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {isAdmin && isLoading ? (
            <Spinner />
          ) : isAdmin && error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <p className="text-red-500 font-semibold mb-2">Failed to connect to database</p>
              <p className="text-xs text-gray-400 font-mono bg-gray-100 rounded px-3 py-2 max-w-lg break-all">{error.message}</p>
            </div>
          ) : activeTab === 'dashboard' && isAdmin ? (
            <Dashboard onNavigate={navigateTo} />
          ) : activeTab === 'photos' && isAdmin ? (
            <PhotoGallery />
          ) : activeTab === 'workforce' && isAdmin ? (
            <WorkforceTab />
          ) : activeTab === 'weekend' ? (
            <WeekendAvailability defaultSection="weekend" />
          ) : activeTab === 'priorities' ? (
            <WeekendAvailability defaultSection="priority" />
          ) : activeTab === 'approvals' ? (
            <Approvals />
          ) : activeTab === 'updates' ? (
            <TeamUpdates />
          ) : activeTab === 'roles' && isAdmin ? (
            <TeamRoles />
          ) : (isAdmin && (activeTab === 'active' || activeTab === 'done' || activeTab === 'skipped')) ? (
            <>
              {activeTab === 'active' && <AddTaskForm />}
              <TaskTable tasks={tabTasks[activeTab] || []} tab={activeTab} />
            </>
          ) : (
            // fallback — member landed on restricted tab somehow
            <WeekendAvailability defaultSection="priority" />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  return (
    <QueryClientProvider client={queryClient}>
      {authEnabled ? (
        <AuthGate><AppInner /></AuthGate>
      ) : (
        <AppInner />
      )}
    </QueryClientProvider>
  );
}
