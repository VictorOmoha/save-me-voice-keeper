import { describe, expect, it } from "vitest";
import { buildAccountDeletionSupportHref } from "@/lib/accountDeletionSupport";

describe("buildAccountDeletionSupportHref", () => {
  it("builds a prefilled support email without claiming the request was recorded", () => {
    const href = buildAccountDeletionSupportHref({ uid: "user-123", email: "person@example.com" });
    const decoded = decodeURIComponent(href);

    expect(href).toMatch(/^mailto:victor@omohasolutions\.com\?/);
    expect(decoded).toContain("Account deletion request - SaveMe");
    expect(decoded).toContain("person@example.com");
    expect(decoded).toContain("user-123");
    expect(decoded).toContain("does not itself record or complete deletion");
    expect(decoded).not.toMatch(/request (was|has been) recorded/i);
  });
});
