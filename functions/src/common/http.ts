import * as functions from "firebase-functions";
import cors from "cors";

// CORS middleware
const corsHandler = cors({origin: true});

// Helper to wrap functions with CORS
export const withCors = (
  handler: (req: functions.https.Request, res: functions.Response) => Promise<void>
) => {
  return (req: functions.https.Request, res: functions.Response) => {
    corsHandler(req, res, async () => {
      await handler(req, res);
    });
  };
};
