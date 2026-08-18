import axios from 'axios';

// Smart Base URL resolution:
// 1. If VITE_API_URL is explicitly set, use it.
// 2. If running in production browser on a custom domain (e.g. ebook.ryz.my.id), use relative '/api'
// 3. Otherwise in local development, use 'http://127.0.0.1:8001/api' or 'http://127.0.0.1:8000/api'
const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== 'undefined') {
    // If on HTTPS or any production domain, always use same-origin relative /api
    if (window.location.protocol === 'https:' || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
      return '/api';
    }
  }

  return 'http://127.0.0.1:8001/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Accept': 'application/json',
  },
});

export default api;
