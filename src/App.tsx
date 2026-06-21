import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import QrGenerate from "@/pages/QrGenerate/QrGenerate";
import QrScan from "@/pages/QrScan/QrScan";
import BatchGenerate from "@/pages/BatchGenerate/BatchGenerate";
import Barcode from "@/pages/Barcode/Barcode";
import WifiQr from "@/pages/WifiQr/WifiQr";
import History from "@/pages/History/History";

export default function App() {
  return (
    <Router>
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
