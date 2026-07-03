import { supabase } from './supabase';

export const PRIORITY_LEVELS = [
  { value: 'very_high', label: 'Very High', pill: 'bg-red-100 text-red-700',    dot: 'bg-red-500'    },
  { value: 'high',      label: 'High',      pill: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  { value: 'medium',    label: 'Medium',    pill: 'bg-gray-100 text-gray-600',  dot: 'bg-gray-400'   },
  { value: 'low',       label: 'Low',       pill: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
];

export const STATUS_OPTIONS = [
  { value: 'in_progress',     label: 'In progress',      pill: 'bg-blue-100 text-blue-700'    },
  { value: 'need_your_input', label: 'Need your input',  pill: 'bg-amber-100 text-amber-700'  },
  { value: 'have_a_question', label: 'Have a question',  pill: 'bg-purple-100 text-purple-700' },
  { value: 'blocker',         label: 'Blocker',          pill: 'bg-red-100 text-red-700'      },
  { value: 'done',            label: 'Done',             pill: 'bg-green-100 text-green-700'  },
];

export function getPriority(val) {
  return PRIORITY_LEVELS.find(p => p.value === val) || PRIORITY_LEVELS[2];
}

export function getStatus(val) {
  return STATUS_OPTIONS.find(s => s.value === val) || STATUS_OPTIONS[0];
}

export async function getUpdates() {
  const { data, error } = await supabase
    .from('team_updates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({
    id:          r.id,
    author:      r.author,
    workingOn:   r.working_on || '',
    priority:    r.priority || 'medium',
    text:        r.text || '',
    status:      r.status || 'in_progress',
    raviNotes:   r.ravi_notes || '',
    createdAt:   r.created_at,
  }));
}

export async function addUpdate({ author, workingOn, priority, text, status }) {
  const { error } = await supabase.from('team_updates').insert({
    id:         crypto.randomUUID(),
    author,
    working_on: workingOn,
    priority,
    text,
    status,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function updateUpdate(id, { workingOn, priority, text, status }) {
  const row = {};
  if (workingOn !== undefined) row.working_on = workingOn;
  if (priority  !== undefined) row.priority   = priority;
  if (text      !== undefined) row.text        = text;
  if (status    !== undefined) row.status      = status;
  const { error } = await supabase.from('team_updates').update(row).eq('id', id);
  if (error) throw error;
}

export async function saveUpdateNote(id, raviNotes) {
  const { error } = await supabase.from('team_updates').update({ ravi_notes: raviNotes }).eq('id', id);
  if (error) throw error;
}

export async function deleteUpdate(id) {
  const { error } = await supabase.from('team_updates').delete().eq('id', id);
  if (error) throw error;
}
