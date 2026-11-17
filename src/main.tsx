import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { notifyVisitOncePerDay } from './analytics/notify';
import { registerSW } from 'virtual:pwa-register';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerSW({ immediate: true });
notifyVisitOncePerDay();
