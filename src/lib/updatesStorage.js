const KEY = 'ceo_team_updates';

export const CATEGORIES = {
  update:   { label: 'Update',   color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  blocker:  { label: 'Blocker',  color: 'bg-red-100 text-red-700',     dot: 'bg-red-500'    },
  question: { label: 'Question', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  fyi:      { label: 'FYI',      color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400'   },
};

export function getUpdates() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

export function saveUpdates(updates) {
  localStorage.setItem(KEY, JSON.stringify(updates));
}

export function addUpdate(entry) {
  const all = getUpdates();
  const next = [entry, ...all];
  saveUpdates(next);
  return next;
}
