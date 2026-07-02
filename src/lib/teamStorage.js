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
  if (updates.waitingOnRavi !== undefined) row.waiting_on_ravi = updates.waitingOnRavi;
  if (updates.waitingReason !== undefined) row.waiting_reason = updates.waitingReason;

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

// Identity stored locally (not synced — it's the user's own device preference)
const IDENTITY_KEY = 'ceo_team_identity';
export function getIdentity() { return localStorage.getItem(IDENTITY_KEY) || null; }
export function saveIdentity(name) { localStorage.setItem(IDENTITY_KEY, name); }
