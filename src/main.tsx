import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeHistory } from '@/store/qrStore'

function InitApp() {
  useEffect(() => {
    initializeHistory();
  }, []);
  
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InitApp />
  </StrictMode>,
)
