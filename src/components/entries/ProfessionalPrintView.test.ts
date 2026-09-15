import {afterEach, describe, expect, it, vi} from "vitest";
import {printProfessionally} from "./ProfessionalPrintView";

const entry = {
  id: "entry-1",
  title: "Nova printout",
  fields: {content: "Something useful"},
  createdAt: new Date("2026-09-15T12:00:00Z"),
  updatedAt: new Date("2026-09-15T12:00:00Z"),
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("printProfessionally", () => {
  it("prints even when the popup load event finished before its listener was attached", () => {
    vi.useFakeTimers();
    const print = vi.fn();
    const popup = {
      closed: false,
      document: {write: vi.fn(), close: vi.fn(), readyState: "complete"},
      addEventListener: vi.fn(),
      focus: vi.fn(),
      print,
    };
    vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);

    expect(printProfessionally([entry])).toBe(true);
    vi.advanceTimersByTime(300);

    expect(print).toHaveBeenCalledOnce();
    expect(popup.document.write).toHaveBeenCalledWith(expect.stringContaining("Something useful"));
  });
});
