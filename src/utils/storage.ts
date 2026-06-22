import type { ScanResult } from '@/types';

const SCAN_HISTORY_KEY = 'qr_studio_scan_history';
const MAX_SCAN_HISTORY = 20;

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
