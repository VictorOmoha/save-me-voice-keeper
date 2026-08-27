import * as functions from "firebase-functions";
import cors from "cors";
import {getAllowedOrigin} from "../billing/safety";

export const getChromeExtensionOrigin = (origin?: string | null): string | null => {
  if (!origin) return null;

  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "chrome-extension:" || !/^[a-p]{32}$/.test(parsed.hostname)) return null;
    return `chrome-extension://${parsed.hostname}`;
  } catch {
    return null;
  }
};

export const isWebCorsOriginAllowed = (origin?: string | null): boolean =>
  !origin || Boolean(getAllowedOrigin(origin));

const corsHandler = cors({
  origin: (origin, callback) => {
    if (isWebCorsOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed"));
  },
});

export const isExtensionCorsOriginAllowed = (origin?: string | null): boolean =>
  !origin || Boolean(getAllowedOrigin(origin) || getChromeExtensionOrigin(origin));

const extensionCorsHandler = cors({
  origin: (origin, callback) => {
    if (isExtensionCorsOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed"));
  },
});

type Handler = (req: functions.https.Request, res: functions.Response) => Promise<void>;

const wrapCors = (corsMiddleware: typeof corsHandler, handler: Handler) => {
  return (req: functions.https.Request, res: functions.Response) => {
    corsMiddleware(req, res, async () => {
      await handler(req, res);
    });
  };
};

export const withCors = (handler: Handler) => wrapCors(corsHandler, handler);

/** CORS policy reserved for endpoints that authenticate scoped extension tokens. */
export const withExtensionCors = (handler: Handler) => wrapCors(extensionCorsHandler, handler);
