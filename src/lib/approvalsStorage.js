import { supabase } from './supabase';

export const APPROVAL_CATEGORIES = [
  { value: 'software',  label: 'Software / SaaS',    emoji: '💻' },
  { value: 'hardware',  label: 'Hardware / Device',  emoji: '🖥️' },
  { value: 'service',   label: 'External Service',   emoji: '🔧' },
  { value: 'travel',    label: 'Travel / Expense',   emoji: '✈️' },
  { value: 'access',    label: 'System Access',      emoji: '🔑' },
  { value: 'other',     label: 'Other',              emoji: '📋' },
];

export const APPROVAL_PRIORITIES = [
  { value: 'urgent', label: 'Urgent', pill: 'bg-red-100 text-red-700'    },
  { value: 'normal', label: 'Normal', pill: 'bg-blue-100 text-blue-700'  },
  { value: 'low',    label: 'Low',    pill: 'bg-gray-100 text-gray-600'  },
];

export const APPROVAL_STATUSES = {
  pending:  { label: 'Pending',  pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400'  },
  approved: { label: 'Approved', pill: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
  rejected: { label: 'Rejected', pill: 'bg-red-100 text-red-600',    dot: 'bg-red-400'    },
};

export function getCategory(val) {
  return APPROVAL_CATEGORIES.find(c => c.value === val) || APPROVAL_CATEGORIES[0];
}
export function getPriority(val) {
  return APPROVAL_PRIORITIES.find(p => p.value === val) || APPROVAL_PRIORITIES[1];
}
export function getApprovalStatus(val) {
  return APPROVAL_STATUSES[val] || APPROVAL_STATUSES.pending;
}

export async function getApprovals() {
  const { data, error } = await supabase
    .from('approval_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map(r => ({
    id:          r.id,
    requestedBy: r.requested_by,
    title:       r.title,
    category:    r.category || 'software',
    reason:      r.reason || '',
    cost:        r.cost || '',
    priority:    r.priority || 'normal',
    status:      r.status || 'pending',
    adminNote:   r.admin_note || '',
    createdAt:   r.created_at,
    updatedAt:   r.updated_at,
  }));
}

export async function submitApproval({ requestedBy, title, category, reason, cost, priority }) {
  const { error } = await supabase.from('approval_requests').insert({
    requested_by: requestedBy,
    title:        title.trim(),
    category,
    reason:       reason.trim(),
    cost:         cost.trim(),
    priority,
    status:       'pending',
  });
  if (error) throw error;
}

export async function updateApproval(id, { title, category, reason, cost, priority }) {
  const row = {};
  if (title    !== undefined) row.title    = title.trim();
  if (category !== undefined) row.category = category;
  if (reason   !== undefined) row.reason   = reason.trim();
  if (cost     !== undefined) row.cost     = cost.trim();
  if (priority !== undefined) row.priority = priority;
  const { error } = await supabase.from('approval_requests').update(row).eq('id', id);
  if (error) throw error;
}

export async function decideApproval(id, status, adminNote) {
  const { error } = await supabase
    .from('approval_requests')
    .update({ status, admin_note: adminNote || '', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteApproval(id) {
  const { error } = await supabase.from('approval_requests').delete().eq('id', id);
  if (error) throw error;
}
