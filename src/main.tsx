import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';

// =============================================================================
// /demo vs production shell — hard isolation
// =============================================================================
// Build version is logged at startup so an operator inspecting the
// console can confirm which build is loaded. Bumped on each deploy
// that needs to invalidate cached chunks.
const BUILD_VERSION = '2026-05-05.t4-support-email';
// Path-based dispatch with two guarantees:
//   1. Production App and the entire ./app/App.tsx import graph (Sidebar,
//      Dashboard, SetupProtocol, motion/react, etc.) NEVER load on /demo.
//      We dynamic-import per branch so module-level side effects in App's
//      chain cannot run at all on /demo.
//   2. body class is set BEFORE React renders, so the first paint is the
//      Demo dark background — no white flash, no production overlay racing
//      Demo's mount.
//
// CSS in styles/index.css uses `body.demo-mode` to lock the background
// dark synchronously, before the dynamic chunk for Demo arrives.
// =============================================================================

const isDemoRoute = (() => {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname;
  return p === '/demo' || p.startsWith('/demo/');
})();

// eslint-disable-next-line no-console
console.log(`[blackbox-console] build ${BUILD_VERSION} · path=${window.location.pathname} · demo=${isDemoRoute}`);

const root = ReactDOM.createRoot(document.getElementById('root')!);

if (isDemoRoute) {
  document.documentElement.classList.add('demo-mode');
  document.body.classList.add('demo-mode');
  void import('./app/Demo').then(({ default: Demo }) => {
    root.render(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
  });
} else {
  void import('./app/App').then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
}
