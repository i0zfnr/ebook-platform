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

export default api;
