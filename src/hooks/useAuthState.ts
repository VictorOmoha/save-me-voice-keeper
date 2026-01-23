import { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

// Constants for retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 500;

export const useAuthState = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);

  const fetchAndSetUser = useCallback(async (session: Session) => {
    if (!mountedRef.current) return;

    try {
      // Fetch profile and subscription data in parallel
      const [profileResult, subscriptionResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle(),
        supabase
          .from('subscribers')
          .select('subscription_tier, subscribed')
          .eq('email', session.user.email)
          .maybeSingle()
      ]);

      if (!mountedRef.current) return;

      const profile = profileResult.data;
      const subscription = subscriptionResult.data;

      // Determine subscription tier and status
      const subscriptionTier = subscription?.subscription_tier || 'free';
      const subscriptionActive = subscription?.subscribed ?? true;

      const userProfile: UserProfile = {
        id: session.user.id,
        email: session.user.email || '',
        full_name: profile?.full_name ||
                   session.user.user_metadata?.full_name ||
                   session.user.user_metadata?.name ||
                   session.user.email?.split('@')[0] || 'User',
        avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url || null,
        subscriptionTier: subscriptionTier as 'free' | 'basic' | 'premium' | 'enterprise',
        subscriptionActive
      };

      setUser(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (!mountedRef.current) return;

      // Fallback to basic user info
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name ||
                 session.user.user_metadata?.name ||
                 session.user.email?.split('@')[0] || 'User',
        avatar_url: session.user.user_metadata?.avatar_url || null,
        subscriptionTier: 'free',
        subscriptionActive: true
      });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);

        if (!mountedRef.current) return;

        setSession(newSession);

        if (newSession?.user) {
          // Use queueMicrotask instead of setTimeout(0) for more predictable timing
          queueMicrotask(() => {
            if (mountedRef.current) {
              fetchAndSetUser(newSession);
            }
          });
        } else {
          setUser(null);
        }

        setIsLoading(false);
      }
    );

    // Handle OAuth callback with proper retry logic
    const handleOAuthCallback = async (): Promise<Session | null> => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // Check for OAuth code in URL (PKCE flow)
      if (params.has('code')) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            params.get('code')!
          );
          if (error) throw error;
          return data.session;
        } catch (error) {
          console.error('Error exchanging code for session:', error);
          return null;
        }
      }

      // Check for access token in hash (implicit flow)
      if (hashParams.has('access_token')) {
        // The auth state listener will handle this automatically
        return null;
      }

      return null;
    };

    // Get initial session with retry logic
    const getInitialSession = async (retryCount = 0): Promise<void> => {
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        // First check for OAuth callback
        await handleOAuthCallback();

        // Then get the current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          if (retryCount < MAX_RETRIES && mountedRef.current) {
            initializingRef.current = false;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return getInitialSession(retryCount + 1);
          }
        } else if (currentSession && mountedRef.current) {
          console.log('Initial session found:', currentSession.user?.email);
          setSession(currentSession);
          await fetchAndSetUser(currentSession);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (retryCount < MAX_RETRIES && mountedRef.current) {
          initializingRef.current = false;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return getInitialSession(retryCount + 1);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
        initializingRef.current = false;
      }
    };

    getInitialSession();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchAndSetUser]);

  const resetUserState = useCallback(() => {
    setUser(null);
    setSession(null);
  }, []);

  return {
    user,
    session,
    isLoading,
    resetUserState
  };
};
