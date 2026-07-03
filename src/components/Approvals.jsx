import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, X, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  Pencil, Trash2, MessageSquare, Package, AlertTriangle,
} from 'lucide-react';
import {
  getApprovals, submitApproval, updateApproval, decideApproval, deleteApproval,
  APPROVAL_CATEGORIES, APPROVAL_PRIORITIES, getCategory, getPriority, getApprovalStatus,
} from '../lib/approvalsStorage';
import { ADMINS, getIdentity, getWeekendData, ensureMember } from '../lib/teamStorage';
import { getAccount, CLIENT_ID } from '../lib/auth';

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700', 'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700', 'from-orange-400 to-orange-600',
  'from-pink-500 to-pink-700', 'from-cyan-500 to-cyan-700',
  'from-rose-500 to-rose-700', 'from-indigo-500 to-indigo-700',
  'from-teal-500 to-teal-700', 'from-amber-500 to-amber-600',
];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function resolveIdentity() {
  const authEnabled = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID';
  if (authEnabled) {
    const account = getAccount();
    if (account) return (account.name || account.username || '');
  }
  return getIdentity();
}

/* ── Request form modal ── */
function RequestModal({ identity, existing, onSave, onClose }) {
  const [title, setTitle]       = useState(existing?.title || '');
  const [category, setCategory] = useState(existing?.category || 'software');
  const [reason, setReason]     = useState(existing?.reason || '');
  const [cost, setCost]         = useState(existing?.cost || '');
  const [priority, setPriority] = useState(existing?.priority || 'normal');

  const isEdit  = !!existing;
  const canSave = title.trim() && reason.trim();

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white";
  const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">{isEdit ? 'Edit request' : 'New approval request'}</p>
            <p className="text-xs text-gray-400">from {identity}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* What do you need */}
          <div>
            <label className={labelCls}>What do you need?</label>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              placeholder="e.g. Figma Pro, MacBook RAM upgrade, Zoom license…"
              className={inputCls} />
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category</label>
            <div className="grid grid-cols-3 gap-2">
              {APPROVAL_CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    category === c.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <span className="text-base">{c.emoji}</span>
                  <span className="leading-tight text-center">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className={labelCls}>Why do you need this?</label>
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Explain the business reason or what problem this solves…"
              className={`${inputCls} resize-none`} />
          </div>

          {/* Cost + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Estimated Cost</label>
              <input value={cost} onChange={e => setCost(e.target.value)}
                placeholder="e.g. $49/mo, $1,200 one-time"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Urgency</label>
              <div className="flex flex-col gap-1.5">
                {APPROVAL_PRIORITIES.map(p => (
                  <button key={p.value} onClick={() => setPriority(p.value)}
                    className={`w-full py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      priority === p.value ? `${p.pill} border-current` : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 px-5 pb-5 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={() => canSave && onSave({ title, category, reason, cost, priority })} disabled={!canSave}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
            {isEdit ? 'Save changes' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Decision modal (admin: approve / reject) ── */
function DecisionModal({ request, decision, onConfirm, onClose }) {
  const [note, setNote] = useState('');
  const isApprove = decision === 'approved';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isApprove ? 'bg-green-100' : 'bg-red-100'}`}>
            {isApprove ? <CheckCircle2 size={20} className="text-green-600" /> : <XCircle size={20} className="text-red-500" />}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{isApprove ? 'Approve request' : 'Reject request'}</p>
            <p className="text-xs text-gray-400 truncate max-w-[200px]">{request.title}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="px-5 py-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            {isApprove ? 'Note (optional)' : 'Reason for rejection'}
          </label>
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} autoFocus
            placeholder={isApprove ? 'Any conditions or comments…' : 'Explain why this is being rejected…'}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none" />
        </div>
        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm(note)}
            disabled={!isApprove && !note.trim()}
            className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${
              isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}>
            {isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Single request card (admin view) ── */
function AdminRequestCard({ req, onDecide, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cat  = getCategory(req.category);
  const pri  = getPriority(req.priority);
  const st   = getApprovalStatus(req.status);
  const color = avatarColor(req.requestedBy);

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${
      req.status === 'pending' ? 'border-amber-200' : req.status === 'approved' ? 'border-green-200' : 'border-red-200'
    }`}>
      {/* Top row */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}>
          {req.requestedBy?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-gray-900 truncate">{req.title}</p>
            <span className="text-xs text-gray-400 flex-shrink-0">{cat.emoji} {cat.label}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">{req.requestedBy}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{timeAgo(req.createdAt)}</span>
            {req.cost && <><span className="text-gray-300">·</span><span className="text-xs font-semibold text-gray-700">{req.cost}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pri.pill}`}>{pri.label}</span>
          <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${st.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>
      </div>

      {/* Reason / expand */}
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-2 px-4 pb-3 text-left">
        <p className={`text-xs text-gray-500 flex-1 ${expanded ? '' : 'line-clamp-1'}`}>{req.reason}</p>
        {expanded ? <ChevronUp size={13} className="text-gray-300 flex-shrink-0" /> : <ChevronDown size={13} className="text-gray-300 flex-shrink-0" />}
      </button>

      {/* Admin note (if decided) */}
      {req.adminNote && (
        <div className={`mx-4 mb-3 px-3 py-2.5 rounded-xl text-xs ${req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          <span className="font-semibold">Ravi: </span>{req.adminNote}
        </div>
      )}

      {/* Actions */}
      <div className={`flex items-center gap-2 px-4 pb-3.5 border-t border-gray-50 pt-3`}>
        {req.status === 'pending' ? (
          <>
            <button onClick={() => onDecide(req, 'approved')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
              <CheckCircle2 size={13} />Approve
            </button>
            <button onClick={() => onDecide(req, 'rejected')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
              <XCircle size={13} />Reject
            </button>
          </>
        ) : (
          <button onClick={() => onDecide(req, req.status === 'approved' ? 'rejected' : 'approved')}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium">
            Change decision
          </button>
        )}
        <button onClick={() => onDelete(req.id)} className="ml-auto p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Member's own request card ── */
function MemberRequestCard({ req, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cat = getCategory(req.category);
  const pri = getPriority(req.priority);
  const st  = getApprovalStatus(req.status);

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${
      req.status === 'pending' ? 'border-gray-200' : req.status === 'approved' ? 'border-green-200 ring-1 ring-green-100' : 'border-red-200 ring-1 ring-red-50'
    }`}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="text-2xl flex-shrink-0 mt-0.5">{cat.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">{req.title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">{cat.label}</span>
            {req.cost && <><span className="text-gray-300">·</span><span className="text-xs font-semibold text-gray-700">{req.cost}</span></>}
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{timeAgo(req.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${st.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>
      </div>

      {/* Expandable reason */}
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-2 px-4 pb-3 text-left">
        <p className={`text-xs text-gray-500 flex-1 ${expanded ? '' : 'line-clamp-1'}`}>{req.reason}</p>
        {expanded ? <ChevronUp size={13} className="text-gray-300 flex-shrink-0" /> : <ChevronDown size={13} className="text-gray-300 flex-shrink-0" />}
      </button>

      {/* Ravi's response */}
      {req.adminNote && (
        <div className={`mx-4 mb-3 px-3 py-2.5 rounded-xl flex items-start gap-2 ${
          req.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <MessageSquare size={13} className={`flex-shrink-0 mt-0.5 ${req.status === 'approved' ? 'text-green-500' : 'text-red-400'}`} />
          <div>
            <p className={`text-xs font-semibold mb-0.5 ${req.status === 'approved' ? 'text-green-700' : 'text-red-600'}`}>
              {req.status === 'approved' ? 'Approved' : 'Rejected'} — Ravi's note
            </p>
            <p className={`text-xs ${req.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>{req.adminNote}</p>
          </div>
        </div>
      )}

      {/* Edit / delete (only for pending) */}
      {req.status === 'pending' && (
        <div className="flex items-center gap-2 px-4 pb-3.5 border-t border-gray-50 pt-3">
          <button onClick={() => onEdit(req)}
            className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 font-medium">
            <Pencil size={12} />Edit
          </button>
          <button onClick={() => onDelete(req.id)}
            className="flex items-center gap-1 text-xs text-red-400 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-50 font-medium">
            <Trash2 size={12} />Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function Approvals() {
  const [identity, setIdentity] = useState(resolveIdentity);
  const qc = useQueryClient();

  const { data: hubData } = useQuery({ queryKey: ['teamHub'], queryFn: getWeekendData });
  const members = hubData?.members || [];

  useEffect(() => {
    if (!identity || members.length === 0) return;
    const isAdm = ADMINS.some(a => identity === a || identity.split(' ')[0] === a);
    if (isAdm) return;
    if (members.includes(identity)) { ensureMember(identity); return; }
    const firstName = identity.split(' ')[0];
    const match = members.find(m => m === firstName || m.split(' ')[0] === firstName);
    if (match) { setIdentity(match); ensureMember(match); }
    else ensureMember(identity);
  }, [members, identity]);

  const isAdmin = ADMINS.some(a => identity === a || (identity || '').split(' ')[0] === a);

  const { data: approvals = [] } = useQuery({ queryKey: ['approvals'], queryFn: getApprovals });

  const [requestModal, setRequestModal] = useState(null); // null | { existing: null|req }
  const [decisionModal, setDecisionModal] = useState(null); // null | { req, decision }
  const [filter, setFilter] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'

  const invalidate = () => qc.invalidateQueries({ queryKey: ['approvals'] });

  const handleSave = async (fields) => {
    try {
      if (requestModal.existing) {
        await updateApproval(requestModal.existing.id, fields);
      } else {
        await submitApproval({ requestedBy: identity, ...fields });
      }
      invalidate();
      setRequestModal(null);
    } catch (err) {
      alert('Failed to submit request: ' + (err.message || err));
    }
  };

  const handleDecide = async (note) => {
    try {
      await decideApproval(decisionModal.req.id, decisionModal.decision, note);
      invalidate();
      setDecisionModal(null);
    } catch (err) {
      alert('Failed to update status: ' + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteApproval(id);
      invalidate();
    } catch (err) {
      alert('Failed to delete: ' + (err.message || err));
    }
  };

  // Admin: filter tabs
  const pending  = approvals.filter(r => r.status === 'pending');
  const approved = approvals.filter(r => r.status === 'approved');
  const rejected = approvals.filter(r => r.status === 'rejected');

  const adminFiltered = filter === 'all' ? approvals
    : filter === 'pending'  ? pending
    : filter === 'approved' ? approved
    : rejected;

  // Member: own requests
  const myRequests = approvals.filter(r => r.requestedBy === identity);

  return (
    <div>
      {requestModal && identity && (
        <RequestModal
          identity={identity}
          existing={requestModal.existing}
          onSave={handleSave}
          onClose={() => setRequestModal(null)}
        />
      )}
      {decisionModal && (
        <DecisionModal
          request={decisionModal.req}
          decision={decisionModal.decision}
          onConfirm={handleDecide}
          onClose={() => setDecisionModal(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Approval Requests</h2>
          <p className="text-xs text-gray-400">
            {isAdmin
              ? `${pending.length} pending · ${approved.length} approved · ${rejected.length} rejected`
              : 'Request purchases, software, access, and more'}
          </p>
        </div>
        {identity && (
          <button onClick={() => setRequestModal({ existing: null })}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
            <Plus size={15} />New Request
          </button>
        )}
      </div>

      {/* ══ ADMIN VIEW ══ */}
      {isAdmin && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { id: 'pending',  label: 'Pending',  count: pending.length,  cls: 'text-amber-600 bg-amber-50 border-amber-200' },
              { id: 'approved', label: 'Approved', count: approved.length, cls: 'text-green-600 bg-green-50 border-green-200' },
              { id: 'rejected', label: 'Rejected', count: rejected.length, cls: 'text-red-600 bg-red-50 border-red-200'       },
              { id: 'all',      label: 'All',      count: approvals.length, cls: 'text-gray-600 bg-gray-100 border-gray-200'  },
            ].map(t => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  filter === t.id ? t.cls : 'text-gray-400 bg-white border-gray-200 hover:border-gray-300'
                }`}>
                {t.label}
                {t.count > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    filter === t.id ? 'bg-white/60' : 'bg-gray-100 text-gray-500'
                  }`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {adminFiltered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No {filter === 'all' ? '' : filter} requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adminFiltered.map(req => (
                <AdminRequestCard
                  key={req.id}
                  req={req}
                  onDecide={(r, d) => setDecisionModal({ req: r, decision: d })}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ MEMBER VIEW ══ */}
      {!isAdmin && (
        <>
          {myRequests.length === 0 ? (
            <div className="bg-white border border-dashed border-blue-200 rounded-2xl py-12 text-center">
              <Package size={28} className="mx-auto mb-3 text-blue-300" />
              <p className="text-sm font-semibold text-gray-700 mb-1">No requests yet</p>
              <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">
                Need a software license, hardware, or any purchase approved by Ravi? Submit a request here.
              </p>
              <button onClick={() => setRequestModal({ existing: null })}
                className="text-sm bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-700">
                Submit your first request
              </button>
            </div>
          ) : (
            <>
              {/* Pending alert */}
              {myRequests.some(r => r.status === 'pending') && (
                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
                  <Clock size={14} className="text-amber-500 flex-shrink-0" />
                  <p className="text-xs font-medium text-amber-700">
                    {myRequests.filter(r => r.status === 'pending').length} request{myRequests.filter(r => r.status === 'pending').length > 1 ? 's' : ''} awaiting Ravi's approval
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {myRequests.map(req => (
                  <MemberRequestCard
                    key={req.id}
                    req={req}
                    onEdit={(r) => setRequestModal({ existing: r })}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
