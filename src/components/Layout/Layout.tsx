import { NavLink, Outlet } from 'react-router-dom';
import { QrCode, Scan, Layers, Barcode, Wifi, History, Share2 } from 'lucide-react';
import { useState } from 'react';
import ShareModal from '@/components/ShareModal/ShareModal';

export default function Layout() {
  const [shareOpen, setShareOpen] = useState(false);
  
  const navItems = [
    { path: '/', label: 'QR 生成', icon: QrCode },
    { path: '/scan', label: 'QR 解析', icon: Scan },
    { path: '/batch', label: '批量生成', icon: Layers },
    { path: '/barcode', label: '条码生成', icon: Barcode },
    { path: '/wifi', label: 'WiFi 码', icon: Wifi },
    { path: '/history', label: '历史记录', icon: History },
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-dark-bg/80 border-b border-dark-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-neon-glow">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold font-display bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                QR Studio
              </span>
            </NavLink>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `nav-link flex items-center gap-1.5 text-sm ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            
            <button
              onClick={() => setShareOpen(true)}
              className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">分享</span>
            </button>
          </div>
          
          <nav className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `nav-link flex items-center gap-1.5 text-sm whitespace-nowrap ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      
      <footer className="border-t border-dark-border py-6">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>QR Code Studio · 所有数据本地存储，保护您的隐私</p>
        </div>
      </footer>
      
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
