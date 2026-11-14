// src/main.jsx — Client Entry Point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Global network interceptor: automatically attach auth token to all /api requests
const originalFetch = window.fetch;
window.fetch = function (resource, options = {}) {
  try {
    const token = localStorage.getItem('hospital_token');
    const headers = new Headers(options.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return originalFetch(resource, { ...options, headers });
  } catch {
    return originalFetch(resource, options);
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
