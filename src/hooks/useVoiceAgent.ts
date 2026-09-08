import {useCallback, useEffect, useRef, useState} from "react";
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "@/lib/firebase";
import {getCloudFunctionUrl} from "@/utils/cloudFunctions";
import {RealtimeVoiceClient, initialVoiceState} from "@/utils/realtimeVoice";
import type {AppCommand, UseVoiceAgentOptions} from "./voiceAgentTypes";
export type {AgentStatus, ActionEvent, ConversationTurn, AppCommand, UseVoiceAgentOptions, NovaActionPayload} from "./voiceAgentTypes";

export const useVoiceAgent = (options: UseVoiceAgentOptions = {}) => {
  const [state, setState] = useState(() => initialVoiceState(options.continuous));
  const inputLevelRef = useRef(0);
  const callbacks = useRef(options);
  const client = useRef<RealtimeVoiceClient>();
  const mounted = useRef(false);
  const continuous = useRef(options.continuous || false);
  const instanceId = useRef(crypto.randomUUID());
  useEffect(() => { callbacks.current = options; });

  // Only successful canonical commands returned by the authenticated server reach the UI.
  const command = useCallback((cmd: AppCommand) => {
    if (!mounted.current || !cmd.success) return;
    const handlers = callbacks.current;
    switch (cmd.appCommand) {
      case "navigate": if (cmd.route) handlers.onNavigate?.(cmd.route); break;
      case "openEntryForm": handlers.onOpenEntryForm?.(cmd.category); break;
      case "openEntry": handlers.onOpenEntry?.(cmd.id, cmd.title); break;
      case "goBack": handlers.onGoBack?.(); break;
      case "scrollPage": handlers.onScrollPage?.(cmd.direction || "down"); break;
      case "startBrainDump": handlers.onStartBrainDump?.(); break;
      case "processBrainDump": handlers.onProcessBrainDump?.(); break;
      case "saveBrainDump": handlers.onSaveBrainDump?.(cmd.category); break;
      case "updateTheme": handlers.onUpdateTheme?.(cmd.theme || "system"); break;
      case "settingsUpdated": handlers.onSettingsUpdated?.(cmd.setting || "", cmd.value, cmd.updates); break;
      case "exportData": handlers.onExportData?.(cmd.format || "json"); break;
      case "printEntry": if (cmd.entries) handlers.onPrintEntry?.(cmd.entries); break;
      case "novaAction": if (cmd.actionType && cmd.actionData) handlers.onNovaAction?.({actionType: cmd.actionType, actionData: cmd.actionData}); break;
    }
  }, []);

  const getClient = useCallback(() => {
    if (client.current) return client.current;
    const owner = auth.currentUser?.uid;
    const api = async (name: string, body: Record<string, unknown>, signal?: AbortSignal) => {
      const user = auth.currentUser;
      if (!owner || user?.uid !== owner) throw new Error("Sign in again to use realtime voice.");
      const token = await user.getIdToken();
      if (auth.currentUser?.uid !== owner) throw new Error("Your sign-in changed. Start a new voice session.");
      const response = await fetch(getCloudFunctionUrl(name), {
        method: "POST", signal: signal || AbortSignal.timeout(30_000),
        headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"}, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message || "Voice request failed. Please try again.");
      return data;
    };
    client.current = new RealtimeVoiceClient(api, (next) => { if (mounted.current) setState(next); }, command,
      (level) => { inputLevelRef.current = level; }, continuous.current);
    return client.current;
  }, [command]);

  useEffect(() => {
    mounted.current = true;
    let uid = auth.currentUser?.uid;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid === uid) return;
      uid = user?.uid;
      client.current?.dispose();
      client.current = undefined;
      setState(initialVoiceState(continuous.current));
    });
    const onOtherSession = (event: Event) => {
      if ((event as CustomEvent).detail !== instanceId.current) client.current?.stop();
    };
    const onPageHide = () => client.current?.stop();
    window.addEventListener("nova:realtime-active", onOtherSession);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      mounted.current = false;
      unsubscribe();
      window.removeEventListener("nova:realtime-active", onOtherSession);
      window.removeEventListener("pagehide", onPageHide);
      client.current?.dispose();
      client.current = undefined;
    };
  }, []);

  const activate = useCallback(() => window.dispatchEvent(new CustomEvent("nova:realtime-active", {detail: instanceId.current})), []);
  const startListening = useCallback(() => {
    if (!mounted.current) return;
    activate();
    void getClient().startListening();
  }, [activate, getClient]);
  const stopListening = useCallback(() => client.current?.stop(), []);
  const sendText = useCallback(async (text: string) => {
    if (!mounted.current) return;
    activate();
    await getClient().sendText(text);
  }, [activate, getClient]);
  const resetConversation = useCallback(() => client.current?.reset(), []);
  const setContinuous = useCallback((value: boolean) => {
    continuous.current = value;
    if (client.current) client.current.setContinuous(value);
    else setState((current) => ({...current, continuous: value}));
  }, []);
  return {...state, inputLevelRef, startListening, stopListening, sendText, resetConversation, setContinuous};
};
