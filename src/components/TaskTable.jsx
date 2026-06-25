import { useState } from 'react';
import { Check, SkipForward, Pencil, Trash2, RotateCcw, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getTasks, saveTasks } from '../lib/storage';
import { PRIORITY_CONFIG } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';

const PRIORITIES = [
  { value: 'very_high', label: '🔴 Very High' },
  { value: 'high',      label: '🟠 High'      },
  { value: 'medium',    label: '🟡 Medium'    },
  { value: 'low',       label: '🟢 Low'       },
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

export default function TaskTable({ tasks, tab }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData]   = useState({});
  const [deleteId, setDeleteId]   = useState(null);
  const queryClient = useQueryClient();

  const sorted = tab === 'active'
    ? [...tasks].sort((a, b) => (PRIORITY_CONFIG[a.priority]?.order ?? 99) - (PRIORITY_CONFIG[b.priority]?.order ?? 99))
    : tasks;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });
  const updateTask = (id, updates) => { saveTasks(getTasks().map(t => t.id === id ? { ...t, ...updates } : t)); invalidate(); };
  const deleteTask = (id) => { saveTasks(getTasks().filter(t => t.id !== id)); invalidate(); };
  const startEdit  = (task) => { setEditingId(task.id); setEditData({ title: task.title, priority: task.priority, notes: task.notes || '' }); };
  const saveEdit   = (id) => { if (!editData.title?.trim()) return; updateTask(id, editData); setEditingId(null); };
  const cancelEdit = () => setEditingId(null);

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

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Task</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase w-32">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Notes</th>
              <th className="px-4 py-3 w-36"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((task, idx) => {
              const isEditing = editingId === task.id;
              const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
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
                    {isEditing ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => saveEdit(task.id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 font-medium">Save</button>
                        <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {tab === 'active' ? (
                          <>
                            <ActionBtn onClick={() => updateTask(task.id, { status: 'done' })} icon={Check} color="text-gray-400 hover:bg-green-50 hover:text-green-600" title="Mark done" />
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

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-2.5">
        {sorted.map((task, idx) => {
          const isEditing = editingId === task.id;
          const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
          return (
            <div key={task.id} className={`bg-white border border-gray-200 rounded-xl border-l-4 ${cfg.border} shadow-sm`}>
              {isEditing ? (
                <div className="p-4 space-y-2.5">
                  <input className={inputCls} value={editData.title} autoFocus onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} placeholder="Task title" />
                  <select className={`${inputCls} bg-white`} value={editData.priority} onChange={e => setEditData(d => ({ ...d, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <input className={inputCls} placeholder="Notes (optional)" value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => saveEdit(task.id)} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium">Save</button>
                    <button onClick={cancelEdit} className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg"><X size={14} className="inline mr-1" />Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{idx + 1}. {task.title}</p>
                      {task.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{task.notes}</p>}
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                      task.priority === 'very_high' ? 'bg-red-50 text-red-600' :
                      task.priority === 'high'      ? 'bg-orange-50 text-orange-600' :
                      task.priority === 'medium'    ? 'bg-yellow-50 text-yellow-700' :
                                                     'bg-green-50 text-green-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex gap-1.5 pt-1 border-t border-gray-100">
                    {tab === 'active' ? (
                      <>
                        <button onClick={() => updateTask(task.id, { status: 'done' })} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100">
                          <Check size={13} /> Done
                        </button>
                        <button onClick={() => updateTask(task.id, { status: 'skip' })} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-medium hover:bg-yellow-100">
                          <SkipForward size={13} /> Skip
                        </button>
                      </>
                    ) : (
                      <button onClick={() => updateTask(task.id, { status: 'todo' })} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100">
                        <RotateCcw size={13} /> Restore
                      </button>
                    )}
                    <button onClick={() => startEdit(task)} className="flex items-center justify-center w-9 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteId(task.id)} className="flex items-center justify-center w-9 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
