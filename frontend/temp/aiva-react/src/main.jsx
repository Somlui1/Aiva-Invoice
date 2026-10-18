import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// No StrictMode: the retained runtime has one-time imperative side effects.
createRoot(document.getElementById('root')).render(<App />);
