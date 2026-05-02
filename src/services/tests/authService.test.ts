import { describe, expect, it } from "vitest";
import { getGoogleAuthFailureMode } from "@/services/authErrors";

describe("getGoogleAuthFailureMode", () => {
  it("uses redirect fallback for generic Google iframe DOMExceptions", () => {
    const error = new DOMException("The operation failed for an operation-specific reason");

    expect(getGoogleAuthFailureMode(error)).toEqual({
      shouldTryRedirect: true,
      message: "Google popup sign-in was blocked by this browser. Redirecting to Google sign-in...",
    });
  });

  it("does not redirect when the user intentionally closes the popup", () => {
    const error = { code: "auth/popup-closed-by-user", message: "Popup closed" };

    expect(getGoogleAuthFailureMode(error)).toEqual({
      shouldTryRedirect: false,
      message: "Sign-in was cancelled",
    });
  });
});
