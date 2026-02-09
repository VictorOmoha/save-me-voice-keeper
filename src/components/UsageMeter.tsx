import React from 'react';
import { Link } from 'react-router-dom';

interface UsageMeterProps {
  current: number;
  limit: number; // -1 means unlimited
  label?: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({ current, limit, label = 'entries' }) => {
  // Unlimited plan
  if (limit === -1) {
    return (
      <div className="border border-galvanized p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="mono text-xs text-muted-foreground tracking-wider">
            {label.toUpperCase()}
          </span>
          <span className="mono text-xs text-muted-foreground">
            {current} / UNLIMITED
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: '10%' }}
          />
        </div>
      </div>
    );
  }

  const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;
  const atLimit = current >= limit;

  // Color based on usage percentage
  let barColor = 'bg-green-500';
  if (percentage >= 90) {
    barColor = 'bg-red-500';
  } else if (percentage >= 70) {
    barColor = 'bg-yellow-500';
  }

  return (
    <div className="border border-galvanized p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="mono text-xs text-muted-foreground tracking-wider">
          {label.toUpperCase()}
        </span>
        <span className="mono text-xs text-muted-foreground">
          {current} / {limit} {label}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {atLimit && (
        <div className="mt-2 flex items-center justify-between">
          <span className="mono text-xs text-red-400">LIMIT_REACHED</span>
          <Link
            to="/subscription"
            className="mono text-xs text-primary hover:underline tracking-wider"
          >
            UPGRADE
          </Link>
        </div>
      )}
    </div>
  );
};
