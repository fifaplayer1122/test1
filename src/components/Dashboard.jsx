import { useQuery } from '@tanstack/react-query';
import { ListTodo, CheckCircle2, AlertCircle, Clock, ChevronRight, Zap, TrendingUp, Users } from 'lucide-react';
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
  return { label, cls: 'bg-blue-50 text-blue-600' };
}

function daysUntil(etaStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(etaStr + 'T00:00:00');
  return Math.round((d - today) / 86400000);
}

function StatCard({ icon: Icon, iconBg, label, value, subtext, onClick, urgent }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-2 text-left w-full transition-all hover:shadow-md active:scale-95 ${
        urgent && value > 0 ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className={`text-2xl font-bold ${urgent && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
      </div>
      {onClick && (
        <div className="mt-auto pt-1 flex items-center gap-0.5 text-xs text-gray-400 font-medium">
          <span>View all</span><ChevronRight size={12} />
        </div>
      )}
    </button>
  );
}

export default function Dashboard({ onNavigate }) {
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: getTasks });
  const { data: wf } = useQuery({ queryKey: ['workforce'], queryFn: getWorkforceReport });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeTasks   = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
  const doneTasks     = tasks.filter(t => t.status === 'done');
  const veryHighTasks = activeTasks.filter(t => t.priority === 'very_high');

  const overdueTasks = activeTasks.filter(t => {
    if (!t.eta) return false;
    return new Date(t.eta + 'T00:00:00') < today;
  });

  const upcomingEtaTasks = activeTasks.filter(t => {
    if (!t.eta) return false;
    const d = new Date(t.eta + 'T00:00:00');
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7);
    return d >= today && d <= limit;
  });

  const priorityOrder = ['very_high', 'high', 'medium', 'low'];
  const priorityCounts = priorityOrder.map(p => ({
    key: p,
    label: PRIORITY_CONFIG[p]?.label || p,
    count: activeTasks.filter(t => t.priority === p).length,
    barColor: p === 'very_high' ? 'bg-red-500' : p === 'high' ? 'bg-orange-400' : p === 'medium' ? 'bg-yellow-400' : 'bg-green-500',
    textColor: p === 'very_high' ? 'text-red-600' : p === 'high' ? 'text-orange-500' : p === 'medium' ? 'text-yellow-600' : 'text-green-600',
  }));
  const totalActive = activeTasks.length || 1;

  const etaSorted = activeTasks
    .filter(t => t.eta)
    .sort((a, b) => a.eta.localeCompare(b.eta))
    .slice(0, 5);

  const recentDone = [...doneTasks].reverse().slice(0, 3);
  const onLeave = wf?.on_leave || [];
  const upcomingLeave = wf?.upcoming_leave || [];

  const nav = (tab) => onNavigate?.(tab);

  return (
    <div className="space-y-5">

      {/* ── Very High Priority spotlight ── */}
      {veryHighTasks.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-red-500" />
            <span className="text-sm font-semibold text-red-700">Needs Immediate Attention</span>
            <span className="ml-auto text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">{veryHighTasks.length}</span>
          </div>
          <div className="space-y-2">
            {veryHighTasks.map(task => {
              const badge = formatEtaBadge(task.eta);
              return (
                <button
                  key={task.id}
                  onClick={() => nav('active')}
                  className="w-full flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-red-100 shadow-sm hover:shadow-md active:scale-95 transition-all text-left"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 flex-1 truncate">{task.title}</span>
                  {badge && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                  )}
                  <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={ListTodo}
          iconBg="bg-blue-50 text-blue-600"
          label="Active Tasks"
          value={activeTasks.length}
          onClick={() => nav('active')}
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-green-50 text-green-600"
          label="Completed"
          value={doneTasks.length}
          onClick={() => nav('done')}
        />
        <StatCard
          icon={AlertCircle}
          iconBg="bg-red-50 text-red-500"
          label="Overdue"
          value={overdueTasks.length}
          onClick={() => nav('active')}
          urgent
        />
        <StatCard
          icon={Clock}
          iconBg="bg-orange-50 text-orange-500"
          label="Due This Week"
          value={upcomingEtaTasks.length}
          subtext="next 7 days"
          onClick={() => nav('active')}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Priority Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Priority Breakdown</h2>
          </div>
          <div className="space-y-3">
            {priorityCounts.map(p => (
              <button key={p.key} onClick={() => nav('active')} className="w-full text-left hover:opacity-80 transition-opacity">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${p.textColor}`}>{p.label}</span>
                  <span className="text-xs text-gray-400 font-medium">{p.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${p.barColor} transition-all duration-500`}
                    style={{ width: `${(p.count / totalActive) * 100}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming ETAs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Upcoming ETAs</h2>
          </div>
          {etaSorted.length === 0 ? (
            <p className="text-xs text-gray-400">No tasks with ETAs set.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {etaSorted.map(task => {
                const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const badge = formatEtaBadge(task.eta);
                const days = daysUntil(task.eta);
                return (
                  <button
                    key={task.id}
                    onClick={() => nav('active')}
                    className="w-full flex items-center gap-2.5 py-2.5 hover:opacity-80 active:opacity-60 transition-opacity text-left"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className="text-sm text-gray-700 truncate flex-1">{task.title}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'today' : `${days}d`}
                    </span>
                    {badge && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Done */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={15} className="text-green-500" />
            <h2 className="text-sm font-semibold text-gray-700">Recently Completed</h2>
            <button onClick={() => nav('done')} className="ml-auto text-xs text-blue-500 font-medium hover:underline">View all</button>
          </div>
          {recentDone.length === 0 ? (
            <p className="text-xs text-gray-400">No completed tasks yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentDone.map(task => (
                <div key={task.id} className="flex items-center gap-2.5 py-2.5">
                  <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500 truncate line-through decoration-gray-300">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workforce Snapshot */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Team Today</h2>
            <button onClick={() => nav('workforce')} className="ml-auto text-xs text-blue-500 font-medium hover:underline">Full report</button>
          </div>
          {onLeave.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={15} />
              <span className="text-sm font-medium">Full team available</span>
            </div>
          ) : (
            <div>
              <p className="text-xs text-red-500 font-medium mb-2">On leave today</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {onLeave.map(p => (
                  <div key={p.name} className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-full px-2.5 py-1">
                    <span className="w-5 h-5 rounded-full bg-red-200 text-red-700 text-xs font-bold flex items-center justify-center">
                      {p.name[0]}
                    </span>
                    <span className="text-xs text-red-700 font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {upcomingLeave.length > 0 && (
            <div>
              <p className="text-xs text-orange-500 font-medium mb-1.5">Coming up</p>
              <div className="space-y-1">
                {upcomingLeave.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{p.name[0]}</span>
                    <span className="truncate">{p.name} — {p.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
