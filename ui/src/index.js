import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './responsive.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Set initial theme based on system preference or saved preference
const savedTheme = localStorage.getItem('themeMode');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

// Apply theme to document
document.documentElement.setAttribute('data-theme', initialTheme);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);