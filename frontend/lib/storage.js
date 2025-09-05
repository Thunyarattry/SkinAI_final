const KEY = 'skinai_history';

export function addHistory(item) {
  const list = getHistory();
  list.push(item);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getHistory() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
