import { useState, useEffect } from 'react';
import {
  CalendarDays, Clock, CheckCircle2, XCircle, Clock3, X,
  UserCircle2, Settings, Plus, Trash2, AlertTriangle,
  Zap, MessageSquare, Bell, ChevronRight, Pencil,
} from 'lucide-react';
import {
  ADMINS,
  getNextWeekend, fmtDate, fmtDay,
  getWeekendData, saveWeekendData,
  getIdentity, saveIdentity,
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
    if (account) return getOutlookFirstName(account);
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

/* ─── Priority edit modal ─── */
function PriorityEditModal({ member, entry, onSave, onClose }) {
  const [focus, setFocus]         = useState(entry?.focus || '');
  const [waiting, setWaiting]     = useState(entry?.waitingOnRavi || false);
  const [waitReason, setWaitReason] = useState(entry?.waitReason || '');
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-gray-900">{member}</p>
            <p className="text-xs text-gray-400">What are you working on?</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Focus</p>
          <textarea rows={3} value={focus} onChange={e => setFocus(e.target.value)} autoFocus
            placeholder="What are you currently working on? What's your main goal this week?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400" />
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Waiting on Ravi?</p>
          <div className="flex gap-2 mb-2">
            {[{ val: false, label: 'No, all good' }, { val: true, label: 'Yes, need input' }].map(opt => (
              <button key={String(opt.val)} onClick={() => setWaiting(opt.val)}
                className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                  waiting === opt.val
                    ? opt.val ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          {waiting && (
            <textarea rows={2} value={waitReason} onChange={e => setWaitReason(e.target.value)}
              placeholder="What decision or input do you need from Ravi?"
              className="w-full border border-red-200 bg-red-50/40 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-400 placeholder-red-300" />
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave({ focus, waitingOnRavi: waiting, waitReason: waiting ? waitReason : '', focusUpdatedAt: new Date().toISOString() })}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Save</button>
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

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function TeamHub({ defaultSection = 'priority' }) {
  const [data, setData]         = useState(getWeekendData);
  const [identity, setIdentity] = useState(resolveIdentity);
  const [activeTab, setActiveTab] = useState(defaultSection);
  const [showIdModal, setShowIdModal]     = useState(false);
  const [editWeekend, setEditWeekend]     = useState(null);
  const [editPriority, setEditPriority]   = useState(null);
  const [showManage, setShowManage]       = useState(false);

  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  const { sat, sun } = getNextWeekend();
  const isAdmin = ADMINS.includes(identity);

  useEffect(() => {
    if (!identity && !authEnabled) setShowIdModal(true);
  }, [identity, authEnabled]);

  const persist = (next) => { setData(next); saveWeekendData(next); };

  const saveWeekend = (entry, nameOverride) => {
    const target = nameOverride || editWeekend;
    if (!target) return;
    persist({ ...data, entries: { ...data.entries, [target]: { ...data.entries[target], ...entry } } });
    setEditWeekend(null);
  };

  const savePriority = (member, entry) => {
    persist({ ...data, entries: { ...data.entries, [member]: { ...data.entries[member], ...entry } } });
    setEditPriority(null);
  };

  const handleManageSave = (members) => { persist({ ...data, members }); setShowManage(false); };

  const canEdit = (member) => isAdmin || identity === member;

  const waitingOnRavi = data.members.filter(m => data.entries[m]?.waitingOnRavi);
  const notSubmittedWeekend = data.members.filter(m => { const e = data.entries[m]; return !e || (!e.sat || e.sat === 'none'); });
  const notSubmittedPriority = data.members.filter(m => !data.entries[m]?.focus?.trim());

  return (
    <div>
      {/* Modals */}
      {showIdModal && <IdentityModal members={data.members} onSelect={name => { setIdentity(name); setShowIdModal(false); }} />}
      {editWeekend && <WeekendEditModal member={editWeekend} entry={data.entries[editWeekend]} onSave={saveWeekend} onClose={() => setEditWeekend(null)} isAdmin={isAdmin} allMembers={data.members.filter(m => !ADMINS.includes(m))} />}
      {editPriority && <PriorityEditModal member={editPriority} entry={data.entries[editPriority]} onSave={e => savePriority(editPriority, e)} onClose={() => setEditPriority(null)} />}
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

      {/* ── Sub-tab pills ── */}
      <div className="flex gap-2 mb-4">
        {[{ id: 'priority', label: 'My Priority', icon: Zap }, { id: 'weekend', label: 'Weekend', icon: CalendarDays }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              activeTab === t.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}>
            <t.icon size={14} />{t.label}
            {isAdmin && activeTab !== t.id && (t.id === 'priority' ? notSubmittedPriority : notSubmittedWeekend).length > 0 && (
              <span className="bg-amber-100 text-amber-600 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                {(t.id === 'priority' ? notSubmittedPriority : notSubmittedWeekend).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ MY PRIORITY TAB ══ */}
      {activeTab === 'priority' && (
        <>
          {/* Member's own form — compact card at top */}
          {identity && !isAdmin && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Your Current Focus</p>
                <button onClick={() => setEditPriority(identity)} className="flex items-center gap-1 text-xs text-blue-500 font-medium hover:underline">
                  <Pencil size={12} />Edit
                </button>
              </div>
              {data.entries[identity]?.focus ? (
                <div>
                  <p className="text-sm text-gray-700 mb-2">{data.entries[identity].focus}</p>
                  {data.entries[identity]?.waitingOnRavi && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                      <Bell size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-600">{data.entries[identity].waitReason || 'Waiting on Ravi'}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Updated {timeAgo(data.entries[identity]?.focusUpdatedAt)}</p>
                </div>
              ) : (
                <button onClick={() => setEditPriority(identity)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-200 text-blue-400 rounded-xl py-3 text-sm hover:bg-blue-50 transition-colors">
                  <Zap size={15} />Tell Ravi what you're working on
                </button>
              )}
            </div>
          )}

          {/* Admin grid view */}
          {isAdmin && (
            <>
              {isAdmin && notSubmittedPriority.length > 0 && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                  <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">Haven't submitted priority ({notSubmittedPriority.length})</p>
                    <p className="text-xs text-amber-600">{notSubmittedPriority.join(', ')}</p>
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                {data.members.filter(m => !ADMINS.includes(m)).map(member => {
                  const e = data.entries[member] || {};
                  const hasEntry = !!e.focus?.trim();
                  return (
                    <div key={member} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${e.waitingOnRavi ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center flex-shrink-0">{member[0]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800">{member}</p>
                          {e.focusUpdatedAt && <p className="text-xs text-gray-400">{timeAgo(e.focusUpdatedAt)}</p>}
                        </div>
                        {e.waitingOnRavi && (
                          <span className="flex items-center gap-1 text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            <Bell size={11} />Waiting
                          </span>
                        )}
                      </div>
                      {hasEntry ? (
                        <div>
                          <p className="text-sm text-gray-600 leading-relaxed">{e.focus}</p>
                          {e.waitingOnRavi && e.waitReason && (
                            <div className="mt-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                              <p className="text-xs text-red-600">{e.waitReason}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300 italic">No update submitted</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ══ WEEKEND TAB ══ */}
      {activeTab === 'weekend' && (
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

          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-40">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{fmtDay(sat)}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Sat Time</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{fmtDay(sun)}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Sun Time</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.members.filter(m => !ADMINS.includes(m)).map(member => {
                  const e = data.entries[member] || {};
                  const isMe = identity === member;
                  const editable = canEdit(member);
                  return (
                    <tr key={member} onClick={() => editable && setEditWeekend(member)}
                      className={`transition-colors ${editable ? 'cursor-pointer hover:bg-blue-50/40' : ''} ${isMe ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{member[0]}</span>
                          <span className={`font-medium ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>{member}</span>
                          {ADMINS.includes(member) && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Admin</span>}
                        </div>
                      </td>
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
            {data.members.filter(m => !ADMINS.includes(m)).map(member => {
              const e = data.entries[member] || {};
              const isMe = identity === member;
              const editable = canEdit(member);
              return (
                <div key={member} onClick={() => editable && setEditWeekend(member)}
                  className={`bg-white border rounded-2xl px-4 py-3.5 shadow-sm transition-all ${isMe ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'} ${editable ? 'cursor-pointer active:scale-95' : ''}`}>
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
