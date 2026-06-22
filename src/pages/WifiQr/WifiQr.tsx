import { useState, useRef, useEffect } from 'react';
import { useQrStore } from '@/store/qrStore';
import QrPreview from '@/components/QrPreview/QrPreview';
import { Wifi, Download, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { generateWifiString, generateQrCanvas, downloadQrPng } from '@/utils/qr';
import { copyToClipboard } from '@/utils/share';
import type { WifiConfig as WifiConfigType, QrConfig } from '@/types';
import { saveHistory } from '@/utils/storage';

export default function WifiQr() {
  const { qrConfig, setQrConfig, setQrType, wifiConfig, setWifiConfig, updateQrContent } = useQrStore();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    setQrType('wifi');
  }, [setQrType]);
  
  const handleChange = (key: keyof WifiConfigType, value: any) => {
    setWifiConfig({ [key]: value } as Partial<WifiConfigType>);
  };
  
  const getContent = () => {
    return generateWifiString(wifiConfig);
  };
  
  const content = getContent();
  
  const handleDownload = async () => {
    const canvas = document.createElement('canvas');
    await generateQrCanvas(canvas, content, qrConfig);
    downloadQrPng(canvas, `wifi_${wifiConfig.ssid || 'qrcode'}.png`);
    
    const fullConfig: QrConfig = {
      ...qrConfig,
      type: 'wifi',
      content,
      formData: { wifi: { ...wifiConfig } },
    };
    
    saveHistory({
      type: 'wifi',
      config: fullConfig,
      preview: canvas.toDataURL('image/png'),
      content: `WiFi: ${wifiConfig.ssid}`,
    });
  };
  
  const handleCopyPassword = async () => {
    try {
      await copyToClipboard(wifiConfig.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-display mb-3 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
          WiFi 二维码
        </h1>
        <p className="text-gray-400">生成 WiFi 连接二维码，扫码自动连接</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <h3 className="card-title flex items-center gap-2">
              <Wifi className="w-5 h-5 text-neon-green" />
              WiFi 配置
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label-text">WiFi 名称 (SSID)</label>
                <input
                  type="text"
                  value={wifiConfig.ssid}
                  onChange={(e) => handleChange('ssid', e.target.value)}
                  placeholder="MyWiFi"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="label-text">安全类型</label>
                <select
                  value={wifiConfig.security}
                  onChange={(e) => handleChange('security', e.target.value)}
                  className="select-field"
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">无密码</option>
                </select>
              </div>
              
              {wifiConfig.security !== 'nopass' && (
                <div>
                  <label className="label-text">密码</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={wifiConfig.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="WiFi 密码"
                      className="input-field pr-12"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-neon-cyan transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between">
                  <label className="label-text mb-0">隐藏网络</label>
                  <div
                    className={`toggle-switch ${wifiConfig.hidden ? 'active' : ''}`}
                    onClick={() => handleChange('hidden', !wifiConfig.hidden)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-5">
            <h3 className="card-title">样式设置</h3>
            <p className="text-sm text-gray-400 mb-4">
              前往 <span className="text-neon-cyan">QR 生成</span> 页面可自定义更多样式
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="label-text">尺寸: {qrConfig.size}px</label>
                <input
                  type="range"
                  min="128"
                  max="512"
                  step="8"
                  value={qrConfig.size}
                  onChange={(e) => setQrConfig({ size: parseInt(e.target.value) })}
                  className="range-slider"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">前景色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrConfig.foregroundColor}
                      onChange={(e) => setQrConfig({ foregroundColor: e.target.value })}
                      className="color-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-text">背景色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrConfig.backgroundColor}
                      onChange={(e) => setQrConfig({ backgroundColor: e.target.value })}
                      className="color-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="glass-card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="card-title flex items-center gap-2">
                <Wifi className="w-5 h-5 text-neon-green" />
                预览卡片
              </h3>
              <button
                onClick={handleDownload}
                disabled={!wifiConfig.ssid}
                className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
              >
                <Download className="w-4 h-4" />
                下载 PNG
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-sm">
                <div className="bg-gradient-to-br from-dark-surface to-dark-bg rounded-3xl p-6 border border-dark-border shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
                      <Wifi className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">
                        {wifiConfig.ssid || 'WiFi 名称'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {wifiConfig.security === 'nopass' ? '开放网络' : wifiConfig.security}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-4 mb-6 flex items-center justify-center">
                    <div className="w-48 h-48">
                      {wifiConfig.ssid || wifiConfig.security === 'nopass' ? (
                        <QrPreview
                          config={{ ...qrConfig, size: 192 }}
                          content={content}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <p className="text-sm text-center">请输入 WiFi 信息</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {wifiConfig.security !== 'nopass' && (
                    <div className="p-4 bg-dark-surface/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">密码</p>
                          <p className="text-white font-mono">
                            {showPassword ? (wifiConfig.password || '••••••••') : '••••••••'}
                          </p>
                        </div>
                        <button
                          onClick={handleCopyPassword}
                          className="p-2 hover:bg-dark-surface rounded-lg transition-colors text-gray-400 hover:text-neon-cyan"
                        >
                          {copied ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-center text-gray-500 text-xs mt-4">
                    使用手机相机扫描即可连接 WiFi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
