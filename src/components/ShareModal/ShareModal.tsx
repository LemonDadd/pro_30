import { useState, useEffect } from 'react';
import { X, Link, Code, Copy, Check } from 'lucide-react';
import { useQrStore } from '@/store/qrStore';
import { encodeShareUrl, generateEmbedCode, copyToClipboard } from '@/utils/share';
import { generateQrSvg } from '@/utils/qr';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { fullQrConfig, currentQrContent, updateQrContent } = useQrStore();
  const [activeTab, setActiveTab] = useState<'link' | 'embed'>('link');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      updateQrContent();
      setShareUrl('');
      setEmbedCode('');
    }
  }, [isOpen, updateQrContent]);
  
  const handleGenerate = async () => {
    updateQrContent();
    const url = encodeShareUrl(fullQrConfig, 'qr');
    setShareUrl(url);
    
    try {
      const svgString = await generateQrSvg(currentQrContent, fullQrConfig);
      const embed = generateEmbedCode(svgString);
      setEmbedCode(embed);
    } catch (e) {
      setEmbedCode('<!-- 生成嵌入代码失败 -->');
    }
  };
  
  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative glass-card w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h3 className="text-lg font-semibold font-display">分享二维码</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-surface rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="flex gap-2 mb-5 border-b border-dark-border">
            <button
              onClick={() => setActiveTab('link')}
              className={`tab-btn flex items-center gap-2 ${activeTab === 'link' ? 'active' : ''}`}
            >
              <Link className="w-4 h-4" />
              链接分享
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`tab-btn flex items-center gap-2 ${activeTab === 'embed' ? 'active' : ''}`}
            >
              <Code className="w-4 h-4" />
              嵌入代码
            </button>
          </div>
          
          {activeTab === 'link' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                生成可分享链接，包含当前二维码的所有配置参数
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  placeholder="点击生成按钮生成分享链接"
                  className="input-field flex-1 text-sm font-mono"
                />
              </div>
              
              <div className="flex gap-3">
                <button onClick={handleGenerate} className="btn-primary flex-1">
                  生成分享链接
                </button>
                <button
                  onClick={() => handleCopy(shareUrl)}
                  disabled={!shareUrl}
                  className="btn-secondary flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'embed' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                复制 HTML 代码嵌入到您的网站中
              </p>
              
              <div className="p-4 bg-dark-surface rounded-xl border border-dark-border max-h-40 overflow-auto">
                <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">
                  {embedCode || '点击生成按钮生成嵌入代码'}
                </pre>
              </div>
              
              <div className="flex gap-3">
                <button onClick={handleGenerate} className="btn-primary flex-1">
                  生成嵌入代码
                </button>
                <button
                  onClick={() => handleCopy(embedCode)}
                  disabled={!embedCode}
                  className="btn-secondary flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
