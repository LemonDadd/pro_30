import { useRef, useEffect, useState } from 'react';
import { useQrStore } from '@/store/qrStore';
import { Barcode, Download, Settings, Type, Palette } from 'lucide-react';
import { generateBarcode, downloadBarcodePng, validateBarcodeContent } from '@/utils/barcode';
import type { BarcodeFormat } from '@/types';

const barcodeFormats: { format: BarcodeFormat; label: string; description: string }[] = [
  { format: 'CODE128', label: 'Code 128', description: '高密度，支持全ASCII' },
  { format: 'EAN13', label: 'EAN-13', description: '13位商品条码' },
  { format: 'UPC', label: 'UPC', description: '12位通用商品码' },
  { format: 'CODE39', label: 'Code 39', description: '工业用条码' },
  { format: 'ITF', label: 'ITF', description: '交叉25码' },
];

export default function BarcodePage() {
  const { barcodeConfig, setBarcodeConfig, saveBarcodeToHistory } = useQrStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (canvasRef.current) {
      try {
        const validation = validateBarcodeContent(barcodeConfig.content, barcodeConfig.format);
        if (validation.valid) {
          generateBarcode(canvasRef.current, barcodeConfig);
          setError(null);
        } else {
          setError(validation.message || '内容无效');
        }
      } catch (e: any) {
        setError(e.message || '生成失败');
      }
    }
  }, [barcodeConfig]);
  
  const handleFormatChange = (format: BarcodeFormat) => {
    setBarcodeConfig({ format });
  };
  
  const handleDownload = () => {
    if (canvasRef.current) {
      downloadBarcodePng(canvasRef.current, `barcode_${Date.now()}.png`);
      saveBarcodeToHistory(canvasRef.current.toDataURL('image/png'));
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-display mb-3 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
          条码生成器
        </h1>
        <p className="text-gray-400">生成多种格式的一维条码</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-5">
            <h3 className="card-title flex items-center gap-2">
              <Type className="w-5 h-5 text-neon-cyan" />
              码制选择
            </h3>
            <div className="space-y-2">
              {barcodeFormats.map((item) => (
                <button
                  key={item.format}
                  onClick={() => handleFormatChange(item.format)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    barcodeConfig.format === item.format
                      ? 'bg-neon-cyan/15 border border-neon-cyan/50'
                      : 'bg-dark-surface border border-dark-border hover:border-neon-cyan/30'
                  }`}
                >
                  <p className={`font-medium ${
                    barcodeConfig.format === item.format ? 'text-neon-cyan' : 'text-white'
                  }`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </button>
              ))}
            </div>
          </div>
          
          <div className="glass-card p-5">
            <h3 className="card-title flex items-center gap-2">
              <Settings className="w-5 h-5 text-neon-purple" />
              参数设置
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label-text">内容</label>
                <input
                  type="text"
                  value={barcodeConfig.content}
                  onChange={(e) => setBarcodeConfig({ content: e.target.value })}
                  className="input-field font-mono"
                  placeholder="输入条码内容"
                />
                {error && (
                  <p className="text-xs text-red-400 mt-1">{error}</p>
                )}
              </div>
              
              <div>
                <label className="label-text">高度: {barcodeConfig.height}px</label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={barcodeConfig.height}
                  onChange={(e) => setBarcodeConfig({ height: parseInt(e.target.value) })}
                  className="range-slider"
                />
              </div>
              
              <div>
                <label className="label-text">线宽: {barcodeConfig.width}px</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={barcodeConfig.width}
                  onChange={(e) => setBarcodeConfig({ width: parseFloat(e.target.value) })}
                  className="range-slider"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-text mb-0">显示文字</label>
                  <div
                    className={`toggle-switch ${barcodeConfig.displayValue ? 'active' : ''}`}
                    onClick={() => setBarcodeConfig({ displayValue: !barcodeConfig.displayValue })}
                  />
                </div>
              </div>
              
              {barcodeConfig.displayValue && (
                <div>
                  <label className="label-text">字体大小: {barcodeConfig.fontSize}px</label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={barcodeConfig.fontSize}
                    onChange={(e) => setBarcodeConfig({ fontSize: parseInt(e.target.value) })}
                    className="range-slider"
                  />
                </div>
              )}
              
              <div>
                <label className="label-text">边距: {barcodeConfig.margin}px</label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={barcodeConfig.margin}
                  onChange={(e) => setBarcodeConfig({ margin: parseInt(e.target.value) })}
                  className="range-slider"
                />
              </div>
            </div>
          </div>
          
          <div className="glass-card p-5">
            <h3 className="card-title flex items-center gap-2">
              <Palette className="w-5 h-5 text-neon-pink" />
              颜色设置
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label-text">线条颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={barcodeConfig.lineColor}
                    onChange={(e) => setBarcodeConfig({ lineColor: e.target.value })}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={barcodeConfig.lineColor}
                    onChange={(e) => setBarcodeConfig({ lineColor: e.target.value })}
                    className="input-field flex-1 text-sm font-mono py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="label-text">背景颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={barcodeConfig.backgroundColor}
                    onChange={(e) => setBarcodeConfig({ backgroundColor: e.target.value })}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={barcodeConfig.backgroundColor}
                    onChange={(e) => setBarcodeConfig({ backgroundColor: e.target.value })}
                    className="input-field flex-1 text-sm font-mono py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="glass-card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="card-title flex items-center gap-2">
                <Barcode className="w-5 h-5 text-neon-cyan" />
                预览
              </h3>
              <button
                onClick={handleDownload}
                disabled={!!error}
                className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
              >
                <Download className="w-4 h-4" />
                下载 PNG
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-8 bg-dark-surface/50 rounded-2xl min-h-[300px]">
              {error ? (
                <div className="text-center text-gray-500">
                  <Barcode className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>{error}</p>
                </div>
              ) : (
                <canvas ref={canvasRef} className="max-w-full h-auto" />
              )}
            </div>
            
            <div className="mt-4 p-4 bg-dark-surface rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">格式</p>
                  <p className="text-white font-medium">{barcodeConfig.format}</p>
                </div>
                <div>
                  <p className="text-gray-500">内容长度</p>
                  <p className="text-white font-medium font-mono">{barcodeConfig.content.length} 字符</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
