import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return parseCsv(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  }
  
  throw new Error('Unsupported file format. Please upload CSV or Excel file.');
}

function parseCsv(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('Empty CSV file'));
          return;
        }
        
        const headers = parseCsvLine(lines[0]);
        const rows = lines.slice(1).map(line => parseCsvLine(line));
        
        resolve({
          headers,
          rows,
          rowCount: rows.length,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  result.push(current);
  return result;
}

function parseExcel(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
        
        if (jsonData.length === 0) {
          reject(new Error('Empty Excel file'));
          return;
        }
        
        const headers = jsonData[0].map(h => String(h || ''));
        const rows = jsonData.slice(1).map(row => row.map(cell => String(cell || ''))).filter(row => row.some(cell => cell.trim()));
        
        resolve({
          headers,
          rows,
          rowCount: rows.length,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
