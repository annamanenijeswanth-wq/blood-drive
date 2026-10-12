import React from 'react'; import { createRoot } from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'; import './styles.css';
// Restore a deep-link route preserved by public/404.html before the router reads the URL
try { const r = sessionStorage.getItem('redirect'); if (r) { sessionStorage.removeItem('redirect'); window.history.replaceState(null, '', r); } } catch (e) {}
createRoot(document.getElementById('root')).render(<BrowserRouter basename="/blood-drive"><App /></BrowserRouter>);
