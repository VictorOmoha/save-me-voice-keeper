import {describe, expect, it, vi} from "vitest";
import type * as functions from "firebase-functions";
import {withCors} from "./http";

function response() {
  const headers = new Map<string, string>();
  return {
    headersSent: false,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    setHeader: (name: string, value: string) => headers.set(name, value),
    getHeader: (name: string) => headers.get(name),
  };
}

describe("HTTP boundary", () => {
  it("does not execute the handler after CORS rejects an origin", async () => {
    const handler = vi.fn();
    const res = response();
    await withCors(handler)(
      {method: "POST", headers: {origin: "https://untrusted.example"}} as functions.https.Request,
      res as unknown as functions.Response
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("completes preflight without invoking application code", async () => {
    const handler = vi.fn();
    const res = response();
    await withCors(handler)(
      {method: "OPTIONS", headers: {origin: "https://saveme.space"}} as functions.https.Request,
      res as unknown as functions.Response
    );
    expect(res.status).toHaveBeenCalledWith(204);
    expect(handler).not.toHaveBeenCalled();
  });

  it("waits for the handler and converts rejections into a completed error response", async () => {
    const res = response();
    const handler = vi.fn(async () => {throw new Error("private failure details");});
    await withCors(handler)(
      {method: "POST", headers: {}} as functions.https.Request,
      res as unknown as functions.Response
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({error: "Internal server error"});
  });
});
