import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import QAApp from './QAApp.jsx';

const isQA = typeof window !== 'undefined' && (
  window.location.search.includes('qa=1') || 
  window.location.pathname.startsWith('/qa')
);

ReactDOM.createRoot(document.getElementById('root')).render(
  isQA ? (
    <QAApp />
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);
