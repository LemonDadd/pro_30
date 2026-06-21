import { useRef, useEffect, useState } from 'react';
import type { QrConfig } from '@/types';
import { generateQrCanvas, generateQrSvg } from '@/utils/qr';

interface QrPreviewProps {
  config: QrConfig;
  content: string;
  className?: string;
}

export default function QrPreview({ config, content, className = '' }: QrPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [svgString, setSvgString] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!content) return;
    
    setLoading(true);
    
    if (config.renderMode === 'canvas') {
      if (canvasRef.current) {
        generateQrCanvas(canvasRef.current, content, config)
          .finally(() => setLoading(false));
      }
    } else {
      generateQrSvg(content, config)
        .then(svg => {
          setSvgString(svg);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [config, content]);
  
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-surface/50 rounded-xl z-10">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {config.renderMode === 'canvas' ? (
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto rounded-xl shadow-lg"
          style={{ maxHeight: '400px' }}
        />
      ) : (
        <div
          className="max-w-full max-h-[400px] rounded-xl shadow-lg overflow-hidden"
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
      )}
    </div>
  );
}

export function useQrCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const generate = async (content: string, config: QrConfig) => {
    if (canvasRef.current) {
      await generateQrCanvas(canvasRef.current, content, config);
    }
  };
  
  const getDataUrl = (): string => {
    if (canvasRef.current) {
      return canvasRef.current.toDataURL('image/png');
    }
    return '';
  };
  
  return { canvasRef, generate, getDataUrl };
}
