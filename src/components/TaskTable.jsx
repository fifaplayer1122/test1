import { useState } from 'react';
import { Check, SkipForward, Pencil, Trash2, RotateCcw, X, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { updateTask as dbUpdateTask, deleteTask as dbDeleteTask } from '../lib/storage';
import { PRIORITY_CONFIG } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';

const PRIORITIES = [
  { value: 'very_high', label: '🔴 Very High' },
  { value: 'high',      label: '🟠 High'      },
  { value: 'medium',    label: '🟡 Medium'    },
  { value: 'low',       label: '🟢 Low'       },
];

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'eta',      label: 'ETA'      },
  { value: 'title',    label: 'Title'    },
];

const inputCls = "border border-blue-400 rounded-lg px-2.5 py-2 w-full bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";

function ActionBtn({ onClick, icon: Icon, color, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${color}`}
    >
      <Icon size={15} />
    </button>
  );
}

function formatEta(etaStr) {
  if (!etaStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const etaDate = new Date(etaStr + 'T00:00:00');
  if (etaDate.getTime() === today.getTime()) {
    return { label: 'Today', cls: 'text-orange-500' };
  }
  if (etaDate < today) {
    return { label: 'Overdue', cls: 'text-red-500' };
  }
  const label = etaDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label, cls: 'text-gray-400' };
}

export default function TaskTable({ tasks, tab }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData]   = useState({});
  const [deleteId, setDeleteId]   = useState(null);
  const [doneTask, setDoneTask]   = useState(null); // task pending done confirmation
  const [doneRemark, setDoneRemark] = useState('');
  const [sortBy, setSortBy]       = useState('priority');
  const queryClient = useQueryClient();

  const sortTasks = (list) => {
    if (sortBy === 'priority') {
      return [...list].sort((a, b) => (PRIORITY_CONFIG[a.priority]?.order ?? 99) - (PRIORITY_CONFIG[b.priority]?.order ?? 99));
    }
    if (sortBy === 'eta') {
      return [...list].sort((a, b) => {
        if (!a.eta && !b.eta) return 0;
        if (!a.eta) return 1;
        if (!b.eta) return -1;
        return a.eta.localeCompare(b.eta);
      });
    }
    if (sortBy === 'title') {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  };

  const sorted = sortTasks(tasks);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });
  const updateTask = (id, updates) => { dbUpdateTask(id, updates).then(invalidate); };
  const deleteTask = (id) => { dbDeleteTask(id).then(invalidate); };

  const markDone = (task) => { setDoneTask(task); setDoneRemark(''); };
  const confirmDone = () => {
    if (!doneTask) return;
    updateTask(doneTask.id, { status: 'done', notes: doneRemark.trim() || doneTask.notes });
    setDoneTask(null);
  };
  const startEdit  = (task) => { setEditingId(task.id); setEditData({ title: task.title, priority: task.priority, notes: task.notes || '', eta: task.eta || '' }); };
  const saveEdit   = (id) => { if (!editData.title?.trim()) return; updateTask(id, { ...editData, eta: editData.eta || undefined }); setEditingId(null); };
  const cancelEdit = () => setEditingId(null);

  const [sheetTask, setSheetTask] = useState(null);

  const sheetAction = (fn) => { fn(); setSheetTask(null); };

  if (sorted.length === 0) {
    return (
      <div className="text-center text-gray-400 py-16">
        <p className="text-sm">Nothing here yet.</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        onConfirm={() => { deleteTask(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />

      {/* ── Done remark modal ── */}
      {doneTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDoneTask(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                  <Check size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Mark as Done</p>
                  <p className="text-xs text-gray-400 truncate max-w-[220px]">{doneTask.title}</p>
                </div>
              </div>
              <button onClick={() => setDoneTask(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Done remark <span className="text-gray-300 font-normal normal-case">(optional)</span></p>
              <textarea
                rows={3}
                value={doneRemark}
                onChange={e => setDoneRemark(e.target.value)}
                autoFocus
                placeholder="What was the outcome? Any follow-ups or notes?"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-green-400"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) confirmDone(); }}
              />
              <p className="text-xs text-gray-400 mt-1">⌘+Enter to confirm</p>
            </div>
            <div className="flex gap-2.5 px-5 pb-5">
              <button onClick={() => setDoneTask(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDone} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700">
                Mark Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header bar with sort ── */}
      <div className="flex items-center justify-between mb-3 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{sorted.length} tasks</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 mr-1">Sort</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors font-medium ${
                sortBy === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Task</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase w-32">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Notes</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase w-24">ETA</th>
              <th className="px-4 py-3 w-36"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((task, idx) => {
              const isEditing = editingId === task.id;
              const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const etaInfo = formatEta(task.eta);
              return (
                <tr key={task.id} className={`border-l-4 ${cfg.border} hover:bg-gray-50/80 transition-colors`}>
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {isEditing
                      ? <input className={inputCls} value={editData.title} autoFocus onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') cancelEdit(); }} />
                      : task.title}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? <select className={inputCls} value={editData.priority} onChange={e => setEditData(d => ({ ...d, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
                      : <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${cfg.dot}`} /><span className="text-gray-600 text-xs">{cfg.label}</span></span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {isEditing
                      ? <input className={inputCls} placeholder="Notes" value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }} />
                      : (task.notes || <span className="text-gray-300">—</span>)}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? <input type="date" className={inputCls} value={editData.eta} onChange={e => setEditData(d => ({ ...d, eta: e.target.value }))} />
                      : etaInfo
                        ? <span className={`text-xs font-medium ${etaInfo.cls}`}>📅 {etaInfo.label}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => saveEdit(task.id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 font-medium">Save</button>
                        <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {tab === 'active' ? (
                          <>
                            <ActionBtn onClick={() => markDone(task)} icon={Check} color="text-gray-400 hover:bg-green-50 hover:text-green-600" title="Mark done" />
                            <ActionBtn onClick={() => updateTask(task.id, { status: 'skip' })} icon={SkipForward} color="text-gray-400 hover:bg-yellow-50 hover:text-yellow-600" title="Skip" />
                          </>
                        ) : (
                          <ActionBtn onClick={() => updateTask(task.id, { status: 'todo' })} icon={RotateCcw} color="text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="Restore" />
                        )}
                        <ActionBtn onClick={() => startEdit(task)} icon={Pencil} color="text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="Edit" />
                        <ActionBtn onClick={() => setDeleteId(task.id)} icon={Trash2} color="text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete" />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile list (tap row → action sheet) ── */}
      <div className="md:hidden bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
        {sorted.map((task) => {
          const isEditing = editingId === task.id;
          const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
          const etaInfo = formatEta(task.eta);
          return (
            <div key={task.id} className={`border-l-4 ${cfg.border}`}>
              {isEditing ? (
                <div className="p-3 space-y-2">
                  <input className={inputCls} value={editData.title} autoFocus onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} placeholder="Task title" />
                  <div className="flex gap-2">
                    <select className={`${inputCls} flex-1 bg-white`} value={editData.priority} onChange={e => setEditData(d => ({ ...d, priority: e.target.value }))}>
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <input type="date" className={`${inputCls} flex-1`} value={editData.eta} onChange={e => setEditData(d => ({ ...d, eta: e.target.value }))} />
                  </div>
                  <input className={inputCls} placeholder="Notes (optional)" value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(task.id)} className="flex-1 py-2.5 bg-blue-600 text-white text-sm rounded-xl font-medium">Save</button>
                    <button onClick={cancelEdit} className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm rounded-xl">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors"
                  onClick={() => setSheetTask(task)}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.notes && <span className="text-xs text-gray-400 truncate max-w-[140px]">{task.notes}</span>}
                      {etaInfo && <span className={`text-xs font-medium ${etaInfo.cls}`}>📅 {etaInfo.label}</span>}
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile action sheet ── */}
      {sheetTask && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setSheetTask(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl pb-safe" onClick={e => e.stopPropagation()} style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
            <div className="px-5 mb-4">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${(PRIORITY_CONFIG[sheetTask.priority] || PRIORITY_CONFIG.medium).dot}`} />
                <p className="text-base font-semibold text-gray-900 leading-tight">{sheetTask.title}</p>
              </div>
              {sheetTask.notes && <p className="text-sm text-gray-400 mt-1 pl-5">{sheetTask.notes}</p>}
            </div>
            <div className="px-4 space-y-2">
              {tab === 'active' ? (
                <>
                  <button onClick={() => sheetAction(() => markDone(sheetTask))}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-green-50 text-green-700 font-semibold text-sm active:bg-green-100">
                    <Check size={20} /> Mark as Done
                  </button>
                  <button onClick={() => sheetAction(() => updateTask(sheetTask.id, { status: 'skip' }))}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-yellow-50 text-yellow-700 font-semibold text-sm active:bg-yellow-100">
                    <SkipForward size={20} /> Skip
                  </button>
                </>
              ) : (
                <button onClick={() => sheetAction(() => updateTask(sheetTask.id, { status: 'todo' }))}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-blue-50 text-blue-700 font-semibold text-sm active:bg-blue-100">
                  <RotateCcw size={20} /> Restore to Active
                </button>
              )}
              <button onClick={() => sheetAction(() => startEdit(sheetTask))}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-gray-50 text-gray-700 font-semibold text-sm active:bg-gray-100">
                <Pencil size={20} /> Edit Task
              </button>
              <button onClick={() => sheetAction(() => setDeleteId(sheetTask.id))}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-red-50 text-red-600 font-semibold text-sm active:bg-red-100">
                <Trash2 size={20} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
