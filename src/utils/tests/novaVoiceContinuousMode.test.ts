import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hookSource = readFileSync("src/hooks/useVoiceAgent.ts", "utf8");
const floatSource = readFileSync("src/components/NovaFloat.tsx", "utf8");
const agentSource = readFileSync("src/components/NovaVoiceAgent.tsx", "utf8");

const block = (source: string, marker: string, nextMarker: string) => {
  const start = source.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = source.indexOf(nextMarker, start + marker.length);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
};

describe("Nova continuous voice mode", () => {
  it("keeps Live mode armed after Nova response playback completes or fails", () => {
    const playAudioBlock = block(
      hookSource,
      "const playAudio = useCallback",
      "// ── Core agent call"
    );

    expect(playAudioBlock).toContain("audio.onended");
    expect(playAudioBlock).toContain("audio.onerror");
    expect(playAudioBlock).toContain("await audio.play()");
    // Completion, playback error, and blocked-autoplay all route through finish(),
    // which re-arms continuous mode.
    expect(playAudioBlock).toContain("restartIfContinuous();");
    expect(playAudioBlock).toContain("audio.onended = finish");
    expect(playAudioBlock.match(/finish\(\);/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("distinguishes automatic recorder stops from a user pressing stop", () => {
    const stopBlock = block(
      hookSource,
      "const stopListening = useCallback",
      "// ── Audio playback"
    );
    const autoTimerBlock = block(
      hookSource,
      "autoStopTimerRef.current = setTimeout",
      "}, MAX_RECORDING_SECONDS * 1000);"
    );

    expect(stopBlock).toContain("manualStopRef.current = true");
    expect(autoTimerBlock).not.toContain("manualStopRef.current = true");
  });

  it("opens global Nova and starts listening when Brain Dump hands off voice", () => {
    expect(floatSource).toContain('window.addEventListener("nova:voice-handoff", handleVoiceHandoff)');
    expect(floatSource).toContain('setPanelState("open")');
    expect(floatSource).toContain("setAutoStartListeningToken((token) => token + 1)");
    expect(floatSource).toContain("continuous={true}");
    expect(agentSource).toContain("autoStartListeningToken !== lastAutoStartTokenRef.current");
    expect(agentSource).toContain("startListening();");
  });
});
