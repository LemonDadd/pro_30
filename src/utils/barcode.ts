import JsBarcode from 'jsbarcode';
import type { BarcodeConfig } from '@/types';

export function generateBarcode(
  canvasOrSvg: HTMLCanvasElement | SVGElement,
  config: BarcodeConfig
): void {
  const { format, content, width, height, displayValue, fontSize, margin, lineColor, backgroundColor } = config;
  
  const options: JsBarcode.Options = {
    format: format.toLowerCase(),
    width: width / 100,
    height: height,
    displayValue,
    fontSize,
    margin,
    lineColor,
    background: backgroundColor,
    textMargin: 8,
  };
  
  JsBarcode(canvasOrSvg as any, content, options);
}

export function downloadBarcodePng(canvas: HTMLCanvasElement, filename: string = 'barcode.png'): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function downloadBarcodeSvg(svgElement: SVGElement, filename: string = 'barcode.svg'): void {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function validateBarcodeContent(content: string, format: string): { valid: boolean; message?: string } {
  if (!content) {
    return { valid: false, message: '请输入内容' };
  }
  
  switch (format) {
    case 'EAN13':
      if (!/^\d{12,13}$/.test(content)) {
        return { valid: false, message: 'EAN-13 需要 12-13 位数字' };
      }
      break;
    case 'UPC':
      if (!/^\d{11,12}$/.test(content)) {
        return { valid: false, message: 'UPC 需要 11-12 位数字' };
      }
      break;
    case 'CODE39':
      if (!/^[A-Z0-9 \-\.$\/\+%]*$/.test(content)) {
        return { valid: false, message: 'CODE39 仅支持大写字母、数字和特殊字符' };
      }
      break;
    case 'ITF':
      if (!/^\d+$/.test(content) || content.length % 2 !== 0) {
        return { valid: false, message: 'ITF 需要偶数位数字' };
      }
      break;
  }
  
  return { valid: true };
}
