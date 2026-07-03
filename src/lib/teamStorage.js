import { supabase } from './supabase';

export const ADMINS = ['Ravi', 'Pranesh'];

export const DEFAULT_MEMBERS = [
  'Aditya Simhadri', 'Janvi', 'Pooja', 'Ramakrishna',
  'Sai Charan', 'Sai Varma', 'Sunil', 'Pranesh',
  'Hitesh', 'Vibha', 'Raghu',
];

export function getNextWeekend() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const daysUntilSat = day === 6 ? 0 : day === 0 ? 6 : 6 - day;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntilSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return { sat, sun };
}

export function fmtDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDay(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// Returns { members: string[], entries: { [name]: {...} } }
export async function getWeekendData() {
  const [membersRes, entriesRes] = await Promise.all([
    supabase.from('members').select('name').order('sort_order'),
    supabase.from('member_entries').select('*'),
  ]);

  let members = (membersRes.data || []).map(r => r.name);
  const entries = {};
  for (const row of (entriesRes.data || [])) {
    entries[row.member_name] = {
      sat:           row.sat || 'none',
      satTime:       row.sat_time || '',
      sun:           row.sun || 'none',
      sunTime:       row.sun_time || '',
      topics:        row.topics || '',
      focus:         row.focus || '',
      waitingOnRavi: row.waiting_on_ravi || false,
      waitingReason: row.waiting_reason || '',
      priorityLevel: row.priority_level || 'medium',
      raviNotes:     row.ravi_notes || '',
      updatedAt:     row.updated_at,
    };
  }

  // One-time migration from localStorage
  if (members.length === 0) {
    const local = localStorage.getItem('ceo_weekend');
    if (local) {
      const parsed = JSON.parse(local);
      members = parsed.members || DEFAULT_MEMBERS;
      // Migrate entries
      for (const [name, e] of Object.entries(parsed.entries || {})) {
        entries[name] = e;
        await supabase.from('member_entries').upsert({
          member_name:    name,
          sat:            e.sat || 'none',
          sat_time:       e.satTime || '',
          sun:            e.sun || 'none',
          sun_time:       e.sunTime || '',
          topics:         e.topics || '',
          focus:          e.focus || '',
          waiting_on_ravi: e.waitingOnRavi || false,
          waiting_reason: e.waitingReason || '',
        }, { onConflict: 'member_name' });
      }
    } else {
      members = DEFAULT_MEMBERS;
    }
    // Seed members table
    await supabase.from('members').insert(
      members.map((name, i) => ({ name, sort_order: i }))
    );
  }

  return { members: members.length ? members : DEFAULT_MEMBERS, entries };
}

export async function upsertMemberEntry(memberName, updates) {
  const row = { member_name: memberName, updated_at: new Date().toISOString() };
  if (updates.sat           !== undefined) row.sat            = updates.sat;
  if (updates.satTime       !== undefined) row.sat_time       = updates.satTime;
  if (updates.sun           !== undefined) row.sun            = updates.sun;
  if (updates.sunTime       !== undefined) row.sun_time       = updates.sunTime;
  if (updates.topics        !== undefined) row.topics         = updates.topics;
  if (updates.focus         !== undefined) row.focus          = updates.focus;
  if (updates.waitingOnRavi   !== undefined) row.waiting_on_ravi  = updates.waitingOnRavi;
  if (updates.waitingReason   !== undefined) row.waiting_reason   = updates.waitingReason;
  if (updates.priorityLevel   !== undefined) row.priority_level   = updates.priorityLevel;
  if (updates.raviNotes       !== undefined) row.ravi_notes       = updates.raviNotes;

  const { error } = await supabase
    .from('member_entries')
    .upsert(row, { onConflict: 'member_name' });
  if (error) throw error;
}

export async function saveMembers(memberNames) {
  // Replace all members
  await supabase.from('members').delete().neq('name', '');
  const rows = memberNames.map((name, i) => ({ name, sort_order: i }));
  const { error } = await supabase.from('members').insert(rows);
  if (error) throw error;
}

// Auto-register a smartdocs.ai employee on first login.
// Inserts them into the members table if not already present.
export async function ensureMember(name) {
  if (!name || ADMINS.some(a => name === a || name.split(' ')[0] === a)) return;
  const { data } = await supabase.from('members').select('name').eq('name', name).maybeSingle();
  if (data) return; // already exists
  const { data: maxRow } = await supabase.from('members').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;
  await supabase.from('members').insert({ name, sort_order: nextOrder });
}

// ── Member priorities (multiple items per member) ─────────────────────────────

const PRIORITY_SEED = [
  { member_name: 'Pranesh',         title: 'CLM competitive positioning vs Coupa & Tonkea — draft response doc',   priority_level: 'very_high' },
  { member_name: 'Pranesh',         title: 'Dual-track pitch framework (standalone CLM vs platform)',               priority_level: 'high'      },
  { member_name: 'Sai Charan',      title: 'Website redesign — homepage hero + product pages',                     priority_level: 'high'      },
  { member_name: 'Sai Charan',      title: 'Mobile responsiveness audit across all landing pages',                 priority_level: 'medium'    },
  { member_name: 'Aditya Simhadri', title: 'RFI response for Publix — compliance & data residency section',        priority_level: 'high'      },
  { member_name: 'Aditya Simhadri', title: 'Customer onboarding checklist for Q3 enterprise deals',                priority_level: 'medium'    },
  { member_name: 'Janvi',           title: 'User research synthesis — onboarding drop-off root cause',             priority_level: 'very_high' },
  { member_name: 'Janvi',           title: 'Q3 success metrics dashboard — churn cohort definition sign-off',      priority_level: 'high'      },
  { member_name: 'Sunil',           title: 'Fix API rate limit bug on bulk export (root cause found)',              priority_level: 'very_high' },
  { member_name: 'Sunil',           title: 'Tech debt: migrate auth service to new token format',                  priority_level: 'medium'    },
  { member_name: 'Vibha',           title: 'Brand refresh copy — homepage, product pages & case studies',          priority_level: 'high'      },
  { member_name: 'Hitesh',          title: 'Enterprise SSO rollout — Okta SAML fallback for 2 pilot customers',   priority_level: 'very_high' },
  { member_name: 'Hitesh',          title: 'Support escalation playbook for enterprise tier',                      priority_level: 'medium'    },
  { member_name: 'Raghu',           title: 'Data pipeline optimisation — nightly sync from 4.2h → 58min done',    priority_level: 'high'      },
  { member_name: 'Raghu',           title: 'Document pipeline approach and hand off to Sunil',                     priority_level: 'low'       },
  { member_name: 'Pooja',           title: 'Legal review of updated MSA template for US customers',                priority_level: 'high'      },
  { member_name: 'Ramakrishna',     title: 'DevOps: set up staging environment parity with prod',                  priority_level: 'medium'    },
  { member_name: 'Sai Varma',       title: 'Integrate Stripe billing for self-serve plan upgrades',                priority_level: 'high'      },
];

export async function getMemberPriorities() {
  const { data, error } = await supabase
    .from('member_priorities')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;

  if ((data || []).length === 0) {
    const rows = PRIORITY_SEED.map((s, i) => ({
      id:             crypto.randomUUID(),
      member_name:    s.member_name,
      title:          s.title,
      priority_level: s.priority_level,
      created_at:     new Date(Date.now() + i * 1000).toISOString(),
    }));
    await supabase.from('member_priorities').insert(rows);
    return rows;
  }

  return data || [];
}

export async function addMemberPriority(memberName, title, priorityLevel) {
  const { error } = await supabase.from('member_priorities').insert({
    member_name:    memberName,
    title:          title.trim(),
    priority_level: priorityLevel || 'medium',
  });
  if (error) throw error;
}

export async function updateMemberPriority(id, { title, priorityLevel }) {
  const row = {};
  if (title         !== undefined) row.title          = title.trim();
  if (priorityLevel !== undefined) row.priority_level = priorityLevel;
  const { error } = await supabase.from('member_priorities').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteMemberPriority(id) {
  const { error } = await supabase.from('member_priorities').delete().eq('id', id);
  if (error) throw error;
}

// Identity stored locally (not synced — it's the user's own device preference)
const IDENTITY_KEY = 'ceo_team_identity';
export function getIdentity() { return localStorage.getItem(IDENTITY_KEY) || null; }
export function saveIdentity(name) { localStorage.setItem(IDENTITY_KEY, name); }
