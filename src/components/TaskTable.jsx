import { useState } from 'react';
import { Check, SkipForward, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getTasks, saveTasks } from '../lib/storage';
import { PRIORITY_CONFIG } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';

const PRIORITIES = [
  { value: 'very_high', label: 'Very High' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function ActionBtn({ onClick, icon: Icon, hoverColor, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors hover:text-${hoverColor}`}
    >
      <Icon size={15} />
    </button>
  );
}

export default function TaskTable({ tasks, tab }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const sorted = tab === 'active'
    ? [...tasks].sort((a, b) => (PRIORITY_CONFIG[a.priority]?.order ?? 99) - (PRIORITY_CONFIG[b.priority]?.order ?? 99))
    : tasks;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });

  const updateTask = (id, updates) => {
    const all = getTasks();
    saveTasks(all.map(t => t.id === id ? { ...t, ...updates } : t));
    invalidate();
  };

  const deleteTask = (id) => {
    const all = getTasks();
    saveTasks(all.filter(t => t.id !== id));
    invalidate();
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditData({ title: task.title, priority: task.priority, notes: task.notes || '' });
  };

  const saveEdit = (id) => {
    if (!editData.title?.trim()) return;
    updateTask(id, { title: editData.title.trim(), priority: editData.priority, notes: editData.notes });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  if (sorted.length === 0) {
    return <div className="text-center text-gray-400 py-16 text-sm">Nothing here yet.</div>;
  }

  const inputCls = "border border-blue-400 rounded px-2 py-1 w-full bg-white text-gray-800 text-sm focus:outline-none";

  return (
    <>
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        onConfirm={() => { deleteTask(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((task, idx) => {
              const isEditing = editingId === task.id;
              const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              return (
                <tr key={task.id} className={`border-l-4 ${cfg.border} hover:bg-gray-50 transition-colors`}>
                  <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {isEditing ? (
                      <input
                        className={inputCls}
                        value={editData.title}
                        onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') cancelEdit(); }}
                        autoFocus
                      />
                    ) : task.title}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        className={inputCls}
                        value={editData.priority}
                        onChange={e => setEditData(d => ({ ...d, priority: e.target.value }))}
                      >
                        {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {isEditing ? (
                      <input
                        className={inputCls}
                        value={editData.notes}
                        onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
                        placeholder="Notes"
                      />
                    ) : (task.notes || '—')}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(task.id)} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Save</button>
                        <button onClick={cancelEdit} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-0.5">
                        {tab === 'active' ? (
                          <>
                            <ActionBtn onClick={() => updateTask(task.id, { status: 'done' })} icon={Check} hoverColor="green-600" title="Mark done" />
                            <ActionBtn onClick={() => updateTask(task.id, { status: 'skip' })} icon={SkipForward} hoverColor="yellow-600" title="Skip" />
                          </>
                        ) : (
                          <ActionBtn onClick={() => updateTask(task.id, { status: 'todo' })} icon={RotateCcw} hoverColor="blue-600" title="Restore" />
                        )}
                        <ActionBtn onClick={() => startEdit(task)} icon={Pencil} hoverColor="blue-600" title="Edit" />
                        <ActionBtn onClick={() => setDeleteId(task.id)} icon={Trash2} hoverColor="red-600" title="Delete" />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((task, idx) => {
          const isEditing = editingId === task.id;
          const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
          return (
            <div key={task.id} className={`bg-white border border-gray-200 rounded-xl border-l-4 ${cfg.border} p-4`}>
              {isEditing ? (
                <div className="space-y-2">
                  <input className={inputCls} value={editData.title} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} autoFocus />
                  <select className={inputCls} value={editData.priority} onChange={e => setEditData(d => ({ ...d, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <input className={inputCls} placeholder="Notes" value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(task.id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Save</button>
                    <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-1">
                    <span className="font-medium text-gray-900 text-sm">{idx + 1}. {task.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className="text-xs text-gray-500">{cfg.label}</span>
                    {task.notes && <span className="text-xs text-gray-400">· {task.notes}</span>}
                  </div>
                  <div className="flex gap-1">
                    {tab === 'active' ? (
                      <>
                        <ActionBtn onClick={() => updateTask(task.id, { status: 'done' })} icon={Check} hoverColor="green-600" title="Mark done" />
                        <ActionBtn onClick={() => updateTask(task.id, { status: 'skip' })} icon={SkipForward} hoverColor="yellow-600" title="Skip" />
                      </>
                    ) : (
                      <ActionBtn onClick={() => updateTask(task.id, { status: 'todo' })} icon={RotateCcw} hoverColor="blue-600" title="Restore" />
                    )}
                    <ActionBtn onClick={() => startEdit(task)} icon={Pencil} hoverColor="blue-600" title="Edit" />
                    <ActionBtn onClick={() => setDeleteId(task.id)} icon={Trash2} hoverColor="red-600" title="Delete" />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
