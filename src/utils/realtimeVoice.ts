import {toolLabel, type ActionEvent, type AgentStatus, type AppCommand, type ConversationTurn} from "@/hooks/voiceAgentTypes";

export interface VoiceState {
  status: AgentStatus;
  transcript: string;
  responseText: string;
  error: string | null;
  actions: ActionEvent[];
  conversationHistory: ConversationTurn[];
  continuous: boolean;
  isConnected: boolean;
  microphoneActive: boolean;
  connectedAt: number | null;
}
export const initialVoiceState = (continuous = false): VoiceState => ({
  status: "idle", transcript: "", responseText: "", error: null, actions: [], conversationHistory: [],
  continuous, isConnected: false, microphoneActive: false, connectedAt: null,
});
type Api = (name: string, body: Record<string, unknown>, signal?: AbortSignal) => Promise<Record<string, unknown>>;
type RealtimeEvent = {
  type: string; item_id?: string; transcript?: string; delta?: string; text?: string;
  response?: {id: string; status: string; output?: {type: string; name: string; call_id: string; arguments: string}[]};
  error?: {code?: string; message?: string};
};

/** One owned WebRTC connection. No microphone access until startListening is invoked. */
export class RealtimeVoiceClient {
  state: VoiceState;
  private pc?: RTCPeerConnection;
  private sender?: RTCRtpSender;
  private channel?: RTCDataChannel;
  private audio?: HTMLAudioElement;
  private stream?: MediaStream;
  private context?: AudioContext;
  private frame?: number;
  private timer?: ReturnType<typeof setTimeout>;
  private controller?: AbortController;
  private connection?: Promise<void>;
  private rejectReady?: (error: Error) => void;
  private sessionId?: string;
  private epoch = 0;
  private turnEpoch = 0;
  private starting = false;
  private disposed = false;
  private responseActive = false;
  private audioPlaying = false;
  private userSpeaking = false;
  private items = new Map<string, ConversationTurn>();
  private handledResponses = new Set<string>();
  private handledCalls = new Set<string>();

  constructor(private api: Api, private onState: (state: VoiceState) => void,
    private onCommand: (command: AppCommand) => void, private onLevel: (level: number) => void,
    continuous = false) { this.state = initialVoiceState(continuous); }

  private patch(update: Partial<VoiceState>) {
    if (this.disposed) return;
    this.state = {...this.state, ...update};
    this.onState(this.state);
  }
  private send(event: Record<string, unknown>) {
    if (this.channel?.readyState !== "open") throw new Error("Voice connection closed. Tap the microphone to reconnect.");
    this.channel.send(JSON.stringify(event));
  }
  private idleStatus(): AgentStatus { return this.state.microphoneActive ? "listening" : "idle"; }
  private live(epoch: number) { return !this.disposed && this.epoch === epoch; }
  private fail(error: unknown, epoch: number) {
    if (!this.live(epoch)) return;
    this.stop();
    this.patch({error: error instanceof Error ? error.message : "Could not start realtime voice. Please try again."});
  }

