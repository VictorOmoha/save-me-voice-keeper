import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const floatSource = readFileSync("src/components/NovaFloat.tsx", "utf8");
const agentSource = readFileSync("src/components/NovaVoiceAgent.tsx", "utf8");

describe("Nova voice handoff", () => {
  it("opens global Nova and starts listening when Brain Dump hands off voice", () => {
    expect(floatSource).toContain('window.addEventListener("nova:voice-handoff", handleVoiceHandoff)');
    expect(floatSource).toContain('setPanelState("open")');
    expect(floatSource).toContain("setAutoStartListeningToken((token) => token + 1)");
    expect(floatSource).toContain("continuous={true}");
    expect(agentSource).toContain("autoStartListeningToken !== lastAutoStartTokenRef.current");
    expect(agentSource).toContain("startListening();");
  });
});
