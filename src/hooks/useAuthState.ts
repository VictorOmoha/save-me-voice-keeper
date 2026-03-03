import { useState, useEffect, useCallback, useRef } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

export const useAuthState = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const mountedRef = useRef(true);
  const unsubFirestoreRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!mountedRef.current) return;

      setUser(firebaseUser);

      // Clean up previous Firestore listener
      if (unsubFirestoreRef.current) {
        unsubFirestoreRef.current();
        unsubFirestoreRef.current = null;
      }

      if (firebaseUser) {
        // Listen to user document for real-time subscription updates
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubFirestoreRef.current = onSnapshot(userDocRef, (snap) => {
          if (!mountedRef.current) return;
          if (snap.exists()) {
            const data = snap.data();
            setSubscriptionTier(data.subscriptionTier || 'free');
            setSubscriptionActive(data.subscriptionStatus === 'active');
          } else {
            setSubscriptionTier('free');
            setSubscriptionActive(false);
          }
          setIsLoading(false);
        }, () => {
          // On error, default to free and stop loading
          if (!mountedRef.current) return;
          setSubscriptionTier('free');
          setSubscriptionActive(false);
          setIsLoading(false);
        });
      } else {
        setSubscriptionTier('free');
        setSubscriptionActive(false);
        setIsLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
      if (unsubFirestoreRef.current) {
        unsubFirestoreRef.current();
      }
    };
  }, []);

  const resetUserState = useCallback(() => {
    setUser(null);
    setSubscriptionTier('free');
    setSubscriptionActive(false);
  }, []);

  return {
    user,
    isLoading,
    subscriptionTier,
    subscriptionActive,
    resetUserState
  };
};
