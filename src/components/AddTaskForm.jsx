import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { createTask } from '../lib/storage';

const PRIORITIES = [
  { value: 'very_high', label: '🔴 Very High' },
  { value: 'high',      label: '🟠 High'      },
  { value: 'medium',    label: '🟡 Medium'    },
  { value: 'low',       label: '🟢 Low'       },
];

export default function AddTaskForm() {
  const [title, setTitle]       = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes]       = useState('');
  const [eta, setEta]           = useState('');
  const [open, setOpen]         = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    createTask({
      id:       crypto.randomUUID(),
      title:    title.trim(),
      priority,
      notes:    notes.trim(),
      eta:      eta || undefined,
      status:   'todo',
    }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    setTitle(''); setNotes(''); setPriority('medium'); setEta(''); setOpen(false);
  };

  return (
    <div className="mb-4">
      {/* Collapsed — just a big tap target on mobile */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 bg-white border border-dashed border-gray-300 rounded-xl px-4 py-3 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm"
        >
          <Plus size={18} />
          <span>Add new action item...</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <input
            type="text"
            placeholder="Action item title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
          <div className="relative">
            <label className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1">
              <Calendar size={13} /> ETA
            </label>
            <input
              type="date"
              value={eta}
              onChange={e => setEta(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 w-full bg-white"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); setTitle(''); setNotes(''); setPriority('medium'); setEta(''); }}
              className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
