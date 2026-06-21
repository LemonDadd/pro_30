export type QrContentType = 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'tel' | 'sms';

export type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

export type RenderMode = 'svg' | 'canvas';

export type GradientType = 'linear' | 'radial';

export interface QrGradient {
  enabled: boolean;
  type: GradientType;
  colors: string[];
  rotation: number;
}

export interface QrLogo {
  enabled: boolean;
  dataUrl: string;
  size: number;
}

export interface QrConfig {
  type: QrContentType;
  content: string;
  size: number;
  errorLevel: ErrorLevel;
  foregroundColor: string;
  backgroundColor: string;
  gradient: QrGradient;
  logo: QrLogo;
  roundedDots: boolean;
  renderMode: RenderMode;
}

export interface WifiConfig {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardConfig {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  url: string;
  address: string;
}

export interface EmailConfig {
  to: string;
  subject: string;
  body: string;
}

export interface SmsConfig {
  phone: string;
  message: string;
}

export type BarcodeFormat = 'CODE128' | 'EAN13' | 'UPC' | 'CODE39' | 'ITF';

export interface BarcodeConfig {
  format: BarcodeFormat;
  content: string;
  width: number;
  height: number;
  displayValue: boolean;
  fontSize: number;
  margin: number;
  lineColor: string;
  backgroundColor: string;
}

export interface HistoryItem {
  id: string;
  type: 'qr' | 'barcode' | 'wifi';
  config: QrConfig | BarcodeConfig;
  preview: string;
  content: string;
  createdAt: number;
}

export interface ScanResult {
  data: string;
  timestamp: number;
}
