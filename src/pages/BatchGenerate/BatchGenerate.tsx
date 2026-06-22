import { useState, useRef, useCallback } from 'react';
import { Layers, Upload, FileSpreadsheet, Eye, Download, ChevronRight, AlertCircle, Check } from 'lucide-react';
import { parseFile, ParsedData } from '@/utils/excel';
import { generateQrCanvas } from '@/utils/qr';
import { useQrStore } from '@/store/qrStore';
import { createZip } from '@/utils/zip';
import { sanitizeFilename } from '@/utils/share';

type Step = 'upload' | 'select' | 'preview';

export default function BatchGenerate() {
  const { qrConfig } = useQrStore();
  const [step, setStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<number>(0);
  const [previewQRs, setPreviewQRs] = useState<{ content: string; dataUrl: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    try {
      const data = await parseFile(file);
      if (data.rowCount === 0) {
        setError('文件中没有有效数据');
        return;
      }
      setParsedData(data);
      setStep('select');
    } catch (err: any) {
      setError(err.message || '文件解析失败');
    }
  };
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    setError(null);
    try {
      const data = await parseFile(file);
      if (data.rowCount === 0) {
        setError('文件中没有有效数据');
        return;
      }
      setParsedData(data);
      setStep('select');
    } catch (err: any) {
      setError(err.message || '文件解析失败');
    }
  }, []);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const generatePreview = async () => {
    if (!parsedData) return;
    
    setIsGenerating(true);
    const previewRows = parsedData.rows.slice(0, 3).filter(row => row[selectedColumn]?.trim());
    const results: { content: string; dataUrl: string }[] = [];
    
    const canvas = document.createElement('canvas');
    
    for (const row of previewRows) {
      const content = row[selectedColumn];
      if (!content?.trim()) continue;
      
      try {
        await generateQrCanvas(canvas, content, { ...qrConfig, size: 150 });
        results.push({
          content,
          dataUrl: canvas.toDataURL('image/png'),
        });
      } catch (e) {
        console.error('QR generation failed', e);
      }
    }
    
    setPreviewQRs(results);
    setIsGenerating(false);
    setStep('preview');
  };
  
  const handleDownloadZip = async () => {
    if (!parsedData) return;
    
    setIsDownloading(true);
    
    try {
      const validRows = parsedData.rows.filter(row => row[selectedColumn]?.trim());
      const files: { filename: string; dataUrl: string }[] = [];
      const canvas = document.createElement('canvas');
      
      for (let i = 0; i < validRows.length; i++) {
        const content = validRows[i][selectedColumn];
        if (!content?.trim()) continue;
        
        await generateQrCanvas(canvas, content, qrConfig);
        const filename = `row${i + 1}_${sanitizeFilename(content)}.png`;
        files.push({
          filename,
          dataUrl: canvas.toDataURL('image/png'),
        });
      }
      
      await createZip(files, `qrcodes_${Date.now()}.zip`);
    } catch (e) {
      console.error('ZIP generation failed', e);
      setError('打包下载失败');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const steps = [
    { key: 'upload', label: '上传文件' },
    { key: 'select', label: '选择列' },
    { key: 'preview', label: '预览下载' },
  ];
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-display mb-3 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
          批量生成
        </h1>
        <p className="text-gray-400">上传 CSV 或 Excel 文件，批量生成二维码</p>
      </div>
      
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2">
          {steps.map((s, index) => (
            <div key={s.key} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                step === s.key
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                  : steps.findIndex(x => x.key === step) > index
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-dark-surface text-gray-500 border border-dark-border'
              }`}>
                {steps.findIndex(x => x.key === step) > index ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                )}
                <span className="text-sm font-medium">{s.label}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-600 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto">
        {step === 'upload' && (
          <div className="glass-card p-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-dark-border rounded-2xl p-12 text-center cursor-pointer hover:border-neon-cyan/50 transition-all group"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-dark-surface flex items-center justify-center group-hover:bg-neon-cyan/10 transition-colors">
                <FileSpreadsheet className="w-10 h-10 text-gray-400 group-hover:text-neon-cyan transition-colors" />
              </div>
              <p className="text-white font-medium text-lg mb-2">拖拽文件到此处或点击上传</p>
              <p className="text-sm text-gray-500 mb-4">支持 CSV、XLS、XLSX 格式</p>
              <button className="btn-primary">
                <Upload className="w-4 h-4 inline mr-2" />
                选择文件
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-dark-surface rounded-xl">
              <h4 className="text-sm font-medium text-white mb-2">文件格式说明</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• 第一行为表头，后续行为数据</li>
                <li>• 选择一列作为二维码内容</li>
                <li>• 空行将被自动跳过</li>
                <li>• 建议文件不超过 1000 行</li>
              </ul>
            </div>
          </div>
        )}
        
        {step === 'select' && parsedData && (
          <div className="glass-card p-6">
            <h3 className="card-title flex items-center gap-2">
              <Layers className="w-5 h-5 text-neon-cyan" />
              选择内容列
            </h3>
            
            <p className="text-sm text-gray-400 mb-4">
              共 {parsedData.rowCount} 行数据，选择一列作为二维码内容
            </p>
            
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {parsedData.headers.map((header, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColumn(index)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedColumn === index
                      ? 'bg-neon-cyan/10 border border-neon-cyan/50'
                      : 'bg-dark-surface border border-dark-border hover:border-neon-cyan/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{header || `第 ${index + 1} 列`}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        示例: {parsedData.rows[0]?.[index] || '(空)'}
                      </p>
                    </div>
                    {selectedColumn === index && (
                      <div className="w-6 h-6 rounded-full bg-neon-cyan flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep('upload')}
                className="btn-secondary flex-1"
              >
                上一步
              </button>
              <button
                onClick={generatePreview}
                disabled={isGenerating}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 生成中...</>
                ) : (
                  <><Eye className="w-4 h-4" /> 预览</>
                )}
              </button>
            </div>
          </div>
        )}
        
        {step === 'preview' && (
          <div className="glass-card p-6">
            <h3 className="card-title flex items-center gap-2">
              <Eye className="w-5 h-5 text-neon-green" />
              批量预览
            </h3>
            
            <p className="text-sm text-gray-400 mb-4">
              预览前 {previewQRs.length} 行二维码（共 {parsedData?.rowCount} 行有效数据）
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {previewQRs.map((qr, index) => (
                <div
                  key={index}
                  className="p-4 bg-dark-surface rounded-xl border border-dark-border hover:border-neon-cyan/30 transition-colors"
                >
                  <img
                    src={qr.dataUrl}
                    alt={`QR ${index + 1}`}
                    className="w-full aspect-square rounded-lg mb-2"
                  />
                  <p className="text-xs text-gray-400 truncate font-mono">{qr.content}</p>
                </div>
              ))}
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                className="btn-secondary flex-1"
              >
                上一步
              </button>
              <button
                onClick={handleDownloadZip}
                disabled={isDownloading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 打包中...</>
                ) : (
                  <><Download className="w-4 h-4" /> 下载 ZIP</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
