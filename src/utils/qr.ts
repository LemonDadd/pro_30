import QRCode from 'qrcode';
import type { QrConfig, WifiConfig, VCardConfig, EmailConfig, SmsConfig, ErrorLevel } from '@/types';

export function generateWifiString(config: WifiConfig): string {
  const { ssid, password, security, hidden } = config;
  const escape = (str: string) => str.replace(/([\\:;,])/g, '\\$1');
  
  let result = 'WIFI:';
  result += `T:${security};`;
  result += `S:${escape(ssid)};`;
  if (security !== 'nopass' && password) {
    result += `P:${escape(password)};`;
  }
  if (hidden) {
    result += 'H:true;';
  }
  result += ';';
  return result;
}

export function generateVCardString(config: VCardConfig): string {
  const { firstName, lastName, organization, title, phone, email, url, address } = config;
  const name = `${lastName}${firstName ? ';' + firstName : ''}`;
  const fullName = `${firstName} ${lastName}`.trim();
  
  let vcard = 'BEGIN:VCARD\n';
  vcard += 'VERSION:3.0\n';
  if (name) vcard += `N:${name}\n`;
  if (fullName) vcard += `FN:${fullName}\n`;
  if (organization) vcard += `ORG:${organization}\n`;
  if (title) vcard += `TITLE:${title}\n`;
  if (phone) vcard += `TEL:${phone}\n`;
  if (email) vcard += `EMAIL:${email}\n`;
  if (url) vcard += `URL:${url}\n`;
  if (address) vcard += `ADR:;;${address}\n`;
  vcard += 'END:VCARD';
  return vcard;
}

export function generateEmailString(config: EmailConfig): string {
  const { to, subject, body } = config;
  let result = `mailto:${to}`;
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (params.length > 0) {
    result += '?' + params.join('&');
  }
  return result;
}

export function generateSmsString(config: SmsConfig): string {
  const { phone, message } = config;
  if (message) {
    return `SMSTO:${phone}:${message}`;
  }
  return `tel:${phone}`;
}

export function getQrContent(config: QrConfig): string {
  switch (config.type) {
    case 'url':
    case 'text':
    case 'tel':
      return config.content;
    case 'wifi':
      return config.content;
    case 'vcard':
      return config.content;
    case 'email':
      return config.content;
    case 'sms':
      return config.content;
    default:
      return config.content;
  }
}

export async function generateQrCanvas(
  canvas: HTMLCanvasElement,
  content: string,
  config: QrConfig
): Promise<void> {
  const { size, errorLevel, foregroundColor, backgroundColor, gradient, roundedDots, logo } = config;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  canvas.width = size;
  canvas.height = size;
  
  await QRCode.toCanvas(canvas, content, {
    width: size,
    margin: 0,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
    errorCorrectionLevel: errorLevel as ErrorLevel,
  });
  
  if (gradient.enabled && gradient.colors.length >= 2) {
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    let grad: CanvasGradient;
    if (gradient.type === 'linear') {
      const angle = (gradient.rotation * Math.PI) / 180;
      const x1 = size / 2 - (size / 2) * Math.cos(angle);
      const y1 = size / 2 - (size / 2) * Math.sin(angle);
      const x2 = size / 2 + (size / 2) * Math.cos(angle);
      const y2 = size / 2 + (size / 2) * Math.sin(angle);
      grad = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    }
    
    gradient.colors.forEach((color, index) => {
      grad.addColorStop(index / (gradient.colors.length - 1), color);
    });
    
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'source-over';
    
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'source-over';
  }
  
  if (roundedDots) {
    await applyRoundedDots(canvas, content, config);
  }
  
  if (logo.enabled && logo.dataUrl) {
    await applyLogo(canvas, logo.dataUrl, logo.size);
  }
}

