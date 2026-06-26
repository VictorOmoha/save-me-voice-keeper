import { createRoot } from 'react-dom/client'
import { installBrowserCompatibilityGuards } from './utils/browserCompatibilityGuards.ts'
import { isFirebaseConfigured } from './lib/firebase.ts'
import App from './App.tsx'
import './index.css'

installBrowserCompatibilityGuards();

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Main.tsx: Root element not found!');
  throw new Error('Root element not found');
}

const ConfigurationError = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', padding: '2rem', textAlign: 'center' }}>
    <div style={{ maxWidth: '28rem' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>SaveMe can't start</h1>
      <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#94a3b8' }}>
        The app is missing its Firebase configuration, so it can't connect to your data.
        If you're a user, this is on us — please try again shortly or contact{' '}
        <a href="mailto:info@saveme.space" style={{ color: '#38bdf8' }}>info@saveme.space</a>.
        If you're a developer, copy <code>.env.example</code> to <code>.env.local</code> and fill in the
        <code> VITE_FIREBASE_*</code> values, then restart the dev server.
      </p>
    </div>
  </div>
);

const root = createRoot(rootElement);

root.render(isFirebaseConfigured ? <App /> : <ConfigurationError />);

// Register service worker — aggressively check for updates on every page load
// so new deploys (bundle changes, SW logic changes) propagate without requiring
// users to clear site data manually.
// In dev the SW's cache-first strategy serves stale modules (you'd always see
// the previous edit), so unregister instead of registering.
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        // Force an update check immediately
        registration.update().catch(() => {});

        // If a new worker is waiting, tell it to skip waiting and activate
        const tryActivate = (worker: ServiceWorker | null) => {
          if (!worker) return;
          worker.postMessage('skipWaiting');
        };
        if (registration.waiting) tryActivate(registration.waiting);

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW installed while an old one is controlling — activate new one
              tryActivate(installing);
            }
          });
        });

        // When the new SW takes control, reload so page uses latest code
        let reloading = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloading) return;
          reloading = true;
          window.location.reload();
        });
      })
      .catch(() => {});
  });
}
