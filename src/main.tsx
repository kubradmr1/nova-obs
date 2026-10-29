import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { AuthProvider } from '@/providers/AuthProvider';
import { MessagingProvider } from '@/providers/MessagingProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import '@/styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element bulunamadı.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <MessagingProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MessagingProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
