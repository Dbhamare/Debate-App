import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_ORIGIN
    ? `${import.meta.env.VITE_API_ORIGIN}/api`
    : 'http://localhost:5000/api',
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