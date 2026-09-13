import axios from 'axios';

// Smart Base URL resolution:
// In the browser on any deployed domain (HTTPS or custom domain like ebook.ryz.my.id), ALWAYS use relative '/api' or window.location.origin + '/api'
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // If deployed on cloud domain (HTTPS or non-localhost)
    if (window.location.protocol === 'https:' || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
      return window.location.origin + '/api';
    }
  }

  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('127.0.0.1')) {
    return import.meta.env.VITE_API_URL;
  }

  return 'http://127.0.0.1:8001/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Accept': 'application/json',
  },
});

let isBackendAvailable: boolean | null = null;
let lastCheckTime = 0;

/**
 * Probes the backend API to determine if an active Node/PHP server is running.
 * If running on a static Nginx host without proxying, returns false so components
 * can immediately use client-side engines without triggering HTTP 405 console errors.
 */
export const checkBackendApi = async (): Promise<boolean> => {
  const now = Date.now();
  if (isBackendAvailable !== null && now - lastCheckTime < 30000) {
    return isBackendAvailable;
  }

  try {
    const healthUrl = `${getBaseUrl()}/health`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      isBackendAvailable = !!(data && (data.status === 'ok' || data.success));
    } else {
      isBackendAvailable = false;
    }
  } catch {
    isBackendAvailable = false;
  }
  lastCheckTime = now;
  return isBackendAvailable;
};

export default api;

