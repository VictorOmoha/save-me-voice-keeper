import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {RealtimeVoiceClient} from "../realtimeVoice";

class Channel {
  readyState = "connecting";
  onopen?: () => void;
  onclose?: () => void;
  onmessage?: (event: {data: string}) => void;
  sent: Record<string, unknown>[] = [];
  send(data: string) { this.sent.push(JSON.parse(data)); }
  close() { this.readyState = "closed"; this.onclose?.(); }
  event(data: object) { this.onmessage?.({data: JSON.stringify(data)}); }
}
class Peer {
  static latest: Peer;
  channel = new Channel();
  connectionState = "new";
  sender = {replaceTrack: vi.fn().mockResolvedValue(undefined)};
  onconnectionstatechange?: () => void;
  ontrack?: (event: unknown) => void;
  close = vi.fn(() => {this.connectionState = "closed"; this.onconnectionstatechange?.();});
  constructor() { Peer.latest = this; }
  addTransceiver() { return {sender: this.sender}; }
  createDataChannel() { return this.channel; }
  async createOffer() { return {type: "offer", sdp: "v=0\r\nm=audio"}; }
  async setLocalDescription() { /* browser owns SDP */ }
  async setRemoteDescription() { this.channel.readyState = "open"; this.channel.onopen?.(); }
}
const track = {enabled: true, stop: vi.fn(), onended: null};
const stream = {getTracks: () => [track], getAudioTracks: () => [track]};
const mic = vi.fn();
const api = vi.fn();
const command = vi.fn();
const playback = {autoplay: true, srcObject: null, setAttribute: vi.fn(), play: vi.fn(), pause: vi.fn()};
const clients: RealtimeVoiceClient[] = [];
const create = (continuous = true) => {
  const client = new RealtimeVoiceClient(api, vi.fn(), command, vi.fn(), continuous);
  clients.push(client); return client;
};
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
const emit = async (data: object) => { Peer.latest.channel.event(data); await flush(); };
const done = (output: object[] = [], id = "response_1", status = "completed") => ({type: "response.done", response: {id, status, output}});
const tool = {type: "function_call", name: "saveEntry", call_id: "call_1", arguments: '{"title":"Insurance"}'};

