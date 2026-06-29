import { useQuery } from '@tanstack/react-query';
import { ListTodo, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getTasks, getWorkforceReport } from '../lib/storage';
import { PRIORITY_CONFIG } from '../lib/utils';

function formatEtaBadge(etaStr) {
  if (!etaStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const etaDate = new Date(etaStr + 'T00:00:00');
  if (etaDate.getTime() === today.getTime()) return { label: 'Today', cls: 'bg-orange-100 text-orange-600' };
  if (etaDate < today) return { label: 'Overdue', cls: 'bg-red-100 text-red-600' };
  const label = etaDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label, cls: 'bg-gray-100 text-gray-500' };
}

function StatCard({ icon: Icon, iconColor, label, value, subtext }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: getTasks });
  const { data: wf } = useQuery({ queryKey: ['workforce'], queryFn: getWorkforceReport });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
  const doneTasks   = tasks.filter(t => t.status === 'done');

  const overdueTasks = activeTasks.filter(t => {
    if (!t.eta) return false;
    const d = new Date(t.eta + 'T00:00:00');
    return d < today;
  });

  const upcomingEtaTasks = activeTasks.filter(t => {
    if (!t.eta) return false;
    const d = new Date(t.eta + 'T00:00:00');
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7);
    return d >= today && d <= limit;
  });

  // Priority breakdown
  const priorityOrder = ['very_high', 'high', 'medium', 'low'];
  const priorityCounts = priorityOrder.map(p => ({
    key: p,
    label: PRIORITY_CONFIG[p]?.label || p,
    count: activeTasks.filter(t => t.priority === p).length,
    color: p === 'very_high' ? 'bg-red-500' : p === 'high' ? 'bg-orange-400' : p === 'medium' ? 'bg-yellow-400' : 'bg-green-500',
  }));
  const totalActive = activeTasks.length || 1;

  // Upcoming ETAs sorted
  const etaSorted = activeTasks
    .filter(t => t.eta)
    .sort((a, b) => a.eta.localeCompare(b.eta))
    .slice(0, 5);

  // Recent done (last 3)
  const recentDone = [...doneTasks].reverse().slice(0, 3);

  // Workforce
  const onLeave = wf?.on_leave || [];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={ListTodo}
          iconColor="bg-blue-50 text-blue-600"
          label="Active Tasks"
          value={activeTasks.length}
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="bg-green-50 text-green-600"
          label="Done"
          value={doneTasks.length}
        />
        <StatCard
          icon={AlertCircle}
          iconColor="bg-red-50 text-red-500"
          label="Overdue"
          value={overdueTasks.length}
        />
        <StatCard
          icon={Clock}
          iconColor="bg-orange-50 text-orange-500"
          label="Upcoming ETAs"
          value={upcomingEtaTasks.length}
          subtext="next 7 days"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Priority Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Priority Breakdown</h2>
          <div className="space-y-3">
            {priorityCounts.map(p => (
              <div key={p.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 font-medium">{p.label}</span>
                  <span className="text-xs text-gray-400">{p.count} tasks</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${p.color} transition-all`}
                    style={{ width: `${(p.count / totalActive) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming ETAs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Upcoming ETAs</h2>
          {etaSorted.length === 0 ? (
            <p className="text-xs text-gray-400">No tasks with ETAs set.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {etaSorted.map(task => {
                const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const badge = formatEtaBadge(task.eta);
                return (
                  <div key={task.id} className="flex items-center gap-2.5 py-2.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className="text-sm text-gray-700 truncate flex-1">{task.title}</span>
                    {badge && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Done */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recently Completed</h2>
          {recentDone.length === 0 ? (
            <p className="text-xs text-gray-400">No completed tasks yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentDone.map(task => (
                <div key={task.id} className="flex items-center gap-2.5 py-2.5">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 truncate">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workforce Snapshot */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Workforce Snapshot</h2>
          {onLeave.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={15} />
              <span className="text-sm font-medium">Full team available today</span>
            </div>
          ) : (
            <div>
              <p className="text-xs text-red-500 font-medium mb-2">On leave today</p>
              <div className="flex flex-wrap gap-2">
                {onLeave.map(p => (
                  <div key={p.name} className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-full px-2.5 py-1">
                    <span className="w-5 h-5 rounded-full bg-red-200 text-red-700 text-xs font-bold flex items-center justify-center">
                      {p.name[0]}
                    </span>
                    <span className="text-xs text-red-700 font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">{onLeave.map(p => p.reason).join(' · ')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
