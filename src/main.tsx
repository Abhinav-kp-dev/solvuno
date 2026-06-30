import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {APIProvider} from '@vis.gl/react-google-maps';
import App from './App.tsx';
import './index.css';
import { AppProvider } from './context/AppContext.tsx';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <AppProvider>
        <App />
      </AppProvider>
    </APIProvider>
  </StrictMode>,
);
