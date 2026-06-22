import { create } from 'zustand';
import type { QrConfig, BarcodeConfig, WifiConfig, VCardConfig, EmailConfig, SmsConfig, HistoryItem } from '@/types';
import { generateWifiString, generateVCardString, generateEmailString, generateSmsString } from '@/utils/qr';

interface QrState {
  qrConfig: QrConfig;
  barcodeConfig: BarcodeConfig;
  wifiConfig: WifiConfig;
  vcardConfig: VCardConfig;
  emailConfig: EmailConfig;
  smsConfig: SmsConfig;
  history: HistoryItem[];
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

export const useQrStore = create<QrState>((set, get) => ({
  qrConfig: defaultQrConfig,
  barcodeConfig: defaultBarcodeConfig,
  wifiConfig: defaultWifiConfig,
  vcardConfig: defaultVcardConfig,
  emailConfig: defaultEmailConfig,
  smsConfig: defaultSmsConfig,
  history: [],
  
  setQrConfig: (config) => set((state) => {
    const newQrConfig = { ...state.qrConfig, ...config };
    const forms = {
      wifi: state.wifiConfig,
      vcard: state.vcardConfig,
      email: state.emailConfig,
      sms: state.smsConfig,
    };
    newQrConfig.content = calculateContent(newQrConfig, forms);
    newQrConfig.formData = buildFormData(newQrConfig.type, forms);
    return { qrConfig: newQrConfig };
  }),
  
  setBarcodeConfig: (config) => set((state) => ({
    barcodeConfig: { ...state.barcodeConfig, ...config },
  })),
  
  setWifiConfig: (config) => set((state) => {
    const wifiConfig = { ...state.wifiConfig, ...config };
    const forms = {
      wifi: wifiConfig,
      vcard: state.vcardConfig,
      email: state.emailConfig,
      sms: state.smsConfig,
    };
    const newQrConfig = { ...state.qrConfig };
    if (newQrConfig.type === 'wifi') {
      newQrConfig.content = calculateContent(newQrConfig, forms);
      newQrConfig.formData = buildFormData('wifi', forms);
    }
    return { wifiConfig, qrConfig: newQrConfig };
  }),
  
  setVcardConfig: (config) => set((state) => {
    const vcardConfig = { ...state.vcardConfig, ...config };
    const forms = {
      wifi: state.wifiConfig,
      vcard: vcardConfig,
      email: state.emailConfig,
      sms: state.smsConfig,
    };
    const newQrConfig = { ...state.qrConfig };
    if (newQrConfig.type === 'vcard') {
      newQrConfig.content = calculateContent(newQrConfig, forms);
      newQrConfig.formData = buildFormData('vcard', forms);
    }
    return { vcardConfig, qrConfig: newQrConfig };
  }),
  
  setEmailConfig: (config) => set((state) => {
    const emailConfig = { ...state.emailConfig, ...config };
    const forms = {
      wifi: state.wifiConfig,
      vcard: state.vcardConfig,
      email: emailConfig,
      sms: state.smsConfig,
    };
    const newQrConfig = { ...state.qrConfig };
    if (newQrConfig.type === 'email') {
      newQrConfig.content = calculateContent(newQrConfig, forms);
      newQrConfig.formData = buildFormData('email', forms);
    }
    return { emailConfig, qrConfig: newQrConfig };
  }),
  
  setSmsConfig: (config) => set((state) => {
    const smsConfig = { ...state.smsConfig, ...config };
    const forms = {
      wifi: state.wifiConfig,
      vcard: state.vcardConfig,
      email: state.emailConfig,
      sms: smsConfig,
    };
    const newQrConfig = { ...state.qrConfig };
    if (newQrConfig.type === 'sms') {
      newQrConfig.content = calculateContent(newQrConfig, forms);
      newQrConfig.formData = buildFormData('sms', forms);
    }
    return { smsConfig, qrConfig: newQrConfig };
  }),
  
  setQrType: (type) => set((state) => {
    const newQrConfig = { ...state.qrConfig, type };
    const forms = {
      wifi: state.wifiConfig,
      vcard: state.vcardConfig,
      email: state.emailConfig,
      sms: state.smsConfig,
    };
    
    if (type !== 'url' && type !== 'text' && type !== 'tel') {
      newQrConfig.content = calculateContent({ ...newQrConfig, type }, forms);
    }
    newQrConfig.formData = buildFormData(type, forms);
    
    return { qrConfig: newQrConfig };
  }),
  
  updateQrContent: () => set((state) => {
    const forms = {
      wifi: state.wifiConfig,
      vcard: state.vcardConfig,
      email: state.emailConfig,
      sms: state.smsConfig,
    };
    const newQrConfig = { ...state.qrConfig };
    newQrConfig.content = calculateContent(newQrConfig, forms);
    newQrConfig.formData = buildFormData(newQrConfig.type, forms);
    return { qrConfig: newQrConfig };
  }),
  
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
      const config = item.config as QrConfig;
      const updates: any = { qrConfig: config };
      
      if (config.formData) {
        if (config.formData.wifi) {
          updates.wifiConfig = { ...defaultWifiConfig, ...config.formData.wifi };
        }
        if (config.formData.vcard) {
          updates.vcardConfig = { ...defaultVcardConfig, ...config.formData.vcard };
        }
        if (config.formData.email) {
          updates.emailConfig = { ...defaultEmailConfig, ...config.formData.email };
        }
        if (config.formData.sms) {
          updates.smsConfig = { ...defaultSmsConfig, ...config.formData.sms };
        }
      }
      
      set(updates);
    } else if (item.type === 'barcode') {
      set({ barcodeConfig: item.config as BarcodeConfig });
    } else if (item.type === 'wifi') {
      const config = item.config as QrConfig;
      const updates: any = { qrConfig: config };
      if (config.formData?.wifi) {
        updates.wifiConfig = { ...defaultWifiConfig, ...config.formData.wifi };
      }
      set(updates);
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
