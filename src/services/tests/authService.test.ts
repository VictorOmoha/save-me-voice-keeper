import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGoogleAuthFailureMode } from "@/services/authErrors";

const {signOutMock, revokeMock} = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  revokeMock: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({auth: {currentUser: {getIdToken: vi.fn()}}}));
vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: signOutMock,
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: class { setCustomParameters() {} },
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
}));
vi.mock("@/services/extensionCredentialService", () => ({revokeExtensionCredentials: revokeMock}));
vi.mock("@/utils/logger", () => ({logAuth: vi.fn()}));

import {authService} from "@/services/authService";

beforeEach(() => {
  vi.clearAllMocks();
});

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

describe("authService.logout", () => {
  it("still performs Firebase local sign-out when extension revocation is unavailable", async () => {
    revokeMock.mockRejectedValueOnce(new Error("revocation outage"));

    await expect(authService.logout()).resolves.toBeUndefined();
    expect(signOutMock).toHaveBeenCalledOnce();
  });
});