  private connect(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("Voice session closed"));
    if (this.channel?.readyState === "open") return Promise.resolve();
    if (this.connection) return this.connection;
    const epoch = this.epoch;
    this.patch({status: "connecting", error: null});
    this.controller = new AbortController();
    const signal = this.controller.signal;
    const sessionId = crypto.randomUUID();
    this.sessionId = sessionId;
    this.connection = (async () => {
      const pc = new RTCPeerConnection();
      this.pc = pc;
      // Reserve a sending track so typed messages never need microphone permission or renegotiation.
      this.sender = pc.addTransceiver("audio", {direction: "sendrecv"}).sender;
      if (this.stream) await this.sender.replaceTrack(this.stream.getAudioTracks()[0]);
      if (!this.live(epoch)) return;
      const audio = new Audio();
      this.audio = audio;
      audio.autoplay = true;
      audio.setAttribute("playsinline", "");
      pc.ontrack = ({streams, track}) => {
        if (!this.live(epoch)) return;
        audio.srcObject = streams[0] || new MediaStream([track]);
        void audio.play().catch(() => this.fail(new Error("Audio playback was blocked. Tap the microphone to try again."), epoch));
      };
      pc.onconnectionstatechange = () => {
        if (this.live(epoch) && ["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          this.fail(new Error("Voice connection lost. Tap the microphone to reconnect."), epoch);
        }
      };
      const channel = pc.createDataChannel("oai-events");
      this.channel = channel;
      const ready = new Promise<void>((resolve, reject) => {
        this.rejectReady = reject;
        channel.onopen = () => { this.rejectReady = undefined; resolve(); };
        channel.onclose = () => this.fail(new Error("Voice connection closed. Tap the microphone to reconnect."), epoch);
        channel.onerror = () => this.fail(new Error("Voice connection failed. Please try again."), epoch);
      });
      // Attach a rejection handler immediately while the SDP HTTP exchange is in flight.
      void ready.catch(() => undefined);
      channel.onmessage = (message) => {
        if (!this.live(epoch)) return;
        try { void this.event(JSON.parse(message.data), epoch).catch((error) => this.fail(error, epoch)); }
        catch { this.fail(new Error("Invalid voice response"), epoch); }
      };
      this.timer = setTimeout(() => this.fail(new Error("Voice connection timed out. Please try again."), epoch), 35_000);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const result = await this.api("voiceRealtimeSession", {sessionId, sdp: offer.sdp}, signal);
      if (!this.live(epoch)) return;
      if (typeof result.sdp !== "string") throw new Error("Invalid voice connection response");
      await pc.setRemoteDescription({type: "answer", sdp: result.sdp});
      await ready;
      if (!this.live(epoch)) return;
      clearTimeout(this.timer);
      const remaining = Math.min(600_000, Number(result.expiresAt) - Date.now());
      if (!(remaining > 0)) throw new Error("Voice session expired. Please try again.");
      this.timer = setTimeout(() => this.fail(new Error("Your ten-minute voice session ended. Tap the microphone to continue."), epoch), remaining);
      // Preserve local conversation context when reconnecting after a manual stop.
      for (const turn of this.state.conversationHistory.slice(-20)) {
        this.send({type: "conversation.item.create", item: {type: "message", role: turn.role === "model" ? "assistant" : "user",
          content: [{type: turn.role === "model" ? "output_text" : "input_text", text: turn.parts.map((part) => part.text || "").join("\n")} ]}});
      }
      this.patch({isConnected: true, connectedAt: Date.now(), status: this.idleStatus()});
    })();
    return this.connection;
  }

