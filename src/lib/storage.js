import { supabase } from './supabase';

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
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
