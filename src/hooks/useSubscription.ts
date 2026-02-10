import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { logError } from '@/utils/logger';

export interface SubscriptionData {
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  active: boolean;
  entryCount: number;
  entryLimit: number;
  features: {
    voiceInput: boolean;
    export: boolean;
    brainDump: boolean;
    premiumTTS: boolean;
    apiAccess: boolean;
    askVault: boolean;
  };
}

export const TIER_LIMITS = {
  free: { entries: 50, voiceInput: true, export: false, brainDump: false, premiumTTS: false, apiAccess: false, askVault: false },
  basic: { entries: 500, voiceInput: true, export: true, brainDump: true, premiumTTS: false, apiAccess: false, askVault: true },
  premium: { entries: -1, voiceInput: true, export: true, brainDump: true, premiumTTS: true, apiAccess: true, askVault: true },
  enterprise: { entries: -1, voiceInput: true, export: true, brainDump: true, premiumTTS: true, apiAccess: true, askVault: true },
};

const DEFAULT_SUBSCRIPTION: SubscriptionData = {
  tier: 'free',
  active: true,
  entryCount: 0,
  entryLimit: TIER_LIMITS.free.entries,
  features: {
    voiceInput: TIER_LIMITS.free.voiceInput,
    export: TIER_LIMITS.free.export,
    brainDump: TIER_LIMITS.free.brainDump,
    premiumTTS: TIER_LIMITS.free.premiumTTS,
    apiAccess: TIER_LIMITS.free.apiAccess,
    askVault: TIER_LIMITS.free.askVault,
  },
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>(DEFAULT_SUBSCRIPTION);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to user document for subscription tier changes
  useEffect(() => {
    if (!user?.uid) {
      setSubscription(DEFAULT_SUBSCRIPTION);
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        const data = docSnap.data();
        const tier: SubscriptionData['tier'] = data?.subscriptionTier || 'free';
        const active: boolean = data?.subscriptionActive ?? true;
        const limits = TIER_LIMITS[tier];

        setSubscription((prev) => ({
          ...prev,
          tier,
          active,
          entryLimit: limits.entries,
          features: {
            voiceInput: limits.voiceInput,
            export: limits.export,
            brainDump: limits.brainDump,
            premiumTTS: limits.premiumTTS,
            apiAccess: limits.apiAccess,
            askVault: limits.askVault,
          },
        }));
        setIsLoading(false);
      },
      (error) => {
        logError('Error listening to user subscription:', error);
        // Fall back to free tier on error
        setSubscription(DEFAULT_SUBSCRIPTION);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Count entries for the user
  useEffect(() => {
    if (!user?.uid) {
      setSubscription((prev) => ({ ...prev, entryCount: 0 }));
      return;
    }

    const entriesRef = collection(db, 'entries');
    const q = query(entriesRef, where('user_id', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSubscription((prev) => ({
          ...prev,
          entryCount: snapshot.size,
        }));
      },
      (error) => {
        logError('Error counting entries:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const canCreateEntry = useCallback((): boolean => {
    if (subscription.entryLimit === -1) return true;
    return subscription.entryCount < subscription.entryLimit;
  }, [subscription.entryCount, subscription.entryLimit]);

  const isFeatureEnabled = useCallback(
    (feature: keyof SubscriptionData['features']): boolean => {
      return subscription.features[feature];
    },
    [subscription.features]
  );

  return {
    subscription,
    isLoading,
    canCreateEntry,
    isFeatureEnabled,
  };
};
