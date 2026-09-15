import {deleteDoc, doc, getDoc, serverTimestamp, setDoc} from 'firebase/firestore';
import {auth, db} from '@/lib/firebase';

const DEVICE_KEY = 'saveme:push-device';
const PUSH_STATE_CACHE = 'saveme-push-state-v1';
let enrollmentVersion = 0;
export const pushConfigured = Boolean(import.meta.env.VITE_FIREBASE_VAPID_KEY);

export function pushAvailability(): string | null {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & {standalone?: boolean}).standalone;
  if (ios && !standalone) return 'On iPhone or iPad, open SaveMe in Safari, tap Share → Add to Home Screen, then open SaveMe from that icon.';
  if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'Push notifications are unavailable in this browser. You can still receive email reminders.';
  if (Notification.permission === 'denied') return 'Notifications are blocked. Allow them in your browser or phone settings, then try again.';
  if (!pushConfigured) return 'Phone notifications are not available yet. You can still use in-app reminders.';
  return null;
}

function savedDevice(): {id: string; uid: string} | null {
  try {
    const value = JSON.parse(localStorage.getItem(DEVICE_KEY) || 'null');
    return typeof value?.id === 'string' && typeof value?.uid === 'string' ? value : null;
  } catch {return null;}
}

export async function isPushDeviceRegistered(): Promise<boolean> {
  const device = savedDevice();
  if (!device || device.uid !== auth.currentUser?.uid || !('Notification' in window) || Notification.permission !== 'granted') return false;
  return (await getDoc(doc(db, 'push_devices', device.id))).exists();
}

export async function enablePushDevice(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in to enable notifications.');
  const unavailable = pushAvailability();
  if (unavailable) throw new Error(unavailable);
  // Request in the click handler, before network work, to preserve user activation on iOS.
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Allow notifications to receive reminders on this device.');
  const previous = savedDevice();
  if (previous && previous.uid !== uid) await disablePushDevice();
  await registerDevice(uid);
}

async function registerDevice(uid: string): Promise<void> {
  const version = enrollmentVersion;
  const stillSignedIn = () => auth.currentUser?.uid === uid && version === enrollmentVersion;
  const {getMessaging, getToken, isSupported} = await import('firebase/messaging');
  if (!(await isSupported())) throw new Error('This browser cannot receive push notifications. Try email reminders.');
  await navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'});
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(), {vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration});
  if (!token || !stillSignedIn()) throw new Error('Please sign in and try enabling notifications again.');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const id = Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  await setDoc(doc(db, 'push_devices', id), {user_id: uid, token, updated_at: serverTimestamp()});
  if (!stillSignedIn()) throw new Error('Device setup was cancelled.');
  const cache = await caches.open(PUSH_STATE_CACHE);
  if (!stillSignedIn()) throw new Error('Device setup was cancelled.');
  await cache.put('/__push-owner', new Response(uid));
  if (!stillSignedIn()) {await cache.delete('/__push-owner'); throw new Error('Device setup was cancelled.');}
  const previous = savedDevice();
  localStorage.setItem(DEVICE_KEY, JSON.stringify({id, uid}));
  if (previous?.uid === uid && previous.id !== id) void deleteDoc(doc(db, 'push_devices', previous.id)).catch(() => {});
  window.dispatchEvent(new Event('saveme:push-changed'));
}

export async function refreshPushDevice(): Promise<void> {
  const device = savedDevice();
  if (device?.uid === auth.currentUser?.uid && !pushAvailability()) await registerDevice(device.uid);
}

export async function disablePushDevice(): Promise<void> {
  enrollmentVersion++;
  const device = savedDevice();
  // Forget enrollment before async cleanup so a provider error cannot silently
  // reconnect this device on the next sign-in.
  localStorage.removeItem(DEVICE_KEY);
  window.dispatchEvent(new Event('saveme:push-changed'));
  if ('caches' in window) {
    const cache = await caches.open(PUSH_STATE_CACHE);
    await cache.delete('/__push-owner');
  }
  // Unsubscribe locally even if the server is unreachable, so sign-out cannot leave
  // reminder contents appearing on a shared phone. Server records are cleaned separately.
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      // Local display is already blocked above. Do not make sign-out wait on a
      // push provider indefinitely when the phone is offline.
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {await Promise.race([subscription.unsubscribe(), new Promise(resolve => {timer = setTimeout(resolve, 4000);})]);}
      finally {clearTimeout(timer);}
    }
    const notifications = await registration?.getNotifications();
    notifications?.forEach(notification => notification.close());
  }
  if (device && device.uid === auth.currentUser?.uid) void deleteDoc(doc(db, 'push_devices', device.id)).catch(() => { /* Expired tokens are also removed by the sender. */ });
}
