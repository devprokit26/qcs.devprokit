import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Self-hosted fonts (GDPR and offline friendly, no external CDN needed)
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-mono/700.css';

import './styles/index.css';

import { registerSW } from 'virtual:pwa-register';
import '@/services/offline/syncEngine';

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
