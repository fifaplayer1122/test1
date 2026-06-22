const TASKS_KEY = 'ceo_tasks';
const PHOTOS_KEY = 'ceo_photos';
const WF_KEY = 'ceo_workforce';

export const getTasks = () => JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
export const saveTasks = (tasks) => localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
export const getPhotos = () => JSON.parse(localStorage.getItem(PHOTOS_KEY) || '[]');
export const savePhotos = (photos) => localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
export const getWorkforceReport = () => JSON.parse(localStorage.getItem(WF_KEY) || 'null');
export const saveWorkforceReport = (report) => localStorage.setItem(WF_KEY, JSON.stringify(report));
