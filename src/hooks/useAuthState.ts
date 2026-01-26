import { useState, useEffect, useCallback, useRef } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const useAuthState = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    console.log('useAuthState: Setting up Firebase auth listener');

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('useAuthState: Auth state changed', {
        user: firebaseUser?.email,
        uid: firebaseUser?.uid
      });

      if (!mountedRef.current) return;

      setUser(firebaseUser);
      setIsLoading(false);
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const resetUserState = useCallback(() => {
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    resetUserState
  };
};
