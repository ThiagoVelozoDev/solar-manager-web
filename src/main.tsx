import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './App';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './components/auth/AuthContext';
import { getApiBaseUrl, getStoredAuthToken } from './lib/api';

const apiBaseUrl = getApiBaseUrl();
const originalFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const shouldAttachToken = requestUrl.startsWith(apiBaseUrl);

  if (!shouldAttachToken) {
    return originalFetch(input, init);
  }

  const headers = new Headers(init?.headers);
  const token = getStoredAuthToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return originalFetch(input, { ...init, headers });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)