import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Volume2, VolumeX, Check } from "lucide-react";
import { demoSpeak, demoStopSpeaking } from "@/utils/demoTTS";

interface VoiceDemoAnimationProps {
  theme: "light" | "dark";
  muted?: boolean;
  onMuteToggle?: () => void;
}

const voiceText =
  'I just had a meeting with Sarah from marketing. She needs the Q3 budget breakdown by next Tuesday at 3pm, and wants to schedule a follow-up the week after. Also, remind me to pick up dry cleaning tomorrow.';

const resultItems = [
  { text: <>Extracted 1 contact → <strong>Sarah (Marketing)</strong></> },
  { text: <>Created event → <strong>Meeting: Tue 3pm · Q3 Budget Review</strong></> },
  { text: <>Added action item → <strong>Prepare Q3 budget breakdown</strong></> },
  { text: <>Set reminder → <strong>Pick up dry cleaning</strong> (tomorrow)</> },
  { text: <>Saved to categories → <strong>Work</strong> (1), <strong>Personal</strong> (1)</> },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const VoiceDemoAnimation: React.FC<VoiceDemoAnimationProps> = ({ theme, muted = false, onMuteToggle }) => {
  const [phase, setPhase] = useState<
    | "idle"
    | "listening"
    | "typing"
    | "divider"
    | "processing"
    | "results"
    | "success"
    | "done"
  >("idle");
  const [typedText, setTypedText] = useState("");
  const [visibleResults, setVisibleResults] = useState<number[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);

  const stopSpeaking = useCallback(() => {
    demoStopSpeaking();
    setSpeaking(false);
  }, []);

  const runDemo = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    stopSpeaking();

    // Reset
    setPhase("idle");
    setTypedText("");
    setVisibleResults([]);
    await sleep(100);

    // Phase 1: Listening
    setPhase("listening");
    await sleep(1200);

    // Phase 2: Type out transcription + TTS
    setPhase("typing");
    if (!muted) {
      setSpeaking(true);
      demoSpeak(voiceText, {
        onEnd: () => setSpeaking(false),
      });
    }
    for (let i = 0; i < voiceText.length; i++) {
      if (!runningRef.current) return;
      const ch = voiceText[i];
      if (ch === "." || ch === "?" || ch === "!") await sleep(260);
      else if (ch === "," || ch === ";") await sleep(130);
      else await sleep(20 + Math.random() * 14);
      setTypedText(voiceText.substring(0, i + 1));
    }
    await sleep(300);

    // Phase 3: Divider + Processing
    setPhase("divider");
    await sleep(100);
    setPhase("processing");
    await sleep(1800);

    // Phase 4: Results
    setPhase("results");
    for (let i = 0; i < resultItems.length; i++) {
      if (!runningRef.current) return;
      await sleep(50);
      setVisibleResults((prev) => [...prev, i]);
      await sleep(300 + Math.random() * 200);
    }
    await sleep(200);

    // Phase 5: Success
    setPhase("success");
    await sleep(500);

    // Phase 6: Done
    setPhase("done");
    runningRef.current = false;
  }, [muted, stopSpeaking]);

  // Auto-play on mount with IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let played = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !played) {
            played = true;
            runDemo();
          }
        }
      },
      { threshold: 0.4 }
    );

    const timer = setTimeout(() => observer.observe(el), 300);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [runDemo]);

  const handleReplay = () => {
    stopSpeaking();
    runningRef.current = false;
    setTimeout(() => runDemo(), 50);
  };

  const isDark = theme === "dark";

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-2xl overflow-hidden border transition-colors ${
        isDark
          ? "bg-[#0a0f1a] border-zinc-800/60 shadow-2xl shadow-black/40"
          : "bg-white border-zinc-200 shadow-xl shadow-zinc-200/60"
      }`}
    >
      {/* Title Bar */}
      <div
        className={`flex items-center gap-3 px-5 py-3 border-b ${
          isDark ? "border-zinc-800/40" : "border-zinc-200"
        }`}
      >
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
        <span
          className={`text-[11px] tracking-[2px] uppercase font-medium flex-1 ${
            isDark ? "text-zinc-500" : "text-zinc-400"
          }`}
        >
          Nova
        </span>

        {/* Mute Toggle */}
        {onMuteToggle && (
          <button
            onClick={onMuteToggle}
            className={`p-1.5 rounded-full transition-colors ${
              isDark
                ? "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                : "hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
            }`}
            title={muted ? "Unmute voice" : "Mute voice"}
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className={`w-3.5 h-3.5 ${speaking ? "text-primary" : ""}`} />
            )}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-6 sm:p-7 min-h-[400px] relative">
        {/* Mic + Waveform */}
        <div
          className={`flex items-center gap-4 mb-6 transition-all duration-500 ${
            phase === "idle" || phase === "listening" || phase === "typing"
              ? "opacity-100 max-h-20"
              : "opacity-0 max-h-0 mb-0 overflow-hidden"
          }`}
        >
          <div className="relative shrink-0">
            <div
              className={`w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 ${
                isDark
                  ? "bg-primary/10 border-primary/30"
                  : "bg-primary/5 border-primary/20"
              }`}
            >
              <Mic
                className={`w-5 h-5 ${
                  phase === "listening" ? "text-primary animate-pulse" : "text-primary"
                }`}
              />
            </div>
            {phase === "listening" && (
              <span className="absolute -inset-1.5 rounded-full border border-primary/10 animate-ping" />
            )}
          </div>

          {/* Waveform bars */}
          <div className="flex items-center gap-[3px] h-8 flex-1">
            {[30, 55, 80, 100, 70, 45, 65, 90, 50, 75, 35, 60].map(
              (h, i) => (
                <span
                  key={i}
                  className="w-[4px] rounded-full bg-primary/50"
                  style={{
                    height: `${h}%`,
                    animation:
                      phase === "listening"
                        ? `waveform-pulse 1s ease-in-out ${i * 0.1}s infinite`
                        : "none",
                    transform: `scaleY(${phase === "typing" ? 0.3 : 1})`,
                    transition: "transform 0.5s ease",
                  }}
                />
              )
            )}
          </div>

          <span
            className={`text-[11px] tracking-[1px] uppercase whitespace-nowrap ${
              isDark ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            {phase === "listening" ? "LISTENING" : "PROCESSED"}
          </span>
        </div>

        {/* Transcription */}
        <div
          className={`font-mono text-sm sm:text-[15px] leading-relaxed mb-5 min-h-[3.5em] transition-all ${
            isDark ? "text-zinc-200" : "text-zinc-800"
          }`}
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {typedText}
          {(phase === "typing" || phase === "divider" || phase === "processing") && (
            <span
              className={`inline-block w-[2px] h-[1.1em] ml-0.5 align-text-bottom animate-pulse ${
                isDark ? "bg-primary" : "bg-primary"
              }`}
            />
          )}
        </div>

        {/* Divider */}
        <div
          className={`h-px mb-5 transition-opacity duration-500 ${
            phase === "divider" ||
            phase === "processing" ||
            phase === "results" ||
            phase === "success" ||
            phase === "done"
              ? "opacity-100"
              : "opacity-0"
          } ${
            isDark
              ? "bg-gradient-to-r from-transparent via-primary/20 to-transparent"
              : "bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          }`}
        />

        {/* Processing */}
        <div
          className={`flex items-center gap-2.5 mb-5 transition-all duration-400 ${
            phase === "processing"
              ? "opacity-100 max-h-10"
              : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <span className="w-3.5 h-3.5 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          <span
            className={`text-xs tracking-[1px] uppercase ${
              isDark ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            Nova is organizing
          </span>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-2 mb-4">
          {resultItems.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 text-sm leading-relaxed transition-all duration-400 ${
                visibleResults.includes(i)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3"
              } ${isDark ? "text-zinc-300" : "text-zinc-700"}`}
            >
              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Success Banner */}
        <div
          className={`rounded-xl px-5 py-3.5 flex items-center gap-3 mb-5 transition-all duration-500 ${
            phase === "success" || phase === "done"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          } ${
            isDark
              ? "bg-gradient-to-r from-primary/8 to-primary/2 border border-primary/12"
              : "bg-gradient-to-r from-primary/5 to-primary/1 border border-primary/10"
          }`}
        >
          <Check className="w-4 h-4 text-primary shrink-0" />
          <span className={`text-sm ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
            Done! 5 items organized.
          </span>
          <span className="text-sm text-primary ml-auto shrink-0">
            View in All Entries →
          </span>
        </div>

        {/* Cursor */}
        {(phase === "success" || phase === "done") && (
          <span
            className={`inline-block w-[2px] h-[1.1em] ml-0.5 align-text-bottom ${
              isDark ? "bg-primary" : "bg-primary"
            }`}
            style={{ animation: "cursor-blink 1s step-end infinite" }}
          />
        )}

        {/* Bottom Input Bar */}
        <div
          className={`flex items-center gap-2.5 pt-3 mt-3 border-t transition-opacity duration-600 ${
            phase === "done" ? "opacity-100" : "opacity-0"
          } ${isDark ? "border-zinc-800/30" : "border-zinc-200"}`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${
              isDark ? "bg-primary/10" : "bg-primary/5"
            }`}
          >
            <Mic
              className={`w-3 h-3 ${
                isDark ? "text-primary/50" : "text-primary/40"
              }`}
            />
          </div>
          <span
            className={`text-xs flex-1 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}
          >
            Or type here...
          </span>
          <span
            className={`text-base ${
              isDark ? "text-primary/40" : "text-primary/30"
            }`}
          >
            ↗
          </span>
        </div>

        {/* Replay Button */}
        <div
          className={`text-center pt-3 transition-opacity duration-500 ${
            phase === "done" ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={handleReplay}
            className={`text-xs tracking-[1px] uppercase px-5 py-2 rounded-full border transition-all ${
              isDark
                ? "border-primary/20 text-primary/50 hover:border-primary/40 hover:text-primary/80 hover:bg-primary/5"
                : "border-primary/20 text-primary/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5"
            }`}
          >
            ⟳ Replay Demo
          </button>
        </div>
      </div>

      {/* Keyframes for waveform */}
      <style>{`
        @keyframes waveform-pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default VoiceDemoAnimation;