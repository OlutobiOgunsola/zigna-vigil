import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export function getErrorMessage(error, fallback = 'Something went wrong.') {
  if (error?.isNormalized) return error.message;
  const data = error?.response?.data;
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (error?.response?.status === 401) return 'Session expired. Please log in.';
  if (error?.code === 'ECONNABORTED') return 'Request timed out.';
  if (!error?.response) return 'Network error.';
  return error?.message || fallback;
}

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('vigil_token');
  if (token) config.headers.set?.('Authorization', `Bearer ${token}`);
  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vigil_token');
      const isAuthPage = window.location.pathname.startsWith('/login');
      if (!isAuthPage) window.location.href = '/login';
    }
    const normalized = new Error(getErrorMessage(error));
    normalized.isNormalized = true;
    normalized.status = error.response?.status;
    normalized.original = error;
    return Promise.reject(normalized);
  }
);

export default {
  authorized: (uri, data, headers = {}, method = 'get') =>
    axiosInstance.request({ method, url: uri, data, headers: { ...headers } }),

  unauthorized: (uri, data, headers = {}, method = 'get') =>
    axiosInstance.request({ method, url: uri, data, headers: { ...headers } }),
};
