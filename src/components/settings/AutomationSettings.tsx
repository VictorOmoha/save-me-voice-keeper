import {useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';
import {ApiKeysSettings} from './ApiKeysSettings';
import {WebhookTesting} from './WebhookTesting';

export const AutomationSettings = () => {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('connect') !== 'agent') return;
    const frame = requestAnimationFrame(() => document.getElementById('connect-agent')?.scrollIntoView({block:'start'}));
    return () => cancelAnimationFrame(frame);
  }, [searchParams]);

  return <div className="min-w-0 space-y-6">
    <ApiKeysSettings />
    <details className="rounded-2xl border border-border/70 bg-card">
      <summary className="cursor-pointer p-5 font-semibold">Webhook testing</summary>
      <div className="space-y-5 px-4 pb-4 md:px-6 md:pb-6">
        <p className="text-sm leading-relaxed text-muted-foreground">Connect tools such as Zapier, Make, or n8n by pasting a webhook URL from your workflow below. Send a test and check the destination to verify it arrived. These controls send data when you choose Send; they do not set up automatic delivery.</p>
        <WebhookTesting />
      </div>
    </details>
  </div>;
};
