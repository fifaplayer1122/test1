import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getTasks, saveTasks } from '../lib/storage';

const PRIORITIES = [
  { value: 'very_high', label: '🔴 Very High' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

export default function AddTaskForm() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const tasks = getTasks();
    const newTask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      priority,
      notes: notes.trim(),
      status: 'todo',
      created_at: new Date().toISOString(),
    };
    saveTasks([...tasks, newTask]);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setTitle('');
    setNotes('');
    setPriority('medium');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <PlusCircle className="text-gray-400 flex-shrink-0" size={18} />
        <input
          type="text"
          placeholder="Add a new action item..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        />
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
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
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-w-0"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </div>
    </form>
  );
}