  async startListening() {
    if (this.disposed || this.starting) return;
    this.starting = true;
    const epoch = this.epoch;
    this.patch({error: null, status: this.state.isConnected ? this.state.status : "connecting"});
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") throw new Error("This browser does not support realtime voice. Try Chrome, Edge, or Safari.");
      if (!this.stream) {
        const stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true}});
        if (!this.live(epoch)) { stream.getTracks().forEach((track) => track.stop()); return; }
        this.stream = stream;
        stream.getAudioTracks()[0].onended = () => this.fail(new Error("Microphone disconnected. Please reconnect it and try again."), epoch);
        if (this.sender) await this.sender.replaceTrack(stream.getAudioTracks()[0]);
        this.meter(stream);
      }
      if (!this.live(epoch)) return;
      this.stream.getTracks().forEach((track) => { track.enabled = true; });
      this.patch({microphoneActive: true});
      await this.connect();
      if (!this.live(epoch)) return;
      this.interrupt();
      this.patch({status: "listening"});
    } catch (error) { this.fail(error, epoch); }
    finally { if (this.live(epoch)) this.starting = false; }
  }

  private meter(stream: MediaStream) {
    if (typeof AudioContext === "undefined") return;
    this.context = new AudioContext();
    void this.context.resume().catch(() => undefined);
    const source = this.context.createMediaStreamSource(stream);
    const analyser = this.context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const values = new Uint8Array(analyser.fftSize);
    const sample = () => {
      analyser.getByteTimeDomainData(values);
      const rms = Math.sqrt(values.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / values.length);
      this.onLevel(this.state.microphoneActive ? rms : 0);
      this.frame = requestAnimationFrame(sample);
    };
    sample();
  }

  private interrupt() {
    this.turnEpoch++;
    if (this.responseActive) this.send({type: "response.cancel"});
    if (this.audioPlaying) this.send({type: "output_audio_buffer.clear"});
    this.responseActive = false;
    this.audioPlaying = false;
  }

  async sendText(text: string) {
    if (!text.trim() || this.disposed) return;
    const epoch = this.epoch;
    try {
      if (text.length > 20_000) throw new Error("Please keep messages under 20,000 characters.");
      await this.connect();
      if (!this.live(epoch)) return;
      this.interrupt();
      this.send({type: "conversation.item.create", item: {type: "message", role: "user", content: [{type: "input_text", text}]}});
      if (!text.startsWith("__nova_greet__:")) this.turn(crypto.randomUUID(), "user", text);
      this.patch({transcript: "", responseText: "", status: "thinking", error: null});
      this.send({type: "response.create"});
    } catch (error) { this.fail(error, epoch); }
  }

  setContinuous(value: boolean) {
    this.patch({continuous: value});
    // Toggling a preference must never acquire or reactivate a microphone.
    if (!value && !this.userSpeaking) this.pauseMic();
  }
  private pauseMic() {
    this.stream?.getTracks().forEach((track) => { track.enabled = false; });
    this.onLevel(0);
    this.patch({microphoneActive: false, ...(this.state.status === "listening" ? {status: "idle" as const} : {})});
  }
  private turn(id: string, role: "user" | "model", text: string) {
    this.items.set(id, {role, parts: [{text}]});
    if (this.items.size > 80) this.items.delete(this.items.keys().next().value!);
    this.patch({conversationHistory: [...this.items.values()].filter((turn) => turn.parts[0].text)});
  }

  private async event(event: RealtimeEvent, epoch: number) {
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        this.userSpeaking = true;
        this.turnEpoch++;
        if (event.item_id) this.turn(event.item_id, "user", "");
        this.patch({status: "listening", transcript: "", responseText: ""});
        break;
      case "input_audio_buffer.speech_stopped":
        this.userSpeaking = false;
        if (!this.state.continuous) this.pauseMic();
        this.patch({status: "thinking"});
        break;
      case "conversation.item.input_audio_transcription.delta":
        this.patch({transcript: this.state.transcript + (event.delta || "")});
        break;
      case "conversation.item.input_audio_transcription.completed":
        this.patch({transcript: event.transcript || ""});
        if (event.item_id) this.turn(event.item_id, "user", event.transcript || "");
        break;
      case "conversation.item.input_audio_transcription.failed":
        this.patch({error: "The caption could not be transcribed. Nova still receives your audio."});
        break;
      case "response.created":
        this.responseActive = true;
        this.patch({status: "thinking", responseText: ""});
        break;
      case "response.output_audio_transcript.delta":
      case "response.output_text.delta": {
        const text = this.state.responseText + (event.delta || "");
        this.patch({responseText: text});
        if (event.item_id) this.turn(event.item_id, "model", text);
        break;
      }
      case "response.output_audio_transcript.done":
      case "response.output_text.done":
        if (event.item_id) this.turn(event.item_id, "model", event.transcript || event.text || this.state.responseText);
        break;
      case "output_audio_buffer.started":
        this.audioPlaying = true;
        this.patch({status: "speaking"});
        break;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        this.audioPlaying = false;
        this.patch({status: this.responseActive && !this.userSpeaking ? "thinking" : this.idleStatus()});
        break;
      case "response.done": {
        const response = event.response;
        if (!response || this.handledResponses.has(response.id)) break;
        this.handledResponses.add(response.id);
        this.responseActive = false;
        if (response.status === "failed" || response.status === "incomplete") {
          this.patch({status: this.audioPlaying ? "speaking" : this.idleStatus(), error: "Nova could not finish the response. Please try again."});
          break;
        }
        const calls = response.status === "completed" ? response.output?.filter((item) => item.type === "function_call") || [] : [];
        const turnEpoch = this.turnEpoch;
        for (const call of calls) {
          if (!this.live(epoch) || turnEpoch !== this.turnEpoch || this.handledCalls.has(call.call_id)) continue;
          this.handledCalls.add(call.call_id);
          let args: Record<string, unknown> = {};
          let result: Record<string, unknown>;
          const index = this.state.actions.length;
          this.patch({status: "acting", actions: [...this.state.actions, {tool: call.name, args, result: {}, label: toolLabel(call.name, args), status: "running"}]});
          try {
            args = JSON.parse(call.arguments);
            const data = await this.api("voiceRealtimeTool", {sessionId: this.sessionId, callId: call.call_id, name: call.name, args}, this.controller?.signal);
            result = data.result as Record<string, unknown>;
            if (!result || typeof result.success !== "boolean") throw new Error("The action returned no confirmed result.");
          } catch (error) {
            result = {success: false, error: error instanceof Error ? error.message : "Action result unknown. Check before retrying."};
          }
          if (!this.live(epoch)) return;
          this.patch({actions: this.state.actions.map((action, i) => i === index ? {tool: call.name, args, result, label: toolLabel(call.name, args), status: result.success ? "done" : "error"} : action)});
          this.send({type: "conversation.item.create", item: {type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result)}});
          if (result.success && result.appCommand) this.onCommand(result as unknown as AppCommand);
        }
        if (!this.live(epoch)) return;
        if (calls.length && turnEpoch === this.turnEpoch && !this.responseActive) {
          this.send({type: "response.create"});
          this.patch({status: "thinking"});
        } else if (!this.audioPlaying) this.patch({status: this.idleStatus()});
        break;
      }
      case "error":
        // A VAD cancellation may win the race with an explicit interruption.
        if (event.error?.code === "response_cancel_not_active") break;
        this.fail(new Error(event.error?.message || "Realtime voice failed. Please reconnect."), epoch);
        break;
    }
  }

  stop() {
    ++this.epoch;
    const sessionId = this.sessionId;
    this.sessionId = undefined;
    this.controller?.abort();
    this.rejectReady?.(new Error("Voice session stopped"));
    this.rejectReady = undefined;
    this.connection = undefined;
    this.starting = false;
    clearTimeout(this.timer);
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((track) => { track.onended = null; track.stop(); });
    this.stream = undefined;
    void this.context?.close().catch(() => undefined);
    this.context = undefined;
    this.channel?.close();
    this.pc?.close();
    this.channel = undefined;
    this.pc = undefined;
    this.sender = undefined;
    this.audio?.pause();
    if (this.audio) this.audio.srcObject = null;
    this.audio = undefined;
    this.responseActive = this.audioPlaying = this.userSpeaking = false;
    this.handledResponses.clear();
    this.handledCalls.clear();
    this.onLevel(0);
    this.patch({status: "idle", isConnected: false, microphoneActive: false, connectedAt: null});
    if (sessionId) {
      // Do not reuse the aborted session signal. Ending never requests a microphone.
      const turns = this.state.conversationHistory.slice(-20).map((turn) => ({...turn, parts: [{text: turn.parts.map((part) => part.text || "").join("\n").slice(0, 1000)}]}));
      void this.api("voiceRealtimeEnd", {sessionId, turns}).catch(() => undefined);
    }
  }
  reset() { this.stop(); this.items.clear(); this.patch(initialVoiceState(this.state.continuous)); }
  dispose() { this.stop(); this.disposed = true; }
}
