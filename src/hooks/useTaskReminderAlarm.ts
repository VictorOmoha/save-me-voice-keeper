import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";

const playReminderChime = () => {
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const audioContext = new AudioContextCtor();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.18);
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.5);

  window.setTimeout(() => void audioContext.close(), 800);
};

export const useTaskReminderAlarm = () => {
  const { systemNotifs } = useNotifications();
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const notification of systemNotifs) {
      if (notification.status !== "pending") continue;
      if (notification.type !== "reminder" && notification.type !== "action_due") continue;
      if (notifiedIdsRef.current.has(notification.id)) continue;

      notifiedIdsRef.current.add(notification.id);
      toast(notification.text, {
        description: "Task reminder",
        duration: 15000,
      });

      try {
        playReminderChime();
      } catch (error) {
        console.debug("Reminder chime unavailable:", error);
      }

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("SaveMe reminder", {
          body: notification.text,
          tag: notification.id,
          requireInteraction: true,
        });
      }
    }
  }, [systemNotifs]);
};
