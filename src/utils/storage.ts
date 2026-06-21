import type { HistoryItem, ScanResult } from '@/types';

const HISTORY_KEY = 'qr_studio_history';
const SCAN_HISTORY_KEY = 'qr_studio_scan_history';
const MAX_HISTORY = 20;
const MAX_SCAN_HISTORY = 20;

export function saveHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>): HistoryItem {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    createdAt: Date.now(),
  };
  
  history.unshift(newItem);
  if (history.length > MAX_HISTORY) {
    history.pop();
  }
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return newItem;
}

export function getHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function deleteHistoryItem(id: string): void {
  const history = getHistory().filter(item => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function saveScanResult(data: string): ScanResult {
  const history = getScanHistory();
  const newItem: ScanResult = {
    data,
    timestamp: Date.now(),
  };
  
  const exists = history.findIndex(item => item.data === data);
  if (exists !== -1) {
    history.splice(exists, 1);
  }
  
  history.unshift(newItem);
  if (history.length > MAX_SCAN_HISTORY) {
    history.pop();
  }
  
  localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
  return newItem;
}

export function getScanHistory(): ScanResult[] {
  try {
    const data = localStorage.getItem(SCAN_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearScanHistory(): void {
  localStorage.removeItem(SCAN_HISTORY_KEY);
}
