import * as functions from "firebase-functions";
import cors from "cors";
import {getAllowedOrigin} from "../billing/safety";

const corsHandler = cors({
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
  return (req: functions.https.Request, res: functions.Response) => {
    corsHandler(req, res, async () => {
      await handler(req, res);
    });
  };
};
