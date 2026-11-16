import '@fontsource-variable/manrope';
import '@fontsource/bodoni-moda/400-italic.css';
import '@fontsource/bodoni-moda/600-italic.css';
import '@fontsource/vt323';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
