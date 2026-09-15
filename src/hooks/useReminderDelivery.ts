import {useCallback, useEffect, useState} from 'react';
import {getFunctions, httpsCallable} from 'firebase/functions';
import {useAuth} from '@/contexts/AuthContext';
import {isPushDeviceRegistered, pushAvailability} from '@/services/pushNotificationService';

export function useReminderDelivery() {
  const {user} = useAuth();
  const uid = user?.uid;
  const [deviceEnabled, setDeviceEnabled] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceHelp, setDeviceHelp] = useState<string | null>(null);
  const refreshDevice = useCallback(async () => {
    setDeviceHelp(pushAvailability());
    setDeviceEnabled(await isPushDeviceRegistered().catch(() => false));
  }, []);
  useEffect(() => {
    let active = true;
    setDeviceEnabled(false);
    setEmailAvailable(null);
    if (!uid) {setLoading(false); return;}
    setLoading(true);
    void Promise.all([
      isPushDeviceRegistered().catch(() => false),
      httpsCallable<Record<string, never>, {emailAvailable: boolean}>(getFunctions(), 'reminderDeliveryStatus', {timeout: 10_000})({})
        .then(result => result.data.emailAvailable).catch(() => null),
    ]).then(([device, email]) => {
      if (active) {setDeviceEnabled(device); setEmailAvailable(email); setDeviceHelp(pushAvailability()); setLoading(false);}
    });
    window.addEventListener('saveme:push-changed', refreshDevice);
    window.addEventListener('focus', refreshDevice);
    return () => {active = false; window.removeEventListener('saveme:push-changed', refreshDevice); window.removeEventListener('focus', refreshDevice);};
  }, [uid, refreshDevice]);
  return {deviceEnabled, emailAvailable, loading, deviceHelp, refreshDevice};
}