describe("Realtime voice lifecycle", () => {
  it('retains the session through a brief network handoff', async () => {
    vi.useFakeTimers();
    try {
      const client=create(); await client.startListening();
      const peer=Peer.latest;
      peer.connectionState='disconnected'; peer.onconnectionstatechange?.();
      await vi.advanceTimersByTimeAsync(4_000);
      peer.connectionState='connected'; peer.onconnectionstatechange?.();
      await vi.advanceTimersByTimeAsync(5_000);
      expect(client.state.isConnected).toBe(true); expect(peer.close).not.toHaveBeenCalled();
    } finally {vi.useRealTimers();}
  });
  it('releases the microphone on sustained disconnection and preserves conversation text', async () => {
    vi.useFakeTimers();
    try {
      const client=create(); await client.sendText('Remember the blue drawer'); await client.startListening();
      Peer.latest.connectionState='disconnected'; Peer.latest.onconnectionstatechange?.();
      await vi.advanceTimersByTimeAsync(8_001);
      expect(client.state.isConnected).toBe(false); expect(track.stop).toHaveBeenCalled();
      expect(client.state.conversationHistory[0].parts[0].text).toBe('Remember the blue drawer');
    } finally {vi.useRealTimers();}
  });
  beforeEach(() => {
    vi.clearAllMocks();
    track.enabled = true;
    vi.stubGlobal("RTCPeerConnection", Peer);
    vi.stubGlobal("Audio", class {constructor() { return playback; }});
    vi.stubGlobal("AudioContext", undefined);
    Object.defineProperty(navigator, "mediaDevices", {configurable: true, value: {getUserMedia: mic}});
    mic.mockResolvedValue(stream);
    playback.play.mockResolvedValue(undefined);
    api.mockImplementation(async (name: string) => name === "voiceRealtimeSession" ?
      {sdp: "v=0", model: "gpt-realtime-2.1", expiresAt: Date.now() + 600_000} :
      name === "voiceRealtimeTool" ? {result: {success: true}} : {success: true});
  });
  afterEach(() => { clients.splice(0).forEach((client) => client.dispose()); vi.unstubAllGlobals(); });

  it("does not acquire a microphone for mounting, typing, or an automatic greeting", async () => {
    const client = create();
    expect(api).not.toHaveBeenCalled();
    await client.sendText("__nova_greet__:Alice");
    expect(mic).not.toHaveBeenCalled();
    expect(client.state.microphoneActive).toBe(false);
    expect(client.state.conversationHistory).toEqual([]);
    expect(api.mock.calls[0][0]).toBe("voiceRealtimeSession");
    expect(Peer.latest.channel.sent).toContainEqual({type: "response.create"});
  });
  it("keeps continuous microphone input active through speech and spoken responses", async () => {
    const client = create(); await client.startListening();
    await emit({type: "input_audio_buffer.speech_started", item_id: "user_1"});
    await emit({type: "input_audio_buffer.speech_stopped"});
    await emit({type: "response.created"});
    await emit({type: "output_audio_buffer.started"});
    expect(client.state.status).toBe("speaking");
    expect(track.enabled).toBe(true);
    expect(client.state.microphoneActive).toBe(true);
    await emit(done());
    expect(client.state.status).toBe("speaking");
    await emit({type: "output_audio_buffer.stopped"});
    expect(client.state.status).toBe("listening");
    expect(mic).toHaveBeenCalledOnce();
  });
  it("pauses the microphone after one manual turn and never rearms on a preference change", async () => {
    const client = create(false); await client.startListening();
    await emit({type: "input_audio_buffer.speech_stopped"});
    expect(track.enabled).toBe(false);
    await emit(done());
    expect(client.state.status).toBe("idle");
    client.setContinuous(true);
    expect(track.enabled).toBe(false);
    await client.startListening();
    expect(track.enabled).toBe(true);
    expect(mic).toHaveBeenCalledOnce();
  });
  it("stops a microphone that resolves after disposal without opening a session", async () => {
    let resolve!: (value: unknown) => void;
    mic.mockReturnValue(new Promise((done) => {resolve = done;}));
    const client = create(); const pending = client.startListening();
    client.dispose(); resolve(stream); await pending;
    expect(track.stop).toHaveBeenCalledOnce();
    expect(api).not.toHaveBeenCalled();
  });
  it("closes tracks, playback and peer, cancels startup and ignores late events after Stop", async () => {
    const client = create(); await client.startListening();
    const peer = Peer.latest;
    client.stop();
    expect(track.stop).toHaveBeenCalledOnce();
    expect(peer.close).toHaveBeenCalledOnce();
    expect(playback.pause).toHaveBeenCalled();
    expect(client.state.microphoneActive).toBe(false);
    peer.channel.event({type: "response.output_audio_transcript.delta", item_id: "late", delta: "ignored"});
    expect(client.state.responseText).toBe("");
    expect(api.mock.calls.some(([name]) => name === "voiceRealtimeEnd")).toBe(true);
  });
  it("ends a server session when stopped during its HTTP connection", async () => {
    let resolve!: (value: unknown) => void;
    api.mockImplementation((name: string) => name === "voiceRealtimeSession" ? new Promise((done) => {resolve = done;}) : Promise.resolve({success: true}));
    const client = create(); const pending = client.startListening(); await flush();
    client.stop(); resolve({sdp: "v=0", expiresAt: Date.now() + 60_000}); await pending;
    expect(client.state.isConnected).toBe(false);
    expect(api.mock.calls.find(([name]) => name === "voiceRealtimeSession")?.[2].aborted).toBe(true);
    expect(api.mock.calls.some(([name]) => name === "voiceRealtimeEnd")).toBe(true);
  });
  it("keeps delayed user captions in turn order without duplicating completed captions", async () => {
    const client = create(); await client.startListening();
    await emit({type: "input_audio_buffer.speech_started", item_id: "user_1"});
    await emit({type: "response.output_audio_transcript.delta", item_id: "model_1", delta: "Saved"});
    await emit({type: "conversation.item.input_audio_transcription.completed", item_id: "user_1", transcript: "Remember this"});
    await emit({type: "response.output_audio_transcript.done", item_id: "model_1", transcript: "Saved."});
    expect(client.state.conversationHistory).toEqual([
      {role: "user", parts: [{text: "Remember this"}]}, {role: "model", parts: [{text: "Saved."}]},
    ]);
  });
  it("executes a duplicated tool response once and dispatches only a successful server command", async () => {
    api.mockImplementation(async (name: string) => name === "voiceRealtimeTool" ?
      {result: {success: true, appCommand: "navigate", route: "/all-entries"}} : {sdp: "v=0", expiresAt: Date.now() + 60_000});
    const client = create(); await client.startListening();
    await emit(done([tool])); await emit(done([tool]));
    expect(api.mock.calls.filter(([name]) => name === "voiceRealtimeTool")).toHaveLength(1);
    expect(command).toHaveBeenCalledExactlyOnceWith({success: true, appCommand: "navigate", route: "/all-entries"});
    expect(client.state.actions[0].status).toBe("done");
    expect(Peer.latest.channel.sent).toContainEqual(expect.objectContaining({type: "conversation.item.create", item: expect.objectContaining({type: "function_call_output", call_id: "call_1"})}));
  });
  it("reports tool failures to the model without claiming success or triggering commands", async () => {
    const client = create(); await client.startListening();
    api.mockRejectedValue(new Error("Result unknown. Check before retrying."));
    await emit(done([tool]));
    expect(command).not.toHaveBeenCalled();
    expect(client.state.actions[0].status).toBe("error");
    expect(JSON.stringify(Peer.latest.channel.sent)).toContain('success');
    expect(api.mock.calls.filter(([name]) => name === "voiceRealtimeTool")).toHaveLength(1);
  });
  it("does not execute partial tools from a cancelled response", async () => {
    const client = create(); await client.startListening();
    await emit(done([tool], "cancelled_response", "cancelled"));
    expect(api.mock.calls.filter(([name]) => name === "voiceRealtimeTool")).toHaveLength(0);
  });
  it("allows explicit interruption of output without stopping the live microphone", async () => {
    const client = create(); await client.startListening();
    await emit({type: "response.created"}); await emit({type: "output_audio_buffer.started"});
    await client.startListening();
    expect(Peer.latest.channel.sent).toContainEqual({type: "response.cancel"});
    expect(Peer.latest.channel.sent).toContainEqual({type: "output_audio_buffer.clear"});
    expect(track.enabled).toBe(true);
  });
  it("releases the microphone after a connection error", async () => {
    api.mockRejectedValue(new Error("Sign in again"));
    const client = create(); await client.startListening();
    expect(client.state.error).toBe("Sign in again");
    expect(client.state.status).toBe("idle");
    expect(track.stop).toHaveBeenCalledOnce();
  });
  it("releases the connection when speaker playback is blocked", async () => {
    const client = create(); await client.startListening();
    playback.play.mockRejectedValue(new Error("blocked"));
    Peer.latest.ontrack?.({streams: [stream], track}); await flush();
    expect(client.state.error).toContain("playback was blocked");
    expect(client.state.isConnected).toBe(false);
    expect(track.stop).toHaveBeenCalledOnce();
  });
});
