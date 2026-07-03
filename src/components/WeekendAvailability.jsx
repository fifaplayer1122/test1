import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, Clock, CheckCircle2, XCircle, Clock3, X,
  UserCircle2, Settings, Plus, Trash2, AlertTriangle,
  Zap, MessageSquare, Bell, ChevronRight, Pencil,
} from 'lucide-react';
import {
  ADMINS,
  getNextWeekend, fmtDate, fmtDay,
  getWeekendData, upsertMemberEntry, saveMembers,
  getMemberPriorities, addMemberPriority, updateMemberPriority, deleteMemberPriority,
  getIdentity, saveIdentity, ensureMember,
} from '../lib/teamStorage';
import { getAccount, CLIENT_ID } from '../lib/auth';

/* ─── helpers ─── */
function getOutlookFirstName(account) {
  const name = (account?.name || account?.username || '');
  return name.split(' ')[0] || name;
}

function resolveIdentity() {
  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  if (authEnabled) {
    const account = getAccount();
    if (account) return (account.name || account.username || '');
  }
  return getIdentity();
}

function timeAgo(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── Status config for weekend ─── */
const STATUS = {
  none:        { label: "Haven't submitted", icon: Clock3,       cls: 'text-amber-500', bg: 'bg-amber-50',  border: 'border-amber-200' },
  available:   { label: 'Available',         icon: CheckCircle2, cls: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200' },
  partial:     { label: 'Partial / Limited', icon: Clock,        cls: 'text-blue-500',  bg: 'bg-blue-50',   border: 'border-blue-200'  },
  unavailable: { label: 'Unavailable',       icon: XCircle,      cls: 'text-red-500',   bg: 'bg-red-50',    border: 'border-red-200'   },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.none;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.cls}`}>
      <Icon size={13} />{s.label}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: 'none',        label: 'Waiting for Reply' },
  { value: 'available',   label: 'Available'          },
  { value: 'partial',     label: 'Partial / Limited'  },
  { value: 'unavailable', label: 'Unavailable'        },
];

/* ─── Weekend edit modal ─── */
function WeekendEditModal({ member, entry, onSave, onClose, isAdmin, allMembers }) {
  const [name, setName]       = useState(member || '');
  const [sat, setSat]         = useState(entry?.sat || 'none');
  const [sun, setSun]         = useState(entry?.sun || 'none');
  const [satTime, setSatTime] = useState(entry?.satTime || '');
  const [sunTime, setSunTime] = useState(entry?.sunTime || '');
  const [topics, setTopics]   = useState(entry?.topics || '');

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Availability</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className={labelCls}>Name</label>
            {isAdmin ? (
              <select value={name} onChange={e => setName(e.target.value)} className={inputCls}>
                <option value="">Select employee…</option>
                {allMembers.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input value={name} readOnly className={`${inputCls} bg-gray-50 text-gray-500`} placeholder="Employee name" />
            )}
          </div>

          {/* Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Saturday Status</label>
              <select value={sat} onChange={e => setSat(e.target.value)} className={inputCls}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sunday Status</label>
              <select value={sun} onChange={e => setSun(e.target.value)} className={inputCls}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Time/Details row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Saturday Time/Details</label>
              <input value={satTime} onChange={e => setSatTime(e.target.value)} placeholder="e.g. 10:30 AM onwards" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sunday Time/Details</label>
              <input value={sunTime} onChange={e => setSunTime(e.target.value)} placeholder="e.g. 9 AM to 12 PM" className={inputCls} />
            </div>
          </div>

          {/* Topics */}
          <div>
            <label className={labelCls}>Topics / Notes</label>
            <textarea rows={3} value={topics} onChange={e => setTopics(e.target.value)}
              placeholder="Any topics or agenda items…"
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave({ sat, sun, satTime, sunTime, topics }, isAdmin ? name : member)}
            className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">Add</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Priority levels config ─── */
const PRIORITY_LEVELS = [
  { value: 'very_high', label: 'Very High', color: 'bg-red-500',    text: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-300',    pill: 'bg-red-100 text-red-700'       },
  { value: 'high',      label: 'High',      color: 'bg-orange-400', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300',  pill: 'bg-orange-100 text-orange-700'  },
  { value: 'medium',    label: 'Medium',    color: 'bg-yellow-400', text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300',  pill: 'bg-yellow-100 text-yellow-700'  },
  { value: 'low',       label: 'Low',       color: 'bg-green-400',  text: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-300',   pill: 'bg-green-100 text-green-700'   },
];
function getPL(val) { return PRIORITY_LEVELS.find(p => p.value === val) || PRIORITY_LEVELS[2]; }

/* ─── Add / Edit single priority item modal ─── */
function PriorityItemModal({ item, memberName, onSave, onClose }) {
  const [title, setTitle] = useState(item?.title || '');
  const [level, setLevel] = useState(item?.priority_level || 'medium');
  const isEdit = !!item;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">{isEdit ? 'Edit Priority' : 'Add Priority'}</p>
            <p className="text-xs text-gray-400">{memberName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Priority Level</p>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITY_LEVELS.map(pl => (
                <button key={pl.value} onClick={() => setLevel(pl.value)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    level === pl.value ? `${pl.bg} ${pl.border} ${pl.text}` : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${level === pl.value ? pl.color : 'bg-gray-200'}`} />
                  {pl.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What are you working on?</p>
            <textarea rows={3} value={title} onChange={e => setTitle(e.target.value)} autoFocus
              placeholder="Describe this priority item — task, deliverable, or goal…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400 leading-relaxed" />
          </div>
        </div>
        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button disabled={!title.trim()} onClick={() => onSave({ title, priorityLevel: level })}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
            {isEdit ? 'Save Changes' : 'Add Priority'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Identity modal (fallback when no auth) ─── */
function IdentityModal({ members, onSelect }) {
  const [selected, setSelected] = useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 text-center">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserCircle2 size={24} className="text-blue-600" />
        </div>
        <h2 className="font-bold text-gray-900 text-lg mb-1">Who are you?</h2>
        <p className="text-xs text-gray-400 mb-5">Pick your name to get started</p>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400 mb-4">
          <option value="">Select your name…</option>
          {members.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button disabled={!selected} onClick={() => { saveIdentity(selected); onSelect(selected); }}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
          Continue
        </button>
      </div>
    </div>
  );
}

/* ─── Manage members modal (Pranesh only) ─── */
function ManageMembersModal({ data, onSave, onClose }) {
  const [members, setMembers] = useState([...data.members]);
  const [newName, setNewName] = useState('');
  const add = () => { const n = newName.trim(); if (n && !members.includes(n)) setMembers(m => [...m, n]); setNewName(''); };
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
          <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add team member name…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          <button onClick={add} className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Plus size={16} /></button>
        </div>
        <button onClick={() => onSave(members)} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Save Changes</button>
      </div>
    </div>
  );
}

/* ─── Admin priority table (multi-item) ─── */
const AVATAR_COLORS_LIST = [
  'from-blue-500 to-blue-700', 'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700', 'from-orange-400 to-orange-600',
  'from-pink-500 to-pink-700', 'from-cyan-500 to-cyan-700',
  'from-rose-500 to-rose-700', 'from-indigo-500 to-indigo-700',
  'from-teal-500 to-teal-700', 'from-amber-500 to-amber-600',
  'from-fuchsia-500 to-fuchsia-700',
];

function AdminPriorityTable({ data, priorityItems, notSubmitted, onAddItem, onEditItem, onDeleteItem, onSaveNotes }) {
  const [expandedNotes, setExpandedNotes] = useState(null);
  const [notesDraft, setNotesDraft] = useState({});

  const members = data.members.filter(m => !ADMINS.includes(m));

  const openNotes = (member) => {
    setNotesDraft(d => ({ ...d, [member]: data.entries[member]?.raviNotes || '' }));
    setExpandedNotes(expandedNotes === member ? null : member);
  };

  const saveNotes = (member) => {
    onSaveNotes(member, notesDraft[member] || '');
    setExpandedNotes(null);
  };

  return (
    <>
      {notSubmitted.length > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-0.5">No priorities submitted ({notSubmitted.length})</p>
            <p className="text-xs text-amber-600">{notSubmitted.join(', ')}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {members.map((member, idx) => {
          const e = data.entries[member] || {};
          const items = priorityItems.filter(p => p.member_name === member);
          const color = AVATAR_COLORS_LIST[idx % AVATAR_COLORS_LIST.length];
          const isNotesOpen = expandedNotes === member;

          return (
            <div key={member} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Member header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {member[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 leading-tight">{member}</p>
                  <p className="text-xs text-gray-400">{items.length} priorit{items.length === 1 ? 'y' : 'ies'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openNotes(member)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                      isNotesOpen || e.raviNotes
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    <MessageSquare size={12} />
                    <span className="hidden sm:inline">{e.raviNotes ? 'Notes' : 'Add note'}</span>
                  </button>
                  <button
                    onClick={() => onAddItem(member)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 font-medium hover:bg-blue-100 transition-all"
                  >
                    <Plus size={12} />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>

              {/* Ravi notes */}
              {e.raviNotes && !isNotesOpen && (
                <div className="px-4 py-2 bg-indigo-50/50 border-b border-indigo-100 flex items-start gap-2">
                  <MessageSquare size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-indigo-600 font-medium leading-relaxed">{e.raviNotes}</p>
                </div>
              )}

              {/* Ravi notes editor */}
              {isNotesOpen && (
                <div className="px-4 py-3 bg-indigo-50/40 border-b border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <MessageSquare size={11} />Ravi's Notes
                  </p>
                  <textarea
                    rows={2}
                    value={notesDraft[member] ?? (e.raviNotes || '')}
                    onChange={ev => setNotesDraft(d => ({ ...d, [member]: ev.target.value }))}
                    autoFocus
                    placeholder={`Thoughts, feedback, or direction for ${member}…`}
                    className="w-full border border-indigo-200 bg-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setExpandedNotes(null)} className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium hover:bg-white">Cancel</button>
                    <button onClick={() => saveNotes(member)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">Save Note</button>
                  </div>
                </div>
              )}

              {/* Priority items */}
              {items.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-gray-300 italic">No priorities submitted yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {items.map((item, i) => {
                    const pl = getPL(item.priority_level);
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                        <span className="text-xs font-bold text-gray-300 w-4 text-center flex-shrink-0">{i + 1}</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${pl.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pl.color}`} />
                          {pl.label}
                        </span>
                        <p className="flex-1 text-sm text-gray-700 leading-snug min-w-0">{item.title}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => onEditItem(item, member)} className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => onDeleteItem(item.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function TeamHub({ defaultSection = 'priority' }) {
  const qc = useQueryClient();
  const { data = { members: [], entries: {} }, isLoading } = useQuery({
    queryKey: ['teamHub'],
    queryFn: getWeekendData,
  });

  const [identity, setIdentity] = useState(resolveIdentity);
  const [showIdModal, setShowIdModal]   = useState(false);
  const [editWeekend, setEditWeekend]   = useState(null);
  const [priorityModal, setPriorityModal] = useState(null); // { item: null|object, memberName: string }
  const [showManage, setShowManage]     = useState(false);

  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  const { sat, sun } = getNextWeekend();
  const isAdmin = ADMINS.some(a => identity === a || (identity || '').split(' ')[0] === a);

  const { data: priorityItems = [] } = useQuery({
    queryKey: ['memberPriorities'],
    queryFn: getMemberPriorities,
  });

  // Match full Outlook name to member record; auto-register new smartdocs.ai employees
  useEffect(() => {
    if (!identity) return;
    const isAdm = ADMINS.some(a => identity === a || identity.split(' ')[0] === a);
    if (isAdm) return;

    if (data.members.length === 0) return;

    if (data.members.includes(identity)) {
      // Already in the list — make sure they're in DB too
      ensureMember(identity);
      return;
    }

    const firstName = identity.split(' ')[0];
    const match = data.members.find(m => m === firstName || m.split(' ')[0] === firstName);
    if (match) {
      setIdentity(match);
      ensureMember(match);
    } else {
      // Brand new employee — add them to the members table then refetch
      ensureMember(identity).then(() => invalidate());
    }
    if (!authEnabled && !match) setShowIdModal(true);
  }, [data.members, identity]);

  useEffect(() => {
    if (!identity && !authEnabled) setShowIdModal(true);
  }, [identity, authEnabled]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['teamHub'] });
  const invalidatePriorities = () => qc.invalidateQueries({ queryKey: ['memberPriorities'] });

  const saveWeekend = async (entry, nameOverride) => {
    const target = nameOverride || editWeekend;
    if (!target) return;
    try {
      await upsertMemberEntry(target, entry);
      invalidate();
      setEditWeekend(null);
    } catch (err) {
      alert('Failed to save availability: ' + (err.message || err));
    }
  };

  const handlePrioritySave = async ({ title, priorityLevel }) => {
    if (!priorityModal) return;
    const { item, memberName } = priorityModal;
    try {
      if (item) {
        await updateMemberPriority(item.id, { title, priorityLevel });
      } else {
        await addMemberPriority(memberName, title, priorityLevel);
      }
      invalidatePriorities();
      setPriorityModal(null);
    } catch (err) {
      alert('Failed to save priority: ' + (err.message || err));
    }
  };

  const handlePriorityDelete = async (id) => {
    try {
      await deleteMemberPriority(id);
      invalidatePriorities();
    } catch (err) {
      alert('Failed to delete priority: ' + (err.message || err));
    }
  };

  const handleManageSave = async (members) => {
    await saveMembers(members);
    invalidate();
    setShowManage(false);
  };

  const canEdit = (member) => isAdmin || identity === member;

  const waitingOnRavi = data.members.filter(m => data.entries[m]?.waitingOnRavi);
  const notSubmittedWeekend = data.members.filter(m => { const e = data.entries[m]; return !e || (!e.sat || e.sat === 'none'); });
  const notSubmittedPriority = data.members.filter(m => !ADMINS.includes(m) && priorityItems.filter(p => p.member_name === m).length === 0);

  return (
    <div>
      {/* Modals */}
      {showIdModal && <IdentityModal members={data.members} onSelect={name => { setIdentity(name); setShowIdModal(false); }} />}
      {editWeekend && <WeekendEditModal member={editWeekend} entry={data.entries[editWeekend]} onSave={saveWeekend} onClose={() => setEditWeekend(null)} isAdmin={isAdmin} allMembers={data.members.filter(m => !ADMINS.includes(m))} />}
      {priorityModal && <PriorityItemModal item={priorityModal.item} memberName={priorityModal.memberName} onSave={handlePrioritySave} onClose={() => setPriorityModal(null)} />}
      {showManage && <ManageMembersModal data={data} onSave={handleManageSave} onClose={() => setShowManage(false)} />}

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-base font-bold text-gray-900">Team Hub</h1>
          <p className="text-xs text-gray-400">{fmtDate(sat)} – {fmtDate(sun)}</p>
        </div>
        <div className="flex items-center gap-2">
          {authEnabled ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50">
              <UserCircle2 size={13} />{identity || '…'}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">Viewing as:</span>
              <select value={identity || ''} onChange={e => { const n = e.target.value; saveIdentity(n); setIdentity(n); }}
                className="text-xs border border-dashed border-blue-300 bg-blue-50 text-blue-700 font-semibold rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer">
                {!identity && <option value="">— pick —</option>}
                {data.members.map(m => <option key={m} value={m}>{m}{ADMINS.includes(m) ? ' (Admin)' : ''}</option>)}
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

      {/* ── Waiting on Ravi banner (admin only) ── */}
      {isAdmin && waitingOnRavi.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-red-500" />
            <span className="text-sm font-semibold text-red-700">Waiting on your decision ({waitingOnRavi.length})</span>
          </div>
          <div className="space-y-2">
            {waitingOnRavi.map(m => (
              <div key={m} className="flex items-start gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-red-100">
                <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{m[0]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{m}</p>
                  <p className="text-xs text-red-600 mt-0.5">{data.entries[m]?.waitReason || 'Needs a decision or discussion'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ MY PRIORITY TAB ══ */}
      {defaultSection === 'priority' && (
        <>
          {/* Member's own view */}
          {identity && !isAdmin && (() => {
            const myItems = priorityItems.filter(p => p.member_name === identity);
            return (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-4">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Your Priorities</p>
                    <p className="text-xs text-gray-400">{myItems.length} item{myItems.length !== 1 ? 's' : ''} · visible to Ravi</p>
                  </div>
                  <button
                    onClick={() => setPriorityModal({ item: null, memberName: identity })}
                    className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={13} />Add Priority
                  </button>
                </div>

                {myItems.length === 0 ? (
                  <button
                    onClick={() => setPriorityModal({ item: null, memberName: identity })}
                    className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-blue-200 text-blue-400 rounded-xl py-8 text-sm hover:bg-blue-50 transition-colors m-4 w-[calc(100%-2rem)]"
                  >
                    <Zap size={20} className="opacity-60" />
                    <span className="font-medium">Tell Ravi what you're working on</span>
                    <span className="text-xs text-gray-400">Add your current priorities and goals</span>
                  </button>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {myItems.map((item, i) => {
                      const pl = getPL(item.priority_level);
                      return (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                          <span className="text-xs font-bold text-gray-300 w-4 text-center flex-shrink-0">{i + 1}</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${pl.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pl.color}`} />
                            {pl.label}
                          </span>
                          <p className="flex-1 text-sm text-gray-700 leading-snug min-w-0">{item.title}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setPriorityModal({ item, memberName: identity })} className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handlePriorityDelete(item.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ravi's notes to this member */}
                {data.entries[identity]?.raviNotes && (
                  <div className="px-4 py-3 border-t border-indigo-100 bg-indigo-50/40 flex items-start gap-2">
                    <MessageSquare size={13} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-indigo-600 mb-0.5">Note from Ravi</p>
                      <p className="text-sm text-indigo-700">{data.entries[identity].raviNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Admin table view */}
          {isAdmin && (
            <AdminPriorityTable
              data={data}
              priorityItems={priorityItems}
              notSubmitted={notSubmittedPriority}
              onAddItem={(memberName) => setPriorityModal({ item: null, memberName })}
              onEditItem={(item, memberName) => setPriorityModal({ item, memberName })}
              onDeleteItem={handlePriorityDelete}
              onSaveNotes={(member, notes) => { upsertMemberEntry(member, { raviNotes: notes }); invalidate(); }}
            />
          )}
        </>
      )}

      {/* ══ WEEKEND TAB ══ */}
      {defaultSection === 'weekend' && (
        <>
          {isAdmin && notSubmittedWeekend.length > 0 && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-0.5">Awaiting weekend response ({notSubmittedWeekend.length})</p>
                <p className="text-xs text-amber-600">{notSubmittedWeekend.join(', ')}</p>
              </div>
            </div>
          )}

          {(() => {
            // Non-admins only see their own row; admins see all
            const weekendMembers = data.members.filter(m =>
              !ADMINS.includes(m) && (isAdmin || m === identity)
            );
            return (
              <>
                {/* Desktop table */}
                <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {isAdmin && <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-40">Name</th>}
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{fmtDay(sat)}</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Sat Time</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{fmtDay(sun)}</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Sun Time</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {weekendMembers.map(member => {
                        const e = data.entries[member] || {};
                        const editable = canEdit(member);
                        return (
                          <tr key={member} onClick={() => editable && setEditWeekend(member)}
                            className={`transition-colors ${editable ? 'cursor-pointer hover:bg-blue-50/40' : ''} bg-blue-50/20`}>
                            {isAdmin && (
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{member[0]}</span>
                                  <span className="font-medium text-gray-800">{member}</span>
                                </div>
                              </td>
                            )}
                            <td className="px-5 py-3.5"><StatusBadge status={e.sat || 'none'} /></td>
                            <td className="px-5 py-3.5 text-xs text-gray-500">{e.satTime || <span className="text-gray-300">—</span>}</td>
                            <td className="px-5 py-3.5"><StatusBadge status={e.sun || 'none'} /></td>
                            <td className="px-5 py-3.5 text-xs text-gray-500">{e.sunTime || <span className="text-gray-300">—</span>}</td>
                            <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">{e.topics || <span className="text-gray-300">—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {weekendMembers.map(member => {
                    const e = data.entries[member] || {};
                    const editable = canEdit(member);
                    return (
                      <div key={member} onClick={() => editable && setEditWeekend(member)}
                        className={`bg-white border border-blue-200 ring-1 ring-blue-100 rounded-2xl px-4 py-3.5 shadow-sm transition-all ${editable ? 'cursor-pointer active:scale-95' : ''}`}>
                        {isAdmin && (
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center">{member[0]}</span>
                            <span className="font-semibold text-sm text-gray-800">{member}</span>
                          </div>
                        )}
                        {editable && !isAdmin && (
                          <div className="flex items-center justify-between mb-2.5">
                            <p className="text-sm font-semibold text-blue-700">Your Availability</p>
                            <span className="text-xs text-blue-500 font-medium">Tap to edit</span>
                          </div>
                        )}
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
              </>
            );
          })()}

          {/* Submit prompt for members */}
          {identity && !isAdmin && !(data.entries[identity]?.sat && data.entries[identity]?.sat !== 'none') && (
            <button onClick={() => setEditWeekend(identity)}
              className="mt-4 w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 text-blue-500 rounded-2xl py-4 text-sm font-medium hover:bg-blue-50 transition-colors">
              <CalendarDays size={16} />Submit your weekend availability
            </button>
          )}
        </>
      )}
    </div>
  );
}
