import { supabase } from './supabase';

// ── Tasks ─────────────────────────────────────────────────────────────────────

const TASK_SEED = [
  // ── To Do ──
  { title: 'IBTTA Annual Meeting - Submit Call for Presentations',                       priority: 'very_high', notes: 'July 10th Deadline',                                          eta: '2026-07-10', status: 'todo' },
  { title: 'Cancel LinkedIn Premium (personal + company)',                                priority: 'very_high', notes: '2 weeks deadline',                                            eta: '2026-07-05', status: 'todo' },
  { title: 'Need to visit office daily to check for mail',                               priority: 'very_high', notes: 'Check daily',                                                 eta: null,         status: 'todo' },
  { title: 'NIGP event - backdrop, table, flyers, swag',                                 priority: 'very_high', notes: 'Conference Aug 23-26, Exhibit Aug 23-24, 2026',               eta: '2026-07-25', status: 'todo' },
  { title: 'Messaging of Maintenance IBTTA Conference',                                  priority: 'high',      notes: 'Being worked on',                                             eta: null,         status: 'todo' },
  { title: 'Apple Developer - confirm organization address change',                       priority: 'high',      notes: '',                                                            eta: null,         status: 'todo' },
  { title: 'Cancel OFAC API subscription',                                               priority: 'high',      notes: '',                                                            eta: null,         status: 'todo' },
  { title: 'FL Registration is rejected, need to fix',                                   priority: 'high',      notes: '',                                                            eta: '2026-07-15', status: 'todo' },
  { title: 'Sign up for Nacha partnership',                                              priority: 'high',      notes: '',                                                            eta: null,         status: 'todo' },
  { title: 'Signup for ESRI partnership',                                                priority: 'high',      notes: '',                                                            eta: null,         status: 'todo' },
  { title: 'Post weekly on leadership channel (at least 1/week)',                        priority: 'medium',    notes: 'Repeated task',                                               eta: null,         status: 'todo' },
  { title: 'Post 2-3 times weekly on notebook channel',                                  priority: 'medium',    notes: 'Repeated task',                                               eta: null,         status: 'todo' },
  { title: 'Adobe $21.19 charge - review and action',                                    priority: 'medium',    notes: '',                                                            eta: null,         status: 'todo' },
  { title: 'NIGP Exhibitor Hub - August Summit registration (initial info added)',        priority: 'medium',    notes: '',                                                            eta: null,         status: 'todo' },
  { title: 'Register for APPA September Summit',                                         priority: 'medium',    notes: '',                                                            eta: null,         status: 'todo' },
  { title: 'Need to order Visiting Card for Tod',                                        priority: 'medium',    notes: 'Already kept in Staples',                                     eta: '2026-07-14', status: 'todo' },
  { title: 'Order dot.Cards - dotcards.net/products/black-card',                         priority: 'medium',    notes: '',                                                            eta: null,         status: 'todo' },
  // ── Done ──
  { title: 'To book a handyman for New Orleans booth build up',                          priority: 'very_high', notes: 'Soon to be sorted',                                           eta: null,         status: 'done' },
  { title: 'IBTTA Maintenance Workshop (New Orleans) - Order table + ship by today',     priority: 'very_high', notes: 'Working on',                                                  eta: null,         status: 'done' },
  { title: 'IBTTA Annual Meeting Exhibit Sales Open on Tuesday (Sneak Preview Available Now!)', priority: 'very_high', notes: 'Need to remind',                                       eta: null,         status: 'done' },
  { title: 'To talk to Sai Pranav on his last working day',                              priority: 'very_high', notes: '',                                                            eta: null,         status: 'done' },
  { title: 'To decide on Jyothi extension',                                              priority: 'very_high', notes: '',                                                            eta: null,         status: 'done' },
  { title: 'US Visa Documents for Raghu',                                                priority: 'high',      notes: 'Being worked on',                                             eta: null,         status: 'done' },
  { title: 'Merchology shirts - check arrival',                                          priority: 'high',      notes: '',                                                            eta: null,         status: 'done' },
  { title: 'Register SmartDocs in Tennessee and Georgia',                                priority: 'high',      notes: '',                                                            eta: null,         status: 'done' },
  { title: 'Get COI for JEA',                                                            priority: 'high',      notes: '',                                                            eta: null,         status: 'done' },
  { title: 'SWAGS - order Touchscreen cleaner, Electronic cleaner, dot.card',            priority: 'medium',    notes: '',                                                            eta: null,         status: 'done' },
  // ── Skipped ──
  { title: 'Harvard Medical School AI certificate program - register',                   priority: 'medium',    notes: '',                                                            eta: null,         status: 'skip' },
];

