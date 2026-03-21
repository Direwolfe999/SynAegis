"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SynAegisOrb, { type OrbState } from "../components/SynAegisOrb";
import LiveTranscription from "../components/LiveTranscription";
import OpticalFeed from "../components/OpticalFeed";
import ProtocolLogs from "../components/ProtocolLogs";
import SystemDiagnostics from "../components/SystemDiagnostics";
import Intro from "../components/Intro";

type WsEvent =
    | { type: "ready"; sessionId: string; startup?: Record<string, unknown> }
    | { type: "agent_text"; text: string }
    | { type: "agent_audio"; mimeType: string; data: string }
    | { type: "agent_hint"; hints: string[] }
    | { type: "session_summary"; summary: string }
    | { type: "fallback_mode"; enabled: boolean; reason?: string }
    | { type: "heartbeat"; ts: string }
    | { type: "connection_stats"; uptime_s: number; messages: number; media_kb: number; fallback_mode: boolean }
    | { type: "audio_frequency"; value: number }
    | { type: "brain_log"; level: string; message: string }
    | { type: "system_metrics"; metrics: Record<string, unknown> }
    | { type: "barge_in_ack" }
    | { type: "error"; message: string };

type Metrics = {
    latency_ms?: number | null;
    billing_enabled?: boolean | null;
    monitoring_series?: number | null;
    capabilities_ok?: boolean | null;
    net_cost_cents?: number | null;
};

const FRAME_INTERVAL_MS = 1200;
const RECONNECT_MIN_MS = 600;
const DEFAULT_SEND_VIDEO_TO_AGENT = process.env.NEXT_PUBLIC_SEND_VIDEO_TO_AGENT === "true";

function toBase64(buffer: ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const stride = 0x8000;
    for (let i = 0; i < bytes.length; i += stride) {
        binary += String.fromCharCode(...bytes.subarray(i, i + stride));
    }
    return btoa(binary);
}

function base64ToBlob(data: string, mimeType: string): Blob {
    const raw = atob(data);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return new Blob([arr], { type: mimeType });
}

