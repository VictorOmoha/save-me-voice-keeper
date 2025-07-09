import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export const useAuthState = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetUser = async (session: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          subscriptionTier: 'free',
          subscriptionActive: true
        });
      } else {
        // Create fallback user if no profile exists
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
    } catch (error) {
      console.error('Error fetching profile:', error);
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
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          // Defer profile fetching to avoid potential deadlocks
          setTimeout(() => {
            if (mounted) {
              fetchAndSetUser(session);
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setIsLoading(false);
        } else if (session) {
          console.log('Initial session found:', session.user?.email);
          // Force trigger auth state change for OAuth redirects
          if (mounted) {
            setSession(session);
            setTimeout(() => {
              if (mounted) {
                fetchAndSetUser(session);
              }
            }, 0);
            setIsLoading(false);
          }
        } else {
          if (mounted) setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) setIsLoading(false);
      }
    };

    // Check for OAuth callback in URL
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has('code') || window.location.hash.includes('access_token')) {
        // This is an OAuth callback, wait a bit longer for session to be established
        await new Promise(resolve => setTimeout(resolve, 100));
        await getInitialSession();
      } else {
        await getInitialSession();
      }
    };

    handleOAuthCallback();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const resetUserState = () => {
    setUser(null);
    setSession(null);
  };

  return {
    user,
    session,
    isLoading,
    resetUserState
  };
};