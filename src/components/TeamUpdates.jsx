import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, X, ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, MessageSquare } from 'lucide-react';
import {
  getUpdates, addUpdate, updateUpdate, deleteUpdate, saveUpdateNote,
  PRIORITY_LEVELS, STATUS_OPTIONS, getPriority, getStatus,
} from '../lib/updatesStorage';
import { ADMINS, getIdentity, getWeekendData } from '../lib/teamStorage';
import { getAccount, CLIENT_ID } from '../lib/auth';

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700', 'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700', 'from-orange-400 to-orange-600',
  'from-pink-500 to-pink-700', 'from-cyan-500 to-cyan-700',
  'from-rose-500 to-rose-700', 'from-indigo-500 to-indigo-700',
  'from-teal-500 to-teal-700', 'from-amber-500 to-amber-600',
];

function resolveIdentity() {
  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  if (authEnabled) {
    const account = getAccount();
    if (account) return (account.name || account.username || '');
  }
  return getIdentity();
}

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ── Update form modal ── */
function UpdateModal({ identity, existing, onSave, onClose }) {
  const [workingOn, setWorkingOn] = useState(existing?.workingOn || '');
  const [priority, setPriority]   = useState(existing?.priority || 'medium');
  const [text, setText]           = useState(existing?.text || '');
  const [status, setStatus]       = useState(existing?.status || 'in_progress');

  const isEdit = !!existing;
  const canSave = workingOn.trim() && text.trim();

  const save = () => {
    if (!canSave) return;
    onSave({ workingOn: workingOn.trim(), priority, text: text.trim(), status });
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white";
  const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(identity)} text-white text-sm font-bold flex items-center justify-center`}>
              {identity[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit update' : 'Post update'}</p>
              <p className="text-xs text-gray-400">{identity}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Working on */}
          <div>
            <label className={labelCls}>What are you working on?</label>
            <input value={workingOn} onChange={e => setWorkingOn(e.target.value)} autoFocus
              placeholder="e.g. CLM competitive analysis, Website redesign…"
              className={inputCls} />
          </div>

          {/* Priority */}
          <div>
            <label className={labelCls}>Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITY_LEVELS.map(pl => (
                <button key={pl.value} onClick={() => setPriority(pl.value)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                    priority === pl.value ? `${pl.pill} border-current` : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}>
                  {pl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Update text */}
          <div>
            <label className={labelCls}>Update / Details</label>
            <textarea rows={3} value={text} onChange={e => setText(e.target.value)}
              placeholder="What's happening? Any blockers or decisions needed?"
              className={`${inputCls} resize-none`} />
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(s => (
                <button key={s.value} onClick={() => setStatus(s.value)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    status === s.value ? `${s.pill} border-current` : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={!canSave}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
            {isEdit ? 'Save changes' : 'Post update'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Single update row ── */
function UpdateRow({ update, isAdmin, isMine, onEdit, onDelete, onSaveNote, avatarColorClass }) {
  const [notesOpen, setNotesOpen]   = useState(false);
  const [noteDraft, setNoteDraft]   = useState(update.raviNotes || '');
  const [menuOpen, setMenuOpen]     = useState(false);

  const pl = getPriority(update.priority);
  const st = getStatus(update.status);

  return (
    <tr className="group hover:bg-gray-50/50 transition-colors">
      {/* Working on */}
      <td className="px-4 py-3 text-sm font-medium text-gray-800 max-w-[160px]">
        <p className="truncate" title={update.workingOn}>{update.workingOn || <span className="text-gray-300 italic text-xs">—</span>}</p>
      </td>

      {/* Priority */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${pl.pill}`}>
          {pl.label}
        </span>
      </td>

      {/* Update text */}
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
        <p className="line-clamp-2 leading-snug">{update.text}</p>
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${st.pill}`}>
          {st.label}
        </span>
      </td>

      {/* Notes */}
      <td className="px-4 py-3 whitespace-nowrap">
        {isAdmin ? (
          <div className="relative">
            <button
              onClick={() => { setNotesOpen(!notesOpen); setMenuOpen(false); }}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                update.raviNotes
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              {notesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        ) : update.raviNotes ? (
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border bg-indigo-50 border-indigo-200 text-indigo-600 font-medium"
          >
            {notesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        )}
      </td>

      {/* Actions (edit/delete for own items) */}
      {(isMine || isAdmin) && (
        <td className="px-2 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isMine && (
              <>
                <button onClick={onEdit} className="p-1.5 text-gray-300 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"><Pencil size={13} /></button>
                <button onClick={onDelete} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
              </>
            )}
          </div>
        </td>
      )}

      {/* Notes expanded row — handled below via fragment trick */}
    </tr>
  );
}

export default function TeamUpdates() {
  const [identity, setIdentity] = useState(resolveIdentity);
  const qc = useQueryClient();

  // Load members (shared cache with WeekendAvailability) for identity matching
  const { data: hubData } = useQuery({ queryKey: ['teamHub'], queryFn: getWeekendData });
  const members = hubData?.members || [];

  // Match full Outlook name (e.g. "Aditya Simhadri") to the exact member record
  useEffect(() => {
    if (!identity || members.length === 0) return;
    if (members.includes(identity) || ADMINS.includes(identity)) return;
    const firstName = identity.split(' ')[0];
    const match = members.find(m => m === firstName || m.split(' ')[0] === firstName);
    if (match) setIdentity(match);
  }, [members]);

  const isAdmin = ADMINS.some(a => identity === a || (identity || '').split(' ')[0] === a);
  const { data: updates = [] } = useQuery({ queryKey: ['updates'], queryFn: getUpdates });

  const [modal, setModal]       = useState(null); // null | { existing: null|update }
  const [expandedNotes, setExpandedNotes] = useState({}); // { updateId: bool }
  const [noteDrafts, setNoteDrafts]       = useState({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ['updates'] });

  const handleSave = async (fields) => {
    try {
      if (modal.existing) {
        await updateUpdate(modal.existing.id, fields);
      } else {
        await addUpdate({ author: identity, ...fields });
      }
      invalidate();
      setModal(null);
    } catch (err) {
      alert('Failed to save update: ' + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    await deleteUpdate(id);
    invalidate();
  };

  const handleSaveNote = async (id) => {
    await saveUpdateNote(id, noteDrafts[id] || '');
    invalidate();
    setExpandedNotes(e => ({ ...e, [id]: false }));
  };

  /* Group by author, preserving insertion order */
  const authors = [];
  const byAuthor = {};
  for (const u of updates) {
    if (!byAuthor[u.author]) { byAuthor[u.author] = []; authors.push(u.author); }
    byAuthor[u.author].push(u);
  }

  /* Members only see their own group */
  const visibleAuthors = isAdmin ? authors : authors.filter(a => a === identity);

  /* If member has no updates yet, show empty state for them */
  const showSelf = !isAdmin && identity && !byAuthor[identity];

  const hasBlocker = (list) => list.some(u => u.status === 'blocker');

  return (
    <div>
      {modal && identity && (
        <UpdateModal
          identity={identity}
          existing={modal.existing}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Team Updates</h2>
          <p className="text-xs text-gray-400">
            {isAdmin
              ? `${authors.length} member${authors.length !== 1 ? 's' : ''} · ${updates.length} update${updates.length !== 1 ? 's' : ''}`
              : 'Your updates visible to Ravi'}
          </p>
        </div>
        {identity && (
          <button onClick={() => setModal({ existing: null })}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
            <Plus size={15} />Post Update
          </button>
        )}
      </div>

      {/* Empty state for member with no posts */}
      {showSelf && (
        <div className="bg-white border border-dashed border-blue-200 rounded-2xl py-10 text-center mb-4">
          <MessageSquare size={28} className="mx-auto mb-3 text-blue-300" />
          <p className="text-sm font-medium text-gray-600 mb-1">No updates yet</p>
          <p className="text-xs text-gray-400 mb-4">Share your current priorities and status with Ravi</p>
          <button onClick={() => setModal({ existing: null })}
            className="text-sm bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-700">
            Post your first update
          </button>
        </div>
      )}

      {/* Empty state for admin */}
      {isAdmin && authors.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No updates yet</p>
          <p className="text-xs mt-1 text-gray-300">Team members haven't posted any updates.</p>
        </div>
      )}

      {/* Per-author sections */}
      <div className="space-y-3">
        {visibleAuthors.map((author, authorIdx) => {
          const items = byAuthor[author];
          const isMine = author === identity;
          const color  = avatarColor(author);
          const blocker = hasBlocker(items);

          return (
            <div key={author} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Author header */}
              <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${blocker ? 'border-red-100 bg-red-50/30' : 'border-gray-100 bg-gray-50'}`}>
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {author[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-900">{author}</p>
                    {blocker && (
                      <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Blocker</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{items.length} update{items.length !== 1 ? 's' : ''}</p>
                </div>
                {isMine && (
                  <button onClick={() => setModal({ existing: null })}
                    className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2.5 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                    <Plus size={12} />Add
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-40">Working on</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Priority</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Update</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-36">Status</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Notes</th>
                      {(isMine || isAdmin) && <th className="px-2 py-2.5 w-16" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map(update => {
                      const pl = getPriority(update.priority);
                      const st = getStatus(update.status);
                      const noteOpen = !!expandedNotes[update.id];

                      return (
                        <>
                          <tr key={update.id} className="group hover:bg-gray-50/50 transition-colors">
                            {/* Working on */}
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                              <p className="truncate max-w-[148px]" title={update.workingOn}>{update.workingOn || <span className="text-gray-300 italic text-xs">—</span>}</p>
                            </td>

                            {/* Priority */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${pl.pill}`}>
                                {pl.label}
                              </span>
                            </td>

                            {/* Update */}
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <p className="line-clamp-2 leading-snug">{update.text}</p>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${st.pill}`}>
                                {st.label}
                              </span>
                            </td>

                            {/* Notes toggle */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {(isAdmin || update.raviNotes) ? (
                                <button
                                  onClick={() => {
                                    setExpandedNotes(e => ({ ...e, [update.id]: !e[update.id] }));
                                    setNoteDrafts(d => ({ ...d, [update.id]: update.raviNotes || '' }));
                                  }}
                                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                                    update.raviNotes
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                      : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                  }`}
                                >
                                  {noteOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                              ) : (
                                <span className="text-gray-300 text-sm">—</span>
                              )}
                            </td>

                            {/* Edit / Delete */}
                            {(isMine || isAdmin) && (
                              <td className="px-2 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isMine && (
                                    <button onClick={() => setModal({ existing: update })}
                                      className="p-1.5 text-gray-300 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors">
                                      <Pencil size={13} />
                                    </button>
                                  )}
                                  {(isMine || isAdmin) && (
                                    <button onClick={() => handleDelete(update.id)}
                                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>

                          {/* Notes expanded row */}
                          {noteOpen && (
                            <tr key={`${update.id}-notes`} className="bg-indigo-50/30">
                              <td colSpan={isMine || isAdmin ? 6 : 5} className="px-5 py-3">
                                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                  <MessageSquare size={11} />
                                  {isAdmin ? "Ravi's Notes" : "Note from Ravi"}
                                </p>
                                {isAdmin ? (
                                  <div>
                                    <textarea
                                      rows={2}
                                      value={noteDrafts[update.id] ?? update.raviNotes ?? ''}
                                      onChange={e => setNoteDrafts(d => ({ ...d, [update.id]: e.target.value }))}
                                      autoFocus
                                      placeholder="Add your feedback or direction…"
                                      className="w-full border border-indigo-200 bg-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => setExpandedNotes(e => ({ ...e, [update.id]: false }))}
                                        className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium hover:bg-white">
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSaveNote(update.id)}
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">
                                        Save Note
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-indigo-700">{update.raviNotes}</p>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
