const WEEKEND_KEY = 'ceo_weekend';
const IDENTITY_KEY = 'ceo_team_identity';

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

export function getWeekendData() {
  const raw = localStorage.getItem(WEEKEND_KEY);
  if (raw) return JSON.parse(raw);
  return { entries: {}, members: DEFAULT_MEMBERS };
}

export function saveWeekendData(data) {
  localStorage.setItem(WEEKEND_KEY, JSON.stringify(data));
}

export function getIdentity() {
  return localStorage.getItem(IDENTITY_KEY) || null;
}

export function saveIdentity(name) {
  localStorage.setItem(IDENTITY_KEY, name);
}
