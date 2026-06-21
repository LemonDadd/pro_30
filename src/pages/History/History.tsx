import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQrStore } from '@/store/qrStore';
import { History, Trash2, RotateCcw, QrCode, Barcode, Wifi, Grid, List } from 'lucide-react';
import { initializeHistory } from '@/store/qrStore';
import type { HistoryItem } from '@/types';

type ViewMode = 'grid' | 'list';

export default function HistoryPage() {
  const { history, deleteHistoryItem, clearHistory, loadFromHistory } = useQrStore();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<'all' | 'qr' | 'barcode' | 'wifi'>('all');
  const navigate = useNavigate();
  
  useEffect(() => {
    initializeHistory();
  }, []);
  
  const filteredHistory = history.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });
  
  const handleLoadItem = (item: HistoryItem) => {
    loadFromHistory(item);
    if (item.type === 'qr') {
      navigate('/');
    } else if (item.type === 'barcode') {
      navigate('/barcode');
    } else if (item.type === 'wifi') {
      navigate('/wifi');
    }
  };
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteHistoryItem(id);
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'qr': return QrCode;
      case 'barcode': return Barcode;
      case 'wifi': return Wifi;
      default: return QrCode;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'qr': return '二维码';
      case 'barcode': return '条码';
      case 'wifi': return 'WiFi';
      default: return type;
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-display mb-3 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
          历史记录
        </h1>
        <p className="text-gray-400">管理您的生成记录，点击重新加载</p>
      </div>
      
      <div className="glass-card p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filterType === 'all'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                  : 'bg-dark-surface text-gray-400 hover:text-white'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterType('qr')}
              className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                filterType === 'qr'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                  : 'bg-dark-surface text-gray-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              二维码
            </button>
            <button
              onClick={() => setFilterType('barcode')}
              className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                filterType === 'barcode'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                  : 'bg-dark-surface text-gray-400 hover:text-white'
              }`}
            >
              <Barcode className="w-4 h-4" />
              条码
            </button>
            <button
              onClick={() => setFilterType('wifi')}
              className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                filterType === 'wifi'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                  : 'bg-dark-surface text-gray-400 hover:text-white'
              }`}
            >
              <Wifi className="w-4 h-4" />
              WiFi
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-dark-surface rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('确定要清空所有历史记录吗？')) {
                    clearHistory();
                  }
                }}
                className="text-sm text-gray-400 hover:text-neon-pink transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </button>
            )}
          </div>
        </div>
      </div>
      
      {filteredHistory.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <History className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-medium text-white mb-2">暂无历史记录</h3>
          <p className="text-gray-500">您生成的二维码和条码将显示在这里</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredHistory.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            return (
              <div
                key={item.id}
                onClick={() => handleLoadItem(item)}
                className="glass-card p-4 cursor-pointer hover:border-neon-cyan/50 transition-all group hover:shadow-neon-glow"
              >
                <div className="relative aspect-square bg-dark-surface rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {item.preview ? (
                    <img
                      src={item.preview}
                      alt={item.content}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <TypeIcon className="w-12 h-12 text-gray-600" />
                  )}
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-1.5 bg-red-500/80 rounded-lg text-white hover:bg-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 bg-dark-bg/80 backdrop-blur rounded-md text-xs text-gray-300">
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-white truncate font-mono">{item.content}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(item.createdAt)}</p>
                
                <button className="w-full mt-3 py-2 text-xs text-neon-cyan bg-neon-cyan/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  重新加载
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card divide-y divide-dark-border">
          {filteredHistory.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            return (
              <div
                key={item.id}
                onClick={() => handleLoadItem(item)}
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-dark-surface/50 transition-colors group"
              >
                <div className="w-16 h-16 bg-dark-surface rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.preview ? (
                    <img
                      src={item.preview}
                      alt={item.content}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <TypeIcon className="w-8 h-8 text-gray-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TypeIcon className="w-4 h-4 text-neon-cyan" />
                    <span className="text-xs text-gray-500">{getTypeLabel(item.type)}</span>
                  </div>
                  <p className="text-white truncate font-mono">{item.content}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatDate(item.createdAt)}</p>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-neon-cyan/20 rounded-lg text-gray-400 hover:text-neon-cyan transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
