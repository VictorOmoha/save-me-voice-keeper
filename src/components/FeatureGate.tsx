import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscription, SubscriptionData } from '@/hooks/useSubscription';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: keyof SubscriptionData['features'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback: React.FC<{ feature: string }> = ({ feature }) => {
  // Convert camelCase feature name to readable label
  const featureLabel = feature
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  return (
    <div className="border border-galvanized p-6 text-center">
      <div className="flex justify-center mb-3">
        <div className="w-10 h-10 border border-galvanized flex items-center justify-center">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
      <p className="mono text-sm text-muted-foreground tracking-wider mb-1">
        FEATURE_LOCKED
      </p>
      <p className="mono text-xs text-muted-foreground mb-4">
        {featureLabel} requires a higher subscription tier.
      </p>
      <Link
        to="/subscription"
        className="inline-block border border-galvanized px-4 py-2 mono text-xs text-primary hover:border-primary transition-colors tracking-wider"
      >
        UPGRADE_TO_UNLOCK
      </Link>
    </div>
  );
};

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback }) => {
  const { isFeatureEnabled, isLoading } = useSubscription();

  if (isLoading) {
    return null;
  }

  if (isFeatureEnabled(feature)) {
    return <>{children}</>;
  }

  return <>{fallback || <DefaultFallback feature={feature} />}</>;
};