async function applyRoundedDots(
  canvas: HTMLCanvasElement,
  content: string,
  config: QrConfig
): Promise<void> {
  const { size, errorLevel, foregroundColor, backgroundColor, gradient } = config;
  
  try {
    const qrData = await QRCode.create(content, {
      errorCorrectionLevel: errorLevel as ErrorLevel,
    });
    
    const modules = qrData.modules;
    const moduleCount = modules.size;
    const moduleSize = size / moduleCount;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
    
    let fillStyle: string | CanvasGradient = foregroundColor;
    if (gradient.enabled && gradient.colors.length >= 2) {
      if (gradient.type === 'linear') {
        const angle = (gradient.rotation * Math.PI) / 180;
        const x1 = size / 2 - (size / 2) * Math.cos(angle);
        const y1 = size / 2 - (size / 2) * Math.sin(angle);
        const x2 = size / 2 + (size / 2) * Math.cos(angle);
        const y2 = size / 2 + (size / 2) * Math.sin(angle);
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.colors.forEach((color, index) => {
          grad.addColorStop(index / (gradient.colors.length - 1), color);
        });
        fillStyle = grad;
      } else {
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.colors.forEach((color, index) => {
          grad.addColorStop(index / (gradient.colors.length - 1), color);
        });
        fillStyle = grad;
      }
    }
    
    ctx.fillStyle = fillStyle;
    
    const radius = moduleSize * 0.4;
    
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules.get(row, col)) {
          const x = col * moduleSize + moduleSize / 2;
          const y = row * moduleSize + moduleSize / 2;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } catch (e) {
    console.warn('Rounded dots fallback to regular QR');
  }
}

async function applyLogo(
  canvas: HTMLCanvasElement,
  logoDataUrl: string,
  logoSizePercent: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No canvas context'));
        return;
      }
      
      const logoSize = (canvas.width * logoSizePercent) / 100;
      const x = (canvas.width - logoSize) / 2;
      const y = (canvas.height - logoSize) / 2;
      
      const padding = logoSize * 0.1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const r = logoSize * 0.15;
      roundRect(ctx, x - padding, y - padding, logoSize + padding * 2, logoSize + padding * 2, r);
      ctx.fill();
      
      ctx.drawImage(img, x, y, logoSize, logoSize);
      resolve();
    };
    img.onerror = reject;
    img.src = logoDataUrl;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export async function generateQrSvg(
  content: string,
  config: QrConfig
): Promise<string> {
  const { size, errorLevel, foregroundColor, backgroundColor, gradient, logo, roundedDots } = config;
  
  let svgString = await QRCode.toString(content, {
    type: 'svg',
    width: size,
    margin: 0,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
    errorCorrectionLevel: errorLevel as ErrorLevel,
  });
  
  if (roundedDots) {
    svgString = await generateRoundedDotsSvg(content, config);
  }
  
  if (gradient.enabled && gradient.colors.length >= 2) {
    svgString = applyGradientToSvg(svgString, gradient, size);
  }
  
  if (logo.enabled && logo.dataUrl) {
    svgString = applyLogoToSvg(svgString, logo.dataUrl, logo.size, size);
  }
  
  return svgString;
}

