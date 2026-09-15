import {describe, expect, it} from "vitest";
import {validateToolArgs} from "./voiceToolValidation";

describe("printEntry validation", () => {
  it("accepts new content for an ad hoc Nova printout", () => {
    expect(validateToolArgs("printEntry", {title: "A note", content: "Print this for me"})).toEqual({
      valid: true,
      sanitizedArgs: {title: "A note", content: "Print this for me"},
    });
  });

  it("still rejects a print request with no printable target", () => {
    expect(validateToolArgs("printEntry", {})).toEqual({
      valid: false,
      error: "printEntry requires id, title, category, or content",
    });
  });
});
