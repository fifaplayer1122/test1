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
export const getWorkforceReport = () => JSON.parse(localStorage.getItem(WF_KEY) || 'null');
export const saveWorkforceReport = (report) => localStorage.setItem(WF_KEY, JSON.stringify(report));