export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;

  if (data.length === 0) {
    const local = localStorage.getItem('ceo_tasks');
    const seed = local
      ? JSON.parse(local)
      : TASK_SEED.map((t, i) => ({
          id:         crypto.randomUUID(),
          ...t,
          created_at: new Date(Date.now() + i * 1000).toISOString(),
        }));
    await supabase.from('tasks').insert(seed);
    return seed;
  }

  return data;
}

export async function createTask(task) {
  const { error } = await supabase.from('tasks').insert({
    id:         task.id,
    title:      task.title,
    priority:   task.priority,
    notes:      task.notes || '',
    eta:        task.eta || null,
    status:     task.status || 'todo',
  });
  if (error) throw error;
}

export async function updateTask(id, updates) {
  const row = {};
  if (updates.title    !== undefined) row.title    = updates.title;
  if (updates.priority !== undefined) row.priority = updates.priority;
  if (updates.notes    !== undefined) row.notes    = updates.notes;
  if (updates.status   !== undefined) row.status   = updates.status;
  if (updates.eta      !== undefined) row.eta      = updates.eta || null;
  const { error } = await supabase.from('tasks').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ── Photos ────────────────────────────────────────────────────────────────────

export async function getPhotos() {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Attach public URL to each row
  return (data || []).map(p => ({
    ...p,
    image_url: supabase.storage.from('photos').getPublicUrl(p.path).data.publicUrl,
  }));
}

export async function uploadPhoto(dataUrl, name) {
  // Convert base64 dataURL → Blob
  const res  = await fetch(dataUrl);
  const blob = await res.blob();
  const path = `${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('photos').insert({
    name: name || '',
    path,
  });
  if (insertError) throw insertError;
}

export async function deletePhoto(id, path) {
  await supabase.storage.from('photos').remove([path]);
  const { error } = await supabase.from('photos').delete().eq('id', id);
  if (error) throw error;
}

// ── Workforce Report ──────────────────────────────────────────────────────────

const DEFAULT_WORKFORCE = {
  summary: "Workforce Availability — June 26th till July 31st 2026",
  report_date: "June 25th 2026",
  parsed_at: new Date('2026-06-25').toISOString(),
  on_leave: [
    { name: 'Dakshay',      reason: 'Family Medical Emergency', duration: 'Full Day', dept: 'Services' },
    { name: 'Harshvardhan', reason: 'Personal commitment',      duration: 'Full Day', dept: 'R & D'   },
  ],
  upcoming_leave: [
    { name: 'Dakshay',   reason: 'Family Medical Emergency - Planned Heart Surgery of Father in Law', duration: 'June 26th',           dept: 'Services' },
    { name: 'Venkatesh', reason: "Going to hometown & Friend's Reception",                            duration: 'June 26th',           dept: 'Services' },
    { name: 'Pooja',     reason: 'Function in family',                                                duration: 'June 26th',           dept: 'R & D'    },
    { name: 'Shruti',    reason: 'Personal Reasons',                                                  duration: 'June 26th',           dept: 'HR'       },
    { name: 'Keerthana', reason: 'Brother Engagement & Housewarming Ceremony',                        duration: 'July 8th & 9th',      dept: 'R & D'    },
    { name: 'Satyaban',  reason: 'Planned Surgery',                                                   duration: 'July 13th till 16th', dept: 'DevOps'   },
  ],
  holidays: [
    { location: 'US', day: 'Fri', date: 'July 03rd', occasion: 'Independence Day' },
  ],
};

export async function getWorkforceReport() {
  const { data, error } = await supabase
    .from('workforce_report')
    .select('data, version')
    .eq('id', 1)
    .single();

  if (error || !data) return DEFAULT_WORKFORCE;
  return data.data;
}

export async function saveWorkforceReport(report) {
  const { error } = await supabase.from('workforce_report').upsert({
    id:      1,
    data:    report,
    version: 'v1',
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
