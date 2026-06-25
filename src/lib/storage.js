const TASKS_KEY = 'ceo_tasks';
const PHOTOS_KEY = 'ceo_photos';
const WF_KEY = 'ceo_workforce';

const DEFAULT_TASKS = [
  { id: '1', title: 'to book a handyman for New Orleans booth build up', priority: 'very_high', status: 'todo', notes: 'Soon to be sorted' },
  { id: '2', title: 'IBTTA Annual Meeting - Submit Call for Presentations', priority: 'very_high', status: 'todo', notes: 'July 10th Deadline' },
  { id: '3', title: 'Messaging of Maintenance IBTTA Conference', priority: 'high', status: 'todo', notes: 'Being worked on' },
  { id: '4', title: 'Apple Developer - confirm organization address change', priority: 'high', status: 'todo', notes: '' },
  { id: '5', title: 'US Visa Documents for Raghu', priority: 'high', status: 'todo', notes: 'Being worked on' },
  { id: '6', title: 'Cancel OFAC API subscription', priority: 'high', status: 'todo', notes: '' },
  { id: '7', title: 'SWAGS - order Touchscreen cleaner, Electronic cleaner, dot.card', priority: 'medium', status: 'todo', notes: '' },
  { id: '8', title: 'Post weekly on leadership channel (at least 1 per week)', priority: 'medium', status: 'todo', notes: '' },
  { id: '9', title: 'Post 2-3 times weekly on notebook channel', priority: 'medium', status: 'todo', notes: '' },
  { id: '10', title: 'Adobe $21.19 charge - review and action', priority: 'medium', status: 'todo', notes: '' },
  { id: '11', title: 'NIGP Exhibitor Hub - August Summit registration (initial info added)', priority: 'medium', status: 'todo', notes: '' },
  { id: '12', title: 'Register for APPA September Summit', priority: 'medium', status: 'todo', notes: '' },
  { id: '13', title: 'Order dot.Cards - https://dotcards.net/products/black-card', priority: 'medium', status: 'todo', notes: '' },
  { id: '14', title: 'Cancel LinkedIn Premium (personal + company)', priority: 'low', status: 'todo', notes: '2 weeks deadline' },
  { id: '15', title: 'IBTTA Maintenance Workshop (New Orleans) - Order table + ship by today', priority: 'very_high', status: 'done', notes: 'Working on' },
  { id: '16', title: 'Merchology shirts - check arrival (today or tomorrow)', priority: 'high', status: 'done', notes: '' },
  { id: '17', title: 'Register SmartDocs in Tennessee and Georgia', priority: 'high', status: 'done', notes: '' },
  { id: '18', title: 'Get COI for JEA', priority: 'high', status: 'done', notes: '' },
  { id: '19', title: 'Harvard Medical School AI certificate program - register', priority: 'medium', status: 'skip', notes: '' },
];

export const getTasks = () => {
  const stored = localStorage.getItem(TASKS_KEY);
  if (!stored) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(DEFAULT_TASKS));
    return DEFAULT_TASKS;
  }
  return JSON.parse(stored);
};
export const saveTasks = (tasks) => localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
export const getPhotos = () => JSON.parse(localStorage.getItem(PHOTOS_KEY) || '[]');
export const savePhotos = (photos) => localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
const DEFAULT_WORKFORCE = {
  summary: "Today's Report - June 24th 2026",
  parsed_at: new Date('2026-06-24').toISOString(),
  on_leave: [
    { name: 'Dakshay',         reason: 'Family Medical Emergency',          duration: 'Full Day', dept: 'Services' },
    { name: 'Venkatesh',       reason: "Going to hometown & Friend's Reception", duration: 'Full Day', dept: 'Services' },
    { name: 'Aditya Simhadri', reason: 'Personal Emergency',                duration: 'Full Day', dept: '' },
  ],
  upcoming_leave: [
    { name: 'Dakshay',      reason: 'Family Medical Emergency - Planned Heart Surgery of Father in Law', duration: 'June 25th & 26th',    dept: 'Services' },
    { name: 'Venkatesh',    reason: "Going to hometown & Friend's Reception",                            duration: 'June 26th',           dept: 'Services' },
    { name: 'Harshvardhan', reason: 'Personal commitment',                                               duration: 'June 25th',           dept: 'R & D'    },
    { name: 'Pooja',        reason: 'Function in family',                                                duration: 'June 26th',           dept: 'R & D'    },
    { name: 'Shruti',       reason: 'Personal Reasons',                                                  duration: 'June 26th',           dept: 'HR'       },
    { name: 'Keerthana',    reason: 'Brother Engagement & Housewarming Ceremony',                        duration: 'July 8th & 9th',      dept: 'R & D'    },
    { name: 'Satyaban',     reason: 'Planned Surgery',                                                   duration: 'July 13th till 16th', dept: 'DevOps'   },
  ],
  holidays: [
    { location: 'US', day: 'Fri', date: 'July 03rd', occasion: 'Independence Day' },
  ],
};

const WF_VERSION = 'v20260624';

export const getWorkforceReport = () => {
  const stored = localStorage.getItem(WF_KEY);
  if (!stored) {
    localStorage.setItem(WF_KEY, JSON.stringify({ ...DEFAULT_WORKFORCE, _version: WF_VERSION }));
    return DEFAULT_WORKFORCE;
  }
  const parsed = JSON.parse(stored);
  // Always refresh seeded data when a new version is deployed
  if (!parsed._user_edited && parsed._version !== WF_VERSION) {
    const fresh = { ...DEFAULT_WORKFORCE, _version: WF_VERSION };
    localStorage.setItem(WF_KEY, JSON.stringify(fresh));
    return fresh;
  }
  return parsed;
};
export const saveWorkforceReport = (report) => localStorage.setItem(WF_KEY, JSON.stringify({ ...report, _user_edited: true, _version: WF_VERSION }));
