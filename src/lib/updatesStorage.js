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

const SEED = [
  { author: 'Pranesh',        working_on: 'CLM competitive analysis',      priority: 'very_high', text: 'Draft response to Coupa/Tonkea positioning doc ready for review. Need Ravi to validate our differentiation angle before we send to Aditya.',           status: 'need_your_input' },
  { author: 'Pranesh',        working_on: 'Dual-track pitch framework',    priority: 'high',      text: 'First draft of standalone CLM vs platform pitch decks done. Aligning messaging with sales team this week.',                                           status: 'have_a_question' },
  { author: 'Sai Charan',     working_on: 'Website redesign',              priority: 'high',      text: 'Waiting on final homepage hero copy from Vibha. Dev build is ready, just blocked on content before we can push to staging.',                          status: 'blocker'         },
  { author: 'Aditya Simhadri',working_on: 'RFI response – Publix',        priority: 'medium',    text: 'Compliance docs attached, unsure if our data residency answer covers their EU requirement. Can someone from legal confirm?',                           status: 'have_a_question' },
  { author: 'Janvi',          working_on: 'Onboarding flow revamp',        priority: 'high',      text: 'Completed user research interviews (8/10 done). Key insight: users drop off at contract template selection step. Sharing findings deck by EOD Fri.',   status: 'in_progress'     },
  { author: 'Janvi',          working_on: 'Q3 success metrics dashboard',  priority: 'medium',    text: 'Dashboard is live in staging. Waiting for Ravi sign-off on the churn cohort definition before we share with the board.',                              status: 'need_your_input' },
  { author: 'Sunil',          working_on: 'API rate limit investigation',  priority: 'very_high', text: 'Root cause found: bulk export jobs not respecting the per-org token bucket. Fix deployed to staging, monitoring in prod from tomorrow.',               status: 'in_progress'     },
  { author: 'Vibha',          working_on: 'Brand refresh – copy',          priority: 'medium',    text: 'All homepage + product page copy delivered to Sai Charan. Starting case study rewrites this week.',                                                   status: 'done'            },
  { author: 'Hitesh',         working_on: 'Enterprise SSO rollout',        priority: 'high',      text: 'Okta integration working for 3 of 5 pilot customers. Two customers still on legacy IdP — need eng support to test SAML fallback.',                    status: 'blocker'         },
  { author: 'Raghu',          working_on: 'Data pipeline optimisation',    priority: 'medium',    text: 'Reduced nightly sync time from 4.2 h to 58 min. Will document the approach and hand off to Sunil.',                                                  status: 'done'            },
];

export async function getUpdates() {
  const { data, error } = await supabase
    .from('team_updates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  if ((data || []).length === 0) {
    const rows = SEED.map((s, i) => ({
      id:         crypto.randomUUID(),
      author:     s.author,
      working_on: s.working_on,
      priority:   s.priority,
      text:       s.text,
      status:     s.status,
      ravi_notes: '',
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
    }));
    await supabase.from('team_updates').insert(rows);
    return rows.map(r => ({
      id: r.id, author: r.author, workingOn: r.working_on,
      priority: r.priority, text: r.text, status: r.status,
      raviNotes: '', createdAt: r.created_at,
    }));
  }

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
