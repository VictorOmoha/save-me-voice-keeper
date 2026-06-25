import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

export const trackActivationEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (!analytics) return;
  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    console.debug("Analytics event failed:", eventName, error);
  }
};
