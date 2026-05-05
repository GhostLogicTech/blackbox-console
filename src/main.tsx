import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import Demo from './app/Demo';
import './styles/index.css';

// Demo route lives at /demo on the same domain. We don't add a router
// dependency to the production bundle — a single pathname check at
// mount selects the shell. Production /admin/whatever paths still hit
// App as before; only paths starting with /demo render Demo.
const isDemoRoute = (() => {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname;
  return p === '/demo' || p.startsWith('/demo/');
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isDemoRoute ? <Demo /> : <App />}
  </React.StrictMode>
);
