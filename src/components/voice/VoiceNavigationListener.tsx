import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const VoiceNavigationListener: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: Event) => {
      const event = e as CustomEvent<{ destination: string; params?: any }>;
      const dest = event.detail?.destination;
      if (!dest) return;

      if (dest === 'dashboard') {
        if (location.pathname !== '/dashboard') {
          navigate('/dashboard');
        }
      }
    };

    window.addEventListener('voice-navigate', handler as EventListener);
    return () => window.removeEventListener('voice-navigate', handler as EventListener);
  }, [navigate, location.pathname]);

  return null;
};
