import { useState, useCallback, useRef } from 'react';
import { useQrStore } from '@/store/qrStore';
import QrPreview, { useQrCanvas } from '@/components/QrPreview/QrPreview';
import { 
  Link, FileText, Wifi, User, Mail, Phone, MessageSquare,
  Download, Image, Palette, Settings, Upload, ChevronDown, ChevronUp,
  AlertCircle
} from 'lucide-react';
import { downloadQrPng, downloadQrSvg, generateWifiString, generateVCardString, generateEmailString, generateSmsString, generateQrSvg } from '@/utils/qr';
import type { QrContentType, WifiConfig, VCardConfig, EmailConfig, SmsConfig } from '@/types';
import { saveHistory } from '@/utils/storage';

const contentTypes: { type: QrContentType; label: string; icon: any }[] = [
  { type: 'url', label: 'URL', icon: Link },
  { type: 'text', label: '文本', icon: FileText },
  { type: 'wifi', label: 'WiFi', icon: Wifi },
  { type: 'vcard', label: '名片', icon: User },
  { type: 'email', label: '邮件', icon: Mail },
  { type: 'tel', label: '电话', icon: Phone },
  { type: 'sms', label: '短信', icon: MessageSquare },
];

export default function QrGenerate() {
  const { qrConfig, setQrConfig } = useQrStore();
  const { canvasRef, generate, getDataUrl } = useQrCanvas();
  const [expandedSection, setExpandedSection] = useState<string | null>('style');
  const [wifiForm, setWifiForm] = useState<WifiConfig>({
    ssid: '',
    password: '',
    security: 'WPA',
    hidden: false,
  });
  const [vcardForm, setVcardForm] = useState<VCardConfig>({
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    phone: '',
    email: '',
    url: '',
    address: '',
  });
  const [emailForm, setEmailForm] = useState<EmailConfig>({
    to: '',
    subject: '',
    body: '',
  });
  const [smsForm, setSmsForm] = useState<SmsConfig>({
    phone: '',
    message: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const getContent = useCallback((): string => {
    switch (qrConfig.type) {
      case 'url':
      case 'text':
      case 'tel':
        return qrConfig.content;
      case 'wifi':
        return generateWifiString(wifiForm);
      case 'vcard':
        return generateVCardString(vcardForm);
      case 'email':
        return generateEmailString(emailForm);
      case 'sms':
        return generateSmsString(smsForm);
      default:
        return qrConfig.content;
    }
  }, [qrConfig.type, qrConfig.content, wifiForm, vcardForm, emailForm, smsForm]);
  
  const handleTypeChange = (type: QrContentType) => {
    setQrConfig({ type, content: '' });
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setQrConfig({
        logo: {
          ...qrConfig.logo,
          enabled: true,
          dataUrl,
        },
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleDownloadPng = async () => {
    const content = getContent();
    if (canvasRef.current) {
      await generate(content, qrConfig);
      downloadQrPng(canvasRef.current, `qrcode_${Date.now()}.png`);
      saveToHistory();
    }
  };
  
  const handleDownloadSvg = async () => {
    const content = getContent();
    try {
      const svgString = await generateQrSvg(content, qrConfig);
      downloadQrSvg(svgString, `qrcode_${Date.now()}.svg`);
      saveToHistory();
    } catch (e) {
      console.error('SVG download failed', e);
    }
  };
  
  const saveToHistory = () => {
    const content = getContent();
    const preview = getDataUrl();
    saveHistory({
      type: 'qr',
      config: qrConfig,
      preview,
      content: content.substring(0, 50),
    });
  };
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const content = getContent();
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-display mb-3 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
          QR 码生成器
        </h1>
        <p className="text-gray-400">快速生成自定义样式的二维码</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-5">
            <h3 className="card-title flex items-center gap-2">
              <FileText className="w-5 h-5 text-neon-cyan" />
              内容类型
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {contentTypes.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleTypeChange(item.type)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                    qrConfig.type === item.type
                      ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan'
                      : 'bg-dark-surface border border-dark-border text-gray-400 hover:border-neon-cyan/30 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="glass-card p-5">
            <div className="space-y-4">
              {(qrConfig.type === 'url' || qrConfig.type === 'text') && (
                <div>
                  <label className="label-text">
                    {qrConfig.type === 'url' ? '网址 URL' : '文本内容'}
                  </label>
                  <input
                    type="text"
                    value={qrConfig.content}
                    onChange={(e) => setQrConfig({ content: e.target.value })}
                    placeholder={qrConfig.type === 'url' ? 'https://example.com' : '输入文本内容'}
                    className="input-field"
                  />
                </div>
              )}
              
              {qrConfig.type === 'tel' && (
                <div>
                  <label className="label-text">电话号码</label>
                  <input
                    type="tel"
                    value={qrConfig.content}
                    onChange={(e) => setQrConfig({ content: e.target.value })}
                    placeholder="+86 13800138000"
                    className="input-field"
                  />
                </div>
              )}
              
              {qrConfig.type === 'wifi' && (
                <>
                  <div>
                    <label className="label-text">WiFi 名称 (SSID)</label>
                    <input
                      type="text"
                      value={wifiForm.ssid}
                      onChange={(e) => setWifiForm({ ...wifiForm, ssid: e.target.value })}
                      placeholder="MyWiFi"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">密码</label>
                    <input
                      type="text"
                      value={wifiForm.password}
                      onChange={(e) => setWifiForm({ ...wifiForm, password: e.target.value })}
                      placeholder="WiFi 密码"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">安全类型</label>
                    <select
                      value={wifiForm.security}
                      onChange={(e) => setWifiForm({ ...wifiForm, security: e.target.value as any })}
                      className="select-field"
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">无密码</option>
                    </select>
                  </div>
                </>
              )}
              
              {qrConfig.type === 'vcard' && (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-text">姓</label>
                      <input
                        type="text"
                        value={vcardForm.lastName}
                        onChange={(e) => setVcardForm({ ...vcardForm, lastName: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label-text">名</label>
                      <input
                        type="text"
                        value={vcardForm.firstName}
                        onChange={(e) => setVcardForm({ ...vcardForm, firstName: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">公司/组织</label>
                    <input
                      type="text"
                      value={vcardForm.organization}
                      onChange={(e) => setVcardForm({ ...vcardForm, organization: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">职位</label>
                    <input
                      type="text"
                      value={vcardForm.title}
                      onChange={(e) => setVcardForm({ ...vcardForm, title: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">电话</label>
                    <input
                      type="tel"
                      value={vcardForm.phone}
                      onChange={(e) => setVcardForm({ ...vcardForm, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">邮箱</label>
                    <input
                      type="email"
                      value={vcardForm.email}
                      onChange={(e) => setVcardForm({ ...vcardForm, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">网站</label>
                    <input
                      type="url"
                      value={vcardForm.url}
                      onChange={(e) => setVcardForm({ ...vcardForm, url: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              )}
              
              {qrConfig.type === 'email' && (
                <div className="space-y-3">
                  <div>
                    <label className="label-text">收件人</label>
                    <input
                      type="email"
                      value={emailForm.to}
                      onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                      placeholder="example@email.com"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">主题</label>
                    <input
                      type="text"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      placeholder="邮件主题"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">正文</label>
                    <textarea
                      value={emailForm.body}
                      onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                      placeholder="邮件正文..."
                      rows={3}
                      className="input-field resize-none"
                    />
                  </div>
                </div>
              )}
              
              {qrConfig.type === 'sms' && (
                <div className="space-y-3">
                  <div>
                    <label className="label-text">电话号码</label>
                    <input
                      type="tel"
                      value={smsForm.phone}
                      onChange={(e) => setSmsForm({ ...smsForm, phone: e.target.value })}
                      placeholder="+86 13800138000"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">短信内容</label>
                    <textarea
                      value={smsForm.message}
                      onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                      placeholder="短信内容..."
                      rows={3}
                      className="input-field resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="glass-card overflow-hidden">
            <button
              onClick={() => toggleSection('style')}
              className="w-full flex items-center justify-between p-5 hover:bg-dark-surface/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-neon-purple" />
                <span className="font-medium">样式设置</span>
              </div>
              {expandedSection === 'style' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === 'style' && (
              <div className="px-5 pb-5 space-y-4 border-t border-dark-border pt-4">
                <div>
                  <label className="label-text">渲染模式</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setQrConfig({ renderMode: 'canvas' })}
                      className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                        qrConfig.renderMode === 'canvas'
                          ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                          : 'bg-dark-surface text-gray-400 border border-dark-border hover:text-white'
                      }`}
                    >
                      Canvas
                    </button>
                    <button
                      onClick={() => setQrConfig({ renderMode: 'svg' })}
                      className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                        qrConfig.renderMode === 'svg'
                          ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                          : 'bg-dark-surface text-gray-400 border border-dark-border hover:text-white'
                      }`}
                    >
                      SVG
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="label-text">尺寸: {qrConfig.size}px</label>
                  <input
                    type="range"
                    min="128"
                    max="1024"
                    step="8"
                    value={qrConfig.size}
                    onChange={(e) => setQrConfig({ size: parseInt(e.target.value) })}
                    className="range-slider"
                  />
                </div>
                
                <div>
                  <label className="label-text">纠错等级</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['L', 'M', 'Q', 'H'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setQrConfig({ errorLevel: level })}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          qrConfig.errorLevel === level
                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                            : 'bg-dark-surface text-gray-400 border border-dark-border hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    L=7% M=15% Q=25% H=30% 容错率
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">前景色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={qrConfig.foregroundColor}
                        onChange={(e) => setQrConfig({ foregroundColor: e.target.value })}
                        className="color-input"
                      />
                      <input
                        type="text"
                        value={qrConfig.foregroundColor}
                        onChange={(e) => setQrConfig({ foregroundColor: e.target.value })}
                        className="input-field flex-1 text-sm font-mono py-2"
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
                      <input
                        type="text"
                        value={qrConfig.backgroundColor}
                        onChange={(e) => setQrConfig({ backgroundColor: e.target.value })}
                        className="input-field flex-1 text-sm font-mono py-2"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label-text mb-0">渐变效果</label>
                    <div
                      className={`toggle-switch ${qrConfig.gradient.enabled ? 'active' : ''}`}
                      onClick={() => setQrConfig({ gradient: { ...qrConfig.gradient, enabled: !qrConfig.gradient.enabled } })}
                    />
                  </div>
                  
                  {qrConfig.gradient.enabled && (
                    <div className="space-y-3 mt-3 p-3 bg-dark-surface rounded-xl">
                      <div>
                        <label className="label-text">渐变类型</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setQrConfig({ gradient: { ...qrConfig.gradient, type: 'linear' } })}
                            className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${
                              qrConfig.gradient.type === 'linear'
                                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                                : 'bg-dark-bg text-gray-400 border border-dark-border'
                            }`}
                          >
                            线性
                          </button>
                          <button
                            onClick={() => setQrConfig({ gradient: { ...qrConfig.gradient, type: 'radial' } })}
                            className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${
                              qrConfig.gradient.type === 'radial'
                                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                                : 'bg-dark-bg text-gray-400 border border-dark-border'
                            }`}
                          >
                            径向
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={qrConfig.gradient.colors[0]}
                          onChange={(e) => {
                            const colors = [...qrConfig.gradient.colors];
                            colors[0] = e.target.value;
                            setQrConfig({ gradient: { ...qrConfig.gradient, colors } });
                          }}
                          className="color-input"
                        />
                        <input
                          type="color"
                          value={qrConfig.gradient.colors[1]}
                          onChange={(e) => {
                            const colors = [...qrConfig.gradient.colors];
                            colors[1] = e.target.value;
                            setQrConfig({ gradient: { ...qrConfig.gradient, colors } });
                          }}
                          className="color-input"
                        />
                        {qrConfig.gradient.type === 'linear' && (
                          <div className="flex-1">
                            <label className="text-xs text-gray-500">角度</label>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={qrConfig.gradient.rotation}
                              onChange={(e) => setQrConfig({ gradient: { ...qrConfig.gradient, rotation: parseInt(e.target.value) } })}
                              className="range-slider"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label-text mb-0">圆角圆点 (液体像素)</label>
                    <div
                      className={`toggle-switch ${qrConfig.roundedDots ? 'active' : ''}`}
                      onClick={() => setQrConfig({ roundedDots: !qrConfig.roundedDots })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="glass-card overflow-hidden">
            <button
              onClick={() => toggleSection('logo')}
              className="w-full flex items-center justify-between p-5 hover:bg-dark-surface/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-neon-pink" />
                <span className="font-medium">Logo 设置</span>
              </div>
              {expandedSection === 'logo' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === 'logo' && (
              <div className="px-5 pb-5 space-y-4 border-t border-dark-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">启用 Logo</span>
                  <div
                    className={`toggle-switch ${qrConfig.logo.enabled ? 'active' : ''}`}
                    onClick={() => setQrConfig({ logo: { ...qrConfig.logo, enabled: !qrConfig.logo.enabled } })}
                  />
                </div>
                
                {qrConfig.logo.enabled && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-dark-border rounded-xl hover:border-neon-cyan/50 transition-colors flex flex-col items-center gap-2 text-gray-400 hover:text-neon-cyan"
                    >
                      <Upload className="w-8 h-8" />
                      <span className="text-sm">点击上传 Logo</span>
                      <span className="text-xs text-gray-500">支持 PNG, JPG, SVG</span>
                    </button>
                    
                    {qrConfig.logo.dataUrl && (
                      <div className="flex items-center gap-3 p-3 bg-dark-surface rounded-xl">
                        <img src={qrConfig.logo.dataUrl} alt="Logo" className="w-12 h-12 rounded-lg object-contain" />
                        <div className="flex-1">
                          <label className="label-text mb-1">Logo 大小: {qrConfig.logo.size}%</label>
                          <input
                            type="range"
                            min="10"
                            max="30"
                            value={qrConfig.logo.size}
                            onChange={(e) => setQrConfig({ logo: { ...qrConfig.logo, size: parseInt(e.target.value) } })}
                            className="range-slider"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-500/80">
                        建议纠错等级设置为 Q 或 H 以确保二维码在添加 Logo 后仍可正常扫描。Logo 大小不超过 30% 为宜。
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="glass-card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="card-title flex items-center gap-2">
                <Settings className="w-5 h-5 text-neon-cyan" />
                预览
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPng}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <Download className="w-4 h-4" />
                  下载 PNG
                </button>
                <button
                  onClick={handleDownloadSvg}
                  className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <Download className="w-4 h-4" />
                  下载 SVG
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-8 bg-dark-surface/50 rounded-2xl min-h-[400px]">
              <canvas ref={canvasRef} className="hidden" />
              <QrPreview config={qrConfig} content={content} />
            </div>
            
            <div className="mt-4 p-4 bg-dark-surface rounded-xl">
              <p className="text-xs text-gray-500 mb-1">内容预览</p>
              <p className="text-sm text-gray-300 font-mono break-all">
                {content || '请输入内容生成二维码'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
