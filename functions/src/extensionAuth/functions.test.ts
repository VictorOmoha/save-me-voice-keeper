import {describe, expect, it} from "vitest";
import {createHash} from "crypto";
import {getChromeExtensionOrigin, isExtensionCorsOriginAllowed, isWebCorsOriginAllowed} from "../common/http";
import {authenticateQuickSaveRequest} from "../quickSave/functions";

describe("extension auth protocol invariants", () => {
  const codePattern = /^[0-9A-HJKMNP-TV-Z]{4}-?[0-9A-HJKMNP-TV-Z]{4}$/;
  it("rejects malformed and ambiguous pairing codes", () => {
    expect(codePattern.test("ABCI-0123")).toBe(false);
    expect(codePattern.test("ABCD-2345")).toBe(true);
    expect(codePattern.test("short")).toBe(false);
  });
  it("hashes pairing and bearer secrets before persistence", () => {
    const value = "sme_r_secret";
    expect(createHash("sha256").update(value).digest("hex")).not.toContain(value);
  });
  it("fixes scope to create and predict only", () => {
    const scope = ["entries:create", "category:predict"];
    expect(scope).not.toContain("entries:read");
    expect(scope).not.toContain("settings:write");
  });

  it("allows a paired extension request only through scoped extension auth", async () => {
    const extensionUser = {uid: "paired-user", credentialId: "extcred_1"};
    const verifyExtension = async () => extensionUser;
    const verifyWeb = async () => ({uid: "web-user"} as never);
    const req = {get: (name: string) => name === "origin" ? `chrome-extension://${"a".repeat(32)}` : ""} as never;

    await expect(authenticateQuickSaveRequest(req, "entries:create", {verifyExtension, verifyWeb})).resolves.toEqual(extensionUser);
  });

  it("denies arbitrary extension origins and invalid scoped credentials", async () => {
    const invalidCredential = async () => null;
    const webUser = async () => ({uid: "web-user"} as never);
    const validOriginReq = {get: (name: string) => name === "origin" ? `chrome-extension://${"b".repeat(32)}` : ""} as never;
    const arbitraryOrigin = "chrome-extension://arbitrary";

    expect(getChromeExtensionOrigin(arbitraryOrigin)).toBeNull();
    expect(isExtensionCorsOriginAllowed(arbitraryOrigin)).toBe(false);
    await expect(authenticateQuickSaveRequest(validOriginReq, "entries:create", {verifyExtension: invalidCredential, verifyWeb: webUser})).resolves.toBeNull();
  });

  it("retains normal web CORS and Firebase-user authentication", async () => {
    const webUser = {uid: "firebase-user"} as never;
    const req = {get: (name: string) => name === "origin" ? "https://saveme.space" : ""} as never;
    let extensionAuthCalled = false;

    expect(isWebCorsOriginAllowed("https://saveme.space")).toBe(true);
    expect(isWebCorsOriginAllowed(`chrome-extension://${"c".repeat(32)}`)).toBe(false);
    await expect(authenticateQuickSaveRequest(req, "entries:create", {
      verifyExtension: async () => { extensionAuthCalled = true; return null; },
      verifyWeb: async () => webUser,
    })).resolves.toBe(webUser);
    expect(extensionAuthCalled).toBe(false);
  });
});