function floatToPcm16(float32: Float32Array): Int16Array {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

function cancelSpeechSafely() {
    if (typeof window === "undefined") return;
    const synth = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    if (synth && typeof synth.cancel === "function") {
        synth.cancel();
    }
}

function speakTextSafely(text: string) {
    if (!text || typeof window === "undefined" || typeof SpeechSynthesisUtterance === "undefined") return;
    const synth = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    if (!synth || typeof synth.speak !== "function") return;

    cancelSpeechSafely();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    utterance.volume = 0.95;
    synth.speak(utterance);
}

function getSpeechRecognitionCtor(): (new () => any) | null {
    if (typeof window === "undefined") return null;
    const w = window as Window & {
        SpeechRecognition?: new () => any;
        webkitSpeechRecognition?: new () => any;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function WarRoom() {
    const [showIntro, setShowIntro] = useState(true);
    const [orbState, setOrbState] = useState<OrbState>("idle");
    const [rippling, setRippling] = useState(false);
    const [userLevel, setUserLevel] = useState(0.1);
    const [aiLevel, setAiLevel] = useState(0.08);
    const [logs, setLogs] = useState<string[]>([]);
    const [transcript, setTranscript] = useState("");
    const [metrics, setMetrics] = useState<Metrics>({});
    const [cameraActive, setCameraActive] = useState(false);
    const [showDiag, setShowDiag] = useState(true);
    const [hovering, setHovering] = useState(false);
    const [visionEnabled, setVisionEnabled] = useState(DEFAULT_SEND_VIDEO_TO_AGENT);
    const [micMuted, setMicMuted] = useState(false);
    const [backendMode, setBackendMode] = useState<"live" | "fallback">("live");
    const [lastPingMs, setLastPingMs] = useState<number | null>(null);
    const [promptText, setPromptText] = useState("");

    const wsRef = useRef<WebSocket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const frameTimerRef = useRef<number | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const manualDisconnectRef = useRef(false);
    const transcriptionTimerRef = useRef<number | null>(null);
    const visionEnabledRef = useRef(visionEnabled);
    const micMutedRef = useRef(micMuted);
    const backendModeRef = useRef<"live" | "fallback">("live");
    const speechRecRef = useRef<any>(null);
    const speechRecRunningRef = useRef(false);

    useEffect(() => {
        visionEnabledRef.current = visionEnabled;
    }, [visionEnabled]);

    useEffect(() => {
        micMutedRef.current = micMuted;
    }, [micMuted]);

    useEffect(() => {
        backendModeRef.current = backendMode;
    }, [backendMode]);

    const wsUrl = useMemo(() => {
        const fallback =
            typeof window !== "undefined"
                ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8080/ws/SynAegis`
                : "ws://localhost:8080/ws/SynAegis";
        return process.env.NEXT_PUBLIC_BACKEND_WS_URL || fallback;
    }, []);

    const pushLog = useCallback((line: string) => {
        const msg = `${new Date().toLocaleTimeString()} [INFO] ${line}`;
        setLogs((prev) => [...prev.slice(-100), msg]);
    }, []);

    const sendJson = useCallback((payload: unknown) => {
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
        }
    }, []);

    const clearTranscription = useCallback(() => {
        if (transcriptionTimerRef.current) {
            window.clearTimeout(transcriptionTimerRef.current);
            transcriptionTimerRef.current = null;
        }
    }, []);

    const showTransientTranscript = useCallback(
        (text: string) => {
            if (!text) return;
            setTranscript(text);
            clearTranscription();
            transcriptionTimerRef.current = window.setTimeout(() => {
                setTranscript("");
            }, 3000);
        },
        [clearTranscription],
    );

    const sendPrompt = useCallback(
        (text: string) => {
            const cleaned = text.trim();
            if (!cleaned) return;
            sendJson({ type: "user_text", text: cleaned });
            pushLog(`You: ${cleaned}`);
        },
        [pushLog, sendJson],
    );

    const stopLocalStt = useCallback(() => {
        const rec = speechRecRef.current;
        if (!rec) return;
        try {
            rec.onresult = null;
            rec.onerror = null;
            rec.onend = null;
            rec.stop?.();
        } catch {
            // ignore
        }
        speechRecRef.current = null;
        speechRecRunningRef.current = false;
    }, []);

    const startLocalStt = useCallback(() => {
        if (speechRecRunningRef.current) return;
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) return;

        try {
            const rec = new Ctor();
            rec.lang = "en-US";
            rec.continuous = true;
            rec.interimResults = false;

            rec.onresult = (event: any) => {
                const results = event?.results;
                if (!results || !results.length) return;
                const result = results[results.length - 1];
                const transcript = result?.[0]?.transcript?.trim?.();
                if (transcript) {
                    sendPrompt(transcript);
                }
            };

            rec.onerror = () => {
                speechRecRunningRef.current = false;
            };

            rec.onend = () => {
                speechRecRunningRef.current = false;
                if (backendModeRef.current === "fallback" && orbState !== "idle") {
                    window.setTimeout(() => {
                        startLocalStt();
                    }, 450);
                }
            };

            rec.start();
            speechRecRef.current = rec;
            speechRecRunningRef.current = true;
        } catch {
            speechRecRunningRef.current = false;
        }
    }, [orbState, sendPrompt]);

    const teardownMedia = useCallback(async () => {
        if (frameTimerRef.current) {
            window.clearInterval(frameTimerRef.current);
            frameTimerRef.current = null;
        }
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        processorRef.current = null;
        sourceRef.current = null;

        if (audioCtxRef.current) {
            try {
                await audioCtxRef.current.close();
            } catch {
                // ignore
            }
        }
        audioCtxRef.current = null;

        mediaRef.current?.getTracks().forEach((t) => t.stop());
        mediaRef.current = null;
        setCameraActive(false);
    }, []);

    const startMedia = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { sampleRate: 16000, channelCount: 1, noiseSuppression: true, echoCancellation: true },
            video: { width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 20, max: 24 } },
        });

        mediaRef.current = stream;
        setCameraActive(true);

        const audioCtx = new AudioContext({ sampleRate: 16000 });
        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(1024, 1, 1);
        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (event) => {
            const pcm = floatToPcm16(event.inputBuffer.getChannelData(0));
            const level = Math.min(1, Math.max(0.08, Math.sqrt(pcm.reduce((a, b) => a + b * b, 0) / pcm.length) / 9000));
            setUserLevel(level);
            setOrbState((prev) => (prev === "thinking" || prev === "speaking" ? prev : "listening"));
            if (micMutedRef.current) return;
            sendJson({ type: "media", mimeType: "audio/pcm", sampleRate: 16000, data: toBase64(pcm.buffer) });
        };

        audioCtxRef.current = audioCtx;
        sourceRef.current = source;
        processorRef.current = processor;

        frameTimerRef.current = window.setInterval(() => {
            if (!visionEnabledRef.current) return;
            const video = videoRef.current;
            if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
            const canvas = document.createElement("canvas");
            canvas.width = 320;
            canvas.height = 180;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const b64 = canvas.toDataURL("image/jpeg", 0.5).split(",")[1];
            sendJson({ type: "media", mimeType: "image/jpeg", data: b64 });
        }, FRAME_INTERVAL_MS);
    }, [sendJson]);

    const connect = useCallback(async () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        manualDisconnectRef.current = false;
        setOrbState("reconnecting");
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = async () => {
            reconnectAttemptsRef.current = 0;
            pushLog("Realtime link established.");
            await startMedia();
            setOrbState("listening");
        };

        ws.onmessage = async (event) => {
            let msg: WsEvent;
            try {
                msg = JSON.parse(event.data) as WsEvent;
            } catch {
                return;
            }

            if (msg.type === "ready") {
                pushLog("System identity synchronized.");
                if (msg.startup && typeof msg.startup === "object") {
                    const startup = msg.startup as Record<string, unknown>;
                    setMetrics({
                        latency_ms: Number(startup.latency_ms ?? 0) || null,
                        billing_enabled: Boolean((startup.billing as Record<string, unknown> | undefined)?.enabled),
                        monitoring_series: Number((startup.monitoring as Record<string, unknown> | undefined)?.series_seen ?? 0),
                        capabilities_ok: Boolean(startup.ok),
                    });
                }
            } else if (msg.type === "agent_text") {
                setOrbState("thinking");
                showTransientTranscript(msg.text);
                pushLog(`SynAegis: ${msg.text}`);

                if (backendModeRef.current === "fallback") {
                    speakTextSafely(msg.text);
                }

                window.setTimeout(() => setOrbState("listening"), 320);
            } else if (msg.type === "agent_audio") {
                const audio = audioRef.current;
                if (!audio) return;
                const url = URL.createObjectURL(base64ToBlob(msg.data, msg.mimeType));
                audio.src = url;
                setOrbState("speaking");
                setAiLevel(0.72);
                await audio.play().catch(() => undefined);
                window.setTimeout(() => setAiLevel(0.14), 420);
            } else if (msg.type === "audio_frequency") {
                setUserLevel(Math.max(0.08, Math.min(1, msg.value)));
            } else if (msg.type === "heartbeat") {
                const ping = Date.now() - new Date(msg.ts).getTime();
                setLastPingMs(Number.isFinite(ping) ? Math.max(0, ping) : null);
            } else if (msg.type === "connection_stats") {
                setMetrics((prev) => ({
                    ...prev,
                    latency_ms: msg.uptime_s,
                    net_cost_cents: msg.media_kb,
                }));
            } else if (msg.type === "fallback_mode") {
                setBackendMode(msg.enabled ? "fallback" : "live");
            } else if (msg.type === "agent_hint") {
                for (const hint of msg.hints ?? []) {
                    pushLog(`[HINT] ${hint}`);
                }
            } else if (msg.type === "session_summary") {
                pushLog(`[SUMMARY] ${msg.summary}`);
            } else if (msg.type === "brain_log") {
                setShowDiag(true);
                pushLog(`[${msg.level.toUpperCase()}] ${msg.message}`);
            } else if (msg.type === "system_metrics") {
                setMetrics((prev) => ({ ...prev, ...(msg.metrics as Metrics) }));
                setShowDiag(true);
            } else if (msg.type === "barge_in_ack") {
                setRippling(true);
                cancelSpeechSafely();
                window.setTimeout(() => setRippling(false), 280);
            } else if (msg.type === "error") {
                setOrbState("error");
                pushLog(`[ERROR] ${msg.message || (msg as any).content || "Unknown error"}`);
                if (/quota|exceeded|resource_exhausted|429/i.test(msg.message)) {
                    manualDisconnectRef.current = true;
                    pushLog("Quota limit reached. Reconnect paused to avoid repeated failures.");
                    ws.close();
                }
            }
        };

        ws.onerror = () => {
            setOrbState("error");
            pushLog("Transport error detected.");
        };

        ws.onclose = async () => {
            await teardownMedia();
            if (manualDisconnectRef.current) {
                setOrbState("idle");
                return;
            }
            const attempt = reconnectAttemptsRef.current + 1;
            reconnectAttemptsRef.current = attempt;
            const wait = Math.min(6000, RECONNECT_MIN_MS * attempt);
            setOrbState("reconnecting");
            pushLog(`Realtime link dropped. Retry in ${wait}ms.`);
            window.setTimeout(() => void connect(), wait);
        };
    }, [pushLog, showTransientTranscript, startMedia, teardownMedia, wsUrl]);

    const disconnect = useCallback(async () => {
        manualDisconnectRef.current = true;
        wsRef.current?.close();
        wsRef.current = null;
        cancelSpeechSafely();
        stopLocalStt();
        await teardownMedia();
        clearTranscription();
        setTranscript("");
        setOrbState("idle");
    }, [clearTranscription, stopLocalStt, teardownMedia]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onEnded = () => {
            setAiLevel(0.1);
            setOrbState((prev) => (prev === "speaking" ? "listening" : prev));
        };
        audio.addEventListener("ended", onEnded);
        return () => audio.removeEventListener("ended", onEnded);
    }, []);

    useEffect(() => {
        if (cameraActive && videoRef.current && mediaRef.current) {
            videoRef.current.srcObject = mediaRef.current;
            videoRef.current.play().catch(() => undefined);
        }
    }, [cameraActive]);

    useEffect(() => {
        const timer = window.setTimeout(() => setShowDiag(false), 9000);
        return () => window.clearTimeout(timer);
    }, [metrics, logs.length]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "v") {
                setVisionEnabled((prev) => {
                    const next = !prev;
                    pushLog(`Vision uplink ${next ? "enabled" : "disabled"}.`);
                    return next;
                });
            }
            if (e.key.toLowerCase() === "m") {
                setMicMuted((prev) => {
                    const next = !prev;
                    pushLog(`Mic uplink ${next ? "muted" : "live"}.`);
                    return next;
                });
            }
            if (e.key.toLowerCase() === "t") {
                sendPrompt("Give me a 1-line realtime status and next best action.");
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [pushLog, sendPrompt]);

    useEffect(() => {
        if (backendMode === "fallback" && orbState !== "idle") {
            startLocalStt();
        } else {
            stopLocalStt();
        }

        return () => {
            stopLocalStt();
        };
    }, [backendMode, orbState, startLocalStt, stopLocalStt]);

    useEffect(() => {
        return () => {
            void disconnect();
        };
    }, [disconnect]);

    return (
        <>
            {/* Intro Screen */}
            <AnimatePresence>
                {showIntro && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="fixed inset-0 z-50 bg-slate-950"
                    >
                        <Intro />

                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Interface */}
            <main className="relative min-h-screen overflow-hidden bg-[#050505] text-slate-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(30,41,59,0.35),transparent_58%)]" />

                {/* Subtle immersive logo background */}
                <div className="fixed inset-0 flex z-0 pointer-events-none items-center justify-center opacity-[0.03]">
                    <img src="/logos/full.png" alt="SynAegis Motif" className="w-[1000px] h-[1000px] object-contain grayscale blur-[3px]" />
                </div>
                {/* Subtle immersive logo background */}
                <div className="fixed inset-0 flex z-0 pointer-events-none items-center justify-center opacity-[0.03]">
                    <img src="/logos/full.png" alt="SynAegis Motif" className="w-[1000px] h-[1000px] object-contain grayscale blur-[3px]" />
                </div>
                <AnimatePresence>
                    {orbState === "reconnecting" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm"
                        >
                            <div className="reconnect-grid rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-xl sm:px-6 sm:py-4">
                                <p className="text-sm tracking-wide text-slate-200 sm:text-lg">SynAegis // Realigning Neural Pathways...</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <OpticalFeed active={cameraActive} videoRef={videoRef} />
                <SystemDiagnostics visible={showDiag} metrics={metrics} />
                <ProtocolLogs logs={logs} />
                <LiveTranscription text={transcript} />

                <section className="relative z-10 flex min-h-screen items-center justify-center px-4">
                    <div className="text-center">
                        <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-[9px] uppercase tracking-[0.16em] sm:text-[10px]">
                            <span className={`rounded-full border px-2 py-1 ${backendMode === "fallback" ? "border-amber-300/40 bg-amber-500/10 text-amber-200" : "border-emerald-300/40 bg-emerald-500/10 text-emerald-200"}`}>
                                {backendMode === "fallback" ? "fallback mode" : "live mode"}
                            </span>
                            <span className={`rounded-full border px-2 py-1 ${visionEnabled ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-200" : "border-slate-500/40 bg-slate-700/20 text-slate-300"}`}>
                                vision {visionEnabled ? "on" : "off"}
                            </span>
                            <span className={`rounded-full border px-2 py-1 ${micMuted ? "border-rose-300/40 bg-rose-500/10 text-rose-200" : "border-cyan-300/40 bg-cyan-500/10 text-cyan-200"}`}>
                                mic {micMuted ? "muted" : "live"}
                            </span>
                            {lastPingMs !== null && (
                                <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-slate-200">ping {lastPingMs}ms</span>
                            )}
                        </div>
                        <h1 className="mb-1 bg-gradient-to-r from-cyan-300 via-white to-cyan-300 bg-clip-text text-[13px] font-extralight uppercase tracking-[0.45em] text-transparent drop-shadow-[0_0_12px_rgba(103,232,249,0.35)] sm:mb-2 sm:text-base sm:tracking-[0.5em] md:text-lg">
                            SynAegis
                        </h1>
                        <div className="mx-auto mb-3 h-px w-10 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent sm:mb-4 sm:w-14" />
                        <SynAegisOrb state={orbState} userLevel={userLevel} aiLevel={aiLevel} rippling={rippling} />
                        <p className="mt-3 text-[9px] font-light uppercase tracking-[0.25em] text-slate-400/90 sm:mt-4 sm:text-[11px] sm:tracking-[0.3em]">
                            {orbState === "idle" ? "awaiting signal" : orbState}
                        </p>
                    </div>
                </section>

                <audio ref={audioRef} className="hidden" />

                <div
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                    onClick={() => {
                        if (orbState === "idle") {
                            void connect();
                        } else {
                            sendJson({ type: "barge_in" });
                            setRippling(true);
                            window.setTimeout(() => setRippling(false), 280);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (orbState === "idle") {
                                void connect();
                            } else {
                                sendJson({ type: "barge_in" });
                            }
                        }
                        if (e.key.toLowerCase() === "x") {
                            void disconnect();
                        }
                    }}
                    className="absolute inset-0 z-30 cursor-pointer"
                    aria-label="Toggle voice presence"
                />

                {!showIntro && (
                <div className="pointer-events-auto absolute bottom-16 left-1/2 z-[40] w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-white/15 bg-black/40 p-2 backdrop-blur-xl sm:bottom-20 sm:p-3">
                    <div className="flex gap-2">
                        <input
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    sendPrompt(promptText);
                                    setPromptText("");
                                }
                            }}
                            placeholder="Type prompt · Enter to send · V vision · M mute · T test"
                            className="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/50 focus:outline-none"
                        />
                        <button
                            onClick={() => {
                                sendPrompt(promptText);
                                setPromptText("");
                            }}
                            className="rounded-md border border-cyan-300/40 bg-cyan-500/10 px-3 py-2 text-xs uppercase tracking-[0.12em] text-cyan-200 hover:bg-cyan-500/20"
                        >
                            Send
                        </button>
                    </div>
                </div>
                )}

                {/* Subtle immersive logo background */}
                <div className="fixed inset-0 flex z-0 pointer-events-none items-center justify-center opacity-[0.03]">
                    <img src="/logos/full.png" alt="SynAegis Motif" className="w-[1000px] h-[1000px] object-contain grayscale blur-[3px]" />
                </div>
                {/* Subtle immersive logo background */}
                <div className="fixed inset-0 flex z-0 pointer-events-none items-center justify-center opacity-[0.03]">
                    <img src="/logos/full.png" alt="SynAegis Motif" className="w-[1000px] h-[1000px] object-contain grayscale blur-[3px]" />
                </div>
                <AnimatePresence>
                    {hovering && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="pointer-events-none absolute bottom-3 left-1/2 z-[60] -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-slate-200 backdrop-blur sm:bottom-6 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]"
                        >
                            {orbState === "idle" ? "Tap to Initialize Mic/Camera" : "Tap to Barge-In · Press X to Halt"}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </>
    );
}
