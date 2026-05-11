import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/hooks/useBrainDumpCapture.ts", "utf8");

const block = (marker: string, nextMarker: string) => {
  const start = source.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = source.indexOf(nextMarker, start + marker.length);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
};

describe("Brain Dump continuous mic stability", () => {
  it("keeps continuous mode armed through empty and hallucinated turns", () => {
    const noSpeechBlock = block("if (!heardText) {", "if (isLikelyHallucination(heardText)) {");
    expect(noSpeechBlock).toContain("if (!continuousRef.current && repeatCountRef.current >= 2)");
    expect(noSpeechBlock).toContain("restartIfContinuous();");
    expect(noSpeechBlock).not.toContain("const emptyTurnLimit = continuousRef.current");

    const hallucinationBlock = block("if (isLikelyHallucination(heardText)) {", "if (heardNormalized === lastNormalized) {");
    expect(hallucinationBlock).toContain("if (!continuousRef.current && repeatCountRef.current >= 2)");
    expect(hallucinationBlock).toContain("restartIfContinuous();");
    expect(hallucinationBlock).not.toContain("const emptyTurnLimit = continuousRef.current");
  });

  it("does not pause continuous mode for duplicate or Nova echo guard skips", () => {
    const duplicateBlock = block("if (heardNormalized === lastNormalized) {", "if (novaLastNormalized.length > 10");
    expect(duplicateBlock).toContain("if (!continuousRef.current)");
    expect(duplicateBlock).toContain("restartIfContinuous();");

    const echoBlock = block("if (novaLastNormalized.length > 10", "// Real speech detected");
    expect(echoBlock).toContain("if (!continuousRef.current)");
    expect(echoBlock).toContain("restartIfContinuous();");
  });

  it("re-arms continuous mode after tiny or transient failed recordings", () => {
    const tinyBlobBlock = block("if (blob.size < 500) {", "// VAD diagnostics");
    expect(tinyBlobBlock).toContain("scheduleContinuousRestart();");

    const catchBlock = block("} catch (error) {\n          const message = error instanceof Error ? error.message : String(error);", "} finally {");
    expect(catchBlock).toContain("scheduleContinuousRestart(1000)");
  });
});
