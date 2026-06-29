import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Header from './components/Header';
import TabBar from './components/TabBar';
import AddTaskForm from './components/AddTaskForm';
import TaskTable from './components/TaskTable';
import PhotoGallery from './components/PhotoGallery';
import WorkforceTab from './components/WorkforceTab';
import Dashboard from './components/Dashboard';
import AuthGate from './components/AuthGate';
import Spinner from './components/Spinner';
import { getTasks } from './lib/storage';
import { CLIENT_ID } from './lib/auth';

const queryClient = new QueryClient();

function AppInner() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: getTasks });

  const activeTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const skippedTasks = tasks.filter(t => t.status === 'skip');

  const counts = { active: activeTasks.length, done: doneTasks.length, skipped: skippedTasks.length };
  const tabTasks = { active: activeTasks, done: doneTasks, skipped: skippedTasks };

  return (
    <div className="min-h-screen">
      <Header activeCount={activeTasks.length} completedCount={doneTasks.length} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
      <main className="max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {isLoading ? (
          <Spinner />
        ) : activeTab === 'dashboard' ? (
          <Dashboard onNavigate={setActiveTab} />
        ) : activeTab === 'photos' ? (
          <PhotoGallery />
        ) : activeTab === 'workforce' ? (
          <WorkforceTab />
        ) : (
          <>
            {activeTab === 'active' && <AddTaskForm />}
            <TaskTable tasks={tabTasks[activeTab] || []} tab={activeTab} />
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  return (
    <QueryClientProvider client={queryClient}>
      {authEnabled ? (
        <AuthGate>
          <AppInner />
        </AuthGate>
      ) : (
        <AppInner />
      )}
    </QueryClientProvider>
  );
}
