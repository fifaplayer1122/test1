import { supabase } from './supabase';

export const CATEGORIES = {
  update:   { label: 'Update',   color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  blocker:  { label: 'Blocker',  color: 'bg-red-100 text-red-700',      dot: 'bg-red-500'    },
  question: { label: 'Question', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  fyi:      { label: 'FYI',      color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'   },
};

export async function getUpdates() {
  const { data, error } = await supabase
    .from('team_updates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  // One-time migration from localStorage
  if (data.length === 0) {
    const local = localStorage.getItem('ceo_team_updates');
    if (local) {
      const seed = JSON.parse(local);
      if (seed.length > 0) {
        await supabase.from('team_updates').insert(
          seed.map(u => ({
            id:         u.id || crypto.randomUUID(),
            author:     u.author,
            text:       u.text,
            category:   u.category || 'update',
            created_at: u.createdAt || new Date().toISOString(),
          }))
        );
        return seed;
      }
    }
  }

  return data || [];
}

export async function addUpdate(entry) {
  const { error } = await supabase.from('team_updates').insert({
    id:         entry.id,
    author:     entry.author,
    text:       entry.text,
    category:   entry.category,
    created_at: entry.createdAt,
  });
  if (error) throw error;
}

export async function deleteUpdate(id) {
  const { error } = await supabase.from('team_updates').delete().eq('id', id);
  if (error) throw error;
}
