import { useState } from 'react';
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
import AuthGate from './components/AuthGate';
import Spinner from './components/Spinner';
import { getTasks } from './lib/storage';
import { CLIENT_ID } from './lib/auth';

const queryClient = new QueryClient();

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  active:     'Active Tasks',
  done:       'Completed',
  skipped:    'Skipped',
  photos:     'Photos',
  workforce:  'Workforce Report',
  weekend:    'Weekend Availability',
  priorities: 'Team Priorities',
  updates:    'Team Updates',
};

function AppInner() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: getTasks });

  const activeTasks  = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
  const doneTasks    = tasks.filter(t => t.status === 'done');
  const skippedTasks = tasks.filter(t => t.status === 'skip');

  const counts = { active: activeTasks.length, done: doneTasks.length, skipped: skippedTasks.length };
  const tabTasks = { active: activeTasks, done: doneTasks, skipped: skippedTasks };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <h1 className="text-base font-bold text-gray-900">{PAGE_TITLES[activeTab] || 'Dashboard'}</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">SmartDocs</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 pb-24 md:pb-6">
          {isLoading ? (
            <Spinner />
          ) : activeTab === 'dashboard' ? (
            <Dashboard onNavigate={setActiveTab} />
          ) : activeTab === 'photos' ? (
            <PhotoGallery />
          ) : activeTab === 'workforce' ? (
            <WorkforceTab />
          ) : activeTab === 'weekend' ? (
            <WeekendAvailability defaultSection="weekend" />
          ) : activeTab === 'priorities' ? (
            <WeekendAvailability defaultSection="priority" />
          ) : activeTab === 'updates' ? (
            <TeamUpdates />
          ) : (
            <>
              {activeTab === 'active' && <AddTaskForm />}
              <TaskTable tasks={tabTasks[activeTab] || []} tab={activeTab} />
            </>
          )}
        </main>
      </div>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
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
