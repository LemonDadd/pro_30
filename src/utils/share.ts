import type { QrConfig, BarcodeConfig } from '@/types';

export function encodeShareUrl(config: QrConfig | BarcodeConfig, type: 'qr' | 'barcode'): string {
  try {
    const data = JSON.stringify({ type, config });
    const encoded = btoa(unescape(encodeURIComponent(data)));
    return `${window.location.origin}${window.location.pathname}#${encoded}`;
  } catch (e) {
    console.error('Failed to encode share URL', e);
    return '';
  }
}

export function decodeShareUrl(): { type: 'qr' | 'barcode'; config: QrConfig | BarcodeConfig } | null {
  try {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    
    const decoded = decodeURIComponent(escape(atob(hash)));
    const data = JSON.parse(decoded);
    
    if (data.type && data.config) {
      return data;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function generateEmbedCode(svgString: string): string {
  return `<img src="data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}" alt="QR Code" />`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function sanitizeFilename(name: string, maxLength: number = 30): string {
  let sanitized = name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }
  if (!sanitized) {
    sanitized = 'unnamed';
  }
  return sanitized;
}
