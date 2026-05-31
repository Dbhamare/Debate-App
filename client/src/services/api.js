import axios from 'axios';

const apiOrigin = import.meta.env.VITE_API_ORIGIN ? import.meta.env.VITE_API_ORIGIN.replace(/\/+$/, '') : (import.meta.env.DEV ? '' : '');

if (import.meta.env.PROD && !apiOrigin) {
  console.error('Missing VITE_API_ORIGIN. Set it to the deployed backend URL before building the frontend.');
}

const api = axios.create({
  baseURL: `${apiOrigin}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;
