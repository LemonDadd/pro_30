import { useState, useRef, useEffect, useCallback } from 'react';
import { Scan, Image as ImageIcon, Camera, Copy, ExternalLink, Trash2, Clock, Check } from 'lucide-react';
import jsQR from 'jsqr';
import { saveScanResult, getScanHistory, clearScanHistory } from '@/utils/storage';
import type { ScanResult } from '@/types';
import { copyToClipboard } from '@/utils/share';

export default function QrScan() {
  const [activeTab, setActiveTab] = useState<'image' | 'camera'>('image');
  const [scanResults, setScanResults] = useState<string[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    setScanHistory(getScanHistory());
  }, []);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        
        if (code) {
          setScanResults([code.data]);
          saveScanResult(code.data);
          setScanHistory(getScanHistory());
        } else {
          const results = scanMultipleQRs(ctx, canvas.width, canvas.height);
          if (results.length > 0) {
            setScanResults(results);
            results.forEach(r => saveScanResult(r));
            setScanHistory(getScanHistory());
          } else {
            setScanResults([]);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const scanMultipleQRs = (ctx: CanvasRenderingContext2D, width: number, height: number): string[] => {
    const results: string[] = [];
    const divisions = [2, 3];
    
    for (const div of divisions) {
      const cellW = Math.floor(width / div);
      const cellH = Math.floor(height / div);
      
      for (let i = 0; i < div; i++) {
        for (let j = 0; j < div; j++) {
          const x = i * cellW;
          const y = j * cellH;
          try {
            const imageData = ctx.getImageData(x, y, cellW, cellH);
            const code = jsQR(imageData.data, cellW, cellH);
            if (code && !results.includes(code.data)) {
              results.push(code.data);
            }
          } catch (e) {
            // skip
          }
        }
      }
    }
    
    return results;
  };
  
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        scanFrame();
      }
    } catch (e) {
      console.error('Camera access denied', e);
      alert('无法访问摄像头，请检查权限设置');
    }
  }, []);
  
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);
  
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      setScanResults([code.data]);
      saveScanResult(code.data);
      setScanHistory(getScanHistory());
      stopCamera();
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      return;
    }
    
    animationRef.current = requestAnimationFrame(scanFrame);
  }, [cameraActive, stopCamera]);
  
  useEffect(() => {
    if (activeTab === 'camera' && !cameraActive && !isScanning) {
      setIsScanning(true);
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);
  
  const handleCopy = async (text: string, index: number) => {
    try {
      await copyToClipboard(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };
  
  const handleOpenLink = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank');
    } else {
      window.open('https://' + url, '_blank');
    }
  };
  
  const isUrl = (text: string) => {
    return text.startsWith('http://') || text.startsWith('https://') || text.startsWith('www.');
  };
  
  const handleClearHistory = () => {
    clearScanHistory();
    setScanHistory([]);
  };
  
  const handleUseHistoryItem = (item: ScanResult) => {
    setScanResults([item.data]);
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-display mb-3 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
          QR 码解析
        </h1>
        <p className="text-gray-400">上传图片或使用摄像头扫描二维码</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-5">
            <div className="flex gap-2 mb-5 border-b border-dark-border">
              <button
                onClick={() => { setActiveTab('image'); stopCamera(); }}
                className={`tab-btn flex items-center gap-2 ${activeTab === 'image' ? 'active' : ''}`}
              >
                <ImageIcon className="w-4 h-4" />
                图片上传
              </button>
              <button
                onClick={() => setActiveTab('camera')}
                className={`tab-btn flex items-center gap-2 ${activeTab === 'camera' ? 'active' : ''}`}
              >
                <Camera className="w-4 h-4" />
                相机扫描
              </button>
            </div>
            
            {activeTab === 'image' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-dark-border rounded-2xl p-12 text-center cursor-pointer hover:border-neon-cyan/50 transition-colors group"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-surface flex items-center justify-center group-hover:bg-neon-cyan/10 transition-colors">
                    <UploadIcon className="w-8 h-8 text-gray-400 group-hover:text-neon-cyan transition-colors" />
                  </div>
                  <p className="text-white font-medium mb-2">点击或拖拽图片到此处</p>
                  <p className="text-sm text-gray-500">支持 PNG, JPG, GIF 等常见图片格式</p>
                </div>
              </div>
            )}
            
            {activeTab === 'camera' && (
              <div className="relative">
                <div className="relative aspect-video bg-dark-surface rounded-2xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-neon-cyan/60 rounded-lg">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-scan" />
                      </div>
                    </div>
                  )}
                  
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={startCamera}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        打开摄像头
                      </button>
                    </div>
                  )}
                </div>
                
                {cameraActive && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={stopCamera}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Scan className="w-4 h-4" />
                      停止扫描
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {scanResults.length > 0 && (
            <div className="glass-card p-5 animate-slide-up">
              <h3 className="card-title flex items-center gap-2">
                <Scan className="w-5 h-5 text-neon-green" />
                解析结果 ({scanResults.length} 个)
              </h3>
              
              <div className="space-y-3">
                {scanResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 bg-dark-surface rounded-xl border border-dark-border hover:border-neon-cyan/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <p className="text-white font-mono text-sm break-all flex-1">
                        {result}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(result, index)}
                        className="btn-secondary flex items-center gap-2 text-sm py-2 px-3"
                      >
                        {copiedIndex === index ? (
                          <><Check className="w-4 h-4 text-green-400" /> 已复制</>
                        ) : (
                          <><Copy className="w-4 h-4" /> 复制</>
                        )}
                      </button>
                      
                      {isUrl(result) && (
                        <button
                          onClick={() => handleOpenLink(result)}
                          className="btn-primary flex items-center gap-2 text-sm py-2 px-3"
                        >
                          <ExternalLink className="w-4 h-4" />
                          打开链接
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title flex items-center gap-2 mb-0">
                <Clock className="w-5 h-5 text-neon-purple" />
                扫描历史
              </h3>
              {scanHistory.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-gray-500 hover:text-neon-pink transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  清空
                </button>
              )}
            </div>
            
            {scanHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无扫描记录</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {scanHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleUseHistoryItem(item)}
                    className="w-full text-left p-3 bg-dark-surface rounded-lg hover:bg-dark-surface/80 transition-colors group"
                  >
                    <p className="text-sm text-gray-300 truncate font-mono">{item.data}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(item.timestamp)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
