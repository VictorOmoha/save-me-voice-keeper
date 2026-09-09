import React from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {NovaFloat} from "@/components/NovaFloat";

const mocks = vi.hoisted(() => ({stop: vi.fn(), start: vi.fn(), active: false}));
vi.mock("@/contexts/AuthContext", () => ({useAuth: () => ({user: {uid: "alice"}})}));
vi.mock("@/contexts/VoiceSessionContext", () => ({useVoiceSession: () => ({
  status: mocks.active ? "listening" : "idle", isConnected: mocks.active, microphoneActive: mocks.active,
  error: null, conversationHistory: [], startListening: mocks.start, stopListening: mocks.stop,
})}));
vi.mock("@/components/NovaVoiceAgent", () => ({NovaVoiceAgent: () => <div>Shared transcript</div>}));
const mount = (path = "/dashboard") => render(<MemoryRouter initialEntries={[path]}><NovaFloat /></MemoryRouter>);

describe("Nova session controls", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.active = false; });
  it("does not display duplicate controls on Voice Capture", () => {
    mount("/voice-capture");
    expect(screen.queryByLabelText("Nova conversation")).toBeNull();
  });
  it("opens the conversation without automatically using the microphone or generating a greeting", () => {
    mount();
    fireEvent.click(screen.getByLabelText("Open Nova conversation"));
    expect(screen.getByText("Shared transcript")).toBeTruthy();
    expect(mocks.start).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Minimize conversation")).toBe(document.activeElement);
  });
  it("keeps an explicit microphone indicator and End control when minimized", () => {
    mocks.active = true; mount();
    fireEvent.click(screen.getByLabelText("Open Nova conversation"));
    fireEvent.click(screen.getByLabelText("Minimize conversation"));
    expect(screen.queryByText("Shared transcript")).toBeNull();
    expect(screen.getByText("Microphone on · continues across pages")).toBeTruthy();
    expect(mocks.stop).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("End voice session"));
    expect(mocks.stop).toHaveBeenCalledOnce();
  });
  it("makes closing explicit and stops audio", () => {
    mocks.active = true; mount();
    fireEvent.click(screen.getByLabelText("Open Nova conversation"));
    fireEvent.click(screen.getByLabelText("End session and close"));
    expect(mocks.stop).toHaveBeenCalledOnce();
    expect(screen.queryByText("Shared transcript")).toBeNull();
  });
  it("supports Escape to minimize without disconnecting", () => {
    mocks.active = true; mount();
    fireEvent.click(screen.getByLabelText("Open Nova conversation"));
    fireEvent.keyDown(screen.getByLabelText("Minimize conversation"), {key: "Escape"});
    expect(mocks.stop).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Open Nova conversation")).toBe(document.activeElement);
  });
});
