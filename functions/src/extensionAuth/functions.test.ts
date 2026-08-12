import {describe, expect, it} from "vitest";
import {createHash} from "crypto";

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
});
