import React from "react";
import { VoiceSettingsForm } from "./VoiceSettingsForm";
import {useVoiceSession} from '@/contexts/VoiceSessionContext';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Link} from 'react-router-dom';

export const VoiceSettings: React.FC = () => {
  const session = useVoiceSession();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Nova voice</CardTitle><p className="text-sm text-muted-foreground">One realtime conversation across your workspace.</p></CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">Talk naturally, interrupt Nova, and move between pages without ending your conversation. Your microphone turns on when you start speaking with Nova.</p>
          <div className="flex items-center justify-between gap-4"><label htmlFor="nova-auto-listen" className="text-sm font-medium">Keep listening after Nova replies<span className="mt-1 block text-xs font-normal text-muted-foreground">Applies to your current conversation.</span></label>
            <Switch id="nova-auto-listen" checked={session.continuous} onCheckedChange={session.setContinuous} />
          </div>
          <Button asChild><Link to="/voice-capture">Open voice capture</Link></Button>
        </CardContent>
      </Card>
      <details className="rounded-xl border border-border/70 bg-card p-5">
        <summary className="cursor-pointer text-sm font-medium">Read-aloud preferences</summary>
        <p className="my-4 text-sm text-muted-foreground">These preferences control read-aloud playback and legacy speech tools. Nova’s realtime conversation uses its own voice.</p>
        <VoiceSettingsForm showTitle={false} />
      </details>
    </div>
  );
};
