import { useRegisterSW } from 'virtual:pwa-register/react';
import { logDebug, logError } from '@/utils/logger';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      logDebug('Service worker registered:', swUrl);
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      logError('Service worker registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1.25rem',
        borderRadius: '0.75rem',
        backgroundColor: '#1a1a1f',
        border: '1px solid #3B82F6',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
        color: '#e4e4e7',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.875rem',
      }}
    >
      <span style={{ flex: 1 }}>New version available!</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          padding: '0.375rem 0.875rem',
          borderRadius: '0.5rem',
          border: 'none',
          backgroundColor: '#3B82F6',
          color: '#ffffff',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Update
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        style={{
          padding: '0.375rem',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#71717a',
          fontSize: '1.125rem',
          cursor: 'pointer',
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
