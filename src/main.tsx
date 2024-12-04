import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Ton style global
import 'leaflet/dist/leaflet.css'; // Import du style Leaflet
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
