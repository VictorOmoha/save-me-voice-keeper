import {useState} from 'react';
import {Bell, Mail, Smartphone} from 'lucide-react';
import {reload, sendEmailVerification} from 'firebase/auth';
import {toast} from 'sonner';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Switch} from '@/components/ui/switch';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {useUserPreferences, type UserPreferences} from '@/hooks/useUserPreferences';
import {useReminderDelivery} from '@/hooks/useReminderDelivery';
import {useAuth} from '@/contexts/AuthContext';
import {auth} from '@/lib/firebase';
import {disablePushDevice, enablePushDevice} from '@/services/pushNotificationService';
import {taskReminderService} from '@/services/taskReminderService';

export const NotificationSettings = () => {
  const {user} = useAuth();
  const {preferences, updatePreferences, isLoading: prefsLoading} = useUserPreferences();
  const {deviceEnabled, emailAvailable, deviceHelp, loading, refreshDevice} = useReminderDelivery();
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [testScheduled, setTestScheduled] = useState(false);
  const emailVerified = user?.emailVerified || verified;
  const disabled = prefsLoading || loading || busy;

  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    try {await operation();} catch (error) {toast.error(error instanceof Error ? error.message : 'Please try again.');}
    finally {setBusy(false);}
  };
  const change = async (key: keyof UserPreferences, value: boolean) => {
    if (!await updatePreferences({[key]: value})) throw new Error('Could not save your notification preference.');
    toast.success('Notification preference saved.');
  };
  const enableDevice = () => {
    const registration = enablePushDevice();
    void run(async () => {
      await registration;
      await change('push_notifications', true);
      await refreshDevice();
    });
  };

  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Reminder delivery</CardTitle>
      <p className="text-sm text-muted-foreground">Choose how SaveMe reaches you when a reminder is due. These settings also apply to reminders you create with Nova.</p>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><Label htmlFor="reminder-alerts">Reminder alerts</Label><p className="text-sm text-muted-foreground">Allow reminder emails, push notifications, and in-app sounds. Reminders always stay in your notification inbox.</p></div>
        <Switch id="reminder-alerts" checked={preferences.reminder_notifications} disabled={disabled} onCheckedChange={value => void run(() => change('reminder_notifications', value))} />
      </div>
      {!preferences.reminder_notifications && <p role="status" className="rounded-lg bg-muted p-3 text-sm">Reminder alerts are paused. Turn them on to receive email or phone alerts.</p>}

      <section className="space-y-3 rounded-lg border p-4" aria-labelledby="push-heading">
        <div className="flex items-start justify-between gap-4">
          <div><h3 id="push-heading" className="flex items-center gap-2 font-medium"><Smartphone className="h-4 w-4" /> Phone & browser notifications</h3><p className="mt-1 text-sm text-muted-foreground">Receive reminders even when SaveMe is closed. Enable each phone or computer you want to use.</p></div>
          <Switch aria-label="Push notifications on all registered devices" checked={preferences.push_notifications} disabled={disabled} onCheckedChange={value => void run(() => change('push_notifications', value))} />
        </div>
        <p className="text-sm" role="status">{loading ? 'Checking this device…' : deviceEnabled ? 'This device is connected.' : 'This device is not connected yet.'}</p>
        {deviceHelp && <p className="text-sm text-muted-foreground">{deviceHelp}</p>}
        {deviceEnabled ? <Button variant="outline" disabled={disabled} onClick={() => void run(async () => {await disablePushDevice(); await refreshDevice(); toast.success('This device is disconnected.');})}>Disconnect this device</Button>
          : <Button disabled={disabled || Boolean(deviceHelp)} onClick={enableDevice}>Enable on this device</Button>}
        <p className="text-xs text-muted-foreground">The switch controls all connected devices. Signing out disconnects this device. Delivery follows your phone’s notification and Focus settings.</p>
      </section>

      <section className="space-y-3 rounded-lg border p-4" aria-labelledby="email-heading">
        <div className="flex items-start justify-between gap-4">
          <div><h3 id="email-heading" className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4" /> Email reminders</h3><p className="mt-1 break-all text-sm text-muted-foreground">{user?.email || 'Add an email address to your account.'}</p></div>
          <Switch aria-label="Email reminders" checked={preferences.email_notifications} disabled={disabled || (!preferences.email_notifications && (!emailVerified || emailAvailable !== true))} onCheckedChange={value => void run(() => change('email_notifications', value))} />
        </div>
        <p className="text-sm text-muted-foreground">{loading ? 'Checking email delivery…' : emailAvailable === null ? 'Could not check email delivery. Please reload to try again.' : !emailAvailable ? 'Email delivery is not available yet. Your in-app reminders will still appear.' : emailVerified ? 'Reminders will be sent to your verified account email when enabled.' : 'Verify your account email before enabling delivery.'}</p>
        {!emailVerified && user?.email && <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={disabled} onClick={() => void run(async () => {
            if (!auth.currentUser) return;
            await sendEmailVerification(auth.currentUser);
            toast.success('Verification email sent. Check your inbox.');
          })}>Send verification email</Button>
          <Button variant="ghost" disabled={disabled} onClick={() => void run(async () => {
            if (!auth.currentUser) return;
            await reload(auth.currentUser);
            setVerified(auth.currentUser.emailVerified);
            if (!auth.currentUser.emailVerified) toast.info('Your email is not verified yet. Open the link in your inbox first.');
          })}>I’ve verified my email</Button>
        </div>}
      </section>

      <div className="space-y-2">
        <Button variant="outline" disabled={disabled || testScheduled || !preferences.reminder_notifications} onClick={() => void run(async () => {
          const result = await taskReminderService.createTaskReminder({taskText: 'Your SaveMe test reminder — you’re connected!', scheduledAtInput: new Date(Date.now() + 60_000).toISOString()});
          if (result.error) throw new Error(result.error);
          setTestScheduled(true);
          window.dispatchEvent(new Event('saveme:reminders-changed'));
          toast.success('Test reminder scheduled for one minute from now.');
        })}>{testScheduled ? 'Test reminder scheduled' : 'Schedule a test reminder'}</Button>
        <p className="text-xs text-muted-foreground">Uses your enabled channels. Reminders are checked every minute; email and phone delivery can take a little longer.</p>
      </div>
      <div className="flex items-start justify-between gap-4 border-t pt-4">
        <div><Label htmlFor="automation-alerts">Automation alerts</Label><p className="text-sm text-muted-foreground">Notifications from automated workflows.</p></div>
        <Switch id="automation-alerts" checked={preferences.automation_notifications} disabled={disabled} onCheckedChange={value => void run(() => change('automation_notifications', value))} />
      </div>
    </CardContent>
  </Card>;
};
