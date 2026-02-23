import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const VoiceNavigationListener: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: Event) => {
      const event = e as CustomEvent<{ destination: string; params?: Record<string, unknown> }>;
      const dest = event.detail?.destination;
      const params = event.detail?.params ?? {};
      if (!dest) return;

      if (dest === 'dashboard') {
        if (location.pathname !== '/dashboard') {
          navigate('/dashboard');
        }
      } else if (dest === 'brain-dump') {
        // Persist intent for the Brain Dump page to read on mount
        // Avoid double triggers: only use sessionStorage when navigating; otherwise dispatch event
        if (location.pathname !== '/brain-dump') {
          try {
            sessionStorage.setItem('brain_dump_auto_start', JSON.stringify(params));
          } catch (error) {
            console.debug('Unable to persist brain dump auto-start params:', error);
          }
          navigate('/brain-dump');
          // Also fire a capture event shortly after navigation to support already-mounted listeners
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('brain-dump:start-capture', { detail: params }));
          }, 250);
        } else {
          // Already on page, trigger capture immediately without touching sessionStorage
          window.dispatchEvent(new CustomEvent('brain-dump:start-capture', { detail: params }));
        }
      }
    };

    window.addEventListener('voice-navigate', handler as EventListener);
    return () => window.removeEventListener('voice-navigate', handler as EventListener);
  }, [navigate, location.pathname]);

  return null;
};
