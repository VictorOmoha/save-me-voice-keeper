import { createRoot } from 'react-dom/client'
import { installBrowserCompatibilityGuards } from './utils/browserCompatibilityGuards.ts'
import App from './App.tsx'
import './index.css'

installBrowserCompatibilityGuards();

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Main.tsx: Root element not found!');
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(<App />);

// Register service worker — aggressively check for updates on every page load
// so new deploys (bundle changes, SW logic changes) propagate without requiring
// users to clear site data manually.
if ('serviceWorker' in navigator) {
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
