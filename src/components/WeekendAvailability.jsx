import { useState, useEffect } from 'react';
import { CalendarDays, Clock, CheckCircle2, XCircle, Clock3, X, UserCircle2, Settings, Plus, Trash2, AlertTriangle } from 'lucide-react';
import {
  ADMINS,
  getNextWeekend, fmtDate, fmtDay,
  getWeekendData, saveWeekendData,
  getIdentity, saveIdentity,
} from '../lib/teamStorage';
import { getAccount, CLIENT_ID } from '../lib/auth';

function getOutlookFirstName(account) {
  if (!account) return null;
  // account.name is "Firstname Lastname" from Azure AD
  const name = account.name || account.username || '';
  return name.split(' ')[0] || name;
}

function resolveIdentity() {
  // If auth is active, use Outlook display name
  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  if (authEnabled) {
    const account = getAccount();
    if (account) return getOutlookFirstName(account);
  }
  // Otherwise fall back to stored manual selection
  return getIdentity();
}

const STATUS = {
  none:        { label: "Haven't submitted", icon: Clock3,        cls: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  available:   { label: 'Available',         icon: CheckCircle2,  cls: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  partial:     { label: 'Partial / Limited', icon: Clock,         cls: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  unavailable: { label: 'Unavailable',       icon: XCircle,       cls: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200'   },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.none;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.cls}`}>
      <Icon size={13} />
      {s.label}
    </span>
  );
}

function EditModal({ member, entry, onSave, onClose }) {
  const [sat, setSat] = useState(entry?.sat || 'none');
  const [sun, setSun] = useState(entry?.sun || 'none');
  const [topics, setTopics] = useState(entry?.topics || '');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-gray-900">{member}</p>
            <p className="text-xs text-gray-400">Update your weekend availability</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {[{ label: 'Saturday', key: 'sat', val: sat, set: setSat }, { label: 'Sunday', key: 'sun', val: sun, set: setSun }].map(day => (
          <div key={day.key} className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{day.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS).map(([key, s]) => {
                const Icon = s.icon;
                const active = day.val === key;
                return (
                  <button
                    key={key}
                    onClick={() => day.set(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      active ? `${s.bg} ${s.border} ${s.cls}` : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={13} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Topics / Notes</p>
          <textarea
            rows={2}
            value={topics}
            onChange={e => setTopics(e.target.value)}
            placeholder="What are you working on this weekend? Any blockers?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSave({ sat, sun, topics })}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function IdentityModal({ members, onSelect }) {
  const [selected, setSelected] = useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 text-center">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserCircle2 size={24} className="text-blue-600" />
        </div>
        <h2 className="font-bold text-gray-900 text-lg mb-1">Who are you?</h2>
        <p className="text-xs text-gray-400 mb-5">Pick your name to update your availability</p>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400 mb-4"
        >
          <option value="">Select your name…</option>
          {members.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button
          disabled={!selected}
          onClick={() => { saveIdentity(selected); onSelect(selected); }}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ManageMembersModal({ data, onSave, onClose }) {
  const [members, setMembers] = useState([...data.members]);
  const [newName, setNewName] = useState('');
  const add = () => {
    const n = newName.trim();
    if (n && !members.includes(n)) { setMembers(m => [...m, n]); }
    setNewName('');
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-900">Manage Team Members</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="space-y-1.5 mb-4 max-h-60 overflow-y-auto">
          {members.map(m => (
            <div key={m} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span className="flex-1 text-sm text-gray-700">{m}</span>
              {ADMINS.includes(m) && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">Admin</span>}
              {!ADMINS.includes(m) && (
                <button onClick={() => setMembers(ms => ms.filter(x => x !== m))} className="text-gray-300 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add team member name…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <button onClick={add} className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            <Plus size={16} />
          </button>
        </div>
        <button
          onClick={() => onSave(members)}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default function WeekendAvailability() {
  const [data, setData]         = useState(getWeekendData);
  const [identity, setIdentity] = useState(resolveIdentity);
  const [showIdModal, setShowIdModal]   = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [showManage, setShowManage]     = useState(false);

  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  const { sat, sun } = getNextWeekend();
  const isAdmin = ADMINS.includes(identity);

  useEffect(() => {
    // Only show manual picker if auth is off and no stored identity
    if (!identity && !authEnabled) setShowIdModal(true);
  }, [identity, authEnabled]);

  const persist = (next) => { setData(next); saveWeekendData(next); };

  const handleSave = (member, entry) => {
    persist({ ...data, entries: { ...data.entries, [member]: entry } });
    setEditTarget(null);
  };

  const handleManageSave = (members) => {
    persist({ ...data, members });
    setShowManage(false);
  };

  const notSubmitted = data.members.filter(m => {
    const e = data.entries[m];
    return !e || (e.sat === 'none' && e.sun === 'none');
  });

  const canEdit = (member) => isAdmin || identity === member;

  return (
    <div>
      {showIdModal && (
        <IdentityModal
          members={data.members}
          onSelect={name => { setIdentity(name); setShowIdModal(false); }}
        />
      )}
      {editTarget && (
        <EditModal
          member={editTarget}
          entry={data.entries[editTarget]}
          onSave={(entry) => handleSave(editTarget, entry)}
          onClose={() => setEditTarget(null)}
        />
      )}
      {showManage && (
        <ManageMembersModal
          data={data}
          onSave={handleManageSave}
          onClose={() => setShowManage(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <CalendarDays size={18} className="text-gray-600" />
            <h1 className="text-base font-bold text-gray-900">Weekend Availability</h1>
          </div>
          <p className="text-xs text-gray-400">
            {fmtDate(sat)} – {fmtDate(sun)} · All times in EST
          </p>
        </div>
        <div className="flex items-center gap-2">
          {authEnabled ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50">
              <UserCircle2 size={13} />
              {identity || '…'}
            </div>
          ) : (
            /* Test switcher — only visible when Outlook auth is off */
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">Viewing as:</span>
              <select
                value={identity || ''}
                onChange={e => { const n = e.target.value; saveIdentity(n); setIdentity(n); }}
                className="text-xs border border-dashed border-blue-300 bg-blue-50 text-blue-700 font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {!identity && <option value="">— pick —</option>}
                {data.members.map(m => (
                  <option key={m} value={m}>{m}{ADMINS.includes(m) ? ' (Admin)' : ''}</option>
                ))}
              </select>
            </div>
          )}
          {identity === 'Pranesh' && (
            <button onClick={() => setShowManage(true)} className="text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg p-1.5 hover:bg-gray-50">
              <Settings size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Not submitted alert — admin only */}
      {isAdmin && notSubmitted.length > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-0.5">Awaiting response ({notSubmitted.length})</p>
            <p className="text-xs text-amber-600">{notSubmitted.join(', ')}</p>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-40">Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{fmtDay(sat)}</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{fmtDay(sun)}</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Topics / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.members.map(member => {
              const e = data.entries[member] || {};
              const isMe = identity === member;
              const editable = canEdit(member);
              return (
                <tr
                  key={member}
                  onClick={() => editable && setEditTarget(member)}
                  className={`transition-colors ${editable ? 'cursor-pointer hover:bg-blue-50/40' : ''} ${isMe ? 'bg-blue-50/30' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {member[0]}
                      </span>
                      <span className={`font-medium ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>{member}</span>
                      {ADMINS.includes(member) && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Admin</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={e.sat || 'none'} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={e.sun || 'none'} /></td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">{e.topics || <span className="text-gray-300">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {data.members.map(member => {
          const e = data.entries[member] || {};
          const isMe = identity === member;
          const editable = canEdit(member);
          return (
            <div
              key={member}
              onClick={() => editable && setEditTarget(member)}
              className={`bg-white border rounded-2xl px-4 py-3.5 shadow-sm transition-all ${
                isMe ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'
              } ${editable ? 'cursor-pointer active:scale-95' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center">{member[0]}</span>
                <span className={`font-semibold text-sm ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>{member}</span>
                {ADMINS.includes(member) && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Admin</span>}
                {isMe && <span className="ml-auto text-xs text-blue-500 font-medium">Tap to edit</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-400 mb-1">Saturday</p>
                  <StatusBadge status={e.sat || 'none'} />
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-400 mb-1">Sunday</p>
                  <StatusBadge status={e.sun || 'none'} />
                </div>
              </div>
              {e.topics && <p className="text-xs text-gray-500 truncate">{e.topics}</p>}
            </div>
          );
        })}
      </div>

      {/* Your entry prompt if not submitted */}
      {identity && !ADMINS.includes(identity) && (() => {
        const e = data.entries[identity] || {};
        const submitted = e.sat && e.sat !== 'none';
        if (submitted) return null;
        return (
          <button
            onClick={() => setEditTarget(identity)}
            className="mt-4 w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 text-blue-500 rounded-2xl py-4 text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            <Clock3 size={16} />
            Submit your availability for this weekend
          </button>
        );
      })()}
    </div>
  );
}
