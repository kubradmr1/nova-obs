import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { AuthGate } from '@/components/auth/AuthGate';
import { AuthProvider } from '@/providers/AuthProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { MessagingProvider } from '@/providers/MessagingProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import '@/styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element bulunamadı.');
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate>
            <MessagingProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </MessagingProvider>
          </AuthGate>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>,
);
