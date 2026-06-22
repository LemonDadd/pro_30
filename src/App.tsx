import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import QrGenerate from "@/pages/QrGenerate/QrGenerate";
import QrScan from "@/pages/QrScan/QrScan";
import BatchGenerate from "@/pages/BatchGenerate/BatchGenerate";
import Barcode from "@/pages/Barcode/Barcode";
import WifiQr from "@/pages/WifiQr/WifiQr";
import History from "@/pages/History/History";
import { initializeHistory, useQrStore } from "@/store/qrStore";
import { decodeShareUrl } from "@/utils/share";
import type { QrConfig, BarcodeConfig } from "@/types";

function DeepLinkHandler() {
  const navigate = useNavigate();
  const setQrConfig = useQrStore(s => s.setQrConfig);
  const setBarcodeConfig = useQrStore(s => s.setBarcodeConfig);
  
  useEffect(() => {
    initializeHistory();
    
    const shared = decodeShareUrl();
    if (shared) {
      if (shared.type === 'qr') {
        setQrConfig(shared.config as Partial<QrConfig>);
        navigate('/');
      } else if (shared.type === 'barcode') {
        setBarcodeConfig(shared.config as Partial<BarcodeConfig>);
        navigate('/barcode');
      }
    }
  }, [navigate, setQrConfig, setBarcodeConfig]);
  
  return null;
}

export default function App() {
  return (
    <Router>
      <DeepLinkHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<QrGenerate />} />
          <Route path="/scan" element={<QrScan />} />
          <Route path="/batch" element={<BatchGenerate />} />
          <Route path="/barcode" element={<Barcode />} />
          <Route path="/wifi" element={<WifiQr />} />
          <Route path="/history" element={<History />} />
        </Route>
      </Routes>
    </Router>
  );
}
