import * as functions from "firebase-functions";
import cors from "cors";
import {getAllowedOrigin} from "../billing/safety";

const corsHandler = cors({
  preflightContinue: true,
  origin: (origin, callback) => {
    if (!origin || getAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed"));
  },
});

export const withCors = (
  handler: (req: functions.https.Request, res: functions.Response) => Promise<void>
) => {
  return (req: functions.https.Request, res: functions.Response): Promise<void> => {
    return new Promise((resolve) => {
      corsHandler(req, res, (error) => {
        if (error) {
          res.status(403).json({error: "Origin not allowed"});
          resolve();
          return;
        }
        if (req.method === "OPTIONS") {
          res.status(204).end();
          resolve();
          return;
        }
        Promise.resolve().then(() => handler(req, res)).catch((handlerError) => {
          console.error("HTTP handler failed:", handlerError);
          if (!res.headersSent) {
            res.status(500).json({error: "Internal server error"});
          }
        }).finally(resolve);
      });
    });
  };
};
