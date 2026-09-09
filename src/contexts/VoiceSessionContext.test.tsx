import React from "react";
import {act, cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {Link, MemoryRouter, Route, Routes} from "react-router-dom";
import {VoiceSessionProvider, useVoiceSession} from "./VoiceSessionContext";
import {useBrainDumpCapture} from "@/hooks/useBrainDumpCapture";
import {NovaFloat} from "@/components/NovaFloat";

const mocks = vi.hoisted(() => ({
  user: {uid: "alice", getIdToken: vi.fn(async () => "test-token")} as {uid: string; getIdToken: () => Promise<string>} | null,
  authChanged: undefined as undefined | ((user: unknown) => void),
}));
vi.mock("@/contexts/AuthContext", () => ({useAuth: () => ({user: mocks.user})}));
vi.mock("@/lib/firebase", () => ({auth: {get currentUser() { return mocks.user; }}}));
vi.mock("firebase/auth", () => ({onAuthStateChanged: (_: unknown, fn: (user: unknown) => void) => { mocks.authChanged = fn; return vi.fn(); }}));
vi.mock("@/utils/cloudFunctions", () => ({getCloudFunctionUrl: (name: string) => `https://voice.test/${name}`}));
vi.mock("@/components/ThemeProvider", () => ({useTheme: () => ({setTheme: vi.fn()})}));
vi.mock("sonner", () => ({toast: {success: vi.fn(), error: vi.fn()}}));

class Channel {
  readyState = "connecting";
  onopen?: () => void;
  onmessage?: (event: {data: string}) => void;
  sent: Record<string, unknown>[] = [];
  send(value: string) { this.sent.push(JSON.parse(value)); }
  close() { this.readyState = "closed"; }
  event(value: object) { this.onmessage?.({data: JSON.stringify(value)}); }
}
class Peer {
  static instances: Peer[] = [];
  channel = new Channel();
  close = vi.fn();
  constructor() { Peer.instances.push(this); }
  addTransceiver() { return {sender: {replaceTrack: vi.fn().mockResolvedValue(undefined)}}; }
  createDataChannel() { return this.channel; }
  async createOffer() { return {sdp: "v=0"}; }
  async setLocalDescription() { /* transport stub */ }
  async setRemoteDescription() { this.channel.readyState = "open"; this.channel.onopen?.(); }
}
const track = {enabled: true, onended: null, stop: vi.fn()};
const mic = vi.fn(async () => ({getTracks: () => [track], getAudioTracks: () => [track]}));
const requests = vi.fn();
let result: Record<string, unknown> = {};

const Capture = () => {
  const voice = useVoiceSession();
  return <><h1>Capture view</h1><button onClick={voice.startListening}>Start capture</button>
    <div data-testid="capture-state">{voice.status} / {String(voice.microphoneActive)}</div>
    <div data-testid="connected-at">{voice.connectedAt ?? "none"}</div>
    <div data-testid="history">{voice.conversationHistory.flatMap((turn) => turn.parts.map((part) => part.text)).join(" | ")}</div>
    <input aria-label="Draft" value={voice.draft} onChange={(event) => voice.setDraft(event.target.value)} />
    {voice.savedMemories.map((entry) => <div key={entry.id}>{entry.title}</div>)}
    <button onClick={voice.resetConversation}>New conversation</button><Link to="/dashboard">Dashboard</Link></>;
};
const Dump = () => {
  const voice = useBrainDumpCapture();
  return <><h1>Brain Dump view</h1><p>{voice.transcript}</p><button onClick={voice.start}>Start dump</button><Link to="/dashboard">Dashboard</Link></>;
};
const Fixture = () => <MemoryRouter initialEntries={["/voice-capture"]}><VoiceSessionProvider><NovaFloat /><Routes>
  <Route path="/voice-capture" element={<Capture />} />
  <Route path="/dashboard" element={<><h1>Dashboard view</h1><Link to="/voice-capture">Capture</Link><Link to="/brain-dump">Brain Dump</Link></>} />
  <Route path="/brain-dump" element={<Dump />} />
</Routes></VoiceSessionProvider></MemoryRouter>;
const emit = async (event: object) => { await act(async () => { Peer.instances[0].channel.event(event); for (let i = 0; i < 20; i++) await Promise.resolve(); }); };
const command = (name: string, id: string) => emit({type: "response.done", response: {id, status: "completed", output: [{type: "function_call", name, call_id: id, arguments: "{}"}]}});
const start = async () => { fireEvent.click(screen.getByText("Start capture")); await waitFor(() => expect(screen.getByTestId("capture-state").textContent).toBe("listening / true")); };

describe("App-owned realtime conversation", () => {
  beforeEach(() => {
    vi.clearAllMocks(); Peer.instances = []; track.enabled = true;
    mocks.user = {uid: "alice", getIdToken: async () => "test-token"};
    vi.stubGlobal("RTCPeerConnection", Peer);
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("Audio", class {setAttribute() {} pause() {} play() {return Promise.resolve();}});
    Object.defineProperty(navigator, "mediaDevices", {configurable: true, value: {getUserMedia: mic}});
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {configurable: true, value: vi.fn()});
    requests.mockImplementation(async (url: string) => ({ok: true, json: async () => url.endsWith("voiceRealtimeSession") ? {sdp: "v=0", expiresAt: Date.now() + 600_000} : url.endsWith("voiceRealtimeTool") ? {result} : {success: true}}));
    vi.stubGlobal("fetch", requests);
  });
  afterEach(() => {cleanup(); vi.unstubAllGlobals();});

  it("keeps one connection, microphone, history and draft through tool navigation and return", async () => {
    render(<Fixture />); expect(Peer.instances).toHaveLength(0);
    await start();
    const connectedAt = screen.getByTestId("connected-at").textContent;
    expect(Number(connectedAt)).toBeGreaterThan(0);
    await emit({type: "conversation.item.input_audio_transcription.completed", item_id: "u1", transcript: "Take me to the dashboard"});
    await emit({type: "response.output_audio_transcript.done", item_id: "a1", transcript: "Opening your dashboard."});
    fireEvent.change(screen.getByLabelText("Draft"), {target: {value: "Keep this draft"}});
    result = {success: true, appCommand: "navigate", route: "/dashboard"};
    await command("navigateApp", "nav-1");
    expect(screen.getByText("Dashboard view")).toBeTruthy();
    expect(mic).toHaveBeenCalledOnce(); expect(Peer.instances).toHaveLength(1);
    expect(track.stop).not.toHaveBeenCalled(); expect(Peer.instances[0].close).not.toHaveBeenCalled();
    expect(Peer.instances[0].channel.sent.filter((event) => event.type === "response.create")).toHaveLength(1);
    fireEvent.click(screen.getByLabelText("Open Nova conversation"));
    expect(screen.getByText("Opening your dashboard.")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Open full voice capture"));
    expect(screen.getByTestId("history").textContent).toContain("Opening your dashboard.");
    expect(screen.getByLabelText("Draft")).toHaveProperty("value", "Keep this draft");
    expect(screen.getByTestId("connected-at").textContent).toBe(connectedAt);
    expect(screen.queryByTestId("nova-voice-dock")).toBeNull();
    expect(track.stop).not.toHaveBeenCalled();
    result = {success: true, appCommand: "goBack"};
    await command("closeEntry", "back-1");
    expect(screen.getByText("Dashboard view")).toBeTruthy();
    expect(Peer.instances).toHaveLength(1);
    expect(track.stop).not.toHaveBeenCalled();
  });
  it("keeps successful save receipts across routes and does not execute failed or duplicate commands", async () => {
    render(<Fixture />); await start();
    result = {success: false, appCommand: "navigate", route: "/dashboard"};
    await command("navigateApp", "failed"); expect(screen.getByText("Capture view")).toBeTruthy();
    fireEvent.click(screen.getByText("Dashboard"));
    const changed = vi.fn(); window.addEventListener("nova:entries-changed", changed);
    result = {success: true, appCommand: "novaAction", actionType: "save_entry", actionData: {id: "receipt", title: "Friday meeting", category: "Work"}};
    await command("saveEntry", "save-1"); await command("saveEntry", "save-1");
    expect(changed).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText("Capture")); expect(screen.getByText("Friday meeting")).toBeTruthy();
    fireEvent.click(screen.getByText("New conversation")); expect(screen.queryByText("Friday meeting")).toBeNull();
    expect(screen.getByTestId("connected-at").textContent).toBe("none");
    expect(track.stop).toHaveBeenCalledOnce(); window.removeEventListener("nova:entries-changed", changed);
  });
  it("continues in Brain Dump without creating a recorder and stops from the dashboard dock", async () => {
    render(<Fixture />); await start();
    await emit({type: "conversation.item.input_audio_transcription.completed", item_id: "u1", transcript: "A thought to organize"});
    fireEvent.click(screen.getByText("Dashboard")); fireEvent.click(screen.getByText("Brain Dump"));
    expect(screen.getByText("A thought to organize")).toBeTruthy();
    fireEvent.click(screen.getByText("Start dump"));
    expect(mic).toHaveBeenCalledOnce(); expect(Peer.instances).toHaveLength(1);
    fireEvent.click(screen.getByText("Dashboard")); fireEvent.click(screen.getByLabelText("End voice session"));
    expect(track.stop).toHaveBeenCalledOnce(); expect(Peer.instances[0].close).toHaveBeenCalledOnce();
    await waitFor(() => expect(requests.mock.calls.some(([url]) => url.endsWith("voiceRealtimeEnd"))).toBe(true));
    fireEvent.click(screen.getByText("Capture")); expect(screen.getByTestId("history").textContent).toContain("A thought to organize");
  });
  it("releases the microphone and clears the previous account's conversation on account change", async () => {
    const {rerender} = render(<Fixture />); await start();
    await emit({type: "conversation.item.input_audio_transcription.completed", item_id: "u1", transcript: "Private to Alice"});
    mocks.user = {uid: "bob", getIdToken: async () => "bob-token"};
    rerender(<Fixture />);
    expect(track.stop).toHaveBeenCalledOnce(); expect(screen.getByTestId("history").textContent).toBe("");
    expect(screen.getByTestId("capture-state").textContent).toBe("idle / false");
  });
  it("ends audio on page exit even though route navigation keeps it alive", async () => {
    render(<Fixture />); await start();
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(track.stop).toHaveBeenCalledOnce(); expect(Peer.instances[0].close).toHaveBeenCalledOnce();
  });
});
