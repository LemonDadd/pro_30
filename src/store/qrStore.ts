import { create } from 'zustand';
import type { QrConfig, BarcodeConfig, WifiConfig, VCardConfig, EmailConfig, SmsConfig, HistoryItem } from '@/types';
import { generateWifiString, generateVCardString, generateEmailString, generateSmsString } from '@/utils/qr';

export type SaveHistoryType = 'qr' | 'barcode' | 'wifi';

interface QrState {
  qrConfig: QrConfig;
  barcodeConfig: BarcodeConfig;
  wifiConfig: WifiConfig;
  vcardConfig: VCardConfig;
  emailConfig: EmailConfig;
  smsConfig: SmsConfig;
  history: HistoryItem[];
  currentQrContent: string;
  fullQrConfig: QrConfig;
  setQrConfig: (config: Partial<QrConfig>) => void;
  setBarcodeConfig: (config: Partial<BarcodeConfig>) => void;
  setWifiConfig: (config: Partial<WifiConfig>) => void;
  setVcardConfig: (config: Partial<VCardConfig>) => void;
  setEmailConfig: (config: Partial<EmailConfig>) => void;
  setSmsConfig: (config: Partial<SmsConfig>) => void;
  setQrType: (type: QrConfig['type']) => void;
  addHistory: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void;
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  loadFromHistory: (item: HistoryItem) => void;
  updateQrContent: () => void;
  saveQrToHistory: (preview: string) => HistoryItem | null;
  saveWifiToHistory: (preview: string) => HistoryItem | null;
  saveBarcodeToHistory: (preview: string) => HistoryItem | null;
  getHistoryTypeLabel: (type: SaveHistoryType) => string;
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
  formData: {},
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

const defaultVcardConfig: VCardConfig = {
  firstName: '',
  lastName: '',
  organization: '',
  title: '',
  phone: '',
  email: '',
  url: '',
  address: '',
};

const defaultEmailConfig: EmailConfig = {
  to: '',
  subject: '',
  body: '',
};

const defaultSmsConfig: SmsConfig = {
  phone: '',
  message: '',
};

function calculateContent(config: Partial<QrConfig>, forms: {
  wifi: WifiConfig;
  vcard: VCardConfig;
  email: EmailConfig;
  sms: SmsConfig;
}): string {
  switch (config.type) {
    case 'url':
    case 'text':
    case 'tel':
      return config.content || '';
    case 'wifi':
      return generateWifiString(forms.wifi);
    case 'vcard':
      return generateVCardString(forms.vcard);
    case 'email':
      return generateEmailString(forms.email);
    case 'sms':
      return generateSmsString(forms.sms);
    default:
      return config.content || '';
  }
}

function buildFormData(type: QrConfig['type'], forms: {
  wifi: WifiConfig;
  vcard: VCardConfig;
  email: EmailConfig;
  sms: SmsConfig;
}): QrConfig['formData'] {
  switch (type) {
    case 'wifi':
      return { wifi: { ...forms.wifi } };
    case 'vcard':
      return { vcard: { ...forms.vcard } };
    case 'email':
      return { email: { ...forms.email } };
    case 'sms':
      return { sms: { ...forms.sms } };
    default:
      return {};
  }
}

function buildFullConfig(
  baseConfig: QrConfig,
  forms: { wifi: WifiConfig; vcard: VCardConfig; email: EmailConfig; sms: SmsConfig }
): QrConfig {
  return {
    ...baseConfig,
    content: calculateContent(baseConfig, forms),
    formData: buildFormData(baseConfig.type, forms),
  };
}

function writeHistoryLocal(newHistory: HistoryItem[]): void {
  localStorage.setItem('qr_studio_history', JSON.stringify(newHistory.slice(0, 20)));
}

function syncDerived(state: Partial<QrState> & Pick<QrState, 'qrConfig' | 'wifiConfig' | 'vcardConfig' | 'emailConfig' | 'smsConfig'>): Partial<QrState> {
  const forms = {
    wifi: state.wifiConfig,
    vcard: state.vcardConfig,
    email: state.emailConfig,
    sms: state.smsConfig,
  };
  const fullQrConfig = buildFullConfig(state.qrConfig, forms);
  return {
    ...state,
    qrConfig: fullQrConfig,
    currentQrContent: fullQrConfig.content,
    fullQrConfig,
  };
}

function pushHistory(history: HistoryItem[], item: Omit<HistoryItem, 'id' | 'createdAt'>): HistoryItem[] {
  const newItem: HistoryItem = {
    ...item,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    createdAt: Date.now(),
  };
  const newHistory = [newItem, ...history].slice(0, 20);
  writeHistoryLocal(newHistory);
  return newHistory;
}

export const useQrStore = create<QrState>((set, get) => ({
  qrConfig: defaultQrConfig,
  barcodeConfig: defaultBarcodeConfig,
  wifiConfig: defaultWifiConfig,
  vcardConfig: defaultVcardConfig,
  emailConfig: defaultEmailConfig,
  smsConfig: defaultSmsConfig,
  history: [],
  currentQrContent: calculateContent(defaultQrConfig, {
    wifi: defaultWifiConfig,
    vcard: defaultVcardConfig,
    email: defaultEmailConfig,
    sms: defaultSmsConfig,
  }),
  fullQrConfig: buildFullConfig(defaultQrConfig, {
    wifi: defaultWifiConfig,
    vcard: defaultVcardConfig,
    email: defaultEmailConfig,
    sms: defaultSmsConfig,
  }),
  
  setQrConfig: (config) => set((state) => syncDerived({
    ...state,
    qrConfig: { ...state.qrConfig, ...config },
  })),
  
  setBarcodeConfig: (config) => set((state) => ({
    barcodeConfig: { ...state.barcodeConfig, ...config },
  })),
  
  setWifiConfig: (config) => set((state) => syncDerived({
    ...state,
    wifiConfig: { ...state.wifiConfig, ...config },
  })),
  
  setVcardConfig: (config) => set((state) => syncDerived({
    ...state,
    vcardConfig: { ...state.vcardConfig, ...config },
  })),
  
  setEmailConfig: (config) => set((state) => syncDerived({
    ...state,
    emailConfig: { ...state.emailConfig, ...config },
  })),
  
  setSmsConfig: (config) => set((state) => syncDerived({
    ...state,
    smsConfig: { ...state.smsConfig, ...config },
  })),
  
  setQrType: (type) => set((state) => syncDerived({
    ...state,
    qrConfig: { ...state.qrConfig, type, content: (type === 'url' || type === 'text' || type === 'tel') ? state.qrConfig.content : '' },
  })),
  
  updateQrContent: () => set((state) => syncDerived(state)),
  
  addHistory: (item) => {
    const newHistory = pushHistory(get().history, item);
    set({ history: newHistory });
  },
  
  clearHistory: () => {
    localStorage.removeItem('qr_studio_history');
    set({ history: [] });
  },
  
  deleteHistoryItem: (id) => {
    const history = get().history.filter(item => item.id !== id);
    writeHistoryLocal(history);
    set({ history });
  },
  
  loadFromHistory: (item) => {
    if (item.type === 'qr' || item.type === 'wifi') {
      const config = item.config as QrConfig;
      const updates: any = {
        qrConfig: { ...defaultQrConfig, ...config },
        wifiConfig: config.formData?.wifi ? { ...defaultWifiConfig, ...config.formData.wifi } : defaultWifiConfig,
        vcardConfig: config.formData?.vcard ? { ...defaultVcardConfig, ...config.formData.vcard } : defaultVcardConfig,
        emailConfig: config.formData?.email ? { ...defaultEmailConfig, ...config.formData.email } : defaultEmailConfig,
        smsConfig: config.formData?.sms ? { ...defaultSmsConfig, ...config.formData.sms } : defaultSmsConfig,
      };
      set(syncDerived(updates));
    } else if (item.type === 'barcode') {
      set({ barcodeConfig: item.config as BarcodeConfig });
    }
  },
  
  saveQrToHistory: (preview: string) => {
    const { fullQrConfig, currentQrContent, history } = get();
    if (!currentQrContent && !fullQrConfig.formData) return null;
    const newHistory = pushHistory(history, {
      type: 'qr',
      config: fullQrConfig,
      preview,
      content: currentQrContent.substring(0, 50),
    });
    set({ history: newHistory });
    return newHistory[0];
  },
  
  saveWifiToHistory: (preview: string) => {
    const { fullQrConfig, currentQrContent, wifiConfig, history } = get();
    const full = buildFullConfig(
      { ...fullQrConfig, type: 'wifi' },
      {
        wifi: wifiConfig,
        vcard: get().vcardConfig,
        email: get().emailConfig,
        sms: get().smsConfig,
      }
    );
    const newHistory = pushHistory(history, {
      type: 'wifi',
      config: full,
      preview,
      content: `WiFi: ${wifiConfig.ssid}`,
    });
    set({ history: newHistory });
    return newHistory[0];
  },
  
  saveBarcodeToHistory: (preview: string) => {
    const { barcodeConfig, history } = get();
    if (!barcodeConfig.content) return null;
    const newHistory = pushHistory(history, {
      type: 'barcode',
      config: barcodeConfig,
      preview,
      content: barcodeConfig.content.substring(0, 50),
    });
    set({ history: newHistory });
    return newHistory[0];
  },
  
  getHistoryTypeLabel: (type: SaveHistoryType) => {
    switch (type) {
      case 'qr': return '二维码';
      case 'barcode': return '条码';
      case 'wifi': return 'WiFi';
      default: return type;
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