function applyGradientToSvg(
  svgString: string,
  gradient: { type: 'linear' | 'radial'; colors: string[]; rotation: number },
  size: number
): string {
  const gradientId = 'qrGradient';
  let gradientDef = '';
  
  if (gradient.type === 'linear') {
    const angle = gradient.rotation;
    const x1 = 50 - 50 * Math.cos((angle * Math.PI) / 180);
    const y1 = 50 - 50 * Math.sin((angle * Math.PI) / 180);
    const x2 = 50 + 50 * Math.cos((angle * Math.PI) / 180);
    const y2 = 50 + 50 * Math.sin((angle * Math.PI) / 180);
    gradientDef = `<defs><linearGradient id="${gradientId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
    gradient.colors.forEach((color, index) => {
      gradientDef += `<stop offset="${(index / (gradient.colors.length - 1)) * 100}%" stop-color="${color}"/>`;
    });
    gradientDef += '</linearGradient></defs>';
  } else {
    gradientDef = `<defs><radialGradient id="${gradientId}" cx="50%" cy="50%" r="50%">`;
    gradient.colors.forEach((color, index) => {
      gradientDef += `<stop offset="${(index / (gradient.colors.length - 1)) * 100}%" stop-color="${color}"/>`;
    });
    gradientDef += '</radialGradient></defs>';
  }
  
  svgString = svgString.replace('<svg ', `<svg ${gradientDef}`);
  svgString = svgString.replace(/fill="#([0-9a-fA-F]{6})"/g, (match, hex) => {
    if (hex.toLowerCase() !== 'ffffff') {
      return `fill="url(#${gradientId})"`;
    }
    return match;
  });
  
  return svgString;
}

function applyLogoToSvg(
  svgString: string,
  logoDataUrl: string,
  logoSizePercent: number,
  qrSize: number
): string {
  const logoSize = (qrSize * logoSizePercent) / 100;
  const x = (qrSize - logoSize) / 2;
  const y = (qrSize - logoSize) / 2;
  const padding = logoSize * 0.1;
  const rectSize = logoSize + padding * 2;
  const rectX = x - padding;
  const rectY = y - padding;
  const r = logoSize * 0.15;
  
  const logoSvg = `
    <rect x="${rectX}" y="${rectY}" width="${rectSize}" height="${rectSize}" rx="${r}" fill="white"/>
    <image href="${logoDataUrl}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}"/>
  `;
  
  svgString = svgString.replace('</svg>', `${logoSvg}</svg>`);
  return svgString;
}

async function generateRoundedDotsSvg(content: string, config: QrConfig): Promise<string> {
  const { size, errorLevel, foregroundColor, backgroundColor, gradient } = config;
  
  try {
    const qrData = await QRCode.create(content, {
      errorCorrectionLevel: errorLevel as ErrorLevel,
    });
    
    const modules = qrData.modules;
    const moduleCount = modules.size;
    const moduleSize = size / moduleCount;
    const radius = moduleSize * 0.4;
    
    let circles = '';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules.get(row, col)) {
          const cx = col * moduleSize + moduleSize / 2;
          const cy = row * moduleSize + moduleSize / 2;
          circles += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${radius.toFixed(2)}"/>`;
        }
      }
    }
    
    const fill = gradient.enabled && gradient.colors.length >= 2 ? 'url(#qrGradient)' : foregroundColor;
    let defs = '';
    
    if (gradient.enabled && gradient.colors.length >= 2) {
      if (gradient.type === 'linear') {
        const angle = gradient.rotation;
        const x1 = 50 - 50 * Math.cos((angle * Math.PI) / 180);
        const y1 = 50 - 50 * Math.sin((angle * Math.PI) / 180);
        const x2 = 50 + 50 * Math.cos((angle * Math.PI) / 180);
        const y2 = 50 + 50 * Math.sin((angle * Math.PI) / 180);
        defs = `<defs><linearGradient id="qrGradient" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
        gradient.colors.forEach((color, index) => {
          defs += `<stop offset="${(index / (gradient.colors.length - 1)) * 100}%" stop-color="${color}"/>`;
        });
        defs += '</linearGradient></defs>';
      } else {
        defs = `<defs><radialGradient id="qrGradient" cx="50%" cy="50%" r="50%">`;
        gradient.colors.forEach((color, index) => {
          defs += `<stop offset="${(index / (gradient.colors.length - 1)) * 100}%" stop-color="${color}"/>`;
        });
        defs += '</radialGradient></defs>';
      }
    }
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${defs}
  <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
  <g fill="${fill}">${circles}</g>
</svg>`;
  } catch (e) {
    return QRCode.toString(content, {
      type: 'svg',
      width: size,
      margin: 0,
      color: { dark: foregroundColor, light: backgroundColor },
      errorCorrectionLevel: errorLevel as ErrorLevel,
    });
  }
}

export function downloadQrPng(canvas: HTMLCanvasElement, filename: string = 'qrcode.png'): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function downloadQrSvg(svgString: string, filename: string = 'qrcode.svg'): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
