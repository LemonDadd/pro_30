import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface QrFileItem {
  filename: string;
  dataUrl: string;
}

export async function createZip(files: QrFileItem[], zipName: string = 'qrcodes.zip'): Promise<void> {
  const zip = new JSZip();
  
  for (const file of files) {
    const base64Data = file.dataUrl.split(',')[1];
    zip.file(file.filename, base64Data, { base64: true });
  }
  
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipName);
}

export async function createZipFromCanvases(
  canvases: HTMLCanvasElement[],
  filenames: string[],
  zipName: string = 'qrcodes.zip'
): Promise<void> {
  const zip = new JSZip();
  
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i];
    const filename = filenames[i] || `qrcode_${i + 1}.png`;
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.split(',')[1];
    zip.file(filename, base64Data, { base64: true });
  }
  
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipName);
}
