import { create } from 'zustand';
import type { QrConfig, BarcodeConfig, WifiConfig, HistoryItem } from '@/types';

interface QrState {
  qrConfig: QrConfig;
  barcodeConfig: BarcodeConfig;
  wifiConfig: WifiConfig;
  history: HistoryItem[];
  setQrConfig: (config: Partial<QrConfig>) => void;
  setBarcodeConfig: (config: Partial<BarcodeConfig>) => void;
  setWifiConfig: (config: Partial<WifiConfig>) => void;
  addHistory: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void;
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  loadFromHistory: (item: HistoryItem) => void;
}

const defaultQrConfig: QrConfig = {
  type: 'url',
  content: 'https://example.com',
  size: 300,
  errorLevel: 'M',
  foregroundColor: '#000000',
  backgroundColor: '#ffffff',
  gradient: {
    enabled: false,
    type: 'linear',
    colors: ['#00d4ff', '#0066ff'],
    rotation: 0,
  },
  logo: {
    enabled: false,
    dataUrl: '',
    size: 20,
  },
  roundedDots: false,
  renderMode: 'canvas',
};

const defaultBarcodeConfig: BarcodeConfig = {
  format: 'CODE128',
  content: '123456789012',
  width: 2,
  height: 100,
  displayValue: true,
  fontSize: 14,
  margin: 10,
  lineColor: '#000000',
  backgroundColor: '#ffffff',
};

const defaultWifiConfig: WifiConfig = {
  ssid: '',
  password: '',
  security: 'WPA',
  hidden: false,
};

export const useQrStore = create<QrState>((set, get) => ({
  qrConfig: defaultQrConfig,
  barcodeConfig: defaultBarcodeConfig,
  wifiConfig: defaultWifiConfig,
  history: [],
  
  setQrConfig: (config) => set((state) => ({
    qrConfig: { ...state.qrConfig, ...config },
  })),
  
  setBarcodeConfig: (config) => set((state) => ({
    barcodeConfig: { ...state.barcodeConfig, ...config },
  })),
  
  setWifiConfig: (config) => set((state) => ({
    wifiConfig: { ...state.wifiConfig, ...config },
  })),
  
  addHistory: (item) => {
    const history = get().history;
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    
    const newHistory = [newItem, ...history].slice(0, 20);
    localStorage.setItem('qr_studio_history', JSON.stringify(newHistory));
    set({ history: newHistory });
  },
  
  clearHistory: () => {
    localStorage.removeItem('qr_studio_history');
    set({ history: [] });
  },
  
  deleteHistoryItem: (id) => {
    const history = get().history.filter(item => item.id !== id);
    localStorage.setItem('qr_studio_history', JSON.stringify(history));
    set({ history });
  },
  
  loadFromHistory: (item) => {
    if (item.type === 'qr') {
      set({ qrConfig: item.config as QrConfig });
    } else if (item.type === 'barcode') {
      set({ barcodeConfig: item.config as BarcodeConfig });
    }
  },
}));

export function initializeHistory(): void {
  try {
    const data = localStorage.getItem('qr_studio_history');
    if (data) {
      const history = JSON.parse(data);
      useQrStore.setState({ history });
    }
  } catch (e) {
    console.error('Failed to load history', e);
  }
}
