import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Shield, Eye, Zap, Users, Clock } from 'lucide-react';
import { getWeekendData, ADMINS } from '../lib/teamStorage';

const ROLES = [
  {
    key: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    pill: 'bg-blue-100 text-blue-700',
    desc: 'Full access — manage members, all data',
  },
  {
    key: 'member',
    label: 'Member',
    icon: Users,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    pill: 'bg-emerald-100 text-emerald-700',
    desc: 'Submit updates, priorities, and availability',
  },
  {
    key: 'viewer',
    label: 'Viewer',
    icon: Eye,
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    pill: 'bg-gray-100 text-gray-600',
    desc: 'Read-only access to all data',
  },
];

function roleMeta(name) {
  if (ADMINS.includes(name)) return ROLES[0];
  return ROLES[1];
}

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700',
  'from-orange-400 to-orange-600',
  'from-pink-500 to-pink-700',
  'from-cyan-500 to-cyan-700',
  'from-rose-500 to-rose-700',
  'from-indigo-500 to-indigo-700',
  'from-teal-500 to-teal-700',
  'from-amber-500 to-amber-600',
  'from-fuchsia-500 to-fuchsia-700',
];

export default function TeamRoles() {
  const { data = { members: [], entries: {} }, isLoading } = useQuery({
    queryKey: ['teamHub'],
    queryFn: getWeekendData,
  });

  const allMembers = data.members;
  const adminCount  = allMembers.filter(m => ADMINS.includes(m)).length;
  const memberCount = allMembers.filter(m => !ADMINS.includes(m)).length;

  return (
    <div className="max-w-3xl mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">Members &amp; Roles</h1>
        <p className="text-sm text-gray-400 mt-0.5">{allMembers.length} members · Manage team access</p>
      </div>

      {/* Role legend cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {ROLES.map(role => {
          const Icon = role.icon;
          const count = role.key === 'admin' ? adminCount : role.key === 'member' ? memberCount : 0;
          return (
            <div key={role.key} className={`bg-white border ${role.border} rounded-2xl p-4 flex gap-3 items-start`}>
              <div className={`w-9 h-9 rounded-xl ${role.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} className={role.color} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${role.pill}`}>{role.label}</span>
                  <span className="text-xs font-semibold text-gray-400">{count}</span>
                </div>
                <p className="text-xs text-gray-400 leading-snug">{role.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Member</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider pr-16 hidden sm:block">Role</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading members…</div>
        ) : allMembers.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No members found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {allMembers.map((name, idx) => {
              const role = roleMeta(name);
              const Icon = role.icon;
              const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const entry = data.entries[name];
              const hasActivity = !!(entry?.focus || entry?.updatedAt);
              const lastActive = entry?.updatedAt
                ? new Date(entry.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : null;

              return (
                <div key={name} className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      {name[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                      {lastActive && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />Last active {lastActive}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Role pill */}
                  <div className="pr-8 hidden sm:flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${role.pill}`}>
                      <Icon size={11} />{role.label}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    {hasActivity ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permissions summary */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Permission Matrix</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Permission</th>
                {ROLES.map(r => (
                  <th key={r.key} className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: 'View dashboard & tasks',    admin: true,  member: true,  viewer: true  },
                { label: 'Create & edit tasks',       admin: true,  member: true,  viewer: false },
                { label: 'Post team updates',         admin: true,  member: true,  viewer: false },
                { label: 'Submit priority & weekend', admin: true,  member: true,  viewer: false },
                { label: 'Upload photos',             admin: true,  member: true,  viewer: false },
                { label: 'Manage team members',       admin: true,  member: false, viewer: false },
                { label: 'Edit workforce report',     admin: true,  member: false, viewer: false },
              ].map(row => (
                <tr key={row.label} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm text-gray-700">{row.label}</td>
                  {['admin', 'member', 'viewer'].map(rk => (
                    <td key={rk} className="px-4 py-3 text-center">
                      {row[rk] ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100">
                          <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100">
                          <svg className="w-3 h-3 text-gray-400" viewBox="0 0 12 12" fill="none">
                            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
